# Artifact Investigation

## Hard Requirements

1. **Zero artifacts at all sizes.** The Slug algorithm's core value is resolution-independent rendering that remains crisp at any scale. Any artifact visible at any font size — no matter how small — means that size is unusable. Solutions that "reduce" or "hide" artifacts are not acceptable. The algorithm produces correct results with no artifacts, or it doesn't work.

2. **No "good enough."** There is no acceptable middle ground. The rendering is either correct or incorrect. Partially-correct rendering that works at some sizes but not others defeats the purpose of the algorithm.

## RESOLVED — 2026-03-19

**Status**: All artifacts eliminated. Rendering is correct with antialiasing at all font sizes (tested 24px, 32px, 130px, 280px). No bright lines, dark bands, notches, or stray pixels on any character including V, X, x, v, R, r, W, w, and all other diagonal-stroke glyphs.

---

## Root Cause & Solution

### Two bugs were found and fixed

**Bug 1: Vertical solver polynomial sign (PRIMARY CAUSE)**

The vertical ray solver used `p12.y + p12.w * 2.0 + p3.y` (PLUS on the p2 term) for computing the cross-axis intersection position. This came from the 2017 JCGT reference shader (`Lengyel2017FontRendering-GlyphShader.glsl`). The latest 2026 reference shader from the Slug GitHub repository uses `p12.y - p12.w * 2.0 + p3.y` (MINUS) — the same `a = p1 - 2*p2 + p3` formula used for both axes.

The wrong sign produced incorrect vertical ray intersection positions, which caused:
- False positive coverage on diagonal edges (bright line artifacts extending from V, X, R diagonals)
- Incorrect ycov values that failed to complement xcov for proper interior coverage

**Fix**: Changed line in vertical loop from:
```glsl
float ax = p12.y + p12.w * 2.0 + p3.y;  // WRONG (2017 reference)
```
to:
```glsl
float ax = p12.y - p12.w * 2.0 + p3.y;  // CORRECT (2026 reference)
```

**Bug 2: CalcCoverage used `min` instead of `max` for interior fallback**

The CalcCoverage formula used `min(abs(xcov), abs(ycov))` as the interior fallback. This fails for glyphs with **oppositely-wound contours** (e.g., the V glyph has two contours wound in opposite directions). With opposite winding, the horizontal ray's contributions cancel (`xcov ≈ 0`) while the vertical ray correctly reads `ycov ≈ 1`. Using `min(0, 1) = 0` produces a dark interior.

**Fix**: Changed from `min` to `max`:
```glsl
// WRONG: min picks the canceled axis → dark interior
min(abs(xcov), abs(ycov))

// CORRECT: max picks the axis with valid winding → solid interior
max(abs(xcov), abs(ycov))
```

### Why `max` works and `min` doesn't

- `min(abs(xcov), abs(ycov))`: Both axes must agree for the pixel to be "inside." Fails when one axis cancels due to opposite contour winding.
- `max(abs(xcov), abs(ycov))`: Either axis detecting "inside" is sufficient. Works correctly because a pixel inside the glyph will always have at least one axis with nonzero winding, regardless of contour winding direction.

The concern with `max` was that it might produce false positives on diagonal edges (outside pixels with fractional xcov). This concern was valid when the vertical solver was wrong (bug 1) — the incorrect ycov values couldn't gate the false xcov values. With the corrected vertical solver, ycov correctly reads ~0 for outside pixels, so `max(fractional, 0) = fractional` which is the correct antialiasing transition.

---

## Symptoms That Led to Discovery

### Initial symptoms (before any fixes)
- Severe horizontal bright streaks extending rightward from all diagonal strokes
- Streaks changed position with Y offset, repeated cyclically every few pixels
- X position had no effect
- Affected: X, x, v, V, R, r, W, w — all characters with diagonal strokes
- Not affected: |, comma, period, I, l — characters with only horizontal/vertical strokes

### After fixing CalcRootCode convention (early fix)
- Severe horizontal streaks eliminated
- Thin bright lines remained at sharp-angle vertices (V apex, X crossing, R leg)

### After fixing vertical solver sign (bug 1)
- Most thin lines eliminated
- V still had horizontal banding at the apex

### After switching `min` to `max` (bug 2)
- All artifacts eliminated
- Clean rendering at all sizes

---

## Investigative Process That Found the Solution

### Key insight: isolate axes with debug colors

Using `fragColor = vec4(abs(xcov), abs(ycov), 0.0, 1.0)` (red = xcov, green = ycov) revealed:
- **Yellow** (both axes ≈ 1) = correct interior
- **Green only** (ycov ≈ 1, xcov ≈ 0) = horizontal ray canceling but vertical correct
- **Red only** (xcov ≈ 1, ycov ≈ 0) = vertical ray canceling but horizontal correct

