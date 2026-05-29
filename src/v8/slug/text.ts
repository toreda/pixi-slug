import {
	Buffer,
	BufferUsage,
	Container,
	Geometry,
	Graphics,
	Mesh,
	Rectangle,
	RendererType,
	UniformGroup
} from 'pixi.js';
import type {Renderer, WebGLRenderer} from 'pixi.js';
import {
	slugGlyphQuads,
	slugGlyphQuadsMultiline,
	slugMergeQuads,
	slugTranslateQuadsXY
} from '../../shared/slug/glyph/quad';
import type {SlugGlyphQuads} from '../../shared/slug/glyph/quad';
import {slugApplyLineLayoutX} from '../../shared/slug/glyph/shift';
import {Defaults} from '../../defaults';
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
import type {SlugTextRebuildKind} from '../../shared/slug/text/rebuild/kind';
import type {SlugMeshSlot} from './mesh/slot';
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
	/**
	 * Rebuild kind for this plan, read from the base mixin's
	 * `_consumePendingKind()` at the top of `rebuild()`. Stored on the
	 * plan so the GPU-attach phase (which may run a frame later) honors
	 * the same kind the geometry phase decided on.
	 */
	kind: SlugTextRebuildKind;
}

/**
 * The Mixin pattern is necessary due to Container API difference
 * per PIXI version while supporting multiple PIXI versions. If we
 * only supported V8 this would be `extends Container` instead.
 */
const SlugTextV8Base = SlugTextMixin(Container);

/** Initial capacity floor — small enough that single-glyph labels don't waste much,
 *  large enough to cover most short axis labels without an early grow. */
const SLOT_MIN_INITIAL_QUADS = 8;

/** Round `n` up to a sensible buffer-capacity quad count.
 *  Allocates `max(n * 1.5, MIN)` rounded up to the next multiple of 4 — keeps
 *  small reserves predictable without burning memory on tiny labels.
 *  See `_specs/features/incremental-mesh-rebuild.md` §4.4. */
function planCapacityQuads(n: number): number {
	const target = Math.max(Math.ceil(n * 1.5), SLOT_MIN_INITIAL_QUADS);
	return Math.ceil(target / 4) * 4;
}

/** Growth target for capacity-grow: max(new * 1.5, current * 2), aligned to 4 quads. */
function growCapacityQuads(newCount: number, currentCapacity: number): number {
	const target = Math.max(Math.ceil(newCount * 1.5), currentCapacity * 2);
	return Math.ceil(target / 4) * 4;
}

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
 *
 * Slot-based mesh reuse: `_shadowSlot`, `_strokeSlot`, and `_fillSlot`
 * survive across rebuilds. The incremental rebuild path rewrites the
 * underlying GL buffers and uniforms in place via `setDataWithSize`
 * (`shrinkToFit: false`) rather than allocating fresh PIXI objects. The
 * full path destroys and recreates them as before. See
 * `_specs/features/incremental-mesh-rebuild.md` for the design and
 * verified PIXI v8 contracts.
 */
export class SlugText extends SlugTextV8Base {
	/** Drop-shadow render-pass slot. `null` when no shadow is configured. */
	private _shadowSlot: SlugMeshSlot | null;
	/** Stroke render-pass slot. `null` when stroke width is 0. */
	private _strokeSlot: SlugMeshSlot | null;
	/** Fill render-pass slot. `null` when text is empty or no font is resolved. */
	private _fillSlot: SlugMeshSlot | null;

	/** Graphics child for underline/strikethrough/overline decorations. */
	private _decorations: Graphics | null;

	/**
	 * Previous attach state held over while a rebuild is in flight.
	 * Old meshes / decorations stay on the display list (so the user
	 * keeps seeing the old text) until the next `_buildAndAttachMeshes`
	 * lands, at which point the swap is atomic and these are flushed.
	 * Eliminates the one-frame blank gap on every property mutation,
	 * and the multi-frame stall on the parallel-compile slow path.
	 *
	 * On the **incremental** rebuild path the swap is atomic in place —
	 * no old state is moved here and no flush is needed. These slots
	 * stay empty for the steady-state hot loop.
	 *
	 * Old per-pass slots are stored as a single array (oldest first)
	 * because the order doesn't matter for disposal and the count can
	 * be 0–3.
	 */
	private _oldSlots: SlugMeshSlot[];
	private _oldDecorations: Graphics | null;

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
		this._shadowSlot = null;
		this._strokeSlot = null;
		this._fillSlot = null;
		this._decorations = null;
		this._oldSlots = [];
		this._oldDecorations = null;
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

	/**
	 * Iterate all live slots that currently have a `shader`. Used by
	 * per-frame uniform setters (supersampling) that must reach every
	 * active pass.
	 */
	private _forEachLiveSlot(fn: (slot: SlugMeshSlot) => void): void {
		if (this._shadowSlot) fn(this._shadowSlot);
		if (this._strokeSlot) fn(this._strokeSlot);
		if (this._fillSlot) fn(this._fillSlot);
	}

	public onSupersamplingChanged(): void {
		const value = this._supersampling ? this._supersampleCount : 0;
		this._forEachLiveSlot((slot) => {
			const group = (slot.shader.resources as Record<string, UniformGroup>).uSupersamplingGroup;
			group.uniforms.uSupersampleCount = value;
		});
	}

	public onSupersampleCountChanged(): void {
		if (!this._supersampling) {
			return;
		}
		this._forEachLiveSlot((slot) => {
			const group = (slot.shader.resources as Record<string, UniformGroup>).uSupersamplingGroup;
			group.uniforms.uSupersampleCount = this._supersampleCount;
		});
	}

