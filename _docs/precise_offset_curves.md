# Precise Offsetting of Quadratic Bézier Curves — Summary

**Paper:** "Precise offsetting of quadratic Bezier curves"
**Author:** Fabian Yzerman (Blend2D)
**Published:** January 18, 2020 (Scientific article, Revision 1.1)
**Source:** `_references/precise_offset_curves.pdf` (16 pages)

## Overview

This paper develops an iterative algorithm for generating **approximate offset paths for planar quadratic Bézier curves** within a specified maximum deviation. The output is a spline of one or more quadratic Bézier curves that maintains **G¹ continuity** at all junctures. This is a focused companion to the author's broader thesis on Bézier curve simplification and offsetting, concentrating specifically on high-quality quadratic offset curves for use in stroking.

## Key Concepts

### The Offset Curve Problem
The offset curve of a quadratic Bézier `C(t)` at distance `δ` is:
```
C̃(t) = C(t) + δ·n(t)
```
where `n(t)` is the unit normal of the derivative. This **cannot be expressed as a polynomial Bézier of the same degree** — it must be approximated.

### Existing Approaches and Their Limitations

1. **AGG (Anti-Grain Geometry) method:** Recursively flattens the curve to a polyline, then offsets each point. Drawbacks:
   - Same number of line segments for inner and outer offsets (inner has too many, outer too few).
   - Quality degrades with larger offset widths.
   - Not optimal under affine transformations.

2. **Hain's circular approximation:** Computes iterative circular approximation for each side separately. Better quality control but:
   - Visible defects in certain cases.
   - Fails when cusps are present — not robust for arbitrary input.
   - Both methods produce polylines, losing curve shape information.

### Control Polygon Translation

The core offset approximation technique:

1. Given quadratic Bézier with control points P₀, P₁, P₂:
   - Compute unit normals at endpoints: `n₀ = n(0)`, `n₁ = n(1)`
   - Translate the two legs (P₁P₀ and P₂P₁) perpendicular to their tangents by distance δ
   - Offset control points: `P̃₀ = P₀ + δ·n₀`, `P̃₂ = P₂ + δ·n₁`
   - `P̃₁ = P₁ + 2δ·n̂/(n̂·n̂)` where `n̂ = n₀ + n₁`

2. The resulting offset curve `C̃(t)` has approximately G² continuity at endpoints (curvatures approximately match).

### Error Analysis — The Central Theorem

**Theorem:** For the distance function `d(t) = ‖C̃(t) - C(t)‖`:

**(i)** The maximum is always at `t_max = 1/2` and the two minima are at `t = 0` and `t = 1`. This holds for arbitrary offset distance and control points.

**(ii)** If the offset distance δ and the angle φ between the two control polygon legs are constant, then `d(t_max)` is also constant — **independent of curve scale** (the parameter `r` vanishes from the formula).

The maximum distance is:
```
d_max(φ) = δ/4 · (3 + cos(φ)) · sec(φ/2)
```

And the maximum relative error:
```
ε_max(φ) = 2·sin⁴(φ/4) / cos(φ/2)
```

**Key insight:** The offset approximation error depends **only on the bend angle φ** and offset distance δ, not on the size of the curve. This makes the error metric both simple and powerful.

### Angle-Based Curve Splitting

To keep the approximation error below a tolerance:

1. Compute the maximum allowable angle φ from the error formula (invertible).
2. Given the curve's derivative `C'(t) = at + b`, find the split parameter:
   ```
   tₛ = m·(bₓ² + b_y²) / (|aₓb_y - a_yb_x| - m·(aₓbₓ + a_yb_y))
   ```
   where `m = tan(φ)`.
3. Split at `tₛ`, offset the first piece, continue with the remainder.
4. Iterate until `tₛ ≥ 1` (remaining curve is within tolerance).

### Cusp Handling

When the local curvature radius falls below the offset distance, the inner offset curve develops cusps. The algorithm finds critical parameters by solving:
```
R(t) = δ  →  t₁,₂ = (-（aₓbₓ + a_yb_y) ± √(discriminant)) / (aₓ² + a_y²)
```

The curve is split at `t₁` and `t₂` (if in (0,1)) **before** the angle-based splitting. This ensures cusps appear precisely at split boundaries rather than mid-segment, producing clean offset paths.

### Complete Algorithm

```
OffsetQuadraticCurve(c, δ, max_angle_m):
  1. Find cusp parameters t₁, t₂ where R(t) = δ
  2. Split at valid cusp parameters
  3. For each segment:
     loop:
       tₛ = parameter where angle condition m is met
       if 0 < tₛ < 1:
         Split at tₛ → cc₁, cc₂
         Translate cc₁'s control polygon by δ → add to output
         cc = cc₂ (continue with remainder)
       else:
         Translate cc's control polygon by δ → add to output
         break
