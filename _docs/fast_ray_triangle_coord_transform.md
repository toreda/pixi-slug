# Fast Ray-Triangle Intersections by Coordinate Transformation — Baldwin & Weber

**Source**: [fast-ray-triangle-intersections-by-coord-transform.pdf](../_references/fast-ray-triangle-intersections-by-coord-transform.pdf)
**Authors**: Doug Baldwin, Michael Weber (SUNY Geneseo)
**Published**: Journal of Computer Graphics Techniques (JCGT), Vol. 5, No. 3, 2016
**License**: CC BY-ND 3.0
**Supplemental**: C++ implementations (12-coeff and 9-coeff), PBRT2 integration, raw timing data

## Purpose

Precompute a per-triangle **global-to-barycentric coordinate transformation matrix** so that ray-triangle intersection at runtime reduces to a matrix-vector multiply followed by trivial range checks. Trades memory for speed — a different point on the time-space spectrum than Möller-Trumbore (zero precomputation) or Woop et al. (per-ray precomputation).

## Core Algorithm

### Precomputation (Per Triangle)

Any triangle `v1, v2, v3` can be constructed from a canonical unit right triangle `(0,0), (1,0), (0,1)` via a 4×4 matrix `T`. The **inverse** of `T` transforms global coordinates into barycentric space. The key trick: `T` contains a "free vector" column `(a, b, c)` that doesn't affect the forward transform but **does** affect the inverse.

**Free vector selection**: Choose the unit vector aligned with the largest-magnitude component of the triangle normal `n = E1 × E2`:
- `|nx|` largest → free vector = `(1, 0, 0)`
- `|ny|` largest → free vector = `(0, 1, 0)`
- `|nz|` largest → free vector = `(0, 0, 1)`

This ensures numerical stability (dividing by the largest component of `n`) and guarantees one column of the inverse matrix is `(0, 0, 1, 0)ᵀ` — a known pattern that doesn't need storage.

### Runtime (Per Ray-Triangle Test)

1. **Transform the ray** into barycentric space using the stored matrix
2. **Compute t**: `t = -oz / dz` (transformed origin / direction)
3. **Compute barycentrics**: `b1 = ox + t·dx`, `b2 = oy + t·dy`
4. **Test**: `0 ≤ b1 ≤ 1` and `0 ≤ b2 ≤ 1` and `b1 + b2 ≤ 1`

Early exits: reject if `t` is out of valid range, or if `b1` is out of range before computing `b2`.

### Storage

| Variant | Per-Triangle Storage | Description |
|---------|---------------------|-------------|
| Pre(12) | 48 bytes | Store top 3 rows of 4×4 matrix (12 floats) |
| Pre(9) | 37 bytes | Store only the 9 unknown coefficients + 1-byte column selector |
| Embree (for comparison) | 48 bytes | 1 vertex + 2 edges + normal |
| Möller-Trumbore | 0 bytes | No precomputation |

## Performance

### Standalone Benchmarks (10M ray-triangle pairs)

| Hit Rate | Pre(12) vs M&T | Pre(12) vs Embree | Pre(9) vs M&T | Pre(9) vs Embree |
|----------|----------------|-------------------|---------------|-----------------|
| 10% | 38% | 48% | 56% | 71% |
| 50% | 35% | 57% | 51% | 84% |
| 90% | 42% | 95% | 62% | 139% |

Pre(12) is **2-3× faster** than Möller-Trumbore across all hit rates. It beats Embree at low/medium hit rates but converges at 90% hit rate. Pre(9) is slower than Pre(12) but still beats M&T; it loses to Embree at high hit rates.

**Note**: Embree's SIMD parallelism was disabled for fair single-ray comparison. With SIMD, Embree would likely be faster.

### In PBRT2 (Complete Ray Tracer)

| Scene | Triangles | Speedup vs Unmodified |
|-------|-----------|----------------------|
| Teapots | 6,804 | 5.7-5.8% |
| Mesh Buddha | 29,892 | 4.1-4.3% |
| San Miguel | 2,503,052 | 3.9-4.0% |
| Plants | 1,171,562 | 2.7-3.1% |
| Buddha | 1,087,720 | 2.0% |
| Villa | 2,624,966 | 1.6% |
| Killeroo | 66,532 | 1.1-1.5% |
| Bunny | 69,453 | 1.2-1.5% |

Consistent 1-6% speedup in real rendering. Interestingly, Pre(9) slightly outperforms Pre(12) in the full ray tracer (opposite of standalone) — likely due to cache pressure from the larger per-triangle storage.

### Image Quality

Visually equivalent. 4 of 8 scenes were pixel-identical. The other 4 showed imperceptible differences (texture variation, noise speckle positions) due to different floating-point rounding paths.

## Comparison with Woop et al.

| Aspect | Baldwin & Weber | Woop et al. (2013) |
|--------|----------------|-------------------|
| Precomputation | Per-triangle matrix | Per-ray shear constants |
| Transform target | Ray → barycentric space | Triangle → ray-aligned space |
| Watertightness | Not guaranteed (`b1+b2 ≤ 1` shortcut) | Guaranteed (independent edge tests) |
| Storage | 37-48 bytes/triangle | 0 bytes/triangle |
| Best for | Static scenes, low hit rates | Any scene, robustness-critical |

Baldwin & Weber's `b1 + b2 ≤ 1` test is exactly the shortcut Woop et al. identified as the root cause of cracks. This algorithm is faster but **not watertight**.

## Relevance to pixi-slug

### Direct Relevance: Low

This is a 3D ray-triangle algorithm for CPU ray tracing. Slug does 2D ray-curve intersection on GPU.

### Applicable Concepts

| Concept | Connection to Slug |
|---------|-------------------|
| **Precomputed per-primitive transforms** | Slug's curve texture stores control points pre-packed in RGBA16F — a form of precomputation that eliminates runtime setup. The band texture precomputes spatial indexing. Same philosophy: invest memory at load time to save work per pixel. |
| **Free vector trick** | Exploiting algebraic degrees of freedom to minimize storage is analogous to Slug's packed vertex attributes — using `floatBitsToUint` to encode glyph metadata in otherwise-unused float slots. |
| **Cache pressure in full systems** | Pre(9) beating Pre(12) in PBRT despite being slower in isolation demonstrates that per-primitive memory matters in cache-bound systems. Directly relevant to Slug's texture size decisions — smaller curve/band textures mean better cache utilization in the fragment shader's inner loops. |
| **Early exit on partial results** | Computing `b1` first and exiting before `b2` mirrors Slug's early-exit `break` when `max(x-coords) * pixelsPerEm < -0.5`. |

### Key Takeaway

This paper quantifies the **memory-vs-speed tradeoff** for per-primitive precomputation. The standalone results (2-3× faster) are compelling, but the PBRT results (1-6%) show that cache effects compress the gains in real systems. For GPU workloads like Slug, where texture cache is the bottleneck, the lesson is clear: compact data representation (8 bytes/curve in RGBA16F) is the right choice over storing precomputed transformation matrices per curve.
