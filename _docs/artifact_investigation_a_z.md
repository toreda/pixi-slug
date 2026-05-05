# Artifact Investigation — Uppercase A and Z at Large Sizes

## Status

**RESOLVED** as of 2026-05-04. Root cause: **`kQuadraticEpsilon = 0.0001` was too tight**, leaving a precision gap where near-horizontal curves with small-but-not-tiny `ay` (Y-quadratic coefficient) bypassed the linear-fallback branch and produced wildly out-of-range `t1`/`t2` values in the H-ray solver. The runaway `t1`²/`t2`² terms made `x1`/`x2` saturate the `clamp(x + 0.5, 0, 1)` AA window, contributing a spurious `+1` to `xcov` for every pixel along the curve's em-Y row.

**Initial fix (2026-05-04)**: bumped `kQuadraticEpsilon` from `0.0001` to `0.01` in `src/shared/shader/slug/frag.glsl`. This extended the linear-fallback regime to absorb the precision-unstable near-horizontal curves. Verified at fontSize=800 with text "AZ" — no more stripes.

**Final fix (Citardauq migration)**: replaced the classical `t = (by ± d)/ay` solver with the per-root sign-safe Citardauq form, eliminating the magic-threshold problem entirely. `kQuadraticEpsilon` and the linear fallback have been retired from the shader. See [citardauq_migration.md](citardauq_migration.md) for the migration plan, the simulator-driven test suite, and the two formula bugs the simulator caught before they reached the shader.

See **Final notes & findings** (immediately below) for the migration's lessons-learned, and **Latest findings (2026-05-04)** further down for the full investigation trail that motivated both fixes.

## Final notes & findings (post-Citardauq, 2026-05-04)

### What the migration actually proved

The 0.0001 → 0.01 epsilon bump fixed the *visible* artifact, but the underlying claim — "small-but-not-tiny `ay` produces runaway `t1`/`t2`" — was a hypothesis, not a measurement. The Citardauq migration's CPU simulator put a number on it. From the synthetic-sweep test in [artifact-pixel-simulator.spec.ts](../tests/shared/slug/artifact-pixel-simulator.spec.ts) (673 cases, comparing both solvers to a float64 reference):

| Metric | Classical (with linear fallback) | Citardauq |
|---|---|---|
| Max relative error | **5.525** (552%) | **7.7e-5** |
| Cases where Citardauq beats classical by ≥ 2× | — | **585 / 673** (87%) |
| Cases in `\|ay\| ≤ 0.01` regime where classical degrades past 1e-3 rel err | **104 / 397** (26%) | **0** |

So the runaway hypothesis was right, and 26% of curves in the unstable regime were in fact producing degraded roots even *with* the fallback. The 0.01 threshold visibly cleaned things up because it caught the worst offenders, but didn't catch all of them — Citardauq does.

### The CPU simulator was the load-bearing tool

Two real bugs surfaced as unit-test failures during Step 1, before any shader change:

1. **Sign inversion in the originally-sketched formula.** This doc's earlier revision proposed `q = -(|by| + d)` with `t1 = q/ay` for `by ≥ 0`. The shader's quadratic is `at² − 2bt + c` (note the −2), not the textbook `at² + bt + c`. Working through the algebra: `q/ay = -(by + d)/ay`, but classical `t1 = (by - d)/ay`. So `q/ay = -classical_t2`, not `classical_t1`. Both root signs flip vs classical. The root-ordering test (synthetic sweep, 100+ cases) caught this on first run. Without the simulator, this would have rendered every code-3 curve backwards in production, surfacing as a screenshot-diff regression that's hard to localize back to "the formula in the doc is wrong."

2. **Double-root NaN on horizontal-tangent curves.** The O glyph's curve 10 (Roboto TTF) has `p1.y = p2.y = -20` exactly — a horizontal segment. At pixel `ey = -20`, both `by = 0` and `py = 0` exactly, so `disc = 0`, `d = 0`, `Q = 0`, and `py / Q = 0/0 = NaN`. Classical handled this fine (disc=0 → t1=t2=0 from the standard branch, since |ay| was non-tiny so the linear fallback didn't fire). Citardauq's textbook form blows up here. Fix: when `|Q|` is below the degeneracy threshold but `|ay|` is non-tiny, fall back to `t1 = t2 = Q/ay`, which is well-defined and correct (it's the double-root case). This case never hits the artifact-prone glyphs (A, Z, V, X) — it hits a clean glyph (O) at a benign pixel — so a screenshot-only workflow would have shipped a NaN-contaminated O before noticing.

These two bugs were why the doc's original "spend a release cycle baking the flag" plan compressed to same-day completion: the simulator made the math falsifiable, so the shader change carried no remaining unknowns by the time it got there.

### Investigation methodology lesson

