# Artifact Investigation

## Hard Requirements

1. **Zero artifacts at all sizes.** The Slug algorithm's core value is resolution-independent rendering that remains crisp at any scale. Any artifact visible at any font size — no matter how small — means that size is unusable. Solutions that "reduce" or "hide" artifacts are not acceptable. The algorithm produces correct results with no artifacts, or it doesn't work.

2. **No "good enough."** There is no acceptable middle ground. The rendering is either correct or incorrect. Partially-correct rendering that works at some sizes but not others defeats the purpose of the algorithm.

## Current Status

**As of 2026-03-19**: Integer winding (binary inside/outside) produces **zero artifacts at all sizes**. This is the current committed baseline. Antialiasing is disabled — edges are aliased/jagged but correct. The next step is adding antialiasing back without reintroducing artifacts.

**Current CalcCoverage**:
```glsl
return step(0.5, max(abs(xwind), abs(ywind)));
```

---

## Key Discoveries

### 1. Integer winding produces zero artifacts

**Verified visually at 24px, 32px, and 130px.** Pure `step(0.5, max(abs(xwind), abs(ywind)))` — no fractional coverage, no antialiasing — renders every glyph correctly with solid interiors and no bright lines, dark notches, or stray pixels at any font size. This proves the root eligibility, root solving, and curve data are all correct.

### 2. The reference shader's single-accumulator formula fails without band-split

**Verified via CPU simulation.** The V glyph has two closed contours that produce `xcov = +2.0` and `ycov = -2.0` at interior pixels. The single-accumulator reference formula gives `sqrt(abs(2 + (-2)) * 0.5) = 0` — black interior. The reference avoids this with band-split (bidirectional rays). Without band-split, a single accumulator cannot work.

### 3. Per-axis fractional coverage produces false positives on diagonal edges

**Root cause of all visible artifacts.** For a pixel OUTSIDE the glyph but near a diagonal edge, the horizontal ray produces a fractional `xcov ≈ 0.3` (the ray grazes the diagonal curve). The vertical ray correctly produces `ycov = 0` (no crossings). Any CalcCoverage formula that picks up the fractional `xcov` value — `max(abs(xcov), abs(ycov))`, weighted average, similarity blend — produces nonzero coverage for an outside pixel.

This is fundamental to single-direction rays without band-split: on diagonal edges, the ray that's nearly parallel to the edge produces fractional values over a wide region, not just the 1-pixel AA transition zone.

### 4. The `fwidth` vs `abs(dFdx)` difference doesn't matter

Tested by switching to `fwidth()` matching the reference. No visible change.

### 5. Square vs rectangular band grid doesn't matter

Tested by switching to single shared band scale matching the reference. No visible change.

### 6. The `by ≈ 0` linear fallback guard doesn't matter

Tested by removing the guard to match the reference's unguarded division. No visible change.

### 7. Band data and curve data are correct

Verified by CPU-side validation: every band's curve references point to the correct curve data in the texture. No mismatches.

### 8. CPU simulation matches GPU for all tested positions

No mismatches between all-curves and band-only simulation. The band system correctly assigns all curves.

---

## What Has Been Tried (Complete List)

### Fixes that corrected real bugs ✅

| # | Fix | Impact |
|---|-----|--------|
| 1 | Float32 round-trip in `curveBounds()` | Correct precision matching |
| 2 | ±1 band extension | Correct band boundary coverage |
| 3 | CalcRootCode: sign-bit → `y > 0.0` convention | Fixed wrong equivalence classes — eliminated severe horizontal streaks |
| 4 | Vertical solver: minus → plus on p2 term | Fixed wrong intersection positions — eliminated vertical streaks |

### Coverage formulas tried ❌ (all produced artifacts)

| # | Formula | Result |
|---|---------|--------|
| 5 | `(abs(xcov) + abs(ycov)) * 0.5` | Semi-transparent interiors |
| 6 | `sqrt(abs(xcov + ycov) * 0.5)` (reference single accumulator) | Black interiors (cancellation) |
| 7 | `max(abs(xcov), abs(ycov))` with weight-based edge blend | Solid interiors, bright line artifacts on diagonals |
| 8 | Similarity-based interior blend | Reduced but didn't eliminate artifacts |
| 9 | `xsum`/`ysum` total-magnitude detection | False positives — outside pixels also have high xsum |
| 10 | Integer winding gating + fractional AA | Artifacts returned through the AA path |
| 11 | Per-axis coverage gated by per-axis integer winding | Incorrect diagonal edge shapes |

### The working solution ✅

