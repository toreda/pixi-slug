# Artifact Investigation — Sharp-Angle Vertex Artifacts

## Hard Requirement

**Artifacts must be fully eliminated, not reduced or hidden.** The Slug algorithm's core value proposition is resolution-independent rendering that remains crisp at any scale. Any artifact visible at any font size — no matter how small — means that size is unusable and undermines the purpose of the algorithm. Solutions that "make artifacts less noticeable" or "reduce them to 1-2px" are not acceptable. The fix must produce zero artifacts at all sizes.

## Current Status

**As of 2026-03-19**: Testing pure integer winding (no antialiasing) to verify the inside/outside determination is correct before adding AA back. Previous approaches using fractional coverage for AA produced bright line artifacts on diagonal edges because the per-axis fractional values produce false positive coverage for outside pixels near diagonal edges.

---

## Key Discoveries

### 1. The reference shader ALSO fails without band-split

**Verified via CPU simulation and raw debug output.** The V glyph has two closed contours. Interior pixels produce `xcov = +2.0` and `ycov = -2.0` — the horizontal and vertical winding numbers have **opposite signs**. The single-accumulator reference formula gives `sqrt(abs(2 + (-2)) * 0.5) = sqrt(0) = 0` — black interior.

This is NOT a bug in our code. It's an inherent property of this glyph's topology with single-direction rays. The reference shader works because it uses the **band-split optimization** (bidirectional rays) which we have not implemented. Without band-split, our separate-accumulator `CalcCoverage` with `max(abs(xcov), abs(ycov))` is the correct adaptation.

### 2. The remaining artifacts are NOT in CalcCoverage

**Verified with raw debug output** (`abs(xcov + ycov) * 0.25` visualization). The dark patches appear in the raw winding values before any coverage formula is applied. CalcCoverage masks them successfully for most pixels — the remaining thin lines are at the boundary where its heuristics break down.

### 3. Two real bugs were found and fixed by comparing to the reference

- **CalcRootCode**: Used wrong bit convention (`floatBitsToUint >> 31` with multipliers 1,2,4) instead of the reference's (`y > 0.0` with multipliers 2,4,8). This produced wrong equivalence classes.
- **Vertical solver**: Used wrong polynomial (`p1y - 2*p2y + p3y`) instead of the rotated form (`p1y + 2*p2y + p3y`). This produced wrong intersection positions.

### 4. The `fwidth` vs `abs(dFdx)` difference is NOT the cause

Tested by switching to `fwidth()` matching the reference exactly. No visible change in artifacts. Currently using `fwidth()` to match reference.

---

## Artifact Characteristics (from systematic testing)

1. **Location**: Every artifact is at a shared endpoint between two curves meeting at a sharp angle. No exceptions.

2. **Affected glyphs**: X (diagonal crossing), v/V (apex), R (leg junction), r (shoulder).

3. **NOT affected**: |, comma, period, J (curve is gentle), straight segments, horizontal joins.

4. **Y-dependence**: Artifacts shift appearance as the text's Y position changes by 1px increments. Cyclic pattern. X position has no effect.

5. **Appearance**: Thin bright lines (1-2px) along diagonal stroke edges inside the glyph.

6. **Scale-dependence**: More visible at larger font sizes. At smaller sizes the artifacts are sub-pixel.

---

## V Glyph Data (from debug dump)

```
bounds: {"minX":29,"minY":0,"maxX":1277,"maxY":1456}
scale: 0.0634765625 (at fontSize=130, unitsPerEm=2048)
pixelsPerEm ≈ 15.75
curves: 10, hBands: 10, vBands: 10

Contour 1 (right side of V):
  curve[0]: (589,0) → (614,110.5) → (639,221)
  curve[1]: (639,221) → (853.5,838.5) → (1068,1456)
  curve[2]: (1068,1456) → (1172.5,1456) → (1277,1456)  [top horizontal]
  curve[3]: (1277,1456) → (1007.5,728) → (738,0)
  curve[4]: (738,0) → (663.5,0) → (589,0)              [bottom horizontal]

Contour 2 (left side of V):
  curve[5]: (29,1456) → (133.5,1456) → (238,1456)      [top horizontal]
  curve[6]: (238,1456) → (450.5,838.5) → (663,221)
  curve[7]: (663,221) → (689.5,110.5) → (716,0)
  curve[8]: (716,0) → (641.5,0) → (567,0)              [bottom horizontal]
  curve[9]: (567,0) → (298,728) → (29,1456)
```

### CPU coverage simulation at X=650 (center of V bottom)

```
y=  0  xcov= 2.0000  ycov=-1.0000  (boundary — not all curves intersect)
y=  5  xcov= 2.0000  ycov=-2.0000  (stable from here)
y= 10  xcov= 2.0000  ycov=-2.0000
...
y=100  xcov= 2.0000  ycov=-2.0000
```

