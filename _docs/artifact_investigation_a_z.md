# Artifact Investigation — Uppercase A and Z at Large Sizes

## Status

**OPEN** as of 2026-05-02. Pre-existing artifact, narrowly scoped to two glyphs and a size threshold. Does NOT block the lazy-load refactor — the texture data emitted by the new and old load pipelines is bit-identical (verified by [tests/shared/slug/font-eager-vs-lazy.spec.ts](../tests/shared/slug/font-eager-vs-lazy.spec.ts)).

## Relationship to the prior artifact investigation

The V/X/R/W diagonal-stroke artifacts resolved on 2026-03-19 are documented in [_docs/artifact_investigation.md](artifact_investigation.md). Those fixes are still correct and complete for the family they targeted. The A/Z artifact described here:

- Affects **different glyphs** (A, Z) than the resolved set (V, X, R, W).
- Has a **different signature** (horizontal stripes at the bottom-left of legs, scaling with size; not the diagonal-stroke streaks of the prior issue).
- Was **already present** before any of the fixes in the prior doc were applied — it just wasn't surfaced by the test cases of the day, because the example default text didn't prominently include uppercase A or Z at large sizes.

The two issues likely share the same root family (band-boundary float32 precision) but require independent fix work because the failure mode and reproduction conditions differ.

## Confirmed pre-existing — not introduced by lazy loading

Two pieces of evidence:

1. **Visible in the published `docs/` build**, which was produced before the lazy-load branch existed.
2. **Byte-equivalence test passes**: [tests/shared/slug/font-eager-vs-lazy.spec.ts](../tests/shared/slug/font-eager-vs-lazy.spec.ts) processes the full Roboto cmap through both the new lazy `SlugFont.ensureGlyphs` pipeline and the legacy eager `slugTexturePack` pipeline and asserts bit-for-bit identical `curveData` and `bandData`. The texture data the GPU receives is the same in both load paths; the rendering bug is downstream of the load pipeline.

## Symptoms

Bottom-left of uppercase A and Z legs shows **horizontal stripe artifacts**:

- **Stripe count and visibility scale with text size**. More stripes / heavier stripes at larger sizes.
- **Stripe length and shape do not change with size or position** — only the count and which stripes are present change.
- **Moving the text vertically (e.g. inserting newlines above) changes the stripe count without changing size**. This is the canonical signature of float32 band-coordinate drift relative to screen position.
- **Affects every instance of the affected glyph uniformly**. Two A's at the same size render with identical artifacts; the stripes are tied to the glyph data, not per-instance noise.
- Other glyphs in the same string render cleanly at the same size.

## Reproduction

**Setup**: v8 example, Roboto TTF (default), text `"AAAZZZ Z Z"`, default viewport.

Progressive size sweep:

| Size (px) | Observed |
|-----------|----------|
| 97 | Clean — no visible artifact on any glyph |
| 122 | Faint stripes appearing on A's left leg and Z's lower-left |
| 208 | Pronounced stripes, multiple per character |
| 270 | Very pronounced; clearly visible from any viewing distance |

**Threshold**: ~100pt for Roboto TTF in this rendering setup. The threshold is **font-specific** — it is a function of how many screen pixels one band covers vs. the float32 boundary uncertainty width, not a universal constant.

## Font-specific behavior

The artifact reproduces on both Roboto encodings, with subtly different shapes:

- **Roboto TTF (native quadratics)**: Stripes on the bottom-left of A's left leg, and on Z's lower-left where the diagonal meets the bottom horizontal stroke.
- **Roboto OTF (CFF, cubics approximated as 2 quadratics each)**: Same affected glyphs (A, Z), but the stripe pattern "reverses" — appears on the opposite side of the leg or shifts the stripe positions. Switching back to TTF reverses again.

The OTF cubic→quadratic conversion in [src/shared/slug/glyph/curves.ts](../src/shared/slug/glyph/curves.ts) splits each cubic at t=0.5 and fits a best-fit quadratic to each half. The resulting quadratic control points sit at different positions than the TTF source's native quadratic control points. The float32 AABBs of those resulting curves therefore land in slightly different bands, shifting which sharp-angle curves get excluded from which bands. The underlying band-boundary problem is the same in both encodings — only the exact pattern of the failure differs.

## Why A and Z, and why the bottom-left

Both glyphs have **acute interior angles near the baseline on the bottom-left**:

- **A**: the left leg meets the baseline at a sharp angle.
- **Z**: the diagonal stroke meets the bottom horizontal stroke at the bottom-left corner.

This is the same family of geometry as the V apex / X crossing / R leg artifacts called out in [_docs/artifact_investigation.md](artifact_investigation.md): "Remaining artifacts at V apex, X crossing, R leg — all at shared curve endpoints with acute angles." The previous fix work resolved the V/X/R/W cases but the A/Z cases have a different size threshold and presentation, suggesting a related but distinct interaction with the band assignment math.

## Likely cause

Band-boundary float32 precision. Specifically:

1. **CPU-side band assignment** in [src/shared/slug/glyph/bands.ts](../src/shared/slug/glyph/bands.ts) computes each curve's float32 AABB and assigns the curve to every band the AABB intersects, with a **±1 band safety margin** at lines [142-149](../src/shared/slug/glyph/bands.ts#L142-L149).

2. **Sharp-angle curves** at A's leg-base and Z's diagonal-meets-baseline have AABBs that sit very close to a band boundary. The `±1` margin handles the common case but appears insufficient for these specific glyph geometries.

3. **At small sizes**, one band covers very few screen pixels, so even when a curve is missing from a band the visual error is sub-pixel and invisible. **At large sizes**, one band covers many pixels and the missing-curve hole becomes a visible stripe.

4. **Stripe count varies with screen position** because the **fragment shader's per-pixel band index calculation** uses vertex-interpolated `bandScale` and `bandOffset` ([src/shared/slug/glyph/quad.ts](../src/shared/slug/glyph/quad.ts) writes them, [src/shared/shader/slug/frag.glsl](../src/shared/shader/slug/frag.glsl) reads them). Both are float32 and drift with the glyph's screen position, causing the per-pixel band lookup to land on a band the curve was excluded from for some pixels but not others.

This signature — size-threshold + position-dependent stripe count — matches a band-precision failure precisely.

## Why this is independent of the lazy-load work

The artifact lives in the **band-assignment math**, not the load pipeline. The lazy and eager load paths emit identical `bandData` and `curveData` (verified by the byte-equivalence test). Fixing this artifact will require changes in:

- [src/shared/slug/glyph/bands.ts](../src/shared/slug/glyph/bands.ts) (CPU-side band assignment), and/or
- [src/shared/slug/glyph/quad.ts](../src/shared/slug/glyph/quad.ts) (vertex-side band scale/offset), and/or
- [src/shared/shader/slug/frag.glsl](../src/shared/shader/slug/frag.glsl) (fragment-side band lookup).

None of those touch when or how glyphs are loaded.

## Candidate fixes (not yet tried)

From the unattempted-fixes list documented in the prior investigation, applicable here:

- **Wider safety margin**: extend the `±1` margin in [bands.ts:142-149](../src/shared/slug/glyph/bands.ts#L142-L149) to `±2`, or compute a dynamic margin proportional to the curve's float32-bounds uncertainty width. Cheapest experiment to run first.
- **Band-split optimization**: split bands at known sharp-angle vertices so each sub-band's curve set is unambiguous. Architecturally larger change.
- **Per-vertex band-coordinate quantization**: snap `bandScale` and `bandOffset` written by [quad.ts](../src/shared/slug/glyph/quad.ts) to float32 values whose representation places band boundaries at the same float positions the CPU-side band assignment used. Removes the CPU/GPU drift directly.
- **Supersampling sanity check**: confirm the affected pixels invoke supersampling and that the supersample positions actually cross the band boundary. If supersampling is silently disabled or the sample positions don't cross the boundary, that's a simpler bug to fix than re-architecting band assignment.

## Recommended workflow when this is picked up

1. Add a focused reproduction test case: render `"A"` and `"Z"` in Roboto TTF at 97, 122, 208, and 270 px; capture screenshots; commit them as the before/after baseline.
2. Try the wider-margin experiment first (cheapest). If it eliminates the stripes at all four sizes, ship that and re-run the regression test. If it only reduces the stripe count, fall back to the per-vertex quantization approach.
3. Re-test on Roboto OTF (CFF) at the same sizes — the OTF and TTF reproductions converge or diverge as the fix takes effect, which is useful diagnostic signal.
4. Once green on both encodings, sweep the same A/Z reproduction across all bundled fixture fonts to confirm no regression on glyphs that were already clean.

## Reference data

Screenshots from the 2026-05-02 reproduction (v8 example, Roboto TTF, default viewport) are referenced in this doc by size. The exact pixel measurements ("97 / 122 / 208 / 270 px") should be considered the ground-truth reproduction parameters for any future fix attempt. The threshold may shift with viewport / DPR / browser changes, but the **size ordering and font selection** are reliable.

## File references

| File | Role |
|------|------|
| [src/shared/slug/glyph/bands.ts](../src/shared/slug/glyph/bands.ts) | CPU band assignment, ±1 safety margin (likely site of fix) |
| [src/shared/slug/glyph/quad.ts](../src/shared/slug/glyph/quad.ts) | Vertex-side `bandScale` / `bandOffset` write |
| [src/shared/shader/slug/frag.glsl](../src/shared/shader/slug/frag.glsl) | Fragment-side per-pixel band index calculation |
| [src/shared/slug/glyph/curves.ts](../src/shared/slug/glyph/curves.ts) | Cubic→quadratic conversion (relevant to the OTF reversal) |
| [tests/shared/slug/font-eager-vs-lazy.spec.ts](../tests/shared/slug/font-eager-vs-lazy.spec.ts) | Byte-equivalence test that ruled out the load pipeline as cause |
| [_docs/artifact_investigation.md](artifact_investigation.md) | Prior investigation (V/X/R/W family) — context, candidate fixes |
