import type {Buffer, Geometry, Mesh, Shader, UniformGroup} from 'pixi.js';
import type {SlugFillGpuV8} from '../fill/gpu';

/**
 * A reusable mesh slot — one slot per render pass kind (shadow, stroke,
 * fill). Each slot owns the PIXI objects for its pass and survives
 * across rebuilds so the incremental path can rewrite buffer contents
 * + uniforms without allocating new `Buffer` / `Geometry` / `Shader` /
 * `Mesh` instances.
 *
 * Capacity headroom: `vertexCapacityQuads` and `indexCapacityQuads`
 * record how many glyph quads the underlying GL buffers can hold. The
 * `Buffer`s are constructed with `shrinkToFit: false` so shrinks stay
 * on the `bufferSubData` path (verified A11 in
 * `_specs/features/incremental-mesh-rebuild.md` §5). When the live
 * quad count is `<=` capacity, `_reuseSlot` updates in place; when it
 * exceeds capacity, `_reuseSlot` allocates larger buffers (per the
 * grow policy in §4.4) but keeps the same `Geometry`, `Shader`, and
 * `Mesh` instances.
 *
 * The shadow and stroke slots always render a solid fill (mode 0), so
 * `fillGpu` and `fillKind` are tracked only for use by the fill slot.
 * For the other two slots `fillGpu` is `null` and `fillKind` is
 * `'solid'`.
 *
 * See `_specs/features/incremental-mesh-rebuild.md` §4.1 for the slot
 * model and §4.3 for the reuse path.
 */
export interface SlugMeshSlot {
	mesh: Mesh<Geometry, Shader>;
	geometry: Geometry;
	shader: Shader;
	uniforms: UniformGroup;
	vertexBuffer: Buffer;
	indexBuffer: Buffer;
	/**
	 * Live typed-array views the slot owns. New quad data is `.set()`
	 * into these arrays in place, then `setDataWithSize` is called on
	 * the wrapping `Buffer` with the new live byte size. The arrays are
	 * sized to `*CapacityQuads`, not to the live quad count.
	 */
	vertices: Float32Array;
	indices: Uint32Array;
	vertexCapacityQuads: number;
	indexCapacityQuads: number;
	/**
	 * Fill resources currently bound on the slot's `shader`. Fill slot
	 * only — `null` for shadow / stroke slots. Disposed and replaced
	 * when the resolved fill mode changes.
	 */
	fillGpu: SlugFillGpuV8 | null;
	/**
	 * Cached fill-mode integer for fast equality check against a newly
	 * resolved fill in `_reuseSlot`. Mirrors `fillGpu.mode` when
	 * `fillGpu` is present; for shadow/stroke slots stays at `0`.
	 */
	fillMode: 0 | 1 | 2 | 3;
	/**
	 * Generation counter from {@link SlugFontGpuV8.generation} captured
	 * when this slot's shader was last bound to the font's curve/band
	 * texture sources. The slot's `_attachGpu` path compares this
	 * against the font's current generation on every pass — when they
	 * differ, the font's GPU cache replaced (and destroyed) the texture
	 * sources this slot's shader still points at, and the shader's
	 * `uCurveTexture` / `uBandTexture` resources must be rebound to the
	 * new sources. Drives the "stationary SlugText that another
	 * SlugText grew the font for" rebinding path.
	 */
	_gpuGeneration: number;
}