xcov and ycov have opposite signs for ALL interior pixels. `xcov + ycov = 0` everywhere inside. This is why the single-accumulator reference formula produces zero coverage for the V's interior.

---

## Complete Exhaustive Diff: Our Shader vs Reference

Every difference between our `frag.glsl` and `Lengyel2017FontRendering-GlyphShader.glsl`, with no assumptions about safety:

| # | What | Reference | Ours | Could it matter? |
|---|------|-----------|------|-----------------|
| 1 | Texture type | `sampler2DRect` (integer coords, no normalization) | `sampler2D` with `texelFetch` (integer coords) | Functionally equivalent for `texelFetch`. `sampler2DRect` is OpenGL desktop only, not available in GLSL ES. |
| 2 | Band texture type | `usampler2DRect` → `texelFetch` returns `uvec4` directly | `sampler2D` → `texelFetch` returns `vec4`, cast to uint via `uint(raw + 0.5)` | Different code path. Our +0.5 rounding could shift values. Reference gets exact uint. |
| 3 | `pixelsPerEm` | `1.0 / fwidth(texcoord.x)` | `1.0 / max(fwidth(renderCoord.x), 1/65536)` | Now matches reference (`fwidth`). We add a near-zero guard the reference doesn't have. Guard value `1/65536` would make `pixelsPerEm = 65536` — far too large, but only triggers for degenerate zero-size glyphs. |
| 4 | Band param structure | `bandParam.z` = single shared scale for both axes; `bandParam.xy` = separate offsets | `bandTransform.xy` = separate scales per axis; `bandTransform.zw` = separate offsets | **Different**. Reference band grid is always square (same scale both axes). Ours is rectangular (different scale per axis). Implications unknown — see analysis below. |
| 5 | Band index computation | `texcoord * bandParam.z + bandParam.xy` | `renderCoord * bandTransform.xy + bandTransform.zw` | Different formula due to #4. Produces different band indices for non-square glyphs. |
| 6 | Loop bound | `curve < hbandData.x` (unbounded) | `min(int(hbandData.x), 512)` | Static cap added. Only matters if a band has >512 curves (unlikely). |
| 7 | Loop variable type | `uint curve` | `int curveIndex` | Type differs. Shouldn't affect iteration but uint vs int comparisons could differ on edge cases. |
| 8 | Linear fallback divisor | `p12.y * 0.5 / by` (no guard on `by`) | `p12.y * 0.5 / (abs(by) < eps ? 1.0 : by)` (guarded) | Reference divides by potentially-zero `by`. In HLSL this produces ±inf which the subsequent clamp handles. In GLSL ES this is undefined. Our guard prevents undefined behavior but changes the result when `by ≈ 0`. |
| 9 | Coverage scaling | `clamp(x1 * pixelsPerEm.x + 0.5, 0.0, 1.0)` computed in one expression | `x1 = x1 * pixelsPerEm.x;` then `clamp(x1 + 0.5, 0.0, 1.0)` on separate line | Intermediate is stored in a variable. The GPU may optimize differently. Float precision of intermediate should be identical. |
| 10 | Weight tracking | None | `xwgt = max(xwgt, clamp(1.0 - abs(x1) * 2.0, ...))` per intersection | Extra computation. Doesn't affect xcov/ycov values. Used only by CalcCoverage. |
| 11 | Coverage accumulation | Single `coverage` variable; both loops add/subtract to it | Separate `xcov` and `ycov` (plus a `coverage` that mirrors them) | Structural difference. The separate accumulators allow our CalcCoverage to treat axes independently. |
| 12 | Final formula | `sqrt(clamp(abs(coverage) * 0.5, 0.0, 1.0))` | `CalcCoverage(xcov, ycov, xwgt, ywgt)` with similarity-based interior + weighted edge blending | **Completely different**. Necessary because the reference formula produces zero for V interiors without band-split. |
| 13 | Output | `vec4(vcolor.xyz * alpha, alpha)` where `alpha = coverage * vcolor.w` | `vColor * cov` | Both are premultiplied alpha. Equivalent when `vColor.a = 1.0`. |

---

## Analysis of Remaining Possible Causes

### A. Square vs rectangular band grid (diff #4)

The reference uses a **single scale** for both band axes. This makes the band grid square — same em-units per band in both directions. Our version uses separate scales, producing a rectangular grid where X and Y bands have different widths.

**Implications**:
- Different curves end up in different bands compared to the reference
- The early-out threshold is the same (`pixelsPerEm.x < -0.5` for horizontal, `pixelsPerEm.y < -0.5` for vertical) — this is unaffected by band scale
- For mirrored curves (V, X), a square grid would produce symmetric band assignments. Our rectangular grid produces asymmetric assignments when the glyph is wider than tall or vice versa.