	/**
	 * Allocate a fresh slot for a pass with `shrinkToFit: false`
	 * vertex / index buffers sized to a capacity reserve. The slot's
	 * typed arrays are sized to the same capacity so live data can be
	 * copied in via `.set()` and `setDataWithSize` issues a
	 * `bufferSubData` against the pre-allocated GL buffer.
	 *
	 * Hit-testing note: the geometry below uses a Slug-specific attribute
	 * layout (`aPositionNormal`, `aTexcoord`, `aJacobian`, `aBanding`,
	 * `aColor`) rather than PIXI's stock `aVertexPosition`. PIXI's
	 * `Mesh.containsPoint` looks up `aVertexPosition` directly and
	 * crashes on this geometry, which is why the parent SlugText
	 * disables hit-testing in its constructor (`eventMode = 'none'`,
	 * `interactiveChildren = false`). Anything that flips those back on
	 * needs a custom `containsPoint` or a separate hit-test rectangle —
	 * do not assume PIXI's default works on these meshes.
	 */
	private _allocSlot(
		quads: SlugGlyphQuads,
		gpu: ReturnType<typeof slugFontGpuV8>,
		fillGpu: SlugFillGpuV8,
		fillBounds: [number, number, number, number],
		strokeExpand: number = 0
	): SlugMeshSlot {
		const stride = Constants.FLOATS_PER_VERTEX * Constants.BYTES_PER_FLOAT;
		const vec4Bytes = Constants.FLOATS_PER_VEC4 * Constants.BYTES_PER_FLOAT;
		const capacityQuads = planCapacityQuads(quads.quadCount);
		const vertexFloats = capacityQuads * Constants.FLOATS_PER_QUAD;
		const indexUints = capacityQuads * Constants.INDICES_PER_QUAD;

		const vertices = new Float32Array(vertexFloats);
		vertices.set(quads.vertices);
		const indices = new Uint32Array(indexUints);
		indices.set(quads.indices);

		const vertexBuffer = new Buffer({
			data: vertices,
			label: 'slug-vertex-buffer',
			usage: BufferUsage.VERTEX,
			shrinkToFit: false
		});
		const indexBuffer = new Buffer({
			data: indices,
			label: 'slug-index-buffer',
			usage: BufferUsage.INDEX,
			shrinkToFit: false
		});

		const geometry = new Geometry({
			attributes: {
				aPositionNormal: {buffer: vertexBuffer, format: 'float32x4', stride, offset: 0},
				aTexcoord: {buffer: vertexBuffer, format: 'float32x4', stride, offset: vec4Bytes},
				aJacobian: {buffer: vertexBuffer, format: 'float32x4', stride, offset: vec4Bytes * 2},
				aBanding: {buffer: vertexBuffer, format: 'float32x4', stride, offset: vec4Bytes * 3},
				aColor: {buffer: vertexBuffer, format: 'float32x4', stride, offset: vec4Bytes * 4}
			},
			indexBuffer: indexBuffer
		});

		const {shader, uniforms} = slugShader(
			gpu.glProgram,
			gpu.curveTexture,
			gpu.bandTexture,
			gpu.fallbackWhite
		);

		const slot: SlugMeshSlot = {
			mesh: new Mesh({geometry, shader}),
			geometry,
			shader,
			uniforms,
			vertexBuffer,
			indexBuffer,
			vertices,
			indices,
			vertexCapacityQuads: capacityQuads,
			indexCapacityQuads: capacityQuads,
			fillGpu: null,
			fillMode: 0,
			_gpuGeneration: gpu.generation
		};

		// Tell PIXI the live data size is what `quads` carries, not the
		// allocated capacity — `gl.drawElements` defaults to the live
		// index buffer length (verified A4 in
		// `_specs/features/incremental-mesh-rebuild.md`).
		vertexBuffer.setDataWithSize(vertices, quads.vertices.length, true);
		indexBuffer.setDataWithSize(indices, quads.indices.length, true);

		this._writePassUniforms(slot, fillGpu, fillBounds, strokeExpand);
		this._writeFillSamplers(slot, fillGpu);
		return slot;
	}

	/**
	 * Rewrite a slot's vertex / index data in place. When the new quad
	 * count fits the slot's current capacity this is the steady-state
	 * incremental path (no PIXI object allocation, only `bufferSubData`
	 * on the GL side). When the new quad count exceeds capacity the
	 * slot's buffers are replaced with larger ones via the
	 * capacity-grow path — `Geometry`, `Shader`, and `Mesh` are reused
	 * either way.
	 *
	 * Always rewrites uniforms and (for the fill slot) rebinds samplers
	 * if the fill mode changed.
	 */
	private _updateSlot(
		slot: SlugMeshSlot,
		quads: SlugGlyphQuads,
		fillGpu: SlugFillGpuV8,
		fillBounds: [number, number, number, number],
		strokeExpand: number = 0
	): void {
		const vertexFloatsNeeded = quads.vertices.length;
		const indexUintsNeeded = quads.indices.length;

		if (
			quads.quadCount > slot.vertexCapacityQuads ||
			quads.quadCount > slot.indexCapacityQuads
		) {
			this._growSlot(slot, quads.quadCount);
		}

		slot.vertices.set(quads.vertices);
		slot.indices.set(quads.indices);

		// `setDataWithSize` with `shrinkToFit: false` on the underlying
		// `Buffer` keeps the GL buffer at its allocated capacity even
		// when the live data shrinks, so the next upload stays on
		// `bufferSubData`. Verified A11.
		slot.vertexBuffer.setDataWithSize(slot.vertices, vertexFloatsNeeded, true);
		slot.indexBuffer.setDataWithSize(slot.indices, indexUintsNeeded, true);

		this._writePassUniforms(slot, fillGpu, fillBounds, strokeExpand);
		this._writeFillSamplers(slot, fillGpu);
	}

