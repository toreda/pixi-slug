import {
	Buffer,
	BufferUsage,
	Container,
	Geometry,
	Graphics,
	Mesh,
	Rectangle,
	Shader,
	UniformGroup
} from 'pixi.js';
import {slugGlyphQuads, slugGlyphQuadsMultiline} from '../../shared/slug/glyph/quad';
import type {SlugGlyphQuads} from '../../shared/slug/glyph/quad';
import {slugApplyLineLayoutX} from '../../shared/slug/glyph/shift';
import {slugComputeLineLayout} from '../../shared/slug/text/layout/align';
import {slugResolvePhysicalAlign} from '../../shared/slug/text/style/align';
import {slugTextWrap} from '../../shared/slug/text/wrap';
import {slugMeasureText} from '../../shared/slug/text/measure';
import {slugFontGpuV8} from './font/gpu';
import {slugShader} from './shader';
import {SlugTextInit} from '../../shared/slug/text/init';
import {SlugTextMixin} from '../../shared/slug/text/base';
import type {SlugFont} from '../../shared/slug/font';

/**
 * The Mixin pattern is necessary due to Container API difference
 * per PIXI version while supporting multiple PIXI versions. If we
 * only supported V8 this would be `extends Container` instead.
 */
const SlugTextV8Base = SlugTextMixin(Container);

/**
 * Renderable text element using the Slug algorithm for PixiJS v8.
 * Extends Container (via SlugTextMixin) for scene graph compatibility.
 *
 * Supports multi-pass rendering for stroke and drop shadow effects:
 * - Drop shadow: rendered first (behind) with shadow color and offset
 * - Stroke: rendered second with stroke color and extra dilation
 * - Fill: rendered last (on top) with the normal text color
 *
 * GPU textures and the compiled shader program are owned by SlugFont (via gpuCache)
 * and shared across all SlugText instances using the same font.
 */
export class SlugText extends SlugTextV8Base {
	/** All meshes for the current text (shadow + stroke + fill). */
	private _meshes: Mesh<Geometry, Shader>[];
	/** Uniforms for the fill pass (controls supersampling). */
	private _uniforms: UniformGroup | null;
	/** Graphics child for underline/strikethrough/overline decorations. */
	private _decorations: Graphics | null;

	constructor(init: SlugTextInit) {
		super();
		this.initBase(init);
		this._meshes = [];
		this._uniforms = null;
		this._decorations = null;

		this.rebuild();
	}

	public onSupersamplingChanged(): void {
		if (this._uniforms) {
			this._uniforms.uniforms.uSupersampleCount = this._supersampling ? this._supersampleCount : 0;
		}
	}

	public onSupersampleCountChanged(): void {
		if (this._uniforms && this._supersampling) {
			this._uniforms.uniforms.uSupersampleCount = this._supersampleCount;
		}
	}

	/**
	 * Build a Mesh from quad data with optional stroke expansion.
	 */
	private _buildMesh(
		quads: SlugGlyphQuads,
		gpu: ReturnType<typeof slugFontGpuV8>,
		strokeExpand: number = 0
	): {mesh: Mesh<Geometry, Shader>; uniforms: UniformGroup} {
		const stride = 20 * 4;
		const vertexBuffer = new Buffer({
			data: quads.vertices,
			label: 'slug-vertex-buffer',
			usage: BufferUsage.VERTEX
		});

		const geometry = new Geometry({
			attributes: {
				aPositionNormal: {buffer: vertexBuffer, format: 'float32x4', stride, offset: 0},
				aTexcoord: {buffer: vertexBuffer, format: 'float32x4', stride, offset: 4 * 4},
				aJacobian: {buffer: vertexBuffer, format: 'float32x4', stride, offset: 8 * 4},
				aBanding: {buffer: vertexBuffer, format: 'float32x4', stride, offset: 12 * 4},
				aColor: {buffer: vertexBuffer, format: 'float32x4', stride, offset: 16 * 4}
			},
			indexBuffer: quads.indices
		});

		const {shader, uniforms} = slugShader(gpu.glProgram, gpu.curveTexture, gpu.bandTexture);
		uniforms.uniforms.uSupersampleCount = this._supersampling ? this._supersampleCount : 0;
		uniforms.uniforms.uStrokeExpand = strokeExpand;

		return {mesh: new Mesh({geometry, shader}), uniforms};
	}

	/**
	 * Build glyph quads from a pre-wrapped line list. Single-line input
	 * still goes through `slugGlyphQuads` directly to avoid a multiline
	 * merge pass.
	 */
	private _makeQuads(
		font: SlugFont,
		lines: string[],
		color: [number, number, number, number],
		extraExpand: number = 0
	): SlugGlyphQuads {
		if (lines.length > 1) {
			const scale = this._fontSize / font.unitsPerEm;
			const lineHeight = (font.ascender - font.descender) * scale;
			return slugGlyphQuadsMultiline(
				lines, font.glyphs, font.advances, font.unitsPerEm,
				this._fontSize, font.textureWidth, lineHeight, color, extraExpand
			);
		}
		return slugGlyphQuads(
			lines[0] || '', font.glyphs, font.advances, font.unitsPerEm,
			this._fontSize, font.textureWidth, color, extraExpand
		);
	}

