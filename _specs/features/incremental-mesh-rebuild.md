# Incremental Mesh Rebuild — Specification

This document is the canonical specification for the incremental mesh rebuild path on `SlugText`. It defines when a `SlugText` mutation can reuse the existing PIXI `Mesh` / `Geometry` / `Shader` / `Buffer` objects across rebuilds instead of destroying and recreating them, what the path requires from PIXI v8, and the matrix of property changes that drive full vs. incremental rebuilds. Use it as the source of truth when verifying or modifying the implementation.

**Status:** Specification draft. Not yet implemented.

---

## 1. Problem

Today every property mutation on `SlugText` calls `rebuild()`, which:

1. Moves all current meshes from `_meshes` into `_oldMeshes` (held-over for atomic swap).
2. Recomputes the full `SlugTextRenderPlan` (wrap, measure, layout, fill/stroke/shadow quads).
3. On the next `onRender` tick, allocates fresh PIXI `Buffer`, `Geometry`, `Shader`, and `Mesh` objects per pass via `_buildMesh`.
4. `addChild`s the new meshes, then `_flushOldAttachState` destroys the old `Geometry` / `Shader` / `Mesh` objects.

For a typical chart axis that scrolls and rapidly invalidates 50–100+ labels in a single frame, this produces:

- ~300 PIXI object lifecycle events per frame (3 passes × 100 labels).
- 100s of short-lived typed-array allocations (one per quad buffer plus PIXI's internal uniform snapshots).
- Repeated `gl.bufferData` reallocations on the driver side, even though the per-label vertex count is usually identical or differs by 1–2 quads.
- `addChild` / `removeChild` churn on the parent container.

The CPU geometry work inside `_buildPlan` is already cheap pure-JS arithmetic. The cost worth eliminating is the **PIXI object churn and the buffer reallocation** on the cache-hit path.

### 1.1 Why this matters — frame budget framing

**Scope of impact:** the stutter / brief-freeze symptom described below is a **specific scenario** that requires a **high count of SlugText objects updating rapidly within a short window** (e.g. chart axis labels during scroll, dashboards rebinding many readouts per frame, scrolling lists with frequently-changing labels). For typical use cases — static text, a handful of labels, infrequent updates, or even many labels that update independently across many frames — today's full-rebuild path is fine and this feature is not user-visible. Single labels, slow updates, and stationary text never reach the failure mode. The cost of the current implementation is invisible until you cross the threshold where the per-frame allocation total starts approaching the frame budget; below that threshold there is nothing to fix.

The raw millisecond numbers underestimate the user-visible impact **when that threshold is crossed**. pixi-slug is **one library among many** in a typical scene; a chart, UI overlay, or game HUD will also be running its own layout, animation, input handling, scene transforms, and other rendering work in the same frame. At 60 fps the entire frame budget is **~16.67 ms** — for everything.

When a label burst pushes pixi-slug alone to:

- **5 ms / frame → ~30% of the budget** consumed by text updates.
- **10 ms / frame → ~60% of the budget** consumed by text updates.

…the application has no remaining headroom for its own work. What the user perceives is **brief, frequent stutters during scroll or animation** that correlate with "too many" SlugText objects — but "too many" is subjective and there's no clean lever for the consuming application to fix it short of cutting label density, which compromises their UX.

This is the worst kind of failure mode for a library: behavior that looks like a pixi-slug bug when nothing is actually broken, the library is just consuming a disproportionate share of a shared budget. The incremental rebuild path is the fix — dropping that 5–10 ms burst down toward <1 ms hands the frame budget back to the application and eliminates the stutter pattern entirely for the dominant workload (text content updates that don't change layout shape).

See §11 for the per-rebuild cost breakdown and concrete projections.

## 2. Goal & success criteria

**Goal:** When a `SlugText` mutates in a way that does not change the shape of its rendered output (same set of passes, same or smaller quad count fitting current buffer capacity, no shader-program-affecting change), reuse the existing PIXI objects and update them in place. Fall through to today's full rebuild for any change that does require fresh objects.

**Success criteria:**

1. A `text` setter that keeps the quad count within current capacity does not allocate a new `Buffer`, `Geometry`, `Shader`, or `Mesh`.
2. The same setter does not call `addChild` or `removeChild` on the SlugText container.
3. Visual output is byte-identical to the full-rebuild path for every incremental case (verified via render-to-pixel test).
4. Full-rebuild cases (font swap, fontSize change, etc.) match today's behavior with no visual regression and no performance regression.
5. When a frame issues a mix of incremental-eligible and full-rebuild-required setter calls on the same SlugText, the rebuild correctly upgrades to a full rebuild (see §6).

## 3. Scope

In scope:

- The PIXI v8 implementation in `src/v8/slug/text.ts` (`SlugText._buildMesh`, `rebuild`, `_buildAndAttachMeshes`, `_flushOldAttachState`).
- The CPU-side plan in `_buildPlan` is reused as-is.
- Decoration `Graphics` reuse via `gfx.clear()` and re-issue.
- The base setters in `src/shared/slug/text/base.ts` need to communicate the *kind* of change so `rebuild()` can pick a path. Today every setter calls `this.rebuild()` unconditionally; the incremental path needs a hint.

Out of scope:

- Per-glyph patching of vertex arrays (analyzed and rejected — see §10).
- v6 and v7 ports. Per project policy, v8 first; port later only after the v8 path is verified.
- Changes to the shader, font caching, or glyph processing.

## 4. Design overview

### 4.1 Mesh slot model

Replace the flat `_meshes: Mesh[]` array with three named slots, one per pass kind:

```
_shadowSlot: SlugMeshSlot | null
_strokeSlot: SlugMeshSlot | null
_fillSlot:   SlugMeshSlot | null
```

Each `SlugMeshSlot` owns:

- `mesh`, `geometry`, `shader`, `uniforms`
- `vertexBuffer`, `indexBuffer`
- `vertexCapacityQuads` — how many quads the underlying GL buffer can hold
- `indexCapacityQuads`
- `fillKind` — `'solid' | 'gradient' | 'texture'`, used to decide whether a sampler swap is needed (gradient/texture passes only)

### 4.2 Rebuild decision tree

`rebuild(kind)` accepts a hint from the setter. The hint is one of:

- `'full'` — geometry must be regenerated (text change, font change, etc.).
- `'fillVisual'` — only fill mode / fill resource changed (no geometry change).
- `'shadowVisual'` — drop shadow visual-only param (color/alpha/blur) changed.
- `'strokeAlphaVisual'` — stroke alpha mode/start/rate changed.
- `'decorationVisual'` — decoration color/thickness changed (geometry-shape-preserving).

Some setters cannot statically choose `'full'` vs. an incremental kind (e.g. `fill` going solid → gradient changes the resolved fill kind and may need the gradient sampler bound where it wasn't before). For these the setter passes the most specific hint and `rebuild()` adjudicates.

The decision tree inside `rebuild(kind)`:

1. If `kind === 'full'` → run today's full path.
2. Otherwise, build the plan as today (the CPU work is cheap and we need the new bounds / fillBounds anyway).
3. For each pass kind (shadow / stroke / fill):
   - If the plan's pass is null and the slot is non-null → dispose the slot.
   - If the plan's pass is non-null and the slot is null → allocate via the full-path constructor.
   - If both are non-null → call `_reuseSlot(slot, plan, passKind)`.

### 4.3 Slot reuse path (`_reuseSlot`)

For a slot whose quad count fits its current capacity:

1. `vertices.set(newVertices)` into the slot's existing typed-array view.
2. `indices.set(newIndices)` into the slot's index typed-array view.
3. `vertexBuffer.setDataWithSize(vertices, newByteSize, true)` — `bufferSubData` on the existing GL buffer. **Must use `setDataWithSize`, not `update()`**, so the `shrinkToFit: false` path applies on shrinks (see A11).
4. `indexBuffer.setDataWithSize(indices, newByteSize, true)` — same.
5. Mutate uniform `Float32Array` slots in place (`uFillBoundsPx`, `uFillParams0`, etc.) — already the pattern today.
6. For fill pass only: if `fillGpu.mode` or `fillKind` changed, rebind the sampler resource on `shader.resources`.

For a slot whose new quad count exceeds capacity:

1. Replace the underlying `Buffer`s with larger ones (capacity-grow strategy, §4.5).
2. Update `Geometry`'s attribute / index references to the new buffers.
3. Keep `Shader`, `Mesh`, and `Geometry` instances (we only swap their owned buffers).

If even buffer-only replacement isn't safe (e.g. `Geometry.setAttribute` semantics differ from what we expect), fall through to full reallocation for that slot. This is a documented fallback, not the steady-state path.

### 4.4 Buffer capacity policy

- Allocate slot buffers with `shrinkToFit: false` so shrinks stay on `bufferSubData`.
- Initial capacity: `max(initialQuadCount * 1.5, 8)` quads.
- On grow: `max(newQuadCount * 1.5, currentCapacity * 2)` quads.
- Never shrink. Memory cost is small for axis-label workloads (a 50-char label at full capacity is ~16 KB vertex + ~1 KB index).

### 4.5 Decoration reuse

`_decorations` is a `Graphics`. On incremental rebuild:

- Keep the `Graphics` instance alive.
- Call `gfx.clear()`.
- Re-run the existing `_buildDecorations` logic against the same instance.
- Only dispose when decorations turn off entirely.

Per A12, this avoids display-list `removeChild`/`addChild` churn and event-listener thrash, but the underlying GPU batches are still pool-recycled and rebuilt on the next render. Acceptable for the simple rect-and-fill shapes pixi-slug emits; revisit if decorations ever grow complex.

### 4.6 Held-over (`_oldMeshes`) interaction

Today's `_oldMeshes` / `_oldDecorations` / `_oldFillGpu` exist to hide the gap when the parallel-link path delays the GPU attach. On the incremental path:

- Cache-hit (steady state): the slot is updated in place. No swap, no held-over state. `_oldMeshes` stays empty.
- Cache-miss (first SlugText per font, parallel link in flight): the incremental path is unreachable on the very first rebuild for that font — there's no slot to reuse yet. Falls naturally to the full path with the existing held-over behavior.

## 5. PIXI v8 assumptions

Each row is a contract the incremental path depends on. The **Date verified** column captures when the assumption was last checked against PIXI source — re-verify on PIXI version bumps or if the incremental path starts misbehaving. The **PIXI version** column pins the package version the verification was performed against.

| # | Assumption | Verified | Date verified | PIXI version | How verified | Notes |
|---|---|---|---|---|---|---|
| A1 | `Buffer.update(size?)` triggers `bufferSubData` on the existing GL buffer when `glBuffer.byteLength >= data.byteLength` | ✅ Verified | 2026-05-11 | pixi.js 8.17.1 | `GlBufferSystem.js:146-147` — `if (glBuffer.byteLength >= data.byteLength) gl.bufferSubData(...)` | Steady-state reuse path. |
| A2 | Growing `Buffer` data beyond capacity reallocates the GL buffer internally; the JS `Buffer` wrapper persists | ✅ Verified | 2026-05-11 | pixi.js 8.17.1 | `GlBufferSystem.js:150` falls through to `gl.bufferData` when `byteLength` exceeds capacity | We keep `Geometry` / `Shader` / `Mesh` even on grow. |
| A3 | Mutating the same typed array in place and calling `buffer.update()` is detected and synced via `_updateID` bump | ✅ Verified | 2026-05-11 | pixi.js 8.17.1 | `Buffer.js:119` identity-check on `this._data === value`; `Buffer.js:146` increments `_updateID`; `GlBufferSystem.js:141` compares `glBuffer.updateID` | No need to reassign `buffer.data`. |
| A4 | `gl.drawElements` count defaults to `geometry.indexBuffer.data.length` (live, not cached) | ✅ Verified | 2026-05-11 | pixi.js 8.17.1 | `GlGeometrySystem.js:265, 267` — `size \|\| geometry.indexBuffer.data.length` | Draw count follows index buffer length automatically. |
| A5 | Updating the index buffer with a smaller live `data.length` shrinks the draw count on the next frame | ✅ Verified | 2026-05-11 | pixi.js 8.17.1 | Direct consequence of A4 + `Buffer.setDataWithSize` emitting `"change"` on length diff (`Buffer.js:132`) | Required for "longer label → shorter label" without a fresh `Mesh`. |
| A6 | A vertex buffer larger than the indexed range is harmless — GL never reads unindexed vertices | ✅ Verified | 2026-05-11 | pixi.js 8.17.1 | Standard GL semantics; PIXI does not validate vertex-buffer length against index references in the draw path | Lets us keep capacity headroom. |
| A7 | Assigning `shader.resources.someName = newTextureSource` after construction does NOT trigger `generateProgram` re-link | ✅ Verified | 2026-05-11 | pixi.js 8.17.1 | `Shader.js:132-139` setter routes to `BindGroup.setResource`; `BindGroup.js:42-48` only swaps event listeners and sets `_dirty = true`; `GlProgram._key` is computed from shader source text only (`GlProgram.js:57`) | Required for fill-mode change without rebuilding the shader. |
| A8 | A swapped `TextureSource` is picked up fresh on the next draw via dynamic sync code | ✅ Verified | 2026-05-11 | pixi.js 8.17.1 | `GenerateShaderSyncCode.js:62-63` emits `tS.bind(resources[j], textureCount)` per program — reads current resource at every draw | No frame-of-staleness risk on sampler swap. |
| A9 | A `TextureSource` size change (256-wide LUT → 1024-wide user texture) has no GL state cost beyond `gl.bindTexture` | ✅ Verified | 2026-05-11 | pixi.js 8.17.1 | Texture binding flows through `TextureSystem` normally; uniform locations unchanged | Same cost as a sprite swapping textures. |
| A10 | Mutating uniform `Float32Array` slots in place is detected by PIXI's uniform sync and pushed on next draw | ✅ Verified (in production today) | 2026-05-11 | pixi.js 8.17.1 | Current `_buildMesh` already does this via `boundsBuf[0] = ...` etc.; PIXI's element-wise comparison detects the change | No new contract needed — already exercised. |
| A11 | `shrinkToFit: false` keeps an oversized GL buffer alive when the data length shrinks, preserving the `bufferSubData` path | ✅ Verified | 2026-05-11 | pixi.js 8.17.1 | `Buffer.js:127` — when `!shrinkToFit && oldData && value.byteLength < oldData.byteLength`, emits `"update"` (not `"change"`), so `_resourceId` is not regenerated and bind-group caches stay valid. `GlBufferSystem.js:146-147` then takes the `bufferSubData` branch because `glBuffer.byteLength` is never reset on the `"update"` path. `Geometry.js:108-109` treats both events identically — no geometry rebuild is triggered by event type. | **Constraint:** must call `setDataWithSize(array, smallerSize, true)`, NOT just `update()`. `update()` (Buffer.js:144) doesn't consult `shrinkToFit`. Also note: the GL buffer is never permanently deallocated under `shrinkToFit: false` until the `Buffer` is destroyed — acceptable for our headroom model (§4.4). |
| A12 | `gfx.clear()` followed by `gfx.rect(...).fill(...)` reuses the same `Graphics` instance with no display-list churn | ⚠️ Partial — display-list reuse confirmed, GPU resource reuse does NOT happen | 2026-05-11 | pixi.js 8.17.1 | `Graphics.js:597-599` → `GraphicsContext.clear()` at `GraphicsContext.js:664-670` only clears `_activePath` + `instructions.length = 0` + resets transform. Context object itself is preserved, no display-list re-parenting. **However:** `GraphicsContextSystem.js:108-124` rebuilds batches on the next render via `buildContextBatches`, and `GpuGraphicsContext.reset()` (line 22-38) returns the previous batch objects to `BigPool` — so the GPU geometry/batch data IS reconstructed each clear/redraw cycle (allocation is pool-backed and event listeners are cleaned correctly, no leaks). | The win for pixi-slug is **only** display-list churn avoidance and event-listener stability. The internal geometry rebuild cost remains — acceptable for the simple rect-and-fill decoration shapes pixi-slug uses, but the reuse path is not as cheap as the slot-based mesh reuse. If decorations ever grow complex, revisit. Gradient/pattern fills survive `clear()` (not destroyed) so swapping the inherited-fill object across rebuilds is safe. |
| A13 | `Geometry` does not require recreation when its underlying `Buffer` data is updated in place (only when the `Buffer` *reference* changes) | ✅ Verified | 2026-05-11 | pixi.js 8.17.1 | `Geometry.js:61` emits `"update"` from buffer change events; downstream consumers re-sync via `_updateID`. Geometry attribute bindings reference the buffer object, not its data | Steady-state reuse keeps the same `Geometry`. |

Legend: ✅ Verified · ⚠️ Needs verification · ❌ Failed verification

**Re-verification policy:** when PIXI is bumped — including patch versions, since internal sync paths have churned on patch bumps before — run through every ✅ row and either confirm the source path still holds (update **both** the date and the version columns) or change the status to ❌ and open follow-up work. ⚠️ rows must reach ✅ before the corresponding code path can rely on the assumption in production. The version pin in each row identifies the exact build the check was performed against; do not assume a different version of the same minor still passes without re-checking.

## 6. Setter → rebuild kind matrix

This table maps every public `SlugText` setter to the rebuild kind it should request. The `text style` interface is the guide for what users can mutate at runtime.

**Important:** When multiple setters fire within the same frame, the effective rebuild is the **strictest** kind among them. If any one of those setters required `'full'`, the whole batch goes through the full path even if the others were incrementally eligible.

| Setter | Current behavior | Target behavior | Notes |
|---|---|---|---|
| `text` | Full rebuild | **Incremental** when new quad count ≤ slot capacity for every pass; otherwise full | Axis-label hot path. Capacity-grow case still avoids Mesh/Shader/Geometry rebuild — just resizes GL buffers. |
| `font` | Full rebuild | **Full** | Different glyph map, different curve/band textures, requires fresh GPU bindings. |
| `fontSize` | Full rebuild | **Full** | Changes scale, line height, advance widths — every vertex moves by a non-uniform amount. |
| `color` | Full rebuild | **Incremental** when previous and next fill are both solid; **full** when crossing solid ↔ non-solid | Solid-to-solid color change rewrites `aColor` only — same vertex layout, no shader resource change. |
| `fill` | Full rebuild | **Incremental** when kind unchanged or solid ↔ solid; **full** when crossing solid ↔ gradient/texture (sampler binding must change AND fill bbox / decoration inherit logic may change) | Even within "incremental", the gradient LUT data may change — that's a `TextureSource` swap, which is cheap (A7–A9). |
| `wordWrap` | Full rebuild | **Full** | Line count / wrap boundaries may change. |
| `wordWrapWidth` | Full rebuild | **Full** | Same as above. |
| `breakWords` | Full rebuild (when wordWrap is on) | **Full** | Wrap policy change. |
| `direction` | Full rebuild | **Full** | LTR ↔ RTL flips physical alignment and decoration positioning. |
| `align` | Full rebuild | **Full** | Per-line offsets change → vertex X positions change. |
| `textJustify` | Full rebuild (when align is justify) | **Full** | Per-glyph shift values change → vertex X positions change. |
| `underline` | Full rebuild | **Incremental decoration** when only color/thickness/alpha changed; **full** when `enabled` toggles or `length` changes | Decoration rebuild via `Graphics.clear()` + re-rect. Glyph passes untouched. |
| `strikethrough` | Full rebuild | **Incremental decoration** (same rules as underline) | Same as above. |
| `overline` | Full rebuild | **Incremental decoration** (same rules as underline) | Same as above. |
| `strokeWidth` | Full rebuild | **Full** when width crosses zero (pass appears/disappears) or non-zero changes (per-vertex dilation changes); base.ts already skips rebuild when transitioning 0 → 0 | Width affects vertex normal expansion — must regenerate stroke quads. |
| `strokeColor` | Full rebuild (when stroke is on) | **Incremental** (stroke pass only — rewrite `aColor`) | Same shape as solid-color change for fill. |
| `strokeAlphaMode` | Full rebuild (when stroke is on) | **Incremental stroke uniform** — write `uStrokeAlphaRate` to 0 (uniform) or actual rate (gradient) | No geometry change; uniform-only. |
| `strokeAlphaStart` | Full rebuild (when stroke gradient is on) | **Incremental stroke uniform** — write `uStrokeAlphaStart` | Uniform-only. |
| `strokeAlphaRate` | Full rebuild (when stroke gradient is on) | **Incremental stroke uniform** — write `uStrokeAlphaRate` | Uniform-only. |
| `stroke` (object setter) | Full rebuild on any change | **Full** when `width` crossed zero; otherwise the strictest kind across the changed sub-fields | Aggregate setter — degrades to the worst case among its components. |
| `dropShadow` | Full rebuild | **Full** when toggling on/off (shadow pass appears/disappears) or `blur` changes (per-vertex dilation), or `distance`/`angle` change (mesh.x/mesh.y offset is fine but blur/distance interact); **incremental** when only `color` or `alpha` changed | Color/alpha change rewrites `aColor` + uniform; offset (`mesh.x/y`) is a single-field set on the existing mesh; blur changes per-vertex expansion. |
| `supersampling` | Already incremental (uniform-only) | **Unchanged** — already uniform-only via `onSupersamplingChanged` | Existing behavior; documented for completeness. |
| `supersampleCount` | Already incremental (uniform-only) | **Unchanged** — already uniform-only via `onSupersampleCountChanged` | Existing behavior. |

The table does not enumerate combinations (e.g. drop shadow + outline). The strict-kind rule in §4.2 handles them: every setter contributes its kind to the batched rebuild, and `rebuild()` runs the strictest path that covers all of them.

## 7. Test surface

For each row in §6, at least one test must:

1. Construct a `SlugText` with a known initial state.
2. Mutate the named property to a value that should hit the target path.
3. Assert the rebuild took the expected path. Done by instrumenting the slot to count `Buffer` / `Geometry` / `Shader` / `Mesh` constructions across the rebuild and comparing to 0 (incremental) or N (full).
4. Render to a canvas and compare pixels against a full-rebuild baseline of the same final state.

Specifically required:

- An axis-label scroll test: 100 SlugTexts updating their `text` property each frame for N frames, asserting allocation count stays flat and frame time does not regress vs. today's path.
- A batched-mutation test: in one frame, set both `text` (incremental-eligible) and `fontSize` (full-required) on the same SlugText; assert the result is a full rebuild and visuals match.
- A capacity-grow test: mutate `text` from a short string to a long string that exceeds initial capacity; assert no `Mesh` / `Geometry` / `Shader` constructions occurred and visuals match.
- A fill-mode-swap test: solid → gradient → texture → solid in sequence; assert no `Shader` reconstruction across the swap and visuals match each baseline.
- A decoration-only test: enable underline, then change only its color; assert no glyph pass touched the GL.

## 8. Memory accounting

`SlugText._vertexBytes` and `SlugText._indexBytes` currently report the live data size. With capacity reserves, the **allocated** GPU bytes can exceed live bytes. Decide one of:

- Report live bytes (current contract). Reserves are invisible to consumers.
- Report capacity bytes. Honest but breaks comparison against today.

Recommendation: keep live-byte reporting and add a separate `_vertexCapacityBytes` / `_indexCapacityBytes` if a debug/memory view ever needs it. Decision to be confirmed during implementation.

## 9. Risks

1. **A11 / A12 unverified** — both are needed for the full incremental win. Verify before depending on them; have a fallback (alloc-fresh `Buffer` on shrink; alloc-fresh `Graphics` on decoration rebuild) if either fails.
2. **Hint-routing complexity** — every setter in `base.ts` needs to call `rebuild(kind)` instead of `rebuild()`. A missing or wrong hint can produce a visible glitch (incremental path running when full was required). Mitigation: default hint is `'full'`, setters opt in to a narrower hint.
3. **Slot/`fillGpu` lifetime** — `_fillGpu` owns the gradient LUT texture. On fill-mode swap (incremental path) the old `_fillGpu` must still be disposed; otherwise textures leak. Slot's `fillKind` field exists to drive this.
4. **PIXI internal-API drift** — A1–A10 rely on PIXI's internal sync paths. Pin the verified PIXI version in this spec and re-verify on bump.

## 10. Rejected approach: per-glyph patching

Considered: when only one character changes, splice the 80 floats (5 vec4 × 4 vertices) for that glyph into the vertex buffer and leave the rest untouched. Rejected because:

- Any advance-width change cascades to every following glyph's X position.
- Wrap boundaries can flip on a one-char change, cascading to every following line.
- Fill bbox is computed from all fill vertices and feeds `uFillBoundsPx` — used by gradient/texture sampling across the whole mesh.
- Decoration logic depends on per-line tallest-glyph scan and effective line width.

The detection logic to prove a patch is safe is more expensive than just rewriting the line's vertex array, which is already cheap pure-JS arithmetic. The only meaningful win is on **object reuse**, which §4 captures.

## 11. Estimated performance payoff

**Applicability:** the projected wins below apply specifically to **workloads with many SlugText objects updating rapidly in a small number of frames** — chart axis scroll, dashboards, scrolling lists, frequently-updated HUDs. They do not apply to static text, occasional label changes, or apps that use only a handful of SlugTexts; in those cases today's full-rebuild path performs fine and the user will not perceive a difference after this feature ships. The §11.4 "what does NOT improve" subsection enumerates the cases where the feature has no observable effect.

Modeled against the canonical chart-axis workload: short labels like `$10.12 → $10.21 → $9.98` (5–6 visible glyphs each, fits initial 8-quad capacity reserve, fill-only — the most common chart configuration). Numbers below are projections derived from the cost model in §11.2; actual measurements will replace them once the implementation lands and the benchmark in §7 runs.

### 11.1 Why the millisecond delta matters

At 60 fps the **entire frame budget is ~16.67 ms** and pixi-slug is one library among many. A 5–10 ms burst from a label-update batch is **30–60% of the budget consumed by text alone**, leaving nothing for the rest of the application's per-frame work. The user-visible symptom is stutters during scroll/animation that correlate with label density — a failure mode the consuming app cannot fix from the outside.

### 11.2 Per-rebuild cost delta (fill-only path)

Allocation accounting for a single `SlugText` rebuild on the cache-hit path (steady state, capacity-fit):

| Object / operation | Today | Incremental | Delta |
|---|---|---|---|
| `Buffer` (JS wrapper) | 2 new + 2 destroyed | 0 | -2 alloc, -2 destroy |
| `Geometry` | 1 new + 1 destroyed | 0 | -1 alloc, -1 destroy |
| `Shader` | 1 new + 1 destroyed | 0 | -1 alloc, -1 destroy |
| `UniformGroup` (~10 `Float32Array` slots) | 1 new + 10 typed arrays | 0 | -1 alloc, -10 typed arrays |
| `BindGroup` resource set | 1 new | 0 | -1 alloc + nested |
| `Mesh` | 1 new + 1 destroyed | 0 | -1 alloc, -1 destroy |
| `SlugFillGpuV8` | 1 new | 0 (1 if fill mode actually changed) | -1 alloc (steady state) |
| `addChild` / `removeChild` events | 2 | 0 | -2 events |
| GL `bufferData` calls (full reallocation) | 2 | 0 | -2 driver reallocs |
| GL `bufferSubData` calls (cheap, in-place) | 0 | 2 | +2 (cheap) |
| `slugGlyphQuads` typed arrays for vertices/indices | 2 | 2 (copied into slot arrays via `.set()`) | 0 — out of scope for v1; potential v2 follow-up |

### 11.3 Projected impact for an 80-label scroll-step burst

Assumes 80 SlugTexts invalidated in one frame (representative chart scroll), fill-only, allocation-only typed arrays from `slugGlyphQuads` remain.

| Metric | Today (projected) | Incremental (projected) | Improvement |
|---|---|---|---|
| Main-thread CPU per burst frame | 3–8 ms | 0.3–0.8 ms | ~6–10× faster |
| PIXI object lifecycle events per frame | ~480 | 0 | eliminated |
| Sustained allocation rate during continuous scroll | high (drives major GC every few seconds) | low (typed-array copies + small objects) | ~50–100× less |
| Major-GC stutter correlation (5–15 ms pauses every N seconds during continuous scroll) | present | effectively eliminated | qualitative |
| Frame-budget share consumed by text on a busy frame | 30–60% | <5% | budget returned to consumer app |

The GC-stutter line is the most important non-numeric improvement. Today's per-rebuild object churn pulls major GC at predictable intervals during continuous scroll; the user experiences this as random hitches that don't correlate with any visible action. The incremental path drops the sustained allocation rate enough that major GC during scroll becomes a non-event.

### 11.4 What does NOT improve

- **First render of any SlugText:** unchanged — no slot exists yet, full allocation path runs.
- **First render of any new font:** unchanged — shader compile cost dominates regardless (already addressed by the parallel-compile feature, see `parallel_shader_compile.md`).
- **`fontSize`, `font`, or wrap-affecting setter changes:** full rebuild required per §6, no improvement.
- **Capacity-grow case** (label grew past current buffer headroom): keeps `Geometry` / `Shader` / `Mesh` but pays one `gl.bufferData` reallocation. Still faster than today (no PIXI object churn) but slower than the steady-state path.
- **Single-label apps:** the improvement is real but small in absolute terms — at one label the per-rebuild delta is ~0.04–0.1 ms. The feature pays off most when label count × update frequency is high (chart axes, dashboards, scrolling lists, frequently-updated HUD readouts).

### 11.5 Mobile / low-end platforms

Wins are amplified on mobile and low-end devices because:

- `gl.bufferData` driver overhead is proportionally higher (often 1–2 ms per call on mobile ANGLE / GLES drivers vs. ~0.1 ms desktop).
- GC pauses are longer and more visible at lower frame rates.
- Frame budget at 30 fps doubles the budget per frame to ~33 ms but doesn't make a 10 ms burst any less disruptive in relative terms.

### 11.6 Caveat — `_buildPlan` cost is unchanged

`_buildPlan` still runs end-to-end on every incremental rebuild. For short axis labels (~5–6 chars) this is trivially small (~240 float comparisons in the bbox scan). For long strings or many wrapped lines it's not free. The bbox scan in `text.ts:525-532` iterates every fill vertex — that's the main remaining bottleneck in the planner. If profiling shows this becoming the dominant cost for long-string workloads, a v3 optimization is to compute the bbox during quad generation in `slugGlyphQuads` instead of as a separate post-pass.

---

# Implementation

## TODO

- [ ] Audit `base.ts` setters and add a `rebuild(kind)` hint. Default hint is `'full'` for backward compatibility. Setters that can statically choose a narrower kind opt in.
- [ ] Define `SlugTextRebuildKind` type: `'full' | 'fillVisual' | 'shadowVisual' | 'strokeAlphaVisual' | 'decorationVisual'`. Place in `src/shared/slug/text/rebuild-kind.ts` per file-organization convention.
- [ ] Introduce `SlugMeshSlot` interface in `src/v8/slug/mesh/slot.ts` with fields per §4.1.
- [ ] Replace `_meshes: Mesh[]` with `_shadowSlot`, `_strokeSlot`, `_fillSlot` in `src/v8/slug/text.ts`. Update `onSupersamplingChanged` and `onSupersampleCountChanged` to iterate the three slots.
- [ ] Refactor `_buildMesh` to also accept an existing slot for in-place update. Split into `_allocSlot(...)` and `_updateSlot(slot, quads, ...)`.
- [ ] Implement `_reuseSlot` per §4.3 — handles both capacity-fit (steady state) and capacity-grow (buffer swap) paths.
- [ ] Update `_buildAndAttachMeshes` to call `_reuseSlot` when the slot exists and the kind is non-`'full'`; otherwise allocate via `_allocSlot`.
- [ ] Update `_flushOldAttachState` to only dispose slots that are being removed (pass disappeared), not all slots on every rebuild.
- [x] Verify A11 (`shrinkToFit: false` preserves `bufferSubData` on shrink). **Confirmed 2026-05-11 against pixi.js 8.17.1.** Constraint: must use `setDataWithSize`, not `update()`.
- [x] Verify A12 (`Graphics.clear()` reuse). **Partially confirmed 2026-05-11 against pixi.js 8.17.1.** Display-list reuse holds; internal GPU batches still rebuild each cycle. Acceptable for current decoration shapes.
- [ ] Wire decoration `Graphics` reuse into the decoration-only incremental path. Keep `_decorations` alive across rebuilds; `gfx.clear()` and re-issue.
- [ ] Handle fill-mode swap on the fill slot: detect `fillKind` change, dispose old `_fillGpu`, build new `_fillGpu`, rebind sampler on the existing `Shader`.
- [ ] Allocation-counter test harness: instrument `Buffer`, `Geometry`, `Shader`, `Mesh` constructors (via test-only spies) to count allocations per rebuild.
- [ ] Add one test per row of §6.
- [ ] Add the axis-label scroll benchmark (100 SlugTexts × N frames). Capture baseline before changes and assert no regression.
- [ ] Add the batched-mutation, capacity-grow, fill-mode-swap, and decoration-only tests per §7.
- [ ] Document the rebuild-kind hint in JSDoc on `SlugTextMixin` so v6/v7 implementers see it when adopting later.
- [ ] Update `CLAUDE.md` knowledge index with a link to this spec.
- [ ] Port to v6 and v7 only after v8 is verified shipped (per project policy in `CLAUDE.md` § Development Workflow).