| # | Formula | Result |
|---|---------|--------|
| 12 | `step(0.5, max(abs(xwind), abs(ywind)))` — pure integer winding | **Zero artifacts.** No antialiasing (aliased edges). |

### Tests that showed no change

| # | Change | Result |
|---|--------|--------|
| A | `fwidth()` instead of `abs(dFdx())` | No change |
| B | Square band grid (single shared scale) | No change |
| C | Removed `by ≈ 0` linear fallback guard | No change |

---

## Root Cause Summary

The artifacts stem from a **fundamental limitation of single-direction rays without band-split**: fractional coverage values on diagonal edges extend over a wide pixel region, producing false positive coverage for outside pixels. Every CalcCoverage formula that uses per-axis fractional values inherits this problem.

The integer winding number (patent Equation 4: count crossings where `Cx(t) > 0`) is immune because it's a binary test — the crossing is either to the right of the pixel or it isn't. No fractional values, no cancellation, no false positives.

---

## Next Steps

### Adding antialiasing without artifacts

The challenge: the integer winding produces zero artifacts but aliased edges. Adding AA requires fractional coverage at edge pixels, but the per-axis fractional values produce false positives on diagonals.

**Option A: Band-split (bidirectional rays)**
The reference's solution. Fire rays in both +X and -X from a split point. Prevents interior cancellation AND produces correct per-pixel fractional coverage because each ray only reaches the nearest edge. Requires:
- Dual-sorted curve lists per band (ascending and descending by max coordinate)
- Band split point calculation during preprocessing (median of curve positions)
- 4-channel band header (currently 2)
- More complex fragment shader loop
- Significant preprocessing changes in `bands.ts` and `pack.ts`

**Option B: Compute AA from the integer winding transition**
Instead of using fractional ray coverage, detect where the integer winding changes from 1→0 across adjacent pixels and compute AA from the transition location. This is essentially distance-to-edge computation.

**Option C: Screen-space post-processing**
Render with integer winding (no artifacts), then apply a screen-space edge smoothing pass (e.g., FXAA-style). Separate from the Slug algorithm but would produce smooth edges.

**Option D: Dilation-based AA**
The dynamic dilation already expands the quad by 0.5 pixels. At the dilated boundary pixels, use the distance from the original quad edge as coverage. This doesn't involve ray coverage at all.

---

## Architecture Notes for Resuming

### Current shader structure
- Integer winding tracked via `xwind`/`ywind` using `step(0.0, x1raw)` on unscaled intersection positions
- Fractional coverage tracked via `xcov`/`ycov` (computed but unused in current CalcCoverage)
- Weight tracking via `xwgt`/`ywgt` (computed but unused)
- Single accumulator `coverage` maintained for reference formula comparison (unused)
- Debug globals `slug_debug_xcov`/`slug_debug_ycov` available for visualization

### Key data for V glyph
- Two contours, 10 curves total
- Interior: `xcov = +2.0`, `ycov = -2.0` (opposite signs, cancel in single accumulator)
- Interior: `xwind = +2.0`, `ywind = -2.0` (same magnitude, `max(abs) = 2` → inside)
- Bottom region (y=0): multiple curve endpoints converge
- `pixelsPerEm ≈ scale ≈ 0.0635` at fontSize=130

### Key data for X glyph
- Single contour, 12 curves
- Crossing point at (644, 735) / (529-759, 735)
- Self-intersecting contour path

---

## File References

| File | Role |
|------|------|
| [src/shared/shader/slug/frag.glsl](../src/shared/shader/slug/frag.glsl) | Fragment shader — CalcCoverage, ray loops, integer winding |
| [src/shared/shader/slug/vert.glsl](../src/shared/shader/slug/vert.glsl) | Vertex shader — dilation, MVP, unpack |
| [src/shared/slug/glyph/bands.ts](../src/shared/slug/glyph/bands.ts) | Band assignment, square grid, float32 bounds |
| [src/shared/slug/glyph/curves.ts](../src/shared/slug/glyph/curves.ts) | Curve extraction, cubic→quadratic conversion |
| [src/shared/slug/glyph/quad.ts](../src/shared/slug/glyph/quad.ts) | Quad building, vertex attributes, square band scale |
| [src/shared/slug/texture/pack.ts](../src/shared/slug/texture/pack.ts) | Curve + band texture packing |
| [src/v8/slug/text.ts](../src/v8/slug/text.ts) | PixiJS v8 integration, texture upload |
| [_references/Lengyel2017FontRendering-GlyphShader.glsl](../_references/Lengyel2017FontRendering-GlyphShader.glsl) | Original reference GLSL shader |
