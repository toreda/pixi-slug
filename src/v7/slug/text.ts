import {TYPES} from '@pixi/constants';
import {Buffer, Geometry, type Renderer} from '@pixi/core';
import {Container} from '@pixi/display';
import {Graphics} from '@pixi/graphics';
import {Mesh} from '@pixi/mesh';
import type {Shader} from '@pixi/core';
import {slugGlyphQuads, slugGlyphQuadsMultiline} from '../../shared/slug/glyph/quad';
import type {SlugGlyphQuads} from '../../shared/slug/glyph/quad';
import {slugApplyLineLayoutX} from '../../shared/slug/glyph/shift';
import type {SlugLineLayout} from '../../shared/slug/text/layout/align';
import {slugComputeLineLayout} from '../../shared/slug/text/layout/align';
import {slugResolvePhysicalAlign} from '../../shared/slug/text/style/align';
import {slugMeasureText} from '../../shared/slug/text/measure';
import {slugTextWrap} from '../../shared/slug/text/wrap';
import {slugBuildDecorationFillV7} from './decoration/fill';
import {slugBuildFillGpuV7, type SlugFillGpuV7} from './fill/gpu';
import {slugFontGpuV7, type SlugFontGpuV7} from './font/gpu';
import {slugShader} from './shader';
import {SlugTextInit} from '../../shared/slug/text/init';
import {SlugTextMixin} from '../../shared/slug/text/base';
import type {SlugFont, SlugFontEnsureResult} from '../../shared/slug/font';
import {Constants} from '../../constants';
import type {Rgba} from '../../rgba';

/**
 * CPU-side render plan computed by the geometry phase
 * ({@link SlugText.rebuild}) and consumed by the GPU-attach phase
 * ({@link SlugText._attachGpu}). Splitting this out lets us defer the
 * Mesh/Shader/Geometry construction (which binds the Slug `Program`
 * and triggers PIXI's blocking `generateProgram` on first draw) to a
 * point where we have a renderer in hand and can route it through the
 * parallel-compile path. See `_specs/features/parallel_shader_compile.md`
 * §5.5 (v8 refactor — v7 mirrors the design).
 */
