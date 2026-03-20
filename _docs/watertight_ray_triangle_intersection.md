# Watertight Ray/Triangle Intersection — Woop, Benthin, Wald

**Source**: [watertight-ray-triangle-intersection.pdf](../_references/watertight-ray-triangle-intersection.pdf)
**Authors**: Sven Woop, Carsten Benthin, Ingo Wald (Intel Labs)
**Published**: Journal of Computer Graphics Techniques (JCGT), Vol. 2, No. 1, 2013
**License**: CC BY-ND 3.0
**Impact**: Became the default ray-triangle intersection algorithm in PBRT3.

## Problem

Standard ray-triangle intersection algorithms (Möller-Trumbore, Plücker coordinates) leave microscopic **cracks between adjacent triangles** due to floating-point rounding errors. When a ray passes through a crack, it incorrectly enters/exits a closed object, corrupting radiance calculations and producing pixel errors. The problem worsens with:

- Small triangles far from the origin (large coordinates, small edges)
- Needle-shaped triangles (mixing very large and very small values)
- Higher tessellation rates (ever-smaller triangles)

Simply increasing to 64-bit precision does not solve the underlying problem — it only reduces the probability.

## Core Algorithm

### Stage 1: Ray-Dependent Affine Transform (Precomputed Per-Ray)

Transform the coordinate system so the ray becomes the unit ray from origin along +z. This uses **translation + shear + scale** (not rotation — shear introduces smaller rounding errors):

1. **Dimension selection**: Choose `kz` as the dimension where `|dir|` is maximal; set `kx`, `ky` as the other two. If `dir[kz] < 0`, swap `kx` and `ky` to preserve triangle winding.

2. **Shear constants** (precomputed once per ray):
   ```
   Sx = dir[kx] / dir[kz]
   Sy = dir[ky] / dir[kz]
   Sz = 1.0 / dir[kz]
   ```

3. **Transform triangle vertices** (per intersection):
   ```
   A' = M · (A - P)    // translate relative to ray origin, then shear+scale
   ```
   After this, the x and y components are ready for 2D edge tests; z encodes hit distance.

### Stage 2: 2D Edge Tests

With the ray simplified to the unit ray, the scaled barycentric coordinates reduce to 2D cross products:

```
U = C'x · B'y - C'y · B'x
V = A'x · C'y - A'y · C'x
W = B'x · A'y - B'y · A'x
```

**Rejection**: If `U < 0 || V < 0 || W < 0` → miss (with backface culling).
**Determinant**: `det = U + V + W`. If `det = 0` → coplanar/degenerate → miss.
**Hit distance**: `T = U·A'z + V·B'z + W·C'z`, then `t = T/det`.

### Why This Is Watertight

The key insight relies on an IEEE 754 guarantee: **rounding preserves ordering**.

For the edge test `W = B'x · A'y - B'y · A'x`:
- If the true (infinite-precision) value `B'x·A'y ≥ B'y·A'x`, then after rounding: `round(B'x·A'y) ≥ round(B'y·A'x)`.
- A ray truly inside the triangle will always be classified as inside after rounding.
- When both products round to the same value (edge test = 0), the algorithm **conservatively treats it as a hit**.

This means: if a ray hits the mathematical edge between two triangles, **at least one** of them will report a hit. No cracks.

### Double-Precision Fallback

When any edge test evaluates to exactly 0.0 in single precision, the algorithm falls back to double precision for that test only. Since `double` has 53 bits of mantissa (> 2 × 24 bits of `float`), it can exactly represent the product of two single-precision values. This resolves all ambiguous cases.

**Frequency**: ~1 in every million ray-triangle intersections. Negligible performance impact.

### Conservative BVH Traversal

The shear transform introduces rounding errors that can shift the effective triangle slightly outside its world-space bounding box. To compensate, the algorithm enlarges BVH bounds by a ray-dependent epsilon:

```
Δxmin = 5ε · (|Kxmin - Px| + max(|Kzmin - Pz|, |Kzmax - Pz|))
```

where `ε = 2⁻²⁴`. This is precomputed per ray and folded into modified ray origins, so the inner traversal loop has **no extra overhead**.

## Performance