**Observation**: V is 1248 wide × 1456 tall. With 10 bands:
- Our version: X bands = 124.8 em/band, Y bands = 145.6 em/band
- Reference: both = max(1248,1456)/10 = 145.6 em/band (the narrower axis doesn't span all bands)

**Not yet tested**. Could explain why artifacts differ between axes for symmetric glyphs.

### B. `uint(raw + 0.5)` rounding vs native uint texture (diff #2)

The reference reads band data as native uint from `usampler2DRect`. We read float32 from `sampler2D` and cast with `uint(raw + 0.5)`. The +0.5 rounding was added to guard against float32 representation error. But if a band data value is exactly an integer (which they all are), the +0.5 would shift it if the float32 representation is already exact: `uint(6.0 + 0.5) = uint(6.5) = 6` (truncation toward zero). This is correct. But if the float32 value were `5.9999`, `uint(5.9999 + 0.5) = uint(6.4999) = 6` — also correct. The rounding should be safe, but it's a different code path than the reference's direct uint read.

**Not yet tested in isolation.**

### C. `by ≈ 0` linear fallback guard (diff #8)

When `ay ≈ 0` AND `by ≈ 0`, the curve is nearly a point (all three control points have similar Y for horizontal, or similar X for vertical). The reference divides by `by` without guarding — in HLSL this produces ±infinity, which the subsequent `clamp` maps to 0 or 1. Our version substitutes `1.0` for `by`, producing `t = p12.y * 0.5 / 1.0 = p12.y * 0.5` — a small value that becomes a small intersection coordinate, clamped to a fractional coverage.

The HLSL ±infinity path produces `clamp(±inf + 0.5, 0, 1) = 0 or 1` — a saturated binary result. Our guard produces a fractional result instead. This could cause a subtle coverage difference at degenerate nearly-point curves near sharp vertices.

**Not yet tested in isolation.**

### D. Intermediate variable storage (diff #9)

The reference computes `clamp(x1 * pixelsPerEm.x + 0.5, 0.0, 1.0)` in one expression. We split this: `x1 = x1 * pixelsPerEm.x;` then `clamp(x1 + 0.5, 0.0, 1.0)`. A GPU compiler might store the intermediate in a different precision register, or might flush denormals differently. For most values this is identical, but at extreme scale factors or very small intersection distances it could differ.

**Unlikely but not proven harmless.**

---

## What We've Tried (Complete List)

### Fix 1: Float32 round-trip in curveBounds() ✅ (kept)
Truncated curve coordinates to float32 before computing bounding boxes.
**Result**: Correct fix for precision matching but did not change artifacts.

### Fix 2: ±1 band extension ✅ (kept)
Extended band assignment by ±1 as safety margin.
**Result**: Correct fix for band boundaries but did not change artifacts.

### Fix 3: CalcRootCode convention ✅ (kept — was a real bug)
Changed from sign-bit extraction to reference's `y > 0.0` convention.
**Result**: Major improvement. Fixed severe horizontal streaks.

### Fix 4: Vertical solver polynomial ✅ (kept — was a real bug)
Changed vertical solver to use rotated polynomial (`+ 2*p2y` not `- 2*p2y`).
**Result**: Fixed vertical streak artifacts.

### Fix 5: Simple average coverage ❌ (reverted)
`(abs(xcov) + abs(ycov)) * 0.5`
**Result**: Semi-transparent interiors. Wrong for single-direction rays.

### Fix 6: Reference single-accumulator ❌ (reverted)
`sqrt(abs(coverage) * 0.5)` with single accumulator.
**Result**: Dim interiors (~0.7). The V's two contours produce opposite-sign winding on each axis, so they cancel in a single accumulator. Confirmed via CPU simulation and debug visualization.

### Fix 7: Weight-based CalcCoverage ✅ (kept, evolved)
Separate xcov/ycov with xwgt/ywgt proximity weights, `max(abs(xcov), abs(ycov))` interior fallback.
**Result**: Solid interiors. Thin artifacts at diagonal edges where weighted average overestimates.

### Fix 8: Similarity-based interior blend ✅ (current)
Enhanced interior fallback: when both axes have similar partial values, blend toward `ax + ay` (sum) instead of `max(ax, ay)`.
**Result**: Best result so far. Remaining thin lines at sharpest vertices.

### Fix 9: `fwidth` vs `abs(dFdx)` ⚠️ (tested, no change)
Changed `pixelsPerEm` to use `fwidth()` matching reference exactly.
**Result**: No visible change. Kept `fwidth()` to match reference.

### Fix 10: Raw debug visualization ℹ️ (diagnostic)
Output `abs(xcov + ycov) * 0.25` to see raw single-accumulator values.
**Result**: Confirmed dark patches exist in raw winding, not just in CalcCoverage. Also confirmed `xcov + ycov ≈ 0` inside V (opposite signs cancel).

---

## What We Haven't Tried

### Band-split optimization (HIGH priority)
The reference fires rays in both +X and -X from a split point. This is the "correct" fix — it prevents interior cancellation and would likely eliminate all remaining artifacts. Requires:
- Dual-sorted curve lists per band (ascending and descending)
- Band split point calculation during preprocessing
- 4-channel band texture (up from 2 channels)
- More complex fragment shader with inner/outer loop
- Significant preprocessing changes

### Square band grid (MEDIUM priority — easy test)
Match the reference's single-scale band grid instead of our rectangular grid. Quick to test — change band computation to use a single shared scale:
```typescript
const maxDim = Math.max(width, height);
const bandScale = bandCount / maxDim;
```
And pass a single scale to the shader instead of separate x/y scales.

### Remove `by ≈ 0` guard (LOW priority — quick test)
Test with the unguarded `p12.y * 0.5 / by` to see if GLSL ES handles ±inf the same as HLSL for this case. Would reveal whether our guard is changing results at degenerate curves.

### Native uint band texture (LOW priority)
Bypass PixiJS texture API and upload band data as `GL_RGBA32UI` with `usampler2D` in the shader. Would eliminate the float32 intermediary entirely.

### Negative-direction rays (MEDIUM priority)
Fire rays in both directions without full band-split. Simpler than band-split but doubles curve processing per pixel.

### Supersampling (LOW priority)
Multiple rays per pixel at offsets. Performance cost but guaranteed to smooth vertex artifacts.

---

## Architecture Notes for Resuming

### Current shader structure
- `CalcCoverage(xcov, ycov, xwgt, ywgt)` — our custom formula with similarity-based interior fallback
- Two separate loops (horizontal and vertical) with separate accumulators
- A `coverage` single-accumulator variable is also maintained (currently unused in output) for A/B testing with the reference formula
- Debug globals `slug_debug_xcov`/`slug_debug_ycov` can be visualized by uncommenting lines in `main()`
- Root eligibility uses reference convention: `(y > 0.0) ? 2u : 0u` with `& 3u`
- Vertical solver uses reference's rotated polynomial: `ax = p12.y + p12.w * 2.0 + p3.y`

### Current CalcCoverage formula
```glsl
similarity = 1.0 - abs(ax - ay) / max(ax + ay, eps);
interior = mix(max(ax, ay), min(ax + ay, 1.0), similarity²);
weighted = min(abs(xcov*xwgt + ycov*ywgt) / wsum, interior);
coverage = mix(interior, weighted, clamp(wsum, 0, 1));
```

### Why separate accumulators are necessary
The V glyph's two contours produce `xcov = +2` and `ycov = -2` at all interior pixels. A single accumulator gives `coverage = 0` (black interior). The reference avoids this with band-split. Our `max(abs(xcov), abs(ycov)) = max(2, 2) = 2` correctly identifies inside.

### Debug entry points
- `examples/v8/index.html` — CPU simulation of ray math for V glyph
- `frag.glsl main()` — debug visualization lines (commented out)
- `slug_debug_xcov/ycov` — raw per-axis winding values

---

## File References

| File | Role |
|------|------|
| [src/shared/shader/slug/frag.glsl](../src/shared/shader/slug/frag.glsl) | Fragment shader — CalcCoverage, ray loops, root eligibility |
| [src/shared/shader/slug/vert.glsl](../src/shared/shader/slug/vert.glsl) | Vertex shader — dilation, MVP, unpack |
| [src/shared/slug/glyph/bands.ts](../src/shared/slug/glyph/bands.ts) | Band assignment, curve sorting, float32 bounds |
| [src/shared/slug/glyph/curves.ts](../src/shared/slug/glyph/curves.ts) | Curve extraction, cubic→quadratic conversion |
| [src/shared/slug/glyph/quad.ts](../src/shared/slug/glyph/quad.ts) | Quad building, vertex attribute packing, Jacobian |
| [src/shared/slug/texture/pack.ts](../src/shared/slug/texture/pack.ts) | Curve + band texture packing |
| [src/v8/slug/text.ts](../src/v8/slug/text.ts) | PixiJS v8 integration, texture upload |
| [_references/Lengyel2017FontRendering-GlyphShader.glsl](../_references/Lengyel2017FontRendering-GlyphShader.glsl) | Original reference GLSL shader |
| [_docs/port_risks.md](port_risks.md) | Full risk analysis (21 risks) |
| [_docs/implementation.md](implementation.md) | Step-by-step algorithm guide from patent |
