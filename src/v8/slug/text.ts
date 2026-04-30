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
import {slugBuildDecorationFill} from './decoration/fill';
import {slugBuildFillGpuV8, type SlugFillGpuV8} from './fill/gpu';
import {slugFontGpuV8} from './font/gpu';
import {slugShader} from './shader';
import {SlugTextInit} from '../../shared/slug/text/init';
import {SlugTextMixin} from '../../shared/slug/text/base';
import type {SlugFont} from '../../shared/slug/font';
import {Constants} from '../../constants';

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
	/** Graphics child for underline/strikethrough/overline decorations. */
	private _decorations: Graphics | null;
	/**
	 * Per-instance GPU resources derived from `_fill` (gradient LUT
	 * texture, wrapped fill texture, mode index, transform). Disposed
	 * on every rebuild before being replaced — the new fill state owns
	 * a fresh LUT.
	 */
	private _fillGpu: SlugFillGpuV8 | null;

	constructor(init: SlugTextInit) {
		super();
		this.initBase(init);
		this._meshes = [];
		this._decorations = null;
		this._fillGpu = null;

		this.rebuild();
	}

	public onSupersamplingChanged(): void {
		const value = this._supersampling ? this._supersampleCount : 0;
		for (const mesh of this._meshes) {
			if (!mesh.shader) continue;
			const group = (mesh.shader.resources as Record<string, UniformGroup>).uSupersamplingGroup;
			group.uniforms.uSupersampleCount = value;
		}
	}

	public onSupersampleCountChanged(): void {
		if (!this._supersampling) return;
		for (const mesh of this._meshes) {
			if (!mesh.shader) continue;
			const group = (mesh.shader.resources as Record<string, UniformGroup>).uSupersamplingGroup;
			group.uniforms.uSupersampleCount = this._supersampleCount;
		}
	}

	/**
	 * Build a Mesh from quad data with optional stroke expansion. The
	 * `fillGpu` argument selects the fill mode and supplies the fill
	 * sampler bindings (gradient LUT or user texture). Pass-specific
	 * uniforms (`uFillMode`, `uFillBoundsPx`, etc.) are written here so
	 * the caller doesn't repeat the pattern across shadow / stroke / fill.
	 */
	private _buildMesh(
		quads: SlugGlyphQuads,
		gpu: ReturnType<typeof slugFontGpuV8>,
		fillGpu: SlugFillGpuV8,
		fillBounds: [number, number, number, number],
		strokeExpand: number = 0
	): {mesh: Mesh<Geometry, Shader>; uniforms: UniformGroup; shader: Shader} {
		const stride = Constants.FLOATS_PER_VERTEX * Constants.BYTES_PER_FLOAT;
		const vec4Bytes = Constants.FLOATS_PER_VEC4 * Constants.BYTES_PER_FLOAT;
		const vertexBuffer = new Buffer({
			data: quads.vertices,
			label: 'slug-vertex-buffer',
			usage: BufferUsage.VERTEX
		});

		const geometry = new Geometry({
			attributes: {
				aPositionNormal: {buffer: vertexBuffer, format: 'float32x4', stride, offset: 0},
				aTexcoord: {buffer: vertexBuffer, format: 'float32x4', stride, offset: vec4Bytes},
				aJacobian: {buffer: vertexBuffer, format: 'float32x4', stride, offset: vec4Bytes * 2},
				aBanding: {buffer: vertexBuffer, format: 'float32x4', stride, offset: vec4Bytes * 3},
				aColor: {buffer: vertexBuffer, format: 'float32x4', stride, offset: vec4Bytes * 4}
			},
			indexBuffer: quads.indices
		});

		const {shader, uniforms} = slugShader(
			gpu.glProgram,
			gpu.curveTexture,
			gpu.bandTexture,
			gpu.fallbackWhite
		);
		uniforms.uniforms.uSupersampleCount = this._supersampling ? this._supersampleCount : 0;
		uniforms.uniforms.uStrokeExpand = strokeExpand;
		uniforms.uniforms.uFillMode = fillGpu.mode;
		uniforms.uniforms.uFillBoundsPx = new Float32Array(fillBounds);
		uniforms.uniforms.uFillParams0 = new Float32Array(fillGpu.params0);
		uniforms.uniforms.uFillTextureSizePx = new Float32Array(fillGpu.textureSizePx);
		uniforms.uniforms.uFillTextureFit = fillGpu.textureFit;
		uniforms.uniforms.uFillTextureScale = new Float32Array(fillGpu.textureScale);
		uniforms.uniforms.uFillTextureOffset = new Float32Array(fillGpu.textureOffset);

		// Bind the fill samplers. When the fill is solid both stay on
		// fallbackWhite (already bound by slugShader); otherwise swap in
		// the gradient LUT or user texture.
		if (fillGpu.gradient) {
			(shader.resources as Record<string, unknown>).uFillGradient = fillGpu.gradient.source;
		}
		if (fillGpu.texture) {
			(shader.resources as Record<string, unknown>).uFillTexture = fillGpu.texture.source;
		}

		return {mesh: new Mesh({geometry, shader}), uniforms, shader};
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
				lines,
				font.glyphs,
				font.advances,
				font.unitsPerEm,
				this._fontSize,
				font.textureWidth,
				lineHeight,
				color,
				extraExpand
			);
		}
		return slugGlyphQuads(
			lines[0] || '',
			font.glyphs,
			font.advances,
			font.unitsPerEm,
			this._fontSize,
			font.textureWidth,
			color,
			extraExpand
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

		// Minor optimization to reduce GC pressure. Create `this._meshes` if it
		// doesn't exist, then clear the array on every call after.
		if (Array.isArray(this._meshes)) {
			this._meshes.length = 0;
		} else {
			this._meshes = [];
		}

		if (this._decorations) {
			this.removeChild(this._decorations);
			this._decorations.destroy();
			this._decorations = null;
		}
		// Dispose previous gradient LUT before creating a new one. User-
		// supplied fill textures are not owned and not destroyed.
		if (this._fillGpu) {
			this._fillGpu.dispose();
			this._fillGpu = null;
		}

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
		const needsShift = layout.perGlyphShiftX !== null || layout.lineOffsetX.some((x) => x !== 0);

		// --- Build fill quads first so we can derive the bbox before the
		//     shadow / stroke passes need it for the fill UV uniform.
		const fillQuads = this._makeQuads(font, lines, this._color);
		if (fillQuads.quadCount > 0 && needsShift) {
			slugApplyLineLayoutX(fillQuads, lineQuadCounts, layout.lineOffsetX, layout.perGlyphShiftX);
		}

		// Compute fill bbox from the fill-pass vertex positions. Shadow
		// and stroke vertices are dilated outward and would inflate the
		// gradient/texture sample area, so we use the fill pass — that
		// matches the user's intent of the gradient covering the visible
		// glyphs.
		let bboxMinX = 0,
			bboxMinY = 0,
			bboxMaxX = 0,
			bboxMaxY = 0;
		if (fillQuads.quadCount > 0) {
			bboxMinX = Infinity;
			bboxMinY = Infinity;
			bboxMaxX = -Infinity;
			bboxMaxY = -Infinity;
			for (let i = 0; i < fillQuads.vertices.length; i += Constants.FLOATS_PER_VERTEX) {
				const vx = fillQuads.vertices[i];
				const vy = fillQuads.vertices[i + 1];
				if (vx < bboxMinX) bboxMinX = vx;
				if (vx > bboxMaxX) bboxMaxX = vx;
				if (vy < bboxMinY) bboxMinY = vy;
				if (vy > bboxMaxY) bboxMaxY = vy;
			}
		}
		const fillBounds: [number, number, number, number] = [
			bboxMinX,
			bboxMinY,
			Math.max(bboxMaxX - bboxMinX, 1),
			Math.max(bboxMaxY - bboxMinY, 1)
		];

		// Build per-instance fill GPU resources (gradient LUT or wrapped
		// fill texture). Solid fills produce a no-op record.
		this._fillGpu = slugBuildFillGpuV8(this._fill);

		// --- Drop shadow pass (always solid color, mode 0) ---
		if (hasShadow) {
			const ds = this._dropShadow!;
			const shadowAlpha = ds.alpha;
			const shadowColor: [number, number, number, number] = [
				ds.color[0],
				ds.color[1],
				ds.color[2],
				shadowAlpha
			];
			const blur = ds.blur;

			const shadowQuads = this._makeQuads(font, lines, shadowColor, blur);

			if (shadowQuads.quadCount > 0) {
				if (needsShift) {
					slugApplyLineLayoutX(
						shadowQuads,
						lineQuadCounts,
						layout.lineOffsetX,
						layout.perGlyphShiftX
					);
				}
				const solidGpu = slugBuildFillGpuV8({
					kind: 'solid',
					color: [0, 0, 0, 1],
					rgbProvided: true,
					alphaProvided: true
				});
				const {mesh, uniforms: shadowUniforms} = this._buildMesh(
					shadowQuads,
					gpu,
					solidGpu,
					fillBounds,
					blur
				);
				if (blur > 0) {
					shadowUniforms.uniforms.uStrokeAlphaStart = shadowAlpha;
					shadowUniforms.uniforms.uStrokeAlphaRate = -shadowAlpha / blur;
				}
				mesh.x = Math.cos(ds.angle) * ds.distance;
				mesh.y = Math.sin(ds.angle) * ds.distance;
				this.addChild(mesh);
				this._meshes.push(mesh);
			}
		}

		// --- Stroke pass (always solid color, mode 0) ---
		if (hasStroke) {
			const strokeQuads = this._makeQuads(font, lines, this._strokeColor, this._strokeWidth);

			if (strokeQuads.quadCount > 0) {
				if (needsShift) {
					slugApplyLineLayoutX(
						strokeQuads,
						lineQuadCounts,
						layout.lineOffsetX,
						layout.perGlyphShiftX
					);
				}
				const solidGpu = slugBuildFillGpuV8({
					kind: 'solid',
					color: [0, 0, 0, 1],
					rgbProvided: true,
					alphaProvided: true
				});
				const {mesh, uniforms: strokeUniforms} = this._buildMesh(
					strokeQuads,
					gpu,
					solidGpu,
					fillBounds,
					this._strokeWidth
				);
				strokeUniforms.uniforms.uStrokeAlphaStart = this._strokeAlphaStart;
				strokeUniforms.uniforms.uStrokeAlphaRate =
					this._strokeAlphaMode === 'gradient' ? this._strokeAlphaRate : 0;
				this.addChild(mesh);
				this._meshes.push(mesh);
			}
		}

		// --- Fill pass (uses the resolved fill mode) ---
		if (fillQuads.quadCount > 0) {
			const {mesh} = this._buildMesh(fillQuads, gpu, this._fillGpu, fillBounds);
			this.addChild(mesh);
			this._meshes.push(mesh);

			// Track memory for the fill pass (representative of total)
			this._vertexBytes = fillQuads.vertices.byteLength;
			this._indexBytes = fillQuads.indices.byteLength;

			this.boundsArea = new Rectangle(bboxMinX, bboxMinY, bboxMaxX - bboxMinX, bboxMaxY - bboxMinY);
		}

		// --- Text decorations (underline / strikethrough / overline) ---
		// Reads only the concrete `_*Draw` records — base.ts has already
		// folded user input + fill color + font metrics into final RGBA
		// and pixel thickness. Decorations sit above/below the glyphs on
		// each line, so they share the same per-line offset (`layout`)
		// and effective width (post-justify) the quad shifter applied.
		//
		// Fill inheritance: when the resolved fill is a gradient/texture
		// AND the decoration did not explicitly set RGB (sticky null),
		// build a parallel PIXI FillGradient/FillPattern sized to the
		// decoration rect so the decoration shows the same fill as the
		// glyphs. The decoration's resolved alpha (which honors per-
		// channel sticky overrides) multiplies onto the PIXI fill via
		// `Graphics.fill({fill, alpha})`.
		const ul = this._underlineDraw,
			st = this._strikethroughDraw,
			ol = this._overlineDraw;
		if ((ul.enabled || st.enabled || ol.enabled) && font) {
			const lineHeight = (font.ascender - font.descender) * scale;

			const packColor = (rgba: [number, number, number, number]): number =>
				(((rgba[0] * 255) & 0xff) << 16) | (((rgba[1] * 255) & 0xff) << 8) | ((rgba[2] * 255) & 0xff);
			const ulPacked = packColor(ul.color),
				stPacked = packColor(st.color),
				olPacked = packColor(ol.color);

			const fillIsNonSolid = this._fill.kind !== 'solid';
			const ulInheritsFill = fillIsNonSolid && this._underline.colorRgb === null;
			const stInheritsFill = fillIsNonSolid && this._strikethrough.colorRgb === null;
			const olInheritsFill = fillIsNonSolid && this._overline.colorRgb === null;

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
					if (ulInheritsFill) {
						const pixiFill = slugBuildDecorationFill(
							this._fill,
							fillBounds[0],
							fillBounds[1],
							fillBounds[2],
							fillBounds[3]
						);
						if (pixiFill) {
							// textureSpace: 'global' opts out of PIXI's default
							// "normalize UV to 0..1 across the shape's bounds"
							// behavior — for a thin underline rect that would
							// compress the texture vertically. We want world-
							// pixel mapping anchored at the bbox so the
							// decoration tile size matches the glyph fill.
							gfx.fill({fill: pixiFill, alpha: ul.color[3], textureSpace: 'global'});
						} else {
							gfx.fill({color: ulPacked, alpha: ul.color[3]});
						}
					} else {
						gfx.fill({color: ulPacked, alpha: ul.color[3]});
					}
				}

				if (st.enabled && st.length > 0) {
					const drawW = effLineW * st.length;
					const x = lineX + xForDecoration(effLineW, drawW, st.align);
					const stY = baselineY + lineY - font.strikethroughPosition * scale;
					gfx.rect(x, stY, drawW, st.thickness);
					if (stInheritsFill) {
						const pixiFill = slugBuildDecorationFill(
							this._fill,
							fillBounds[0],
							fillBounds[1],
							fillBounds[2],
							fillBounds[3]
						);
						if (pixiFill) {
							gfx.fill({fill: pixiFill, alpha: st.color[3], textureSpace: 'global'});
						} else {
							gfx.fill({color: stPacked, alpha: st.color[3]});
						}
					} else {
						gfx.fill({color: stPacked, alpha: st.color[3]});
					}
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
					if (olInheritsFill) {
						const pixiFill = slugBuildDecorationFill(
							this._fill,
							fillBounds[0],
							fillBounds[1],
							fillBounds[2],
							fillBounds[3]
						);
						if (pixiFill) {
							gfx.fill({fill: pixiFill, alpha: ol.color[3], textureSpace: 'global'});
						} else {
							gfx.fill({color: olPacked, alpha: ol.color[3]});
						}
					} else {
						gfx.fill({color: olPacked, alpha: ol.color[3]});
					}
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
		if (this._fillGpu) {
			this._fillGpu.dispose();
			this._fillGpu = null;
		}
		super.destroy();
	}
}
