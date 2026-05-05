import {
	Buffer,
	BufferUsage,
	Container,
	Geometry,
	Graphics,
	Mesh,
	Rectangle,
	RendererType,
	Shader,
	UniformGroup
} from 'pixi.js';
import type {Renderer, WebGLRenderer} from 'pixi.js';
import {slugGlyphQuads, slugGlyphQuadsMultiline} from '../../shared/slug/glyph/quad';
import type {SlugGlyphQuads} from '../../shared/slug/glyph/quad';
import {slugApplyLineLayoutX} from '../../shared/slug/glyph/shift';
import type {SlugLineLayout} from '../../shared/slug/text/layout/align';
import {slugComputeLineLayout} from '../../shared/slug/text/layout/align';
import {slugResolvePhysicalAlign} from '../../shared/slug/text/style/align';
import {slugTextWrap} from '../../shared/slug/text/wrap';
import {slugMeasureText} from '../../shared/slug/text/measure';
import {slugBuildDecorationFill} from './decoration/fill';
import {slugBuildFillGpuV8, type SlugFillGpuV8} from './fill/gpu';
import {slugFontGpuV8, type SlugFontGpuV8} from './font/gpu';
import {slugShader} from './shader';
import {SlugTextInit} from '../../shared/slug/text/init';
import {SlugTextMixin} from '../../shared/slug/text/base';
import type {SlugFont} from '../../shared/slug/font';
import type {SlugFontEnsureResult} from '../../shared/slug/font';
import {Constants} from '../../constants';
import type {Rgba} from '../../rgba';