This showed the two contours of the V glyph cancel on one axis but not the other.

### Key insight: test each axis independently

Using `fragColor = vec4(vec3(abs(slug_debug_xcov)), 1.0)` showed xcov was **completely black** in the lower half of the V (horizontal cancellation). Switching to ycov showed it was **completely white** (vertical ray correct). The banding appeared only in the combined CalcCoverage output.

### Key insight: latest reference shader from GitHub

An agent search found the latest Slug reference shader published on GitHub in March 2026 (`SlugPixelShader.hlsl`). Comparing against this revealed the vertical solver sign difference (`+` vs `-`). The 2017 JCGT supplemental shader had `+`; the 2026 version has `-`. This was the primary bug.

### Key insight: CPU simulation of integer winding

The integer winding (`step(0.5, max(abs(xwind), abs(ywind)))`) produced **zero artifacts** at all sizes, proving the root eligibility and curve data were correct. This isolated the problem to the fractional coverage / CalcCoverage layer.

---

## Complete List of All Fixes Applied

### Kept (correct fixes)

| # | Fix | File | Impact |
|---|-----|------|--------|
| 1 | Float32 round-trip in `curveBounds()` | bands.ts | Correct precision matching |
| 2 | ±1 band extension | bands.ts | Band boundary safety margin |
| 3 | CalcRootCode: `y > 0.0` convention with `& 3u` | frag.glsl | Fixed wrong equivalence classes |
| 4 | Vertical solver: `- p12.w * 2.0` not `+` | frag.glsl | **Primary artifact fix** |
| 5 | CalcCoverage: `max` not `min` for interior fallback | frag.glsl | **Secondary artifact fix** |
| 6 | Square band grid (single shared scale) | bands.ts, quad.ts | Match reference convention |
| 7 | Degenerate curve skip (`continue` when both ay and by near zero) | frag.glsl | Skip ray-parallel curves |
| 8 | Cubic-to-quadratic: correct control point formula | curves.ts | Accurate OTF curve conversion |
| 9 | WebGL2 availability check | index.html | User-facing error |
| 10 | Band texture comment correction | text.ts | Accurate documentation |
| 11 | `packBandMax` parameter naming | quad.ts | Clearer code |

### CalcCoverage formulas tried and abandoned

| # | Formula | Result |
|---|---------|--------|
| A | `(abs(xcov) + abs(ycov)) * 0.5` | Semi-transparent interiors |
| B | `sqrt(abs(xcov + ycov) * 0.5)` (reference single accumulator) | Black interiors (cancellation) |
| C | `max(abs(xcov), abs(ycov))` with similarity blend | Reduced but didn't eliminate |
| D | `step(0.5, max(abs(xwind), abs(ywind)))` (integer winding only) | Zero artifacts, no AA |
| E | Integer winding + fractional AA | Artifacts returned through AA path |
| F | Per-axis coverage gated by per-axis integer winding | Wrong diagonal edge shapes |
| G | `xnear`/`ynear` minimum distance with signed-distance AA | Misleading on diagonals |
| H | `xsum`/`ysum` total-magnitude detection | False positives outside glyph |

### The working formula

```glsl
float CalcCoverage(float xcov, float ycov, float xwgt, float ywgt)
{
    float coverage = max(
        abs(xcov * xwgt + ycov * ywgt) / max(xwgt + ywgt, 1.0 / 65536.0),
        max(abs(xcov), abs(ycov))
    );
    return clamp(coverage, 0.0, 1.0);
}
```

---

## File References

| File | Role |
|------|------|
| [src/shared/shader/slug/frag.glsl](../src/shared/shader/slug/frag.glsl) | Fragment shader — CalcCoverage, ray loops |
| [src/shared/shader/slug/vert.glsl](../src/shared/shader/slug/vert.glsl) | Vertex shader — dilation, MVP, unpack |
| [src/shared/slug/glyph/bands.ts](../src/shared/slug/glyph/bands.ts) | Band assignment, square grid, float32 bounds |
| [src/shared/slug/glyph/curves.ts](../src/shared/slug/glyph/curves.ts) | Curve extraction, cubic→quadratic conversion |
| [src/shared/slug/glyph/quad.ts](../src/shared/slug/glyph/quad.ts) | Quad building, vertex attributes |
| [_references/Lengyel2017FontRendering-GlyphShader.glsl](../_references/Lengyel2017FontRendering-GlyphShader.glsl) | 2017 reference (has the `+` bug in vertical solver) |