```

### Quality Comparison Results

Tested against AGG and Hain's method with a quality target of 0.188 pixels at δ=1000 (φ=22.5°):

| Scenario | New (curves) | New+Flatten | AGG | Hain |
|----------|-------------|-------------|-----|------|
| Slightly curved | 3+3 verts | 7+7 | 10+10 | 7+7 |
| Bent (~90°) | 9+9 | 17+14 | 18+18 | 16+13 |
| Sharp turn (~180°) | 21+21 | 21+20 | 22+22 | **(8)+(5)** fails |

- **New (curves):** Fewest "control points" — retains curve form, defers flattening.
- **New+Flatten** and **Hain:** Similar vertex counts in normal cases.
- **AGG:** Consistently over-generates vertices.
- **Hain:** Fails on sharp turns with cusps — not robust.

### Performance Benchmarks

| Metric | New (curves only) | New+Flatten | AGG | Hain |
|--------|-------------------|-------------|-----|------|
| Slightly curved (20°) | **141 ns** | 605 ns | 657 ns | 632 ns |
| Bent (60°) | **271 ns** | 1040 ns | 956 ns | 987 ns |
| Sharp turn (100°) | **422 ns** | 1373 ns | 1133 ns | 1157 ns |

Key findings:
- **Curves-only output is 3–5× faster** than any flattened approach.
- Flattening dominates the total cost — offsetting itself is cheap.
- Performance scales with bend angle, **not with offset width**.
- For random curves at large scale (size=1000): New+Flatten matches Hain's performance.

## Relevance to pixi-slug SlugText

### Text Stroke (Outline) — VERY HIGH RELEVANCE

This is the **most directly implementable** reference for improving pixi-slug's text stroke rendering. Here's why:

1. **Operates on quadratic Béziers natively.** TrueType fonts (which pixi-slug supports) use quadratic Bézier curves. No intermediate conversion step is needed — the algorithm works directly on the glyph's native curve format.

2. **The control polygon translation formula is trivial to implement:**
   ```typescript
   // For each quadratic curve in the glyph:
   const n0 = unitNormal(P1.x - P0.x, P1.y - P0.y);
   const n1 = unitNormal(P2.x - P1.x, P2.y - P1.y);
   const nSum = { x: n0.x + n1.x, y: n0.y + n1.y };
   const dot = nSum.x * nSum.x + nSum.y * nSum.y;

   const Q0 = { x: P0.x + δ * n0.x, y: P0.y + δ * n0.y };
   const Q2 = { x: P2.x + δ * n1.x, y: P2.y + δ * n1.y };
   const Q1 = { x: P1.x + 2*δ * nSum.x / dot, y: P1.y + 2*δ * nSum.y / dot };
   ```

3. **The angle-based error formula provides a decision boundary.** Given a stroke width and the maximum bend angle in a glyph's curves, pixi-slug can determine whether the simple quad-expansion approach is sufficient or whether true offset curves are needed:
   - `ε_max(φ) < threshold` → quad expansion is fine
   - `ε_max(φ) ≥ threshold` → compute proper offset curves

4. **Offset curves could be precomputed at font load time.** Since the offset curve of a quadratic Bézier is another spline of quadratic Béziers, the offset curves can be stored alongside the original glyph curves and rendered through the existing Slug shader pipeline. This would make strokes:
   - Resolution-independent (curves, not polylines)
   - Transformation-independent (offset in em-space, transforms apply cleanly)
   - GPU-efficient (same rendering path as fill)

5. **Cusp detection directly addresses known artifact locations.** The cusp parameter formula identifies exactly where stroke rendering will produce artifacts — these correspond to the sharp-angle artifact locations documented in `_docs/artifact_investigation.md` (V apex, X crossing, R leg junction).

### Comparison with Current Stroke Approach

| Aspect | Current (quad expansion) | Paper's approach |
|--------|------------------------|------------------|
| Implementation | Expand glyph quad by strokeWidth, re-render | Precompute offset curves, render as separate glyph |
| Correctness | Approximate — winding test at wider area | Geometrically precise offset curves |
| Thick strokes | Breaks down at high curvature | Handles via cusp splitting |
| CPU cost | None (purely GPU) | One-time preprocessing per font/stroke-width |
| GPU cost | One extra Slug render pass | One extra Slug render pass (same) |
| Curve data | Reuses original glyph curves | Additional offset curve data per stroke width |
| Memory | No extra | ~2× curve texture data per stroke width |

### Text Fill — LOW RELEVANCE

Fill rendering uses the Slug winding-number algorithm on the original glyph curves. No offsetting is involved.

### Drop Shadow — NO RELEVANCE

Drop shadows are purely a rendering-order effect with no curve geometry manipulation.

### Practical Implementation Path for pixi-slug

If upgrading stroke rendering:

1. **Phase 1 — Error assessment:** Implement the angle-based error formula to measure how far the current quad-expansion strokes deviate from true offset curves at various stroke widths. This determines whether the upgrade is worth pursuing.

2. **Phase 2 — CPU offset computation:** At font load time (or lazily per stroke width), compute offset curves for each glyph using the control polygon translation + angle splitting + cusp handling algorithm. Store alongside original curve data.

3. **Phase 3 — GPU rendering:** Feed offset curves into the existing Slug shader as a separate "stroke glyph" — same rendering path, different curve data. The Slug winding-number test works on any set of quadratic Bézier curves, regardless of whether they're original glyph outlines or computed offset curves.

This approach is incrementally adoptable — Phase 1 alone provides valuable diagnostic information, and the existing quad-expansion method remains as a fast fallback.