/**
 * CPU-side render plan computed by the geometry phase
 * ({@link SlugText.rebuild}) and consumed by the GPU-attach phase
 * ({@link SlugText._attachGpu}). Splitting this out lets us defer the
 * Mesh/Shader/Geometry construction (which binds the Slug `GlProgram`
 * and triggers PIXI's blocking `generateProgram` on first draw) to a
 * point where we have a renderer in hand and can route it through the
 * parallel-compile path. See `_specs/features/parallel_shader_compile.md`
 * §5.5.
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
	bboxRect: Rectangle | null;
	fillQuads: SlugGlyphQuads | null;
	shadowQuads: SlugGlyphQuads | null;
	shadowColor: Rgba | null;
	shadowBlur: number;
	shadowAlpha: number;
	shadowOffsetX: number;
	shadowOffsetY: number;
	strokeQuads: SlugGlyphQuads | null;
}

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
	/**
	 * Computed by {@link rebuild} (geometry phase) and consumed by
	 * {@link _attachGpu} (GPU phase) on the next `onRender` tick.
	 * `null` when there is nothing to draw OR when the previous plan
	 * has already been attached to the display list.
	 */
	private _pendingPlan: SlugTextRenderPlan | null;
	/**
	 * Bound `onRender` callback. Stored so we can hand the same
	 * function reference to PIXI repeatedly without allocating, and so
	 * the parallel-compile readiness chain can re-arm it after the
	 * shader finishes linking.
	 */
	private _onRenderHandler: (renderer: Renderer) => void;
	/**
	 * Token tracking the in-flight `programReady` chain. Bumped by
	 * every {@link rebuild} so a late-arriving program-ready callback
	 * from a stale plan can detect that the SlugText has moved on and
	 * skip re-arming `onRender`.
	 */
	private _attachToken: number;
	/**
	 * Most recent `SlugFontGpuV8` cache record this SlugText has
	 * confirmed as program-ready. `programReady` lives on the cache
	 * record forever once set (a one-shot signal, not cleared on
	 * resolve), so we use this reference-equality flag to skip the
	 * await on subsequent attaches against the same cache. Reset to
	 * `null` only when the SlugText has never seen a ready signal yet.
	 */
	private _programReadyCache: SlugFontGpuV8 | null;

	constructor(init: SlugTextInit) {
		super();
		this.initBase(init);
		this._meshes = [];
		this._decorations = null;
		this._fillGpu = null;
		this._pendingPlan = null;
		this._attachToken = 0;
		this._programReadyCache = null;
		this._onRenderHandler = (renderer: Renderer): void => {
			this._attachGpu(renderer);
		};

		// Opt the whole subtree out of hit-testing by default. The
		// internal meshes use a custom geometry (aPositionNormal, not
		// aVertexPosition) so PIXI's Mesh.containsPoint crashes when the
		// event system tries to test them. Users who want a clickable
		// SlugText can override eventMode after construction.
		this.eventMode = 'none';
		this.interactiveChildren = false;

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
		if (!this._supersampling) {
			return;
		}

		for (const mesh of this._meshes) {
			if (!mesh.shader) {
				continue;
			}
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
	 *
	 * Hit-testing note: the geometry below uses a Slug-specific attribute
	 * layout (`aPositionNormal`, `aTexcoord`, `aJacobian`, `aBanding`,
	 * `aColor`) rather than PIXI's stock `aVertexPosition`. PIXI's
	 * `Mesh.containsPoint` looks up `aVertexPosition` directly and
	 * crashes on this geometry, which is why the parent SlugText
	 * disables hit-testing in its constructor (`eventMode = 'none'`,
	 * `interactiveChildren = false`). Anything that flips those back on
	 * needs a custom `containsPoint` or a separate hit-test rectangle
	 * — do not assume PIXI's default works on these meshes.
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
		color: Rgba,
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

	/**
	 * Geometry phase: wraps + measures + lays out the text, builds the
	 * per-pass `SlugGlyphQuads` arrays, computes the fill bbox, and
	 * stores the result in {@link _pendingPlan}. **Does not** create
	 * Mesh/Geometry/Shader objects or touch the display list — those
	 * happen in {@link _attachGpu} on the next `onRender` tick. Splitting
	 * the work this way lets the GPU-attach step route through the
	 * parallel-compile path (see
	 * `_specs/features/parallel_shader_compile.md` §5.5).
	 *
	 * Tearing down the previous frame's meshes / decorations / fill GPU
	 * resources still happens here so observers checking `this.children`
	 * mid-rebuild see the same "removed before added" behavior they used
	 * to. Setters that mutate per-frame uniforms (e.g. supersampling)
	 * iterate `_meshes` — when the array is empty (pending attach) they
	 * naturally no-op and the next `_buildMesh` call picks up the
	 * latest values.
	 */
	public rebuild(): void {
		this._rebuildCount++;
		this._attachToken++;

		this._teardownAttached();

		const plan = this._buildPlan();
		this._pendingPlan = plan;

		// Schedule the GPU-attach phase for the next render tick. If the
		// plan ended up empty (no font / empty text / unitsPerEm == 0),
		// there's nothing to attach so we can leave `onRender` clear and
		// skip per-frame churn entirely.
		if (plan) {
			this.onRender = this._onRenderHandler;
		} else {
			this.onRender = null;
		}
	}

	/**
	 * Remove and destroy meshes, decorations, and the per-instance fill
	 * GPU record from the previous attach. Reuses `_meshes` so we don't
	 * churn an array per rebuild. Each mesh owns a fresh `Buffer` +
	 * `Geometry` + `Shader` (built per-text in `_buildMesh`); without
	 * teardown those orphan after every text change. `Geometry.destroy(true)`
	 * releases the vertex Buffer; `Shader.destroy()` defaults to
	 * `destroyPrograms=false`, so the `GlProgram` stays shared with other
	 * SlugText instances using the same font.
	 */
	private _teardownAttached(): void {
		for (let i = this._meshes.length - 1; i >= 0; i--) {
			const mesh = this._meshes[i];
			this.removeChild(mesh);
			mesh.geometry.destroy(true);
			mesh.shader?.destroy();
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

		// Lazy glyph processing: ensure every codepoint in the current
		// text has been processed and packed into the font's curve/band
		// textures before we read offsets from them. Cached glyphs
		// short-circuit at the cost of one Map.has() per codepoint;
		// only NEW codepoints trigger outline processing. The result
		// drives the GPU sync inside `slugFontGpuV8` later — a buffer
		// grow forces a texture recreate, an in-place append triggers a
		// reupload, and a no-op return path leaves both textures
		// untouched.
		const ensureResult = font.ensureGlyphs(this._text);

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
		const bboxRect =
			fillQuads.quadCount > 0
				? new Rectangle(bboxMinX, bboxMinY, bboxMaxX - bboxMinX, bboxMaxY - bboxMinY)
				: null;

		let shadowQuads: SlugGlyphQuads | null = null;
		let shadowColor: Rgba | null = null;
		let shadowBlur = 0;
		let shadowAlpha = 0;
		let shadowOffsetX = 0;
		let shadowOffsetY = 0;
		if (this._dropShadow !== null) {
			const ds = this._dropShadow;
			shadowAlpha = ds.alpha;
			shadowColor = [ds.color[0], ds.color[1], ds.color[2], shadowAlpha];
			shadowBlur = ds.blur;
			shadowOffsetX = Math.cos(ds.angle) * ds.distance;
			shadowOffsetY = Math.sin(ds.angle) * ds.distance;
			const quads = this._makeQuads(font, lines, shadowColor, shadowBlur);
			if (quads.quadCount > 0) {
				if (needsShift) {
					slugApplyLineLayoutX(
						quads,
						lineQuadCounts,
						layout.lineOffsetX,
						layout.perGlyphShiftX
					);
				}
				shadowQuads = quads;
			}
		}

		let strokeQuads: SlugGlyphQuads | null = null;
		if (this._strokeWidth > 0) {
			const quads = this._makeQuads(font, lines, this._strokeColor, this._strokeWidth);
			if (quads.quadCount > 0) {
				if (needsShift) {
					slugApplyLineLayoutX(
						quads,
						lineQuadCounts,
						layout.lineOffsetX,
						layout.perGlyphShiftX
					);
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
			bboxRect,
			fillQuads: fillQuads.quadCount > 0 ? fillQuads : null,
			shadowQuads,
			shadowColor,
			shadowBlur,
			shadowAlpha,
			shadowOffsetX,
			shadowOffsetY,
			strokeQuads
		};
	}

	/**
	 * GPU-attach phase. Runs from `onRender(renderer)`. Calls
	 * {@link slugFontGpuV8} with the renderer in hand so the
	 * cache-miss path can route through `KHR_parallel_shader_compile`
	 * when the toggle is on. While the parallel link is in flight
	 * (`gpu.programReady` unresolved), this is a no-op render-wise —
	 * `onRender` is detached and we re-arm it from the readiness
	 * callback so the next frame after the link completes does the
	 * mesh attach. The user sees nothing for those few frames; the
	 * alternative was a ~500 ms freeze.
	 *
	 * Non-WebGL renderers (WebGPU, Canvas) skip the parallel path
	 * entirely and use the synchronous attach (legacy behavior).
	 */
	private _attachGpu(renderer: Renderer): void {
		const plan = this._pendingPlan;
		if (!plan) return;

		const webglRenderer = renderer.type === RendererType.WEBGL ? (renderer as WebGLRenderer) : null;
		const gpu = slugFontGpuV8(plan.font, plan.ensureResult, webglRenderer);

		// `programReady` is a one-shot signal: present while the parallel
		// link is in flight, still present (resolved) after it completes.
		// We gate on a per-SlugText flag that flips once we've confirmed
		// readiness, so subsequent attaches skip the await without
		// looping. The flag tracks the *cache record* so a re-rebuild
		// that lands on the same cache entry doesn't re-wait either.
		if (gpu.programReady && this._programReadyCache !== gpu) {
			// Parallel link in flight. Stop firing `onRender` every frame
			// and re-arm only when the link reports readiness; this also
			// hands a stable token to the resolution callback so a stale
			// readiness from an earlier rebuild can detect the SlugText
			// has moved on.
			this.onRender = null;
			const token = this._attachToken;
			gpu.programReady.then(() => {
				if (this._attachToken !== token) return;
				this._programReadyCache = gpu;
				if (this._pendingPlan === null) return;
				this.onRender = this._onRenderHandler;
			});
			return;
		}

		this._buildAndAttachMeshes(plan, gpu);
		this._pendingPlan = null;
		// Per-frame `onRender` no longer needed — clear so PIXI removes
		// us from its onRender list.
		this.onRender = null;
	}

	/**
	 * Construct Mesh/Geometry/Shader objects from a finalized plan and
	 * attach them to the display list. Also builds the decoration
	 * Graphics (which doesn't use the Slug shader and is cheap, but is
	 * grouped here so a single attach pass covers all child additions).
	 */
	private _buildAndAttachMeshes(plan: SlugTextRenderPlan, gpu: SlugFontGpuV8): void {
		this._fillGpu = slugBuildFillGpuV8(this._fill);

		// --- Drop shadow pass (always solid color, mode 0) ---
		if (plan.shadowQuads !== null) {
			const solidGpu = slugBuildFillGpuV8({
				kind: 'solid',
				color: [0, 0, 0, 1],
				rgbProvided: true,
				alphaProvided: true
			});
			const {mesh, uniforms: shadowUniforms} = this._buildMesh(
				plan.shadowQuads,
				gpu,
				solidGpu,
				plan.fillBounds,
				plan.shadowBlur
			);
			if (plan.shadowBlur > 0) {
				shadowUniforms.uniforms.uStrokeAlphaStart = plan.shadowAlpha;
				shadowUniforms.uniforms.uStrokeAlphaRate = -plan.shadowAlpha / plan.shadowBlur;
			}
			mesh.x = plan.shadowOffsetX;
			mesh.y = plan.shadowOffsetY;
			this.addChild(mesh);
			this._meshes.push(mesh);
		}

		// --- Stroke pass (always solid color, mode 0) ---
		if (plan.strokeQuads !== null) {
			const solidGpu = slugBuildFillGpuV8({
				kind: 'solid',
				color: [0, 0, 0, 1],
				rgbProvided: true,
				alphaProvided: true
			});
			const {mesh, uniforms: strokeUniforms} = this._buildMesh(
				plan.strokeQuads,
				gpu,
				solidGpu,
				plan.fillBounds,
				this._strokeWidth
			);
			strokeUniforms.uniforms.uStrokeAlphaStart = this._strokeAlphaStart;
			strokeUniforms.uniforms.uStrokeAlphaRate =
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

			if (plan.bboxRect) this.boundsArea = plan.bboxRect;
		}

		this._buildDecorations(plan);
	}

	/**
	 * Build the underline/strikethrough/overline Graphics from the
	 * plan. Reads only the concrete `_*Draw` records — base.ts has
	 * already folded user input + fill color + font metrics into final
	 * RGBA and pixel thickness. Decorations sit above/below the glyphs
	 * on each line, so they share the same per-line offset (`layout`)
	 * and effective width (post-justify) the quad shifter applied.
	 *
	 * Fill inheritance: when the resolved fill is a gradient/texture
	 * AND the decoration did not explicitly set RGB (sticky null),
	 * build a parallel PIXI FillGradient/FillPattern sized to the
	 * decoration rect so the decoration shows the same fill as the
	 * glyphs. The decoration's resolved alpha (which honors per-channel
	 * sticky overrides) multiplies onto the PIXI fill via
	 * `Graphics.fill({fill, alpha})`.
	 */
	private _buildDecorations(plan: SlugTextRenderPlan): void {
		const ul = this._underlineDraw,
			st = this._strikethroughDraw,
			ol = this._overlineDraw;
		if (!(ul.enabled || st.enabled || ol.enabled)) return;

		const {font, lines, scale, layout, fillBounds} = plan;
		const lineHeight = (font.ascender - font.descender) * scale;

		const packColor = (rgba: Rgba): number =>
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

	override destroy(): void {
		this._releaseFontOnDestroy();
		// Bump the token so any in-flight `programReady` callback that
		// resolves after destruction notices and skips re-arming
		// `onRender` on a dead instance.
		this._attachToken++;
		this.onRender = null;
		this._pendingPlan = null;
		for (const mesh of this._meshes) {
			mesh.geometry.destroy(true);
			mesh.shader?.destroy();
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
