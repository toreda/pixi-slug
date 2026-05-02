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
import {slugBuildDecorationFillV7} from './decoration/fill';
import {slugBuildFillGpuV7, type SlugFillGpuV7} from './fill/gpu';
import {slugFontGpuV7} from './font/gpu';
import {slugShader} from './shader';
import {SlugTextInit} from '../../shared/slug/text/init';
import {SlugTextMixin} from '../../shared/slug/text/base';
import type {SlugFont} from '../../shared/slug/font';
import {Constants} from '../../constants';
import type {Rgba} from '../../rgba';

const SlugTextV7Base = SlugTextMixin(Container);

/**
 * Renderable text element using the Slug algorithm for PixiJS v7.
 * Extends Container (via SlugTextMixin) for scene graph compatibility.
 *
 * Supports multi-pass rendering for stroke and drop shadow effects:
 * - Drop shadow: rendered first (behind) with shadow color and offset
 * - Stroke: rendered second with stroke color and extra dilation
 * - Fill: rendered last (on top) with the resolved fill (solid /
 *   linear gradient / radial gradient / texture)
 *
 * GPU textures and the compiled program are owned by SlugFont (via
 * gpuCache) and shared across all SlugText instances using the same
 * font. Per-text gradient LUTs / wrapped fill textures live on
 * `_fillGpu` and are rebuilt + disposed each time the fill changes.
 */
export class SlugText extends SlugTextV7Base {
	private _meshes: Mesh<Shader>[];
	/** Graphics child for underline/strikethrough/overline decorations. */
	private _decorations: Graphics | null;
	/**
	 * Per-instance GPU resources derived from `_fill` (gradient LUT
	 * texture, wrapped fill texture, mode index). Disposed on every
	 * rebuild before being replaced — the new fill state owns a fresh
	 * LUT.
	 */
	private _fillGpu: SlugFillGpuV7 | null;

	constructor(init: SlugTextInit) {
		super();
		this.initBase(init);
		this._meshes = [];
		this._decorations = null;
		this._fillGpu = null;

		// Opt the whole subtree out of hit-testing by default. The
		// internal meshes use a custom geometry so PIXI's
		// Mesh.containsPoint crashes when the event system tries to test
		// them. Users who want a clickable SlugText can flip
		// `interactive`/`interactiveChildren` after construction. Cast
		// through `any` because the mixin's ContainerLike interface
		// hides PIXI v7 DisplayObject's interactivity fields.
		(this as any).interactive = false;
		(this as any).interactiveChildren = false;

		this.rebuild();
	}

	public onSupersamplingChanged(): void {
		const value = this._supersampling ? this._supersampleCount : 0;
		for (const mesh of this._meshes) {
			mesh.shader.uniforms.uSupersampleCount = value;
		}
	}

	public onSupersampleCountChanged(): void {
		if (!this._supersampling) return;
		for (const mesh of this._meshes) {
			mesh.shader.uniforms.uSupersampleCount = this._supersampleCount;
		}
	}