	public rebuild(): void {
		this._rebuildCount++;

		// Remove all previous meshes from display list.
		// Don't call mesh.destroy() — it can interfere with shared GlProgram
		// resources when multiple meshes use the same shader program.
		for (const mesh of this._meshes) {
			this.removeChild(mesh);
		}
		this._meshes = [];
		if (this._decorations) {
			this.removeChild(this._decorations);
			this._decorations.destroy();
			this._decorations = null;
		}
		this._uniforms = null;

		const font = this._fontRef?.deref();
		if (!font || this._text.length === 0 || font.glyphs.size === 0) {
			return;
		}

		const gpu = slugFontGpuV8(font);
		const hasShadow = this._dropShadow !== null;
		const hasStroke = this._strokeWidth > 0;

		// --- Line layout (text-align / text-justify) ---
		// Wrap once, measure once, resolve alignment once. The resulting
		// `lineQuadCounts` + `layout` get applied to every quad buffer
		// (shadow / stroke / fill) so all three passes stay registered.
		const scale = this._fontSize / font.unitsPerEm;
		const wrapping = this._wordWrap && this._wordWrapWidth > 0;
		const hasNewline = this._text.indexOf('\n') >= 0;
		let lines: string[];
		if (wrapping || hasNewline) {
			const width = wrapping ? this._wordWrapWidth : 0;
			lines = slugTextWrap(this._text, font.advances, scale, width, this._breakWords).lines;
		} else {
			lines = [this._text];
		}

		const lineWidths = new Float32Array(lines.length);
		const lineQuadCounts = new Int32Array(lines.length);
		let widestLine = 0;
		for (let l = 0; l < lines.length; l++) {
			const line = lines[l];
			lineWidths[l] = slugMeasureText(line, font.advances, scale);
			if (lineWidths[l] > widestLine) widestLine = lineWidths[l];
			let count = 0;
			for (let i = 0; i < line.length; i++) {
				if (font.glyphs.has(line.charCodeAt(i))) count++;
			}
			lineQuadCounts[l] = count;
		}

		// Box width: wrap width when wrapping is on; otherwise the
		// widest natural line. Single-line, no-wrap cases collapse to
		// `widestLine === lineWidths[0]`, so any align resolves to a
		// zero offset (start/center/right all agree on a 1-line block).
		const boxWidth = wrapping ? this._wordWrapWidth : widestLine;
		const physicalAlign = slugResolvePhysicalAlign(this._align, this._direction);
		const layout = slugComputeLineLayout(
			lines,
			lineWidths,
			boxWidth,
			physicalAlign,
			this._textJustify,
			(c) => font.glyphs.has(c)
		);
		const needsShift =
			layout.perGlyphShiftX !== null ||
			layout.lineOffsetX.some((x) => x !== 0);

		// --- Drop shadow pass ---
		if (hasShadow) {
			const ds = this._dropShadow!;
			const shadowAlpha = ds.alpha ?? 1;
			const shadowColor: [number, number, number, number] = ds.color
				? [ds.color[0], ds.color[1], ds.color[2], shadowAlpha]
				: [0, 0, 0, shadowAlpha];
			const blur = ds.blur ?? 0;

			const shadowQuads = this._makeQuads(font, lines, shadowColor, blur);

			if (shadowQuads.quadCount > 0) {
				if (needsShift) {
					slugApplyLineLayoutX(shadowQuads, lineQuadCounts, layout.lineOffsetX, layout.perGlyphShiftX);
				}
				const {mesh, uniforms: shadowUniforms} = this._buildMesh(shadowQuads, gpu, blur);
				if (blur > 0) {
					shadowUniforms.uniforms.uStrokeAlphaStart = shadowAlpha;
					shadowUniforms.uniforms.uStrokeAlphaRate = -shadowAlpha / blur;
				}
				const angle = ds.angle ?? Math.PI / 6;
				const dist = ds.distance ?? 5;
				mesh.x = Math.cos(angle) * dist;
				mesh.y = Math.sin(angle) * dist;
				this.addChild(mesh);
				this._meshes.push(mesh);
			}
		}

		// --- Stroke pass ---
		if (hasStroke) {
			const strokeQuads = this._makeQuads(font, lines, this._strokeColor, this._strokeWidth);

			if (strokeQuads.quadCount > 0) {
				if (needsShift) {
					slugApplyLineLayoutX(strokeQuads, lineQuadCounts, layout.lineOffsetX, layout.perGlyphShiftX);
				}
				const {mesh, uniforms: strokeUniforms} = this._buildMesh(strokeQuads, gpu, this._strokeWidth);
				strokeUniforms.uniforms.uStrokeAlphaStart = this._strokeAlphaStart;
				strokeUniforms.uniforms.uStrokeAlphaRate =
					this._strokeAlphaMode === 'gradient' ? this._strokeAlphaRate : 0;
				this.addChild(mesh);
				this._meshes.push(mesh);
			}
		}

		// --- Fill pass ---
		const fillQuads = this._makeQuads(font, lines, this._color);
		if (fillQuads.quadCount > 0 && needsShift) {
			slugApplyLineLayoutX(fillQuads, lineQuadCounts, layout.lineOffsetX, layout.perGlyphShiftX);
		}

		if (fillQuads.quadCount > 0) {
			const {mesh, uniforms} = this._buildMesh(fillQuads, gpu);
			this._uniforms = uniforms;
			this.addChild(mesh);
			this._meshes.push(mesh);

			// Track memory for the fill pass (representative of total)
			this._vertexBytes = fillQuads.vertices.byteLength;
			this._indexBytes = fillQuads.indices.byteLength;

			// Bounds from fill pass vertices
			const floatsPerVertex = 20;
			let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
			for (let i = 0; i < fillQuads.vertices.length; i += floatsPerVertex) {
				const vx = fillQuads.vertices[i];
				const vy = fillQuads.vertices[i + 1];
				if (vx < minX) minX = vx;
				if (vx > maxX) maxX = vx;
				if (vy < minY) minY = vy;
				if (vy > maxY) maxY = vy;
			}
			this.boundsArea = new Rectangle(minX, minY, maxX - minX, maxY - minY);
		}

		// --- Text decorations (underline / strikethrough / overline) ---
		// Reads only the concrete `_*Draw` records — base.ts has already
		// folded user input + fill color + font metrics into final RGBA
		// and pixel thickness. Decorations sit above/below the glyphs on
		// each line, so they share the same per-line offset (`layout`)
		// and effective width (post-justify) the quad shifter applied.
		const ul = this._underlineDraw, st = this._strikethroughDraw, ol = this._overlineDraw;
		if ((ul.enabled || st.enabled || ol.enabled) && font) {
			const lineHeight = (font.ascender - font.descender) * scale;

			const packColor = (rgba: [number, number, number, number]): number =>
				((rgba[0] * 255) & 0xff) << 16 | ((rgba[1] * 255) & 0xff) << 8 | ((rgba[2] * 255) & 0xff);
			const ulPacked = packColor(ul.color), stPacked = packColor(st.color), olPacked = packColor(ol.color);

			const gfx = new Graphics();

			// Inner offset for a length-restricted decoration within its
			// line box. `align` here is the decoration's own physical
			// alignment (already resolved against direction in base.ts).
			const xForDecoration = (
				lineW: number,
				drawW: number,
				align: 'left' | 'center' | 'right'
			): number => {
				if (align === 'right') return lineW - drawW;
				if (align === 'center') return (lineW - drawW) / 2;
				return 0;
			};

			for (let l = 0; l < lines.length; l++) {
				const line = lines[l];
				const effLineW = layout.effectiveLineWidth[l];
				const lineX = layout.lineOffsetX[l];
				const lineY = l * lineHeight;

				// Per-line baseline matches slugGlyphQuads' own maxGlyphTop scan,
				// so decorations align with the actual glyph positions on this line.
				let maxGlyphTop = 0;
				for (let i = 0; i < line.length; i++) {
					const g = font.glyphs.get(line.charCodeAt(i));
					if (g && g.bounds.maxY > maxGlyphTop) maxGlyphTop = g.bounds.maxY;
				}
				const baselineY = maxGlyphTop * scale;

				if (ul.enabled && ul.length > 0) {
					const drawW = effLineW * ul.length;
					const x = lineX + xForDecoration(effLineW, drawW, ul.align);
					const ulY = baselineY + lineY - font.underlinePosition * scale;
					gfx.rect(x, ulY, drawW, ul.thickness);
					gfx.fill({color: ulPacked, alpha: ul.color[3]});
				}

				if (st.enabled && st.length > 0) {
					const drawW = effLineW * st.length;
					const x = lineX + xForDecoration(effLineW, drawW, st.align);
					const stY = baselineY + lineY - font.strikethroughPosition * scale;
					gfx.rect(x, stY, drawW, st.thickness);
					gfx.fill({color: stPacked, alpha: st.color[3]});
				}

				// Overline: font tables don't define an overline metric, so by
				// CSS-engine convention reuse the underline thickness. Place the
				// line's bottom edge at the top of the rendered glyphs (y=0 in
				// local coords, which the quad builder pins to the tallest glyph
				// on the line — see slugGlyphQuads).
				if (ol.enabled && ol.length > 0) {
					const drawW = effLineW * ol.length;
					const x = lineX + xForDecoration(effLineW, drawW, ol.align);
					const olY = lineY - ol.thickness;
					gfx.rect(x, olY, drawW, ol.thickness);
					gfx.fill({color: olPacked, alpha: ol.color[3]});
				}
			}

			this._decorations = gfx;
			this.addChild(gfx);
		}
	}

	override destroy(): void {
		this._releaseFontOnDestroy();
		for (const mesh of this._meshes) {
			mesh.destroy();
		}
		this._meshes = [];
		if (this._decorations) {
			this._decorations.destroy();
			this._decorations = null;
		}
		super.destroy();
	}
}
