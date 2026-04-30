import {TYPES} from '@pixi/constants';
import {Buffer, Geometry} from '@pixi/core';
import {Container} from '@pixi/display';
import {Graphics} from '@pixi/graphics';
import {Mesh} from '@pixi/mesh';
import type {Shader} from '@pixi/core';
import {slugGlyphQuads, slugGlyphQuadsMultiline} from '../../shared/slug/glyph/quad';
import type {SlugGlyphQuads} from '../../shared/slug/glyph/quad';
import {slugApplyLineLayoutX} from '../../shared/slug/glyph/shift';
import {slugComputeLineLayout} from '../../shared/slug/text/layout/align';
import {slugResolvePhysicalAlign} from '../../shared/slug/text/style/align';
import {slugMeasureText} from '../../shared/slug/text/measure';
import {slugTextWrap} from '../../shared/slug/text/wrap';
// v6 shares v7's fill GPU and decoration-fill modules — both PIXI
// versions expose the same @pixi/core / @pixi/graphics surface
// (BaseTexture.fromBuffer, WRAP_MODES, Graphics.beginTextureFill).
import {slugBuildDecorationFillV7} from '../../v7/slug/decoration/fill';
import {slugBuildFillGpuV7, type SlugFillGpuV7} from '../../v7/slug/fill/gpu';
import {slugFontGpuV6} from './font/gpu';
import {slugShader} from './shader';
import {SlugTextInit} from '../../shared/slug/text/init';
import {SlugTextMixin} from '../../shared/slug/text/base';
import type {SlugFont} from '../../shared/slug/font';

const SlugTextV6Base = SlugTextMixin(Container);

/**
 * Renderable text element using the Slug algorithm for PixiJS v6.
 * Extends Container (via SlugTextMixin) for scene graph compatibility.
 *
 * Note: Requires WebGL2. The application must be configured with
 * `preferWebGLVersion: 2` to enable the WebGL2 features required by Slug.
 *
 * Supports multi-pass rendering for stroke and drop shadow effects:
 * - Drop shadow: rendered first (behind) with shadow color and offset
 * - Stroke: rendered second with stroke color and extra dilation
 * - Fill: rendered last (on top) with the resolved fill (solid /
 *   linear gradient / radial gradient / texture)
 */
export class SlugText extends SlugTextV6Base {
	private _meshes: Mesh<Shader>[];
	private _shader: Shader | null;
	/** Graphics child for underline/strikethrough/overline decorations. */
	private _decorations: Graphics | null;
	/**
	 * Per-instance GPU resources derived from `_fill`. Disposed on every
	 * rebuild before being replaced.
	 */
	private _fillGpu: SlugFillGpuV7 | null;

	constructor(init: SlugTextInit) {
		super();
		this.initBase(init);
		this._meshes = [];
		this._shader = null;
		this._decorations = null;
		this._fillGpu = null;

		this.rebuild();
	}

	public onSupersamplingChanged(): void {
		if (this._shader) {
			this._shader.uniforms.uSupersampleCount = this._supersampling ? this._supersampleCount : 0;
		}
	}

	public onSupersampleCountChanged(): void {
		if (this._shader && this._supersampling) {
			this._shader.uniforms.uSupersampleCount = this._supersampleCount;
		}
	}

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