	private _makeQuads(
		font: SlugFont,
		lines: string[],
		color: Rgba,
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

	/**
	 * Build a Mesh from quad data with optional stroke expansion. The
	 * `fillGpu` argument selects the fill mode and supplies the fill
	 * sampler bindings (gradient LUT or user texture). Pass-specific
	 * uniforms (`uFillMode`, `uFillBoundsPx`, etc.) are written here so
	 * the caller doesn't repeat the pattern across shadow / stroke / fill.
	 *
	 * Hit-testing note: the geometry below uses a Slug-specific attribute
	 * layout (`aPositionNormal`, `aTexcoord`, `aJacobian`, `aBanding`,
	 * `aColor`) rather than PIXI's stock `aVertexPosition`. PIXI's
	 * `Mesh.containsPoint` looks up `aVertexPosition` directly and
	 * crashes on this geometry, which is why the parent SlugText
	 * disables hit-testing in its constructor (`interactive = false`,
	 * `interactiveChildren = false`). Anything that flips those back on
	 * needs a custom `containsPoint` or a separate hit-test rectangle
	 * — do not assume PIXI's default works on these meshes.
	 */
	private _buildMesh(
		quads: SlugGlyphQuads,
		gpu: ReturnType<typeof slugFontGpuV7>,
		fillGpu: SlugFillGpuV7,
		fillBounds: [number, number, number, number],
		strokeExpand: number = 0
	): {mesh: Mesh<Shader>; shader: Shader} {
		const stride = Constants.FLOATS_PER_VERTEX * Constants.BYTES_PER_FLOAT;
		const vec4Bytes = Constants.FLOATS_PER_VEC4 * Constants.BYTES_PER_FLOAT;
		const vertexBuffer = new Buffer(quads.vertices.buffer as ArrayBuffer, true);
		const geometry = new Geometry();

		geometry.addAttribute('aPositionNormal', vertexBuffer, 4, false, TYPES.FLOAT, stride, 0);
		geometry.addAttribute('aTexcoord', vertexBuffer, 4, false, TYPES.FLOAT, stride, vec4Bytes);
		geometry.addAttribute('aJacobian', vertexBuffer, 4, false, TYPES.FLOAT, stride, vec4Bytes * 2);
		geometry.addAttribute('aBanding', vertexBuffer, 4, false, TYPES.FLOAT, stride, vec4Bytes * 3);
		geometry.addAttribute('aColor', vertexBuffer, 4, false, TYPES.FLOAT, stride, vec4Bytes * 4);

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

		// Bind the fill samplers. When the fill is solid both stay on
		// fallbackWhite (already bound by slugShader); otherwise swap in
		// the gradient LUT or user texture.
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

		// Tear down previous meshes and drop them from `_meshes` in the
		// same reverse pass — reusing the array avoids per-rebuild GC
		// pressure.
		for (let i = this._meshes.length - 1; i >= 0; i--) {
			const mesh = this._meshes[i];
			this.removeChild(mesh);
			mesh.destroy();
			this._meshes.pop();
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

		const gpu = slugFontGpuV7(font);
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
		let bboxMinX = 0, bboxMinY = 0, bboxMaxX = 0, bboxMaxY = 0;
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
		this._fillGpu = slugBuildFillGpuV7(this._fill);

		// --- Drop shadow pass (always solid color, mode 0) ---
		if (hasShadow) {
			const ds = this._dropShadow!;
			const shadowAlpha = ds.alpha;
			const shadowColor: Rgba =
				[ds.color[0], ds.color[1], ds.color[2], shadowAlpha];
			const blur = ds.blur;

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

		// --- Fill pass (uses the resolved fill mode) ---
		if (fillQuads.quadCount > 0) {
			const {mesh} = this._buildMesh(fillQuads, gpu, this._fillGpu, fillBounds);
			this.addChild(mesh);
			this._meshes.push(mesh);

			this._vertexBytes = fillQuads.vertices.byteLength;
			this._indexBytes = fillQuads.indices.byteLength;
		}

		// --- Text decorations (underline / strikethrough / overline) ---
		// Decorations sit above/below the glyphs on each line, so they
		// share the per-line offset (`layout`) and effective width
		// (post-justify) the quad shifter applied above.
		//
		// Fill inheritance (texture only on v7): when the resolved fill
		// is a texture AND the decoration did not explicitly set RGB
		// (sticky null), build a parallel `Graphics.beginTextureFill`
		// matrix anchored to the bbox so the decoration tiles match the
		// glyph fill. Gradients on v7 decorations fall back to the
		// representative solid color — see decoration/fill.ts for why.
		const ul = this._underlineDraw, st = this._strikethroughDraw, ol = this._overlineDraw;
		if ((ul.enabled || st.enabled || ol.enabled) && font) {
			const lineHeight = (font.ascender - font.descender) * scale;

			const packColor = (rgba: Rgba): number =>
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
				color: Rgba,
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