	/**
	 * Replace a slot's vertex and index buffers with larger ones while
	 * keeping the `Geometry`, `Shader`, and `Mesh` instances. The
	 * existing `Buffer` instances are destroyed because their underlying
	 * GL buffers can't be enlarged in place.
	 *
	 * Why we don't keep the same `Buffer` objects: PIXI's `Buffer.update`
	 * does reallocate the GL buffer internally when data grows beyond
	 * capacity (A2 in the spec), but the JS typed-array slot is fixed
	 * at construction. We need a larger typed array to host the new
	 * data, which means a new `Buffer` wrapper too.
	 */
	private _growSlot(slot: SlugMeshSlot, newQuadCount: number): void {
		const newCapacity = growCapacityQuads(
			newQuadCount,
			Math.max(slot.vertexCapacityQuads, slot.indexCapacityQuads)
		);
		const stride = Constants.FLOATS_PER_VERTEX * Constants.BYTES_PER_FLOAT;
		const vec4Bytes = Constants.FLOATS_PER_VEC4 * Constants.BYTES_PER_FLOAT;
		const vertexFloats = newCapacity * Constants.FLOATS_PER_QUAD;
		const indexUints = newCapacity * Constants.INDICES_PER_QUAD;

		const oldVertexBuffer = slot.vertexBuffer;
		const oldIndexBuffer = slot.indexBuffer;

		slot.vertices = new Float32Array(vertexFloats);
		slot.indices = new Uint32Array(indexUints);
		slot.vertexBuffer = new Buffer({
			data: slot.vertices,
			label: 'slug-vertex-buffer',
			usage: BufferUsage.VERTEX,
			shrinkToFit: false
		});
		slot.indexBuffer = new Buffer({
			data: slot.indices,
			label: 'slug-index-buffer',
			usage: BufferUsage.INDEX,
			shrinkToFit: false
		});
		slot.vertexCapacityQuads = newCapacity;
		slot.indexCapacityQuads = newCapacity;

		// Re-bind the geometry's attribute buffers to the new vertex
		// buffer. The attribute records reference the buffer by object
		// identity, so we have to point them at the replacement before
		// the next draw.
		slot.geometry.attributes.aPositionNormal.buffer = slot.vertexBuffer;
		slot.geometry.attributes.aTexcoord.buffer = slot.vertexBuffer;
		slot.geometry.attributes.aJacobian.buffer = slot.vertexBuffer;
		slot.geometry.attributes.aBanding.buffer = slot.vertexBuffer;
		slot.geometry.attributes.aColor.buffer = slot.vertexBuffer;
		// `Geometry.indexBuffer` is read by the renderer at draw time
		// and is a writable field — swap it directly.
		(slot.geometry as unknown as {indexBuffer: Buffer}).indexBuffer = slot.indexBuffer;
		// Re-attribute the new attribute offsets (same stride / offsets
		// as the original allocation — those don't change when capacity
		// grows).
		slot.geometry.attributes.aPositionNormal.stride = stride;
		slot.geometry.attributes.aPositionNormal.offset = 0;
		slot.geometry.attributes.aTexcoord.stride = stride;
		slot.geometry.attributes.aTexcoord.offset = vec4Bytes;
		slot.geometry.attributes.aJacobian.stride = stride;
		slot.geometry.attributes.aJacobian.offset = vec4Bytes * 2;
		slot.geometry.attributes.aBanding.stride = stride;
		slot.geometry.attributes.aBanding.offset = vec4Bytes * 3;
		slot.geometry.attributes.aColor.stride = stride;
		slot.geometry.attributes.aColor.offset = vec4Bytes * 4;

		oldVertexBuffer.destroy();
		oldIndexBuffer.destroy();
	}

	/**
	 * Write per-pass uniforms to the slot's uniform group. The values
	 * mirror the ones today's `_buildMesh` writes — split out so the
	 * alloc and update paths share it.
	 */
	private _writePassUniforms(
		slot: SlugMeshSlot,
		fillGpu: SlugFillGpuV8,
		fillBounds: [number, number, number, number],
		strokeExpand: number
	): void {
		const uniforms = slot.uniforms;
		uniforms.uniforms.uSupersampleCount = this._supersampling ? this._supersampleCount : 0;
		uniforms.uniforms.uStrokeExpand = strokeExpand;
		uniforms.uniforms.uFillMode = fillGpu.mode;
		uniforms.uniforms.uFillTextureFit = fillGpu.textureFit;
		// Mutate the typed-array slots in place rather than allocating
		// fresh `Float32Array`s. PIXI v8's WebGL uniform sync compares
		// element-wise against a cached snapshot, so changing the buffer
		// contents is detected and pushed to the GPU on the next draw —
		// no `update()` call needed. Verified A10.
		const boundsBuf = uniforms.uniforms.uFillBoundsPx as Float32Array;
		boundsBuf[0] = fillBounds[0];
		boundsBuf[1] = fillBounds[1];
		boundsBuf[2] = fillBounds[2];
		boundsBuf[3] = fillBounds[3];
		const params0Buf = uniforms.uniforms.uFillParams0 as Float32Array;
		params0Buf[0] = fillGpu.params0[0];
		params0Buf[1] = fillGpu.params0[1];
		params0Buf[2] = fillGpu.params0[2];
		params0Buf[3] = fillGpu.params0[3];
		const texSizeBuf = uniforms.uniforms.uFillTextureSizePx as Float32Array;
		texSizeBuf[0] = fillGpu.textureSizePx[0];
		texSizeBuf[1] = fillGpu.textureSizePx[1];
		const texScaleBuf = uniforms.uniforms.uFillTextureScale as Float32Array;
		texScaleBuf[0] = fillGpu.textureScale[0];
		texScaleBuf[1] = fillGpu.textureScale[1];
		const texOffsetBuf = uniforms.uniforms.uFillTextureOffset as Float32Array;
		texOffsetBuf[0] = fillGpu.textureOffset[0];
		texOffsetBuf[1] = fillGpu.textureOffset[1];
	}