The original A/Z investigation hit a wall at the **"Crucial unresolved discrepancy"** section below — the CPU simulator at the time replicated only one code path and never produced the GPU's `xcov ≈ 1` artifact value. The conclusion was "the simulator is missing something the GPU does." That was correct, but the productive response wasn't *more* GPU debug modes — it was *fixing the simulator*. Once Citardauq's simulator computed the `ay` precision regime correctly, the artifact mechanism became visible as a 552% relative-error blip, not a mysterious GPU-only effect.

For future precision investigations, the order of operations should be:

1. **Build a CPU simulator first.** The bit-exact float32 mirror is cheap (sub-second test runs) and falsifiable.
2. **Verify it reproduces the bug.** If it doesn't, the simulator is incomplete — *fix the simulator before believing GPU-only theories*. The original A/Z simulator missed the `ay → 0` runaway because it had the same bug as the shader; both used the same classical formula. A simulator that mirrors the buggy code reproduces the bug only by accident.
3. **Then change the math.** Once the simulator agrees with the GPU on a known-bad pixel, every subsequent change is observable in milliseconds, not in shader-rebuild + screenshot loops.

### What's permanent

- [tests/shared/slug/artifact-pixel-simulator.spec.ts](../tests/shared/slug/artifact-pixel-simulator.spec.ts) now contains both solvers (Citardauq as primary, classical retained as numerical reference) plus 5 new tests: float64-reference accuracy, unstable-regime accuracy, root-ordering, NaN handling, and per-glyph regression for A / Z / O. These run in ~1.3 s and would catch any future regression in either solver.
- The `SLUG_DEBUG_HRAY_LIMIT` and `SLUG_DEBUG_HRAY_SKIP_POS` flags remain in [frag.glsl](../src/shared/shader/slug/frag.glsl) for future curve-position binary searches.
- The `SLUG_DEBUG_RAW` debug-mode menu (modes 1–13) remains intact. Modes 9 (axis-disagreement) and 12 (fine-grained xcov) were the most informative single visualizations during the original investigation.

### What's gone

- `kQuadraticEpsilon` define
- The classical `t = (by ± d) / ay` formula
- The `if (abs(ay) < kQuadraticEpsilon) { ... }` linear fallback (4 sites: H/V × `SlugRenderEx`/`SlugRenderRaw`)
- The `SLUG_USE_CITARDAUQ` feature flag (was staged during migration, retired after visual verification)

All four solver sites in the shader now route through a single `solveQuadraticRoots` helper that GLSL inlines with no call overhead.

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

## Crucial unresolved discrepancy — RESOLVED post-Citardauq

> **Status (2026-05-04):** resolved. The "simulator never produces xcov ≈ 1" mystery had a simpler explanation than #1/#2/#3 below: the simulator at the time mirrored the *buggy* classical solver, and the same `ay → 0` runaway happened in both — except the simulator was sweeping em-x/em-y in coarse steps and missing the precision-knife-edge pixels the GPU happened to render. The Citardauq migration's simulator added (a) a synthetic-sweep that didn't depend on guessing the right pixels, and (b) a float64-reference comparison that quantified classical's max relative error at 552%. With those in place, the original mechanism (small-but-not-tiny `ay` → catastrophic cancellation in `(by - d)`) became visible as a numerical fact, not a GPU-only mystery. Preserved below as the original analysis.

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