interface SlugTextRenderPlan {
	font: SlugFont;
	ensureResult: SlugFontEnsureResult;
	lines: string[];
	scale: number;
	lineQuadCounts: Int32Array;
	layout: SlugLineLayout;
	needsShift: boolean;
	fillBounds: [number, number, number, number];
	fillQuads: SlugGlyphQuads | null;
	shadowQuads: SlugGlyphQuads | null;
	shadowAlpha: number;
	shadowBlur: number;
	shadowOffsetX: number;
	shadowOffsetY: number;
	strokeQuads: SlugGlyphQuads | null;
}

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
	/**
	 * Computed by {@link rebuild} (geometry phase) and consumed by
	 * {@link _attachGpu} (GPU phase) on the next `_render` tick.
	 * `null` when there is nothing to draw OR when the previous plan
	 * has already been attached to the display list.
	 */
	private _pendingPlan: SlugTextRenderPlan | null;
	/**
	 * Token tracking the in-flight `programReady` chain. Bumped by
	 * every {@link rebuild} so a late-arriving program-ready callback
	 * from a stale plan can detect that the SlugText has moved on and
	 * skip redundant work.
	 */
	private _attachToken: number;
	/**
	 * Most recent `SlugFontGpuV7` cache record this SlugText has
	 * confirmed as program-ready. `programReady` lives on the cache
	 * record forever once set (a one-shot signal, not cleared on
	 * resolve), so we use this reference-equality flag to skip the
	 * await on subsequent attaches against the same cache. Reset to
	 * `null` only when the SlugText has never seen a ready signal yet.
	 */
	private _programReadyCache: SlugFontGpuV7 | null;

	constructor(init: SlugTextInit) {
		super();
		this.initBase(init);
		this._meshes = [];
		this._decorations = null;
		this._fillGpu = null;
		this._pendingPlan = null;
		this._attachToken = 0;
		this._programReadyCache = null;

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

	/**
	 * Geometry phase: wraps + measures + lays out the text, builds the
	 * per-pass `SlugGlyphQuads` arrays, computes the fill bbox, and
	 * stores the result in {@link _pendingPlan}. **Does not** create
	 * Mesh/Geometry/Shader objects or touch the display list — those
	 * happen in {@link _attachGpu} on the next `_render` tick. This
	 * defers the binding that triggers PIXI v7's blocking
	 * `generateProgram` so the parallel-compile path (when active) can
	 * complete the link first.
	 */
	public rebuild(): void {
		this._rebuildCount++;
		this._attachToken++;

		this._teardownAttached();

		this._pendingPlan = this._buildPlan();
	}

	/**
	 * Remove and destroy meshes, decorations, and the per-instance fill
	 * GPU record from the previous attach. Reuses `_meshes` so we don't
	 * churn an array per rebuild. Unlike v8, v7 calls `mesh.destroy()`
	 * to release per-mesh GPU buffers — v7's `Program.glPrograms` cache
	 * is keyed on the program (not on the mesh), so destroying meshes
	 * does not affect the shared compiled program.
	 */
	private _teardownAttached(): void {
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
	}

	/**
	 * Pure-CPU geometry computation. Returns `null` for the empty-text
	 * / no-font early-exit case so the caller can skip scheduling an
	 * attach. All references the result holds (`font.glyphs`,
	 * `font.advances`, layout arrays) are stable for the lifetime of
	 * the plan — `ensureGlyphs` only appends, never mutates existing
	 * glyph entries.
	 */
	private _buildPlan(): SlugTextRenderPlan | null {
		const font = this._fontRef?.deref();
		if (!font || this._text.length === 0 || font.unitsPerEm === 0) {
			return null;
		}

		// See v8 SlugText.rebuild for the lazy-glyph-processing rationale —
		// behavior is identical here.
		const ensureResult = font.ensureGlyphs(this._text);

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

		let shadowQuads: SlugGlyphQuads | null = null;
		let shadowAlpha = 0;
		let shadowBlur = 0;
		let shadowOffsetX = 0;
		let shadowOffsetY = 0;
		if (this._dropShadow !== null) {
			const ds = this._dropShadow;
			shadowAlpha = ds.alpha;
			shadowBlur = ds.blur;
			shadowOffsetX = Math.cos(ds.angle) * ds.distance;
			shadowOffsetY = Math.sin(ds.angle) * ds.distance;
			const shadowColor: Rgba = [ds.color[0], ds.color[1], ds.color[2], shadowAlpha];
			const quads = this._makeQuads(font, lines, shadowColor, shadowBlur);
			if (quads.quadCount > 0) {
				if (needsShift) {
					slugApplyLineLayoutX(quads, lineQuadCounts, layout.lineOffsetX, layout.perGlyphShiftX);
				}
				shadowQuads = quads;
			}
		}

		let strokeQuads: SlugGlyphQuads | null = null;
		if (this._strokeWidth > 0) {
			const quads = this._makeQuads(font, lines, this._strokeColor, this._strokeWidth);
			if (quads.quadCount > 0) {
				if (needsShift) {
					slugApplyLineLayoutX(quads, lineQuadCounts, layout.lineOffsetX, layout.perGlyphShiftX);
				}
				strokeQuads = quads;
			}
		}

		return {
			font,
			ensureResult,
			lines,
			scale,
			lineQuadCounts,
			layout,
			needsShift,
			fillBounds,
			fillQuads: fillQuads.quadCount > 0 ? fillQuads : null,
			shadowQuads,
			shadowAlpha,
			shadowBlur,
			shadowOffsetX,
			shadowOffsetY,
			strokeQuads
		};
	}

	/**
	 * v7 `Container` calls `_render(renderer)` every frame the
	 * container is visible (before iterating children). We use it as
	 * the GPU-attach point: the first frame after a {@link rebuild}
	 * runs `slugFontGpuV7(font, ensureResult, renderer)` (which routes
	 * through the parallel-compile path when conditions allow), then
	 * builds Mesh/Geometry/Shader objects from the stored plan and
	 * adds them to the display list. v7's render loop adds the new
	 * children in time for the same frame's child iteration (Container
	 * re-reads `this.children.length` per render call), so the user
	 * sees no extra-frame delay on the sync path.
	 */
	protected override _render(renderer: Renderer): void {
		const plan = this._pendingPlan;
		if (!plan) return;

		const gpu = slugFontGpuV7(plan.font, plan.ensureResult, renderer);

		// `programReady` is a one-shot signal: present while the parallel
		// link is in flight, still present (resolved) after it completes.
		// Gate on a per-SlugText flag that flips once we've confirmed
		// readiness, so subsequent attaches skip the await without
		// looping. The flag tracks the *cache record* so a re-rebuild
		// that lands on the same cache entry doesn't re-wait either.
		if (gpu.programReady && this._programReadyCache !== gpu) {
			const token = this._attachToken;
			gpu.programReady.then(() => {
				if (this._attachToken !== token) return;
				this._programReadyCache = gpu;
				// Next visible frame's `_render` call will re-run and
				// take the attach path. Nothing else to do here — v7
				// has no `onRender` setter to clear/re-arm.
			});
			return;
		}

		this._buildAndAttachMeshes(plan, gpu);
		this._pendingPlan = null;
	}

	private _buildAndAttachMeshes(plan: SlugTextRenderPlan, gpu: SlugFontGpuV7): void {
		this._fillGpu = slugBuildFillGpuV7(this._fill);

		// --- Drop shadow pass (always solid color, mode 0) ---
		if (plan.shadowQuads !== null) {
			const solidGpu = slugBuildFillGpuV7({
				kind: 'solid',
				color: [0, 0, 0, 1],
				rgbProvided: true,
				alphaProvided: true
			});
			const {mesh, shader} = this._buildMesh(plan.shadowQuads, gpu, solidGpu, plan.fillBounds, plan.shadowBlur);
			if (plan.shadowBlur > 0) {
				shader.uniforms.uStrokeAlphaStart = plan.shadowAlpha;
				shader.uniforms.uStrokeAlphaRate = -plan.shadowAlpha / plan.shadowBlur;
			}
			mesh.x = plan.shadowOffsetX;
			mesh.y = plan.shadowOffsetY;
			this.addChild(mesh);
			this._meshes.push(mesh);
		}

		// --- Stroke pass (always solid color, mode 0) ---
		if (plan.strokeQuads !== null) {
			const solidGpu = slugBuildFillGpuV7({
				kind: 'solid',
				color: [0, 0, 0, 1],
				rgbProvided: true,
				alphaProvided: true
			});
			const {mesh, shader} = this._buildMesh(
				plan.strokeQuads,
				gpu,
				solidGpu,
				plan.fillBounds,
				this._strokeWidth
			);
			shader.uniforms.uStrokeAlphaStart = this._strokeAlphaStart;
			shader.uniforms.uStrokeAlphaRate =
				this._strokeAlphaMode === 'gradient' ? this._strokeAlphaRate : 0;
			this.addChild(mesh);
			this._meshes.push(mesh);
		}

		// --- Fill pass (uses the resolved fill mode) ---
		if (plan.fillQuads !== null) {
			const {mesh} = this._buildMesh(plan.fillQuads, gpu, this._fillGpu, plan.fillBounds);
			this.addChild(mesh);
			this._meshes.push(mesh);

			this._vertexBytes = plan.fillQuads.vertices.byteLength;
			this._indexBytes = plan.fillQuads.indices.byteLength;
		}

		this._buildDecorations(plan);
	}

	/**
	 * Build the underline/strikethrough/overline Graphics from the
	 * plan. Reads only the concrete `_*Draw` records — base.ts has
	 * already folded user input + fill color + font metrics into final
	 * RGBA and pixel thickness.
	 *
	 * Fill inheritance (texture only on v7): when the resolved fill is
	 * a texture AND the decoration did not explicitly set RGB (sticky
	 * null), build a parallel `Graphics.beginTextureFill` matrix
	 * anchored to the bbox so the decoration tiles match the glyph
	 * fill. Gradients on v7 decorations fall back to the representative
	 * solid color — see decoration/fill.ts for why.
	 */
	private _buildDecorations(plan: SlugTextRenderPlan): void {
		const ul = this._underlineDraw, st = this._strikethroughDraw, ol = this._overlineDraw;
		if (!(ul.enabled || st.enabled || ol.enabled)) return;

		const {font, lines, scale, layout, fillBounds} = plan;
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

	public destroy(): void {
		this._releaseFontOnDestroy();
		// Bump the token so any in-flight `programReady` callback that
		// resolves after destruction notices and skips re-arming work
		// against a dead instance.
		this._attachToken++;
		this._pendingPlan = null;
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