	/**
	 * Rebind the slot's gradient / texture samplers from a freshly
	 * resolved `SlugFillGpuV8`. Reading or assigning `shader.resources`
	 * does NOT trigger a re-link (verified A7); the swapped texture is
	 * picked up fresh on the next draw (verified A8).
	 *
	 * For the fill slot we also dispose the previously-owned
	 * `SlugFillGpuV8` (gradient LUT texture, wrapped fill texture) if
	 * the new GPU record is different.
	 */
	private _writeFillSamplers(slot: SlugMeshSlot, fillGpu: SlugFillGpuV8): void {
		// Bind whichever fill resource the resolved mode wants. When the
		// fill is solid both stay on the font's fallbackWhite (already
		// bound by slugShader at slot construction); otherwise swap in
		// the gradient LUT or user texture.
		if (fillGpu.gradient) {
			(slot.shader.resources as Record<string, unknown>).uFillGradient = fillGpu.gradient.source;
		}
		if (fillGpu.texture) {
			(slot.shader.resources as Record<string, unknown>).uFillTexture = fillGpu.texture.source;
		}

		// Lifecycle: only the fill slot owns a `fillGpu` record. Shadow
		// and stroke slots pass synthetic solid `fillGpu` instances that
		// the caller does not retain — we leave `slot.fillGpu` untouched
		// for those.
		if (fillGpu.mode === 0 && !fillGpu.gradient && !fillGpu.texture) {
			// Synthetic solid (shadow / stroke pass). Don't take
			// ownership.
			return;
		}
		if (slot.fillGpu && slot.fillGpu !== fillGpu) {
			slot.fillGpu.dispose();
		}
		slot.fillGpu = fillGpu;
		slot.fillMode = fillGpu.mode;
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
	 * Build a sub/sup glyph run at its own font size and translate it so
	 * its baseline lands at `(anchorX, targetBaselineY)` in the parent
	 * SlugText's local coordinate space. The script is rendered as a
	 * single line (no wrap, newlines treated as literal). Returns `null`
	 * when no glyphs resolved.
	 *
	 * Each script gets its own `slugGlyphQuads` call so the per-vertex
	 * jacobian and band scale reflect the script's smaller size — the
	 * shader does not assume a global scale, so the quads merge into the
	 * fill buffer correctly.
	 */
	private _buildScriptQuads(
		font: SlugFont,
		text: string,
		fontSize: number,
		anchorX: number,
		targetBaselineY: number
	): SlugGlyphQuads | null {
		const scriptScale = fontSize / font.unitsPerEm;
		const quads = slugGlyphQuads(
			text,
			font.glyphs,
			font.advances,
			font.unitsPerEm,
			fontSize,
			font.textureWidth,
			this._color,
			0
		);
		if (quads.quadCount === 0) return null;

		// The script's internal baseline is `maxGlyphTop_script *
		// scriptScale`. Translate so the baseline lands at the requested
		// target — and x by the requested anchor.
		let maxGlyphTop = 0;
		for (let i = 0; i < text.length; i++) {
			const g = font.glyphs.get(text.charCodeAt(i));
			if (g && g.bounds.maxY > maxGlyphTop) maxGlyphTop = g.bounds.maxY;
		}
		const scriptInternalBaselineY = maxGlyphTop * scriptScale;
		slugTranslateQuadsXY(quads, anchorX, targetBaselineY - scriptInternalBaselineY);
		return quads;
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
	 * On the **incremental** rebuild path no old slots are moved to
	 * `_oldSlots`; the swap happens atomically in place when
	 * `_attachGpu` runs. On the **full** path the current slots are
	 * moved aside so the next attach can drop them after the new ones
	 * are on the display list, preserving the no-blank-frame contract.
	 */
	public rebuild(): void {
		// Async font-resolve callbacks can fire after the SlugText has
		// been destroyed (the `.then(...)` block in base.ts captures
		// `this` before destroy runs). Bail before touching the display
		// list or allocating quads on a dead instance.
		if (this.destroyed) return;

		this._rebuildCount++;
		this._attachToken++;

		const kind = this._consumePendingKind();

		// `_consumePendingKind` returns `'full'` for any rebuild not
		// driven through `_requestRebuild` (constructor's initial call,
		// font-resolve async path, setters that still call this.rebuild()
		// directly). For the full path we move old state into the
		// held-over slots; for incremental kinds the existing slots will
		// be updated in place by `_attachGpu` and there is nothing to
		// hold over.
		if (kind === 'full') {
			if (this._shadowSlot) {
				this._oldSlots.push(this._shadowSlot);
				this._shadowSlot = null;
			}
			if (this._strokeSlot) {
				this._oldSlots.push(this._strokeSlot);
				this._strokeSlot = null;
			}
			if (this._fillSlot) {
				this._oldSlots.push(this._fillSlot);
				this._fillSlot = null;
			}
			if (this._decorations) {
				this._oldDecorations = this._decorations;
				this._decorations = null;
			}
		}

		const plan = this._buildPlan(kind);
		this._pendingPlan = plan;

		// Publish bounds synchronously from the plan so `width` / `height`
		// are valid immediately after `rebuild()` (and therefore after
		// construction and after every property setter), matching v6/v7
		// and 0.2.0. The plan already holds `bboxRect` from a CPU-only
		// measurement pass; nothing about the deferred GPU-attach path
		// requires waiting until `onRender` to expose it. PIXI's
		// `getGlobalBounds` does a falsy check on `boundsArea`, so
		// clearing it back to `undefined` correctly disables the override
		// for empty text — but the public type is non-nullable, hence
		// the cast.
		this.boundsArea =
			plan && plan.bboxRect ? plan.bboxRect : (undefined as unknown as Rectangle);

		// Schedule the GPU-attach phase for the next render tick. If the
		// plan ended up empty (no font / empty text / unitsPerEm == 0),
		// there's nothing to attach so we can leave `onRender` clear and
		// skip per-frame churn entirely. We also have to flush the
		// held-over state here — without an upcoming attach to drive the
		// swap, the old meshes would stay on the display list forever.
		if (plan) {
			this.onRender = this._onRenderHandler;
		} else {
			// No plan to attach — there's nothing left for the deferred
			// attach to do, so dispose any currently-active slots
			// directly (incremental path may have left them in place
			// when the rebuild started) and flush the held-over state.
			if (this._shadowSlot) {
				this._disposeSlot(this._shadowSlot);
				this._shadowSlot = null;
			}
			if (this._strokeSlot) {
				this._disposeSlot(this._strokeSlot);
				this._strokeSlot = null;
			}
			if (this._fillSlot) {
				this._disposeSlot(this._fillSlot);
				this._fillSlot = null;
			}
			if (this._decorations) {
				this.removeChild(this._decorations);
				this._decorations.destroy();
				this._decorations = null;
			}
			this._flushOldAttachState();
			this.onRender = null;
		}
	}

	/**
	 * Drop the held-over attach state from the previous rebuild. Called
	 * atomically from {@link _buildAndAttachMeshes} after the new children
	 * are on the display list, and from the empty-plan branch of
	 * {@link rebuild} (no upcoming attach to drive the swap) and from
	 * {@link destroy}.
	 */
	private _flushOldAttachState(): void {
		for (let i = this._oldSlots.length - 1; i >= 0; i--) {
			this._disposeSlot(this._oldSlots[i]);
		}
		this._oldSlots.length = 0;

		if (this._oldDecorations) {
			this.removeChild(this._oldDecorations);
			this._oldDecorations.destroy();
			this._oldDecorations = null;
		}
	}

	/**
	 * Tear down a single slot — remove its mesh from the display list,
	 * destroy the geometry (and the underlying GL buffers), destroy the
	 * shader and mesh, and dispose any owned fill-GPU record.
	 */
	private _disposeSlot(slot: SlugMeshSlot): void {
		this.removeChild(slot.mesh);
		slot.geometry.destroy(true);
		slot.shader.destroy();
		slot.mesh.destroy();
		if (slot.fillGpu) {
			slot.fillGpu.dispose();
			slot.fillGpu = null;
		}
	}

	/**
	 * Rebind the slot's `uCurveTexture` / `uBandTexture` sampler
	 * resources to the font's current GPU cache texture sources when
	 * the font's generation counter has moved past what this slot
	 * recorded. Cheap no-op in the steady state (one integer compare).
	 *
	 * Why this is necessary: `slugFontGpuV8`'s cache-hit grow path
	 * destroys and replaces the font's `curveTexture` / `bandTexture`
	 * when `ensureGlyphs` reallocates the curve or band buffer
	 * (triggered by ANY SlugText on the same font appending glyphs that
	 * exceed current headroom). Slots not rebuilt in that same frame
	 * still hold a `shader.resources.uCurveTexture` / `uBandTexture`
	 * binding to the *destroyed* sources — PIXI's GC reclaims those
	 * texture sources and the slot's draw call samples from invalid
	 * memory (visual: glyph appears blank or garbled). The font's
	 * `gpu.generation` is bumped on every replace; slots cache the
	 * generation they were last bound to and rebind here when stale.
	 * See multi-font audit recommendation Option A.
	 *
	 * Reading or assigning `shader.resources` does NOT trigger a re-link
	 * (verified A7 in `_specs/features/incremental-mesh-rebuild.md`);
	 * the swapped texture source is picked up fresh on the next draw
	 * (verified A8).
	 */
	private _syncSlotToFontGeneration(slot: SlugMeshSlot, gpu: SlugFontGpuV8): void {
		if (slot._gpuGeneration === gpu.generation) return;
		const resources = slot.shader.resources as Record<string, unknown>;
		resources.uCurveTexture = gpu.curveTexture.source;
		resources.uBandTexture = gpu.bandTexture.source;
		slot._gpuGeneration = gpu.generation;
	}

	/**
	 * Pure-CPU geometry computation. Returns `null` for the empty-text
	 * / no-font early-exit case so the caller can skip scheduling an
	 * attach. All references the result holds (`font.glyphs`,
	 * `font.advances`, layout arrays) are stable for the lifetime of
	 * the plan — `ensureGlyphs` only appends, never mutates existing
	 * glyph entries.
	 */
	private _buildPlan(kind: SlugTextRebuildKind): SlugTextRenderPlan | null {
		const font = this._fontRef?.deref();
		if (!font || font.unitsPerEm === 0) {
			return null;
		}

		const subSize = this._effectiveSubFontSize();
		const supSize = this._effectiveSupFontSize();
		const hasSub = subSize > 0;
		const hasSup = supSize > 0;

		// Bail when there is no main text and no scripts to render. A
		// SlugText with only sub/sup set still produces a plan.
		if (this._text.length === 0 && !hasSub && !hasSup) {
			return null;
		}

		// Lazy glyph processing: ensure every codepoint in the current
		// text — including sub/sup runs — has been processed and packed
		// into the font's curve/band textures before we read offsets from
		// them. Cached glyphs short-circuit at the cost of one Map.has()
		// per codepoint; only NEW codepoints trigger outline processing.
		// The result drives the GPU sync inside `slugFontGpuV8` later — a
		// buffer grow forces a texture recreate, an in-place append
		// triggers a reupload, and a no-op return path leaves both
		// textures untouched.
		let ensureSource = this._text;
		if (hasSub) ensureSource += this._subscript;
		if (hasSup) ensureSource += this._superscript;
		const ensureResult = font.ensureGlyphs(ensureSource);

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
		const fillMain = this._makeQuads(font, lines, this._color);
		if (fillMain.quadCount > 0 && needsShift) {
			slugApplyLineLayoutX(fillMain, lineQuadCounts, layout.lineOffsetX, layout.perGlyphShiftX);
		}

		// --- Sub/sup buffer-merge path ---
		// Build each script as its own quad run (smaller scale → its own
		// jacobian baked per-vertex), translate to the anchor point at the
		// trailing edge of the main text's last line, and concatenate onto
		// the fill buffer. Stroke and shadow do NOT receive scripts.
		// Scripts inherit only the main fill color via `_color`.
		const lastLineIndex = lines.length - 1;
		const lastLine = lines[lastLineIndex];
		const lastLineHasGlyph = (lineQuadCounts[lastLineIndex] ?? 0) > 0;
		const scaleMain = scale;
		const lineHeight = (font.ascender - font.descender) * scaleMain;

		// Main last-line baseline in the merged buffer. Each line's
		// internal `baselineY` is `maxGlyphTop_line * scaleMain`, and the
		// line itself is shifted by `lastLineIndex * lineHeight`
		// (`slugGlyphQuadsMultiline`) — so the baseline of the last line
		// is the sum of the two. When the main text is empty we still
		// anchor scripts as if `_fontSize` were used for line metrics, so
		// the scripts don't collapse onto y=0.
		let maxGlyphTopMain = 0;
		if (lastLineHasGlyph) {
			for (let i = 0; i < lastLine.length; i++) {
				const g = font.glyphs.get(lastLine.charCodeAt(i));
				if (g && g.bounds.maxY > maxGlyphTopMain) maxGlyphTopMain = g.bounds.maxY;
			}
		} else {
			// Fall back to the font's ascender so a sub/sup-only SlugText
			// has a sensible vertical anchor.
			maxGlyphTopMain = font.ascender;
		}
		const mainBaselineY = lastLineIndex * lineHeight + maxGlyphTopMain * scaleMain;

		// Trailing x cursor of the last line, after alignment offset.
		const mainCursorEndX = layout.lineOffsetX[lastLineIndex] + lineWidths[lastLineIndex];
		const scriptGap = this._fontSize * Defaults.SlugText.ScriptGapRatio;
		const scriptAnchorX = mainCursorEndX + scriptGap;

		const subBuilt = hasSub
			? this._buildScriptQuads(
					font,
					this._subscript,
					subSize,
					scriptAnchorX,
					mainBaselineY + this._fontSize * Defaults.SlugText.SubBaselineRatio
				)
			: null;
		const supBuilt = hasSup
			? this._buildScriptQuads(
					font,
					this._superscript,
					supSize,
					scriptAnchorX,
					mainBaselineY - this._fontSize * Defaults.SlugText.SupBaselineRatio
				)
			: null;

		const fillQuads =
			subBuilt || supBuilt ? slugMergeQuads([fillMain, subBuilt, supBuilt]) : fillMain;

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
			strokeQuads,
			kind
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

		// Pull-on-draw rebind path (A2 from the multi-font audit). Any
		// frame in which this SlugText has no pending rebuild, we still
		// need to check whether another SlugText sharing the same font
		// grew the font's curve/band buffers since our last attach —
		// that grow destroyed our shader's bound texture sources. Cheap:
		// `slugFontGpuV8` short-circuits on cache hit when nothing
		// changed, and `_syncSlotToFontGeneration` is one integer
		// compare per live slot in the steady state. Without this
		// rebind, stationary SlugTexts that share a font with a
		// just-grown SlugText render as blank glyphs (the texture
		// source they reference was destroyed by PIXI's GC).
		if (!plan) {
			const font = this._fontRef?.deref();
			if (!font) return;
			const gpuCache = font.gpuCache as SlugFontGpuV8 | null;
			if (!gpuCache) return;
			if (this._shadowSlot) this._syncSlotToFontGeneration(this._shadowSlot, gpuCache);
			if (this._strokeSlot) this._syncSlotToFontGeneration(this._strokeSlot, gpuCache);
			if (this._fillSlot) this._syncSlotToFontGeneration(this._fillSlot, gpuCache);
			return;
		}

		const webglRenderer = renderer.type === RendererType.WEBGL ? (renderer as WebGLRenderer) : null;
		const gpu = slugFontGpuV8(plan.font, plan.ensureResult, webglRenderer);

		// `programReady` is a one-shot signal: present while the parallel
		// link is in flight, still present (resolved) after it completes.
		// We gate on a per-SlugText flag that flips once we've confirmed
		// readiness, so subsequent attaches skip the await without
		// looping. The flag tracks the *cache record* so a re-rebuild
		// that lands on the same cache entry doesn't re-wait either.
		//
		// The promise resolves to `boolean` (true on successful PIXI
		// program-data injection, false on injection failure / PIXI
		// internal drift). We don't branch on the value: false means
		// PIXI's sync compile will run on the first draw — exactly the
		// pre-feature behavior, so falling through to the normal attach
		// is correct. A rejection is treated the same way: we cannot
		// stay parked indefinitely, so we still attach and let PIXI's
		// sync path surface any real shader error on first draw.
		if (gpu.programReady && this._programReadyCache !== gpu) {
			// Parallel link in flight. Stop firing `onRender` every frame
			// and re-arm only when the link reports readiness; this also
			// hands a stable token to the resolution callback so a stale
			// readiness from an earlier rebuild can detect the SlugText
			// has moved on.
			this.onRender = null;
			const token = this._attachToken;
			const onSettled = (): void => {
				if (this._attachToken !== token) return;
				this._programReadyCache = gpu;
				if (this._pendingPlan === null) return;
				this.onRender = this._onRenderHandler;
			};
			// `slugCompileAndInject` resolves to `true`/`false` and does
			// not reject — link / injection errors are logged at their
			// source and mapped to `false` so the caller falls through to
			// PIXI's sync compile. Reject branch is wired anyway as a
			// belt-and-suspenders against future contract drift, so a
			// stray rejection cannot strand the text with `onRender` null.
			gpu.programReady.then(onSettled, onSettled);
			return;
		}

		this._buildAndAttachMeshes(plan, gpu);
		this._pendingPlan = null;
		// Keep `onRender` attached so the pull-on-draw generation check
		// at the top of `_attachGpu` runs every frame. Steady-state cost
		// is one map deref + one integer compare per live slot; cheaper
		// than the alternative of pushing rebinds from the font (which
		// would require SlugFont to track all its SlugText users — a
		// pattern SlugText explicitly avoids). See multi-font audit
		// option A2.
	}

	/**
	 * Construct or reuse slot meshes from a finalized plan and attach
	 * them to the display list. On the incremental path the existing
	 * slots are updated in place; on the full path fresh slots are
	 * allocated and the old ones flushed.
	 *
	 * Also builds (or rebuilds) the decoration `Graphics`. The Graphics
	 * is reused via `clear()` + re-issue when it already exists, since
	 * the alternative is destroying and recreating a child node every
	 * rebuild — see A12 in `_specs/features/incremental-mesh-rebuild.md`
	 * (display-list churn avoided; internal GPU batches still rebuild).
	 */
	private _buildAndAttachMeshes(plan: SlugTextRenderPlan, gpu: SlugFontGpuV8): void {
		// --- Drop shadow pass (always solid color, mode 0) ---
		if (plan.shadowQuads !== null) {
			const solidGpu = slugBuildFillGpuV8({
				kind: 'solid',
				color: [0, 0, 0, 1],
				rgbProvided: true,
				alphaProvided: true
			});
			if (this._shadowSlot) {
				this._updateSlot(
					this._shadowSlot,
					plan.shadowQuads,
					solidGpu,
					plan.fillBounds,
					plan.shadowBlur
				);
				this._syncSlotToFontGeneration(this._shadowSlot, gpu);
			} else {
				this._shadowSlot = this._allocSlot(
					plan.shadowQuads,
					gpu,
					solidGpu,
					plan.fillBounds,
					plan.shadowBlur
				);
				this.addChild(this._shadowSlot.mesh);
			}
			if (plan.shadowBlur > 0) {
				this._shadowSlot.uniforms.uniforms.uStrokeAlphaStart = plan.shadowAlpha;
				this._shadowSlot.uniforms.uniforms.uStrokeAlphaRate =
					-plan.shadowAlpha / plan.shadowBlur;
			}
			this._shadowSlot.mesh.x = plan.shadowOffsetX;
			this._shadowSlot.mesh.y = plan.shadowOffsetY;
		} else if (this._shadowSlot) {
			// Drop-shadow disabled between rebuilds — release the slot.
			this._disposeSlot(this._shadowSlot);
			this._shadowSlot = null;
		}

		// --- Stroke pass (always solid color, mode 0) ---
		if (plan.strokeQuads !== null) {
			const solidGpu = slugBuildFillGpuV8({
				kind: 'solid',
				color: [0, 0, 0, 1],
				rgbProvided: true,
				alphaProvided: true
			});
			if (this._strokeSlot) {
				this._updateSlot(
					this._strokeSlot,
					plan.strokeQuads,
					solidGpu,
					plan.fillBounds,
					this._strokeWidth
				);
				this._syncSlotToFontGeneration(this._strokeSlot, gpu);
			} else {
				this._strokeSlot = this._allocSlot(
					plan.strokeQuads,
					gpu,
					solidGpu,
					plan.fillBounds,
					this._strokeWidth
				);
				this.addChild(this._strokeSlot.mesh);
			}
			this._strokeSlot.uniforms.uniforms.uStrokeAlphaStart = this._strokeAlphaStart;
			this._strokeSlot.uniforms.uniforms.uStrokeAlphaRate =
				this._strokeAlphaMode === 'gradient' ? this._strokeAlphaRate : 0;
		} else if (this._strokeSlot) {
			this._disposeSlot(this._strokeSlot);
			this._strokeSlot = null;
		}

		// --- Fill pass (uses the resolved fill mode) ---
		if (plan.fillQuads !== null) {
			const fillGpu = slugBuildFillGpuV8(this._fill);
			if (this._fillSlot) {
				this._updateSlot(this._fillSlot, plan.fillQuads, fillGpu, plan.fillBounds);
				this._syncSlotToFontGeneration(this._fillSlot, gpu);
			} else {
				this._fillSlot = this._allocSlot(plan.fillQuads, gpu, fillGpu, plan.fillBounds);
				this.addChild(this._fillSlot.mesh);
			}
			this._vertexBytes = plan.fillQuads.vertices.byteLength;
			this._indexBytes = plan.fillQuads.indices.byteLength;
		} else if (this._fillSlot) {
			this._disposeSlot(this._fillSlot);
			this._fillSlot = null;
		}

		this._buildDecorations(plan);

		// New children are now on the display list. Drop the previous
		// frame's children atomically — the swap from the user's POV
		// happens in a single frame with no gap.
		this._flushOldAttachState();
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
	 *
	 * Reuses the existing `_decorations` Graphics across rebuilds when
	 * possible — `clear()` wipes prior geometry without destroying the
	 * child (A12).
	 */
	private _buildDecorations(plan: SlugTextRenderPlan): void {
		const ul = this._underlineDraw,
			st = this._strikethroughDraw,
			ol = this._overlineDraw;
		if (!(ul.enabled || st.enabled || ol.enabled)) {
			// Decorations turned off. Drop the existing Graphics if any.
			if (this._decorations) {
				this.removeChild(this._decorations);
				this._decorations.destroy();
				this._decorations = null;
			}
			return;
		}

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

		// Build the inherited fill once per decoration kind. Inputs
		// (`_fill`, `fillBounds`) are constant across lines, so creating
		// fresh `FillGradient` / `FillPattern` objects per line is pure
		// overhead — N lines × 3 decorations would otherwise allocate
		// 3N PIXI fill objects per rebuild.
		const inheritedUlFill = ulInheritsFill
			? slugBuildDecorationFill(this._fill, fillBounds[0], fillBounds[1], fillBounds[2], fillBounds[3])
			: null;
		const inheritedStFill = stInheritsFill
			? slugBuildDecorationFill(this._fill, fillBounds[0], fillBounds[1], fillBounds[2], fillBounds[3])
			: null;
		const inheritedOlFill = olInheritsFill
			? slugBuildDecorationFill(this._fill, fillBounds[0], fillBounds[1], fillBounds[2], fillBounds[3])
			: null;

		// Reuse the existing Graphics if we have one; otherwise create
		// fresh. `clear()` wipes the prior instructions without
		// destroying the child (A12).
		let gfx: Graphics;
		if (this._decorations) {
			gfx = this._decorations;
			gfx.clear();
		} else {
			gfx = new Graphics();
		}

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
				if (inheritedUlFill) {
					// textureSpace: 'global' opts out of PIXI's default
					// "normalize UV to 0..1 across the shape's bounds"
					// behavior — for a thin underline rect that would
					// compress the texture vertically. We want world-
					// pixel mapping anchored at the bbox so the
					// decoration tile size matches the glyph fill.
					gfx.fill({fill: inheritedUlFill, alpha: ul.color[3], textureSpace: 'global'});
				} else {
					gfx.fill({color: ulPacked, alpha: ul.color[3]});
				}
			}

			if (st.enabled && st.length > 0) {
				const drawW = effLineW * st.length;
				const x = lineX + xForDecoration(effLineW, drawW, st.align);
				const stY = baselineY + lineY - font.strikethroughPosition * scale;
				gfx.rect(x, stY, drawW, st.thickness);
				if (inheritedStFill) {
					gfx.fill({fill: inheritedStFill, alpha: st.color[3], textureSpace: 'global'});
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
				if (inheritedOlFill) {
					gfx.fill({fill: inheritedOlFill, alpha: ol.color[3], textureSpace: 'global'});
				} else {
					gfx.fill({color: olPacked, alpha: ol.color[3]});
				}
			}
		}

		if (this._decorations !== gfx) {
			this._decorations = gfx;
			this.addChild(gfx);
		}
	}

	override destroy(): void {
		this._releaseFontOnDestroy();
		// Bump the token so any in-flight `programReady` callback that
		// resolves after destruction notices and skips re-arming
		// `onRender` on a dead instance.
		this._attachToken++;
		this.onRender = null;
		this._pendingPlan = null;
		if (this._shadowSlot) {
			this._disposeSlot(this._shadowSlot);
			this._shadowSlot = null;
		}
		if (this._strokeSlot) {
			this._disposeSlot(this._strokeSlot);
			this._strokeSlot = null;
		}
		if (this._fillSlot) {
			this._disposeSlot(this._fillSlot);
			this._fillSlot = null;
		}
		if (this._decorations) {
			this._decorations.destroy();
			this._decorations = null;
		}
		// A rebuild may have moved the previously-attached state into
		// the held-over slots without the next attach landing yet.
		// PIXI's `super.destroy()` removes children from the display
		// list as part of destruction, but we still own the geometry /
		// shader / fillGpu lifecycles, so dispose them explicitly here.
		this._flushOldAttachState();
		super.destroy();
	}
}