	private _buildMesh(
		quads: SlugGlyphQuads,
		gpu: ReturnType<typeof slugFontGpuV6>,
		fillGpu: SlugFillGpuV7,
		fillBounds: [number, number, number, number],
		strokeExpand: number = 0
	): {mesh: Mesh<Shader>; shader: Shader} {
		const stride = 20 * 4;
		const vertexBuffer = new Buffer(quads.vertices.buffer as ArrayBuffer, true);
		const geometry = new Geometry();

		geometry.addAttribute('aPositionNormal', vertexBuffer, 4, false, TYPES.FLOAT, stride, 0);
		geometry.addAttribute('aTexcoord', vertexBuffer, 4, false, TYPES.FLOAT, stride, 4 * 4);
		geometry.addAttribute('aJacobian', vertexBuffer, 4, false, TYPES.FLOAT, stride, 8 * 4);
		geometry.addAttribute('aBanding', vertexBuffer, 4, false, TYPES.FLOAT, stride, 12 * 4);
		geometry.addAttribute('aColor', vertexBuffer, 4, false, TYPES.FLOAT, stride, 16 * 4);

		const indices16 = new Uint16Array(quads.indices.length);
		for (let i = 0; i < quads.indices.length; i++) {
			indices16[i] = quads.indices[i];
		}
		geometry.addIndex(indices16 as any);

		const shader = slugShader(gpu.program, gpu.curveTexture, gpu.bandTexture, gpu.fallbackWhite, [800, 400]);
		shader.uniforms.uSupersampleCount = this._supersampling ? this._supersampleCount : 0;
		shader.uniforms.uStrokeExpand = strokeExpand;
		shader.uniforms.uFillMode = fillGpu.mode;
		shader.uniforms.uFillBoundsPx = new Float32Array(fillBounds);
		shader.uniforms.uFillParams0 = new Float32Array(fillGpu.params0);
		shader.uniforms.uFillTextureSizePx = new Float32Array(fillGpu.textureSizePx);
		shader.uniforms.uFillTextureFit = fillGpu.textureFit;
		shader.uniforms.uFillTextureScale = new Float32Array(fillGpu.textureScale);
		shader.uniforms.uFillTextureOffset = new Float32Array(fillGpu.textureOffset);

		if (fillGpu.gradient) {
			shader.uniforms.uFillGradient = fillGpu.gradient;
		}
		if (fillGpu.texture) {
			shader.uniforms.uFillTexture = fillGpu.texture;
		}

		return {mesh: new Mesh(geometry, shader), shader};
	}

