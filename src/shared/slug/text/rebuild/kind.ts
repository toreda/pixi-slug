/**
 * Hint passed by setters to `SlugText.rebuild(kind)` describing the
 * narrowest rebuild path that can produce a correct result for the
 * change being applied. The version-specific implementation reads the
 * hint to decide whether to reuse the existing PIXI `Mesh` / `Geometry`
 * / `Shader` / `Buffer` objects (incremental path) or to allocate fresh
 * ones (full path).
 *
 * Strict-kind contract: when multiple setters fire within the same
 * frame, the effective rebuild kind is the strictest among them. If any
 * setter requested `'full'`, the whole batched rebuild upgrades to
 * full. The implementation enforces this by tracking the current
 * pending kind and only narrowing — never widening — based on each
 * setter call.
 *
 * Default hint is `'full'`. Setters opt in to a narrower kind only when
 * they can statically prove it is safe.
 *
 * v8 today collapses every non-`'full'` kind to the same path — the
 * `_buildAndAttachMeshes` code is already idempotent against any plan
 * and selectively allocates / updates / disposes per pass. The kind
 * granularity exists so future optimizations (e.g. "skip the planner
 * entirely for stroke-alpha-only changes and just write the two
 * uniforms") can land without touching setters again.
 *
 * Kinds:
 * - `'full'` — geometry must be regenerated AND the old slots must be
 *   parked in `_oldSlots` so the next attach can flush them atomically.
 *   Routes that change pass shape (e.g. font swap, fontSize change,
 *   wrap toggle) MUST use this — the old GL buffers / shader
 *   resources are stale and reusing them in place would produce wrong
 *   output.
 * - `'content'` — text content changed but layout shape is otherwise
 *   preserved. The planner reruns end-to-end; the slot's
 *   `_updateSlot` rewrites buffers in place (or replaces them on
 *   capacity grow). Used by `text` setter.
 * - `'fillVisual'` — fill mode / fill resource / fill color changed.
 *   Geometry is unchanged; the fill pass's `aColor` attribute or
 *   sampler binding is rewritten by `_writeFillSamplers` /
 *   `_writePassUniforms`.
 * - `'shadowVisual'` — drop shadow visual-only parameter changed
 *   (color or alpha). Blur or distance changes are NOT shadow-visual —
 *   they require geometry regeneration and route through `'full'`.
 * - `'strokeAlphaVisual'` — stroke alpha mode / start / rate changed.
 *   Stroke width / color changes are NOT stroke-alpha-visual — width
 *   changes route through `'full'`, color changes through
 *   `'fillVisual'`-style handling.
 * - `'decorationVisual'` — decoration color / thickness / alpha
 *   changed in a way that preserves the decoration's geometry shape.
 *   Glyph passes are untouched. Enabling / disabling a decoration or
 *   changing `length` routes through `'full'`.
 *
 * See `_specs/features/incremental-mesh-rebuild.md` §6 for the
 * setter → kind mapping.
 */
export type SlugTextRebuildKind =
	| 'full'
	| 'content'
	| 'fillVisual'
	| 'shadowVisual'
	| 'strokeAlphaVisual'
	| 'decorationVisual';