| Algorithm | Fairy Forest | Conference | Dragon | Power Plant |
|-----------|-------------|------------|--------|-------------|
| Möller-Trumbore | 100% | 100% | 100% | 100% |
| Davidovic et al. | 93% | 92% | 96% | 85% |
| Dammertz & Keller | 38% | 30% | 64% | 8% |
| **This paper** (intersection only) | 96% | 99% | 99% | 100% |
| **This paper** (+ conservative traversal) | 87% | 88% | 90% | 92% |

Performance in Mrays/sec on dual Xeon E5-2690 (16 HT cores, 2.9 GHz).

The intersection test alone matches Möller-Trumbore. The conservative traversal adds ~10-12% overhead (modified ray origins, slight register pressure, ~1% extra traversal steps).

## False Negative Counts (100M rays, interior of sphere)

| Algorithm | Normal Sphere (40K tri) | Shifted Sphere (40K tri) | Normal Sphere (4M tri) | Shifted Sphere (4M tri) |
|-----------|------------------------|-------------------------|----------------------|------------------------|
| Möller-Trumbore | 41 | 21 | 327 | 339 |
| Plücker coordinates | 0 | 77M | 0 | 85M |
| Davidovic et al. | 0 | 148 | 0 | 11,778 |
| Dammertz & Keller | 0 | 0 | 0 | 0 |
| **This paper** | 0 | 0 | 0 | 0 |

Plücker coordinates are catastrophically unstable for shifted geometry. Möller-Trumbore fails ~3 per million (mostly from the `u+v ≤ 1` shortcut). This algorithm: zero false negatives.

## Key Design Decisions

1. **Shear instead of rotation**: Fewer operations, smaller rounding errors, more numerically stable.
2. **Per-ray transform, not per-triangle**: The shear constants are computed once per ray and reused across all triangles — amortizing cost.
3. **Edge test = 0 treated as hit**: The conservative choice that guarantees watertightness. Combined with rare double-precision fallback, false positives are negligible.
4. **No epsilon tuning**: Unlike ad-hoc approaches that test edges against a small positive epsilon (causing self-shadowing artifacts), this algorithm's conservativeness is mathematically bounded.
5. **`u+v ≤ 1` shortcut rejected**: The paper explicitly identifies this common optimization as the root cause of most Möller-Trumbore failures. All three edges must be tested independently for watertightness.

## Relevance to pixi-slug

### Direct Relevance: Moderate

Slug casts rays (horizontal and vertical) through 2D quadratic Bézier curves, not 3D triangles. But the floating-point robustness principles transfer directly.

### Applicable Concepts

| Concept | Connection to Slug |
|---------|-------------------|
| **Sign-based tests over epsilon comparisons** | Slug's `0x2E74` magic-number lookup uses sign bits (`p.y > 0.0`) — never epsilon — to classify root eligibility. This is exactly the same philosophy: sign tests are robust under IEEE 754 rounding, epsilon comparisons are not. |
| **Transform-to-simplify** | Woop transforms the problem so the ray is trivial (origin along +z). Slug transforms curves relative to the pixel (`p12 - renderCoord`) so the ray origin is at the pixel center. Same principle: move complexity into the coordinate transform to simplify the per-test math. |
| **Conservative treatment of boundary cases** | Woop: edge test = 0 → hit. Slug: uses `clamp(x + 0.5, 0, 1)` for coverage, which smoothly handles boundary pixels rather than making a hard in/out decision. Both avoid cracks/artifacts at boundaries. |
| **Avoiding the "third edge shortcut"** | The paper shows `u+v ≤ 1` causes cracks because the shared edge is computed differently in neighboring triangles. Slug avoids analogous shortcuts by using the full equivalence-class lookup table for root eligibility rather than simplified range checks. |
| **Double-precision fallback for ambiguous cases** | Slug uses `kQuadraticEpsilon` (0.0001) to detect near-degenerate quadratics and falls back to the linear case. Same pattern: fast path for common cases, guarded fallback for numerically ambiguous ones. |
| **Per-ray precomputation** | Woop precomputes shear constants per ray. Slug precomputes `pixelsPerEm` per pixel (via `fwidth()`). Both amortize setup cost to simplify the inner loop. |

### Key Takeaway

This paper is the definitive reference for why **sign-based classification** beats **epsilon-based comparison** in floating-point geometry. Slug already follows this principle via the `0x2E74` lookup — the winding number test never compares a floating-point value against an epsilon to decide root eligibility. The paper provides the formal IEEE 754 proof for why this works: rounding preserves sign ordering, so sign-based decisions are watertight by construction.