	public rebuild(): void {
		this._rebuildCount++;

		for (const mesh of this._meshes) {
			this.removeChild(mesh);
			mesh.destroy();
		}
		this._meshes = [];
		this._shader = null;
		if (this._decorations) {
			this.removeChild(this._decorations);
			this._decorations.destroy();
			this._decorations = null;
		}
		if (this._fillGpu) {
			this._fillGpu.dispose();
			this._fillGpu = null;
		}

		const font = this._fontRef?.deref();
		if (!font || this._text.length === 0 || font.glyphs.size === 0) {
			return;
		}

		const gpu = slugFontGpuV6(font);
		const hasShadow = this._dropShadow !== null;
		const hasStroke = this._strokeWidth > 0;

		// --- Line layout (text-align / text-justify) ---
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

		// --- Build fill quads first so we can derive the bbox ---
		const fillQuads = this._makeQuads(font, lines, this._color);
		if (fillQuads.quadCount > 0 && needsShift) {
			slugApplyLineLayoutX(fillQuads, lineQuadCounts, layout.lineOffsetX, layout.perGlyphShiftX);
		}

		const FLOATS_PER_VERTEX = 20;
		let bboxMinX = 0, bboxMinY = 0, bboxMaxX = 0, bboxMaxY = 0;
		if (fillQuads.quadCount > 0) {
			bboxMinX = Infinity;
			bboxMinY = Infinity;
			bboxMaxX = -Infinity;
			bboxMaxY = -Infinity;
			for (let i = 0; i < fillQuads.vertices.length; i += FLOATS_PER_VERTEX) {
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

		this._fillGpu = slugBuildFillGpuV7(this._fill);

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
				const solidGpu = slugBuildFillGpuV7({
					kind: 'solid',
					color: [0, 0, 0, 1],
					rgbProvided: true,
					alphaProvided: true
				});
				const {mesh, shader} = this._buildMesh(shadowQuads, gpu, solidGpu, fillBounds, blur);
				if (blur > 0) {
					shader.uniforms.uStrokeAlphaStart = shadowAlpha;
					shader.uniforms.uStrokeAlphaRate = -shadowAlpha / blur;
				}
				const angle = ds.angle ?? Math.PI / 6;
				const dist = ds.distance ?? 5;
				mesh.x = Math.cos(angle) * dist;
				mesh.y = Math.sin(angle) * dist;
				this.addChild(mesh);
				this._meshes.push(mesh);
			}
		}

		if (hasStroke) {
			const strokeQuads = this._makeQuads(font, lines, this._strokeColor, this._strokeWidth);

			if (strokeQuads.quadCount > 0) {
				if (needsShift) {
					slugApplyLineLayoutX(strokeQuads, lineQuadCounts, layout.lineOffsetX, layout.perGlyphShiftX);
				}
				const solidGpu = slugBuildFillGpuV7({
					kind: 'solid',
					color: [0, 0, 0, 1],
					rgbProvided: true,
					alphaProvided: true
				});
				const {mesh, shader} = this._buildMesh(
					strokeQuads,
					gpu,
					solidGpu,
					fillBounds,
					this._strokeWidth
				);
				shader.uniforms.uStrokeAlphaStart = this._strokeAlphaStart;
				shader.uniforms.uStrokeAlphaRate =
					this._strokeAlphaMode === 'gradient' ? this._strokeAlphaRate : 0;
				this.addChild(mesh);
				this._meshes.push(mesh);
			}
		}

		if (fillQuads.quadCount > 0) {
			const {mesh, shader} = this._buildMesh(fillQuads, gpu, this._fillGpu, fillBounds);
			this._shader = shader;
			this.addChild(mesh);
			this._meshes.push(mesh);

			this._vertexBytes = fillQuads.vertices.byteLength;
			this._indexBytes = fillQuads.indices.byteLength;
		}

		// --- Text decorations (underline / strikethrough / overline) ---
		// Texture fills inherit through `slugBuildDecorationFillV7`;
		// gradients on v6 decorations fall back to the representative
		// solid color (no `FillGradient` in v6 Graphics — see
		// decoration/fill.ts for the rationale).
		const ul = this._underlineDraw, st = this._strikethroughDraw, ol = this._overlineDraw;
		if ((ul.enabled || st.enabled || ol.enabled) && font) {
			const lineHeight = (font.ascender - font.descender) * scale;

			const packColor = (rgba: [number, number, number, number]): number =>
				((rgba[0] * 255) & 0xff) << 16 | ((rgba[1] * 255) & 0xff) << 8 | ((rgba[2] * 255) & 0xff);
			const ulPacked = packColor(ul.color), stPacked = packColor(st.color), olPacked = packColor(ol.color);

			const fillIsTexture = this._fill.kind === 'texture';
			const ulInheritsFill = fillIsTexture && this._underline.colorRgb === null;
			const stInheritsFill = fillIsTexture && this._strikethrough.colorRgb === null;
			const olInheritsFill = fillIsTexture && this._overline.colorRgb === null;

			const gfx = new Graphics();

			const xForDecoration = (
				lineW: number,
				drawW: number,
				align: 'left' | 'center' | 'right'
			): number => {
				if (align === 'right') return lineW - drawW;
				if (align === 'center') return (lineW - drawW) / 2;
				return 0;
			};

			const drawDecoration = (
				x: number,
				y: number,
				w: number,
				h: number,
				inherits: boolean,
				color: [number, number, number, number],
				packed: number
			): void => {
				if (inherits) {
					const texFill = slugBuildDecorationFillV7(
						this._fill,
						fillBounds[0], fillBounds[1], fillBounds[2], fillBounds[3],
						color[3]
					);
					if (texFill) {
						gfx.beginTextureFill({
							texture: texFill.texture,
							alpha: texFill.alpha,
							matrix: texFill.matrix
						});
						gfx.drawRect(x, y, w, h);
						gfx.endFill();
						return;
					}
				}
				gfx.beginFill(packed, color[3]);
				gfx.drawRect(x, y, w, h);
				gfx.endFill();
			};

			for (let l = 0; l < lines.length; l++) {
				const line = lines[l];
				const effLineW = layout.effectiveLineWidth[l];
				const lineX = layout.lineOffsetX[l];
				const lineY = l * lineHeight;

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
					drawDecoration(x, ulY, drawW, ul.thickness, ulInheritsFill, ul.color, ulPacked);
				}

				if (st.enabled && st.length > 0) {
					const drawW = effLineW * st.length;
					const x = lineX + xForDecoration(effLineW, drawW, st.align);
					const stY = baselineY + lineY - font.strikethroughPosition * scale;
					drawDecoration(x, stY, drawW, st.thickness, stInheritsFill, st.color, stPacked);
				}

				if (ol.enabled && ol.length > 0) {
					const drawW = effLineW * ol.length;
					const x = lineX + xForDecoration(effLineW, drawW, ol.align);
					const olY = lineY - ol.thickness;
					drawDecoration(x, olY, drawW, ol.thickness, olInheritsFill, ol.color, olPacked);
				}
			}

			this._decorations = gfx;
			this.addChild(gfx);
		}
	}

	public destroy(): void {
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
