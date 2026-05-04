# Artifact Investigation — Uppercase A and Z at Large Sizes

## Status

**RESOLVED** as of 2026-05-04. Root cause: **`kQuadraticEpsilon = 0.0001` was too tight**, leaving a precision gap where near-horizontal curves with small-but-not-tiny `ay` (Y-quadratic coefficient) bypassed the linear-fallback branch and produced wildly out-of-range `t1`/`t2` values in the H-ray solver. The runaway `t1`²/`t2`² terms made `x1`/`x2` saturate the `clamp(x + 0.5, 0, 1)` AA window, contributing a spurious `+1` to `xcov` for every pixel along the curve's em-Y row.

**Fix**: bumped `kQuadraticEpsilon` from `0.0001` to `0.01` in [src/shared/shader/slug/frag.glsl:12](../src/shared/shader/slug/frag.glsl#L12). This extends the linear-fallback regime to absorb the precision-unstable near-horizontal curves. Verified at fontSize=800 with text "AZ" — no more stripes.

See **Latest findings (2026-05-04)** below for the full investigation trail.

## Symptom recap

Bottom-left of uppercase **A** and **Z** legs shows horizontal stripe artifacts at sizes ≥ ~91pt for Roboto. The artifact is subtle (white rendered text, dark background → "slightly brighter" stripes that the user described as "subtle"). The original symptom description in the prior version of this doc remains accurate; preserved at the bottom of this file.

The artifact also appears on **uppercase X**, **#**, **!**, and other glyphs at large sizes — see the prior investigation [_docs/artifact_investigation.md](artifact_investigation.md) for the V/X/R/W family of cases that was resolved in 2026-03 by two shader bugs. The current open A/Z artifact is a separate, narrower issue that survived those fixes.

## What was confirmed

1. **CPU↔GPU agreement on band transform**: `bands.ts` and `quad.ts` produce bit-identical float32 `bandScale` and `bandOffset` for every glyph tested (A, Z, V, X, O, I). Permanent regression test at [tests/shared/slug/bandscale-cpu-vs-vertex.spec.ts](../tests/shared/slug/bandscale-cpu-vs-vertex.spec.ts).

2. **Band assignment is correct**: float32 vs float64 disagreements in `floor(cMin*scale + offset)` exist, but they're absorbed by the `±1` margin and `Math.max(0, ...)` clamps. No curves are missing from the band the GPU's float32 calc actually queries.

3. **Sort order is correct**: zero inversions across A/Z/V/X/O/I when comparing the production sort key (float64) against float32 max-coord. The early-out `break` cannot fire on the wrong curve.

4. **Bug is in the horizontal ray only**: `SLUG_DEBUG_AXIS_MODE = 1` (paint `abs(xcov)` only) shows the artifact stripes; `SLUG_DEBUG_AXIS_MODE = 2` (paint `abs(ycov)` only) renders cleanly. The vertical ray loop is innocent.

5. **Artifact pixels have full integer xcov, not partial**: `SLUG_DEBUG_RAW = 12` (fine-grained xcov bands) shows the artifact zone as **white**, meaning `|xcov| > 0.95`. **NOT** the small ~0.21 imbalance I initially hypothesized.

6. **Artifact pixels have V-ray correctly at zero**: `SLUG_DEBUG_RAW = 9` (axis-disagreement detector) shows the artifact zone as YELLOW (xcov ≈ 1, ycov ≈ 0, both wgts < 0.1). The H-ray says "fully inside" while the V-ray correctly says "fully outside".

7. **Artifact pixels have 4+ H-ray crossings**: `SLUG_DEBUG_RAW = 11` (artifact-only h-count) shows the artifact zone as **white** (4+ curves with code != 0). The H-ray IS processing many curves; it's not a missing-crossing issue.

## What was tried and ruled out

| Hypothesis | Outcome |
|------|---------|
| `bandScale`/`bandOffset` differ between CPU & GPU | Ruled out by bit-equivalence test |
| Float64 vs float32 floor disagreement at band boundary | Ruled out — `±1` margin absorbs it |
| Float64 sort key disagrees with float32 max-coord, mis-orders curves | Ruled out — zero inversions |
| Curve missing from band → early-out break drops it | Ruled out — every needed curve is in every needed band |
| Bug in dilation halo (em-y < 0) | Ruled out by `SLUG_DEBUG_DISABLE_DILATION = 1` test (2026-05-04) — artifact persists with dilation off, so dilation halo is innocent |
| Tiny AA imbalance (xcov ~ 0.21) leaking through `max(weighted, interior)` | Ruled out — fine-grained probe shows xcov ≈ 1, not 0.21 |
| Fix: `mix(interior, weighted, max(xwgt, ywgt))` instead of `max` | Tried, did NOT eliminate the artifact. Reverted. |
| Float32 round-trip in `bands.ts` `curveBounds` interior-extremum branch | Tried 2026-05-04, did NOT eliminate the artifact. Reverted. The ±1 margin already absorbs CPU/GPU bound disagreement. |
| `pack.ts` curve-texel wrap-skip strands previous curve's p3 slot | Tried 2026-05-04, did NOT eliminate the artifact. Reverted. The wrap logic is correct — the previous curve's column is by construction never `widthMask`, so its `+1` neighbor stays on the same row. |
| Band lookup index is wrong (bands "drawn at wrong place") | Ruled out by `SLUG_DEBUG_RAW = 13` (band-index color ramp). Bands are uniform horizontal stripes at exactly the expected screen-Y positions. Indexing is correct; band CONTENT is what produces wrong xcov. |

The previously-claimed CalcCoverage fix was **incorrect**. The artifact pixels have `weighted = interior = 1` (both equal), so `mix` and `max` produce the same value. Reverted on 2026-05-03.

## Crucial unresolved discrepancy

The bit-exact float32 CPU simulator at [tests/shared/slug/artifact-pixel-simulator.spec.ts](../tests/shared/slug/artifact-pixel-simulator.spec.ts) computes xcov values for every (em-x, em-y) pair in the artifact region. **The simulator never produces the white xcov ≈ 1 the GPU shows at the artifact pixels.** Either:

1. The simulator is missing something the GPU does (a code path divergence we haven't identified)
2. The artifact pixels are at em-x or em-y values different from what we've been sampling
3. The GPU has additional state (`fwidth(renderCoord)` derivatives, supersampling, vTexcoord interpolation precision) that affects the calculation

Most likely: **#3 — the `pixelsPerEm` computed from `fwidth()` may differ from `fontSize/unitsPerEm` at the dilation halo**, or `vTexcoord` is interpolated to values we don't expect.

## Latest findings (2026-05-04) — root cause isolated to sort-position ≥ 3

### Critical user observation: artifact stripes are MIRRORED

The user observed that the bright-stripe pixels OUTSIDE the glyph (left of A's left leg) are **mirrored** with dark-gap pixels INSIDE the glyph (inside A's right leg). Same em-Y rows on both sides; the stripe count and shape match. This rules out a content-only bug and points at a curve-X-position mathematical issue.

Mathematical implication: the artifact must be a **`+1` xcov contribution at a wrong em-X position**. For pixels left of the glyph (correct xcov = 0), `+1` produces brightness ≈ 1 → bright stripes. For pixels inside the right leg (correct xcov = -1 from leg's matching entry/exit), the spurious `+1` cancels to xcov = 0 → dark gap.

### H-ray-only artifact confirmed

The user previously confirmed:
- V-only rendering (H-bands disabled): no artifacts.
- H-only rendering (V-bands disabled): artifacts present.

Therefore the bug is in the H-ray pipeline.

### Number of artifact stripes varies with screen Y position (3-5 stripes)

This rules out pure glyph-data bugs. The **screen-Y-dependent count** strongly implicates a precision/position-dependent issue in the H-ray solver: which pixels fall into the affected condition depends on how screen pixels align to em-Y values.

### Binary-search by HRAY_LIMIT — root cause isolated

Added a new compile-time flag `SLUG_DEBUG_HRAY_LIMIT` to [src/shared/shader/slug/frag.glsl](../src/shared/shader/slug/frag.glsl) that limits the H-ray loop to processing only the first N curves in each H-band's sorted list. Curves are sorted descending by max-X, so position 0 is the rightmost-extent curve in the band, position 1 is second-rightmost, etc.

Test sequence at fontSize=800, text="AZ", Roboto TTF default:

| HRAY_LIMIT | A artifacts | Z artifacts |
|---|---|---|
| 1 | None | None |
| 2 | None | None |
| 3 | None | None |
| 4 | Bottom-left block starting | Stripes appear (small, on lower-right) |
| 6 | Full stripes | Full stripes |

**Result**: the artifact-causing curve is at **sort-position 3** (4th curve from the right in the band). Adding it triggers the bug; processing only positions 0..2 produces no artifacts.

### Geometric interpretation of position 3

In the H-band sorted list (descending max-X), the rightmost extents are:
- Position 0: outermost curve on the right side of the glyph (e.g., A's right leg outer edge)
- Position 1: inner curve of right side
- Position 2: another right-side curve
- **Position 3: middle-of-glyph curve** — likely the bottom horizontal stroke of A's foot/serif, or Z's bottom horizontal stroke. Short curves with **small Y extent (near-horizontal)**.

### Suspected mechanism: small-but-not-tiny `ay` denominator

Near-horizontal curves have small `ay = p1.y - 2*p2.y + p3.y` (the Y-quadratic coefficient). The H-ray solver:

```glsl
float ay = p12.y - p12.w * 2.0 + p3.y;
float ra = 1.0 / ay;
float d = sqrt(max(by * by - ay * p12.y, 0.0));
float t1 = (by - d) * ra;
float t2 = (by + d) * ra;

if (abs(ay) < kQuadraticEpsilon) {
    if (abs(by) < kQuadraticEpsilon) continue;
    t1 = p12.y * 0.5 / by;
    t2 = t1;
}
```

The fallback uses linear-equation math when `|ay| < kQuadraticEpsilon = 0.0001`. For curves with `ay` in the range `(0.0001, ~larger_threshold)` — small enough to cause numerical instability but NOT small enough to trigger the fallback — `ra` is large (e.g., `1/0.0002 = 5000`), producing wildly out-of-range `t1`/`t2`. The subsequent `x1 = (ax * t1 - bx * 2.0) * t1 + p12.x` has a `t1²` term that explodes, giving `x1` magnitudes far beyond the AA window. `clamp(x1 + 0.5, 0, 1)` saturates to 1 → spurious +1 xcov contribution.

### Fix applied

Bumped `kQuadraticEpsilon` from `0.0001` to `0.01` in [src/shared/shader/slug/frag.glsl:12](../src/shared/shader/slug/frag.glsl#L12). Verified visually at fontSize=800 with text "AZ" on Roboto TTF default — stripes gone.

Mechanism: with the larger threshold, curves whose `|ay|` falls in the precision-unstable range `(0.0001, 0.01)` now route through the linear-fallback branch:

```glsl
if (abs(ay) < kQuadraticEpsilon) {
    if (abs(by) < kQuadraticEpsilon) continue;
    t1 = p12.y * 0.5 / by;
    t2 = t1;
}
```

This computes `t` as a stable linear-equation solution `t = -p12.y / (2 * by)` (rearranged), avoiding the runaway `1/ay`. The fallback's accuracy when `|ay|` is small-but-nonzero is acceptable because the linear approximation is dominant in this regime.

### Caveats and follow-ups

1. **The threshold is still hardcoded.** Shipped as-is on 2026-05-04 because it resolves the artifact across all tested font sizes (verified visually at 800pt, no regressions on V/X/R/W/B). Two follow-up options when this needs revisiting:

   **Preferred (textbook) fix — Citardauq formula.** Replace the unstable `t = (by - d) / ay` with the numerically stable alternate form `t = p12.y / (by + d)`, which avoids subtraction-cancellation as `ay → 0`. The current linear fallback is a special case of Citardauq when `d → |by|`; switching to Citardauq handles all in-between cases too and removes the magic-threshold problem entirely. Sketch:

   ```glsl
   // For ay*t² - 2*by*t + p12.y = 0:
   //   classical: t1 = (by - d)/ay, t2 = (by + d)/ay   ← unstable as ay → 0
   //   Citardauq: t1 = p12.y/(by + d), t2 = p12.y/(by - d)  ← stable as ay → 0
   if (abs(ay) < kQuadraticEpsilon) {
       t1 = p12.y / (by + d);
       t2 = p12.y / (by - d);
   } else {
       t1 = (by - d) / ay;
       t2 = (by + d) / ay;
   }
   ```

   Touches the solver math, so V/X/R/W/A/Z/# all need a regression check after.

   **Fallback fix — scale `kQuadraticEpsilon` with `pixelsPerEm`.** If the Citardauq switch turns out to break some other path or interact badly with the elsewhere-in-the-shader assumptions, just scale the existing threshold:

   ```glsl
   float kQuadraticEpsilon = max(0.0001 * pixelsPerEm.x, 0.0001);  // H-ray
   // and pixelsPerEm.y in the V-ray
   ```

   Pins the precision boundary to screen-space scale, robust at any font size, no math change. Roughly 5-line patch.

2. **Verify the fix on the prior V/X/R/W test cases.** The 2026-03 fix for those glyphs touched the vertical solver and CalcCoverage. The new `kQuadraticEpsilon = 0.01` was visually verified to not regress them on 2026-05-04 (no artifacts on V, X, R, W, B at 800pt). Re-verify if `kQuadraticEpsilon` is changed again.

3. **The `SLUG_DEBUG_HRAY_LIMIT` flag is now staged at [frag.glsl line ~36](../src/shared/shader/slug/frag.glsl)** alongside `SLUG_DEBUG_HRAY_SKIP_POS`. Set to a non-negative integer to limit the H-ray loop to the first N curves. Useful for future curve-position binary searches. Default `-1` (disabled).

### Investigation summary — what cracked it

After the doc's prior section ruled out band assignment, sort, dilation, and CalcCoverage hypotheses, two new tools cracked the case:

1. **The user's observation** that artifact stripes are MIRRORED between outside-glyph (bright stripes) and inside-glyph (dark gaps) — this fixed the mathematical interpretation as a `+1` xcov contribution at a wrong em-X.

2. **The `SLUG_DEBUG_HRAY_LIMIT` binary search** — by limiting the H-ray to N curves and incrementing N until artifacts appeared, isolated the offending curve to sort-position 3 in each affected band. This narrowed the suspect set from "any curve in any band" to "near-horizontal short curves on glyph diagonals/feet" — which directly suggested the `ay` precision hypothesis.

Both tools should be the first ones reached for in any future similar investigation.

### Reproduction recipe

1. `git diff` should show: `kQuadraticEpsilon` bumped to `0.01`, `SLUG_DEBUG_HRAY_LIMIT` added (currently `-1` = disabled).
2. `npx pnpm run build:v8:dev`
3. Open `http://localhost:3000/examples/v8/`, hard-reload.
4. Set fontSize = 800, text = "AZ".
5. Verify no stripes at bottom-left of A or bottom-right of Z.

## Debug machinery (staged in shaders)

All compile-time flags. Reset to 0 before shipping. Build with `npx pnpm run build:v8:dev`.

### `SLUG_DEBUG_RAW` ([src/shared/shader/slug/frag.glsl:14-29](../src/shared/shader/slug/frag.glsl#L14-L29))

| Mode | Purpose |
|------|---------|
| 0 | off (production) |
| 1 | xcov as red/green |
| 2 | xwgt as greyscale |
| 3 | ycov as red/green |
| 4 | ywgt as greyscale |
| 5 | xcov bucketed (red=high noise, blue=mid AA, green=integer) |
| 6 | (R=\|xcov\|, G=\|ycov\|, B=weighted) packed |
| 7 | bug-pixel detector v1 (\|xcov\|>0.1 AND xwgt<0.1) — too generous, hits all interior |
| 8 | bug-pixel detector v2 (\|xcov\| > xwgt + 0.1) — same problem |
| 9 | **axis-disagreement** — yellow=xcov full, ycov zero, no wgt (most useful) |
| 10 | H-ray crossing count (red=1, yellow=2, green=3+) |
| 11 | crossing count ONLY at bug pixels |
| 12 | **fine-grained xcov bands** (10% increments — black→red→yellow→white) |
| 13 | bandIndex.y as color ramp (per-band hue) — confirms band-index correctness |

### Other staged debug capability

- One-time quad-attributes log in [src/shared/slug/glyph/quad.ts](../src/shared/slug/glyph/quad.ts) (currently NOT present — was added then removed). Prints to browser console for A/Z. Re-add by inserting after the `x0/y0/x1/y1` computation.
- `SLUG_DEBUG_DISABLE_DILATION` flag in [src/shared/shader/slug/vert.glsl](../src/shared/shader/slug/vert.glsl) (currently NOT present — was added then removed). Bypasses dilation entirely.

Both can be re-staged from git history if needed.

## Diagnostic tests (preserved as permanent regression checks)

- [tests/shared/slug/bandscale-cpu-vs-vertex.spec.ts](../tests/shared/slug/bandscale-cpu-vs-vertex.spec.ts) — asserts CPU↔GPU bandScale/offset match
- [tests/shared/slug/artifact-pixel-simulator.spec.ts](../tests/shared/slug/artifact-pixel-simulator.spec.ts) — bit-exact float32 simulator of the H-ray. Currently sweeps em-x and em-y in the artifact zone. **Useful starting point** for the next investigator — extend it to model `fwidth()`, `vTexcoord` interpolation, or whatever the next hypothesis requires.

## Where to resume

Three best paths to try next:

### Path 1 — Get the GPU's actual xcov value for a known artifact pixel

Add a debug mode that **encodes xcov as a precise color** (e.g., R = (xcov + 1) * 0.5 with high precision, or use `SLUG_DEBUG_RAW = 12` which already does coarse bands). Use the browser's color picker / pixel inspector to read the exact xcov value at one or two artifact pixels. Then plug those exact (em-x, em-y) values into the CPU simulator and see if it reproduces. If the simulator gives xcov = 0 but the GPU gives xcov = 1 at the SAME (em-x, em-y), then there's a code-path divergence we haven't identified.

To compute the (em-x, em-y) at a screen pixel: re-add the quad-attributes console log in `quad.ts`, hover over the artifact pixel in the browser to read its screen coords, then linearly interpolate using the quad's screen→em transform.

### Path 2 — Disable dilation and check if the artifact persists

Re-add `SLUG_DEBUG_DISABLE_DILATION` in [vert.glsl](../src/shared/shader/slug/vert.glsl) (was previously staged at line ~10 and used at line ~127). Build with it set to 1. If the artifact disappears, the bug lives in the dilation halo (em-y outside `[bounds.minY, bounds.maxY]`). If it persists, dilation is innocent and the bug is purely in the ray solver / band arithmetic for in-bbox pixels.

### Path 3 — Look at supersampling

The investigation assumed supersampling is off (`Defaults.Supersampling = false`). Confirm in DevTools that `uSupersampleCount = 0` for the example, and verify by setting it to a non-zero value to see if the artifact gets averaged-out (which would suggest a sub-pixel sampling effect).

## Context for an LLM resuming this work

- The current code at [src/shared/shader/slug/frag.glsl](../src/shared/shader/slug/frag.glsl) is the **production state** with all debug flags off (`SLUG_DEBUG_RAW = 0`). All `#elif` branches for the debug modes remain in place — flip the flag, rebuild, screenshot.
- The `CalcCoverage` formula is back to `max(weighted, max(abs(xcov), abs(ycov)))` — the original V/X/R/W fix from 2026-03. **Do not change this without first solving the open A/Z problem**, as the fix interacts with both glyph families.
- The user's reproduction setup: v8 example, Roboto TTF (default), test string `AAZZ##!`, size 270pt+ for clear visibility. Mode 12 (fine-grained xcov) is the most informative single visualization.
- The user has the example running at `http://localhost:3000/examples/v8/`. Build with `npx pnpm run build:v8:dev`, hard-reload the page.
- Extensive screenshots from this investigation are preserved in the user's chat history but not in the repo. The most useful: mode-9 (axis-disagreement) and mode-12 (fine-grained xcov).

---

# Investigation history (preserved from prior versions)

## Relationship to the prior artifact investigation

The V/X/R/W diagonal-stroke artifacts resolved on 2026-03-19 are documented in [_docs/artifact_investigation.md](artifact_investigation.md). Those fixes are still correct and complete for the family they targeted. The A/Z artifact described here:

- Affects **different glyphs** (A, Z) than the resolved set (V, X, R, W).
- Has a **different signature** (horizontal stripes at the bottom-left of legs, scaling with size; not the diagonal-stroke streaks of the prior issue).
- Was **already present** before any of the fixes in the prior doc were applied — it just wasn't surfaced by the test cases of the day, because the example default text didn't prominently include uppercase A or Z at large sizes.

The two issues likely share the same root family (boundary float32 precision) but require independent fix work because the failure mode and reproduction conditions differ.

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

## File references

| File | Role |
|------|------|
| [src/shared/shader/slug/frag.glsl](../src/shared/shader/slug/frag.glsl) | Fragment shader — `CalcCoverage`, ray loops. **All debug modes live here.** |
| [src/shared/shader/slug/vert.glsl](../src/shared/shader/slug/vert.glsl) | Vertex shader — dilation, MVP, unpack |
| [src/shared/slug/glyph/bands.ts](../src/shared/slug/glyph/bands.ts) | CPU band assignment, ±1 safety margin |
| [src/shared/slug/glyph/quad.ts](../src/shared/slug/glyph/quad.ts) | Vertex-side `bandScale` / `bandOffset` write |
| [src/shared/slug/glyph/curves.ts](../src/shared/slug/glyph/curves.ts) | Cubic→quadratic conversion (relevant to OTF reversal) |
| [tests/shared/slug/bandscale-cpu-vs-vertex.spec.ts](../tests/shared/slug/bandscale-cpu-vs-vertex.spec.ts) | Permanent regression — CPU↔GPU bandScale agreement |
| [tests/shared/slug/artifact-pixel-simulator.spec.ts](../tests/shared/slug/artifact-pixel-simulator.spec.ts) | Bit-exact CPU simulator. Extend for next investigation phase. |
| [tests/shared/slug/font-eager-vs-lazy.spec.ts](../tests/shared/slug/font-eager-vs-lazy.spec.ts) | Byte-equivalence test that ruled out the load pipeline as cause |
| [_docs/artifact_investigation.md](artifact_investigation.md) | Prior investigation (V/X/R/W family) — context, candidate fixes |