1. **Citardauq migration completed.** The `kQuadraticEpsilon = 0.01` patch was the right thing to ship in 2026-05 — it killed the visible artifact across all tested sizes. But the threshold was still magic, and the same failure mode could resurface at extreme sizes or on differently-distributed `ay` glyphs. The follow-up plan in [citardauq_migration.md](citardauq_migration.md) replaced the classical solver with the per-root sign-safe Citardauq form, retiring `kQuadraticEpsilon` entirely. The migration's simulator-driven approach (Step 1 — implement and test the math in a CPU mirror of the H-ray before touching the shader) caught two real bugs that would otherwise have been screenshot-diff-only:
   - The originally-sketched `q = -(|by| + d)` form on line 144 of an earlier revision of *this* doc inverted both root signs vs classical (the shader's quadratic is `at² − 2bt + c`, not `at² + bt + c`). Would have rendered every code-3 curve backwards.
   - A double-root edge case: when `disc → 0` and `by → 0` exactly (e.g. O glyph, curve 10 at certain pixels), Citardauq's `Q → 0` and `py/Q → NaN`. Falls back to `t = Q/ay` which stays well-defined.

   Net result: the shader's curve loop is one branch shorter, scale-independent, and ~5e-5 max relative error vs a float64 reference (down from 5.5 max for classical at the worst-conditioned synthetic inputs).

2. **V/X/R/W/B regression re-verified.** The 2026-03 fix family from [artifact_investigation.md](artifact_investigation.md) (vertical solver sign + CalcCoverage min→max) was re-checked after the Citardauq migration. No regressions on V, X, R, W, B at 800pt.

3. **The `SLUG_DEBUG_HRAY_LIMIT` flag is staged at [frag.glsl](../src/shared/shader/slug/frag.glsl)** alongside `SLUG_DEBUG_HRAY_SKIP_POS`. Set to a non-negative integer to limit the H-ray loop to the first N curves. Useful for future curve-position binary searches. Default `-1` (disabled).

### Investigation summary — what cracked it

After the doc's prior section ruled out band assignment, sort, dilation, and CalcCoverage hypotheses, two new tools cracked the case:

1. **The user's observation** that artifact stripes are MIRRORED between outside-glyph (bright stripes) and inside-glyph (dark gaps) — this fixed the mathematical interpretation as a `+1` xcov contribution at a wrong em-X.

2. **The `SLUG_DEBUG_HRAY_LIMIT` binary search** — by limiting the H-ray to N curves and incrementing N until artifacts appeared, isolated the offending curve to sort-position 3 in each affected band. This narrowed the suspect set from "any curve in any band" to "near-horizontal short curves on glyph diagonals/feet" — which directly suggested the `ay` precision hypothesis.

Both tools should be the first ones reached for in any future similar investigation.

### Reproduction recipe — verifying the fix is still in place

(Updated post-Citardauq, 2026-05-04. The original recipe described the epsilon-bump fix that was retired in Step 6 of the migration.)

1. `git log --oneline src/shared/shader/slug/frag.glsl` should show the Citardauq migration commits.
2. `grep kQuadraticEpsilon src/shared/shader/slug/frag.glsl` should return nothing — the symbol is gone.
3. `solveQuadraticRoots` should be the only solver, called from all four sites (H/V × `SlugRenderEx`/`SlugRenderRaw`).
4. `npx pnpm run build:v8:dev`, open `http://localhost:3000/examples/v8/`, hard-reload.
5. Set fontSize = 800, text = `AAZZ##!`. Verify: no stripes anywhere, including bottom-left of A and bottom of Z.
6. Run `npx jest tests/shared/slug/artifact-pixel-simulator.spec.ts --no-coverage` — all 9 tests pass, including the synthetic-sweep accuracy comparison and the per-glyph regression for A / Z / O.

To intentionally regress and observe the original artifact (e.g. for educational purposes or to test new debug machinery), `git checkout` to a commit before the Citardauq migration began.

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

## Where to resume — A/Z investigation closed

The A/Z investigation is closed (Citardauq migration, 2026-05-04). The three "next paths" originally listed here (read GPU xcov via color encoding; disable dilation; investigate supersampling) were not needed — the simulator-driven approach landed the fix without them. They remain valid debug tactics for *future* precision investigations on different glyph families, so the original text is preserved at the bottom of this file under "Investigation history."

### If a similar artifact resurfaces on a different glyph family

Recommended order of operations (refined from this investigation's lessons):

1. **First, run the existing simulator suite** at [tests/shared/slug/artifact-pixel-simulator.spec.ts](../tests/shared/slug/artifact-pixel-simulator.spec.ts). If a per-glyph regression test fails for the affected glyph, the bug is reproducible in CPU and you have a falsifiable test case.
2. **If the simulator is clean but the GPU artifacts**, the simulator is missing something the GPU does. *Fix the simulator before chasing GPU-side hypotheses.* The 2026-05 investigation hit a wall here exactly because the simulator mirrored the same buggy solver as the shader — both produced clean output for the wrong reason. Add whatever the simulator is missing (alternate code path, derivative term, dilation logic) until it agrees with the GPU on a known-bad pixel.
3. **Then change the math.** Once the simulator is faithful, every shader change is observable in milliseconds, not in build + screenshot loops. Use the synthetic-sweep style (compare both old and new solvers against a float64 reference) to quantify the improvement, not just confirm the artifact disappears.
4. **Stage behind a flag during integration**, retire the flag after one bake cycle of visual verification. The Citardauq migration's `SLUG_USE_CITARDAUQ` flag was useful for ~30 minutes; the value was the test suite, not the flag.

### Debug machinery still available for future work

- `SLUG_DEBUG_RAW` modes 1–13 in [frag.glsl](../src/shared/shader/slug/frag.glsl). Modes 9 and 12 were the most informative; the rest cover narrower hypotheses.
- `SLUG_DEBUG_HRAY_SKIP_POS` and `SLUG_DEBUG_HRAY_LIMIT` for binary-searching the offending curve in a band's sorted list.
- `solveCitardauq` and `solveClassical` both available in the simulator for cross-comparison against any future third solver.

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
