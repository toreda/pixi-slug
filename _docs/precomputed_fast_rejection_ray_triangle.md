# Precomputed Fast Rejection Ray-Triangle Intersection — Pichler et al.

**Source**: [precomputed-fast-rejection-ray-triangle-intersection-1-s2.0-S2666629422000031-main.pdf](../_references/precomputed-fast-rejection-ray-triangle-intersection-1-s2.0-S2666629422000031-main.pdf)
**Authors**: Thomas Alois Pichler, Andrej Ferko, Michal Ferko, Peter Kán, Hannes Kaufmann (TU Wien / Comenius University Bratislava)
**Published**: Graphics and Visual Computing 6 (2022), Elsevier — CC BY 4.0
**Context**: CPU-based ray tracing (PBRT3), with additional CPU/GPU synthetic benchmarks

## Purpose

Proposes a ray-triangle intersection algorithm that **precomputes per-triangle transformation matrices** during preprocessing, then uses them at runtime to transform the ray-plane intersection point into 2D for fast rejection tests. Two approaches are studied: a **unit triangle method (UTM)** and a **similarity-preserving pruning method**.

## Core Algorithm

### Overall Pipeline (4 steps)

1. **Bounding sphere test** — reject if ray misses the triangle's bounding sphere
2. **Ray-plane intersection** — compute point `P` where ray hits the triangle's plane
3. **AABB test** — reject if `P` falls outside the triangle's axis-aligned bounding box
4. **2D transformation + rejection** — apply a precomputed matrix to `P`, then test in 2D

### Approach 1: Unit Triangle Method (UTM)

**Precompute**: A 4×4 matrix that maps the 3D triangle `ABC` to the 2D unit triangle `(0,0), (1,0), (0,1)`.

**Runtime**: Transform the ray-plane intersection point `P` with this matrix. The point is inside the triangle if and only if:

```
xP ≥ 0,  yP ≥ 0,  xP + yP ≤ 1
```

The matrix construction follows Baldwin & Weber (2016), exploiting a "free vector" column (all zeros plus a single 1) chosen based on the highest-magnitude component of the triangle normal — this minimizes operations and avoids numerical instability.

**Optimization**: Transform only the x-component first; if it's out of range, skip the y-component entirely.

### Approach 2: Similarity-Preserving Pruning

**Precompute**: A transformation matrix (SPTM) that maps the triangle into 2D while preserving similarity — longest edge maps to `(0,0)→(1,0)`, third vertex lands in the first quadrant.

**Runtime**: Instead of a direct containment test, **prune surrounding areas** by checking whether the transformed point falls in one of 3 (or 4) rejection regions:

| Region | Test | Operations |
|--------|------|------------|
| Below | `Qy < 0` | 1 comparison |
| Above (4-fold only) | `Qy > Cy'` | 1 comparison |
| Left | `-Qx·Cy' + Qy·Cx' > 0` | 5 ops |
| Right | `Cy'·(Qx-1) + Qy·(1-Cx') > 0` | 6 ops |

**Key advantage**: Uses Plücker-based signed-area edge tests (same as Woop et al.), producing **watertight results** — no gaps between adjacent triangles.

**Probability optimization**: Precompute hit-probabilities for each rejection region (assuming uniform distribution within bounding circle), then reorder tests so the most likely rejection is checked first. Reduces pruning tests by ~15-20%.

### Hybrid Algorithm

Uses pruning (watertight) when barycentric coordinates are not needed, falls back to UTM when they are.

## Performance Results

### In PBRT3 (CPU ray tracing, realistic scenes)

| Algorithm | vs. Woop et al. (PBRT3 default) |
|-----------|----------------------------------|
| Baldwin & Weber | 94–98% of default time (faster) |
| UTM (this paper) | 96–98% of default time (faster) |
| Hybrid (UTM + pruning) | 95–98% of default time (faster) |
| Möller-Trumbore | baseline (PBRT2 default, slower than Woop) |

All proposed methods beat PBRT3's default. UTM is comparable to Baldwin & Weber, sometimes marginally faster/slower depending on scene hit-rate.

### Synthetic CPU tests (outside PBRT)

UTM achieves **~29-37% speedup** over Möller-Trumbore on CPU for randomly generated ray-triangle pairs (10M tests).

### GPU results (CUDA)

**UTM does not outperform Möller-Trumbore on GPU.** The precomputed per-triangle storage increases register pressure and memory bandwidth, negating the computational savings. Branch-less Möller-Trumbore (8.25ms) beats branch-less UTM without bounding tests (12.36ms) on synthetic data.

## Key Findings

1. **Precomputation pays off on CPU** — storing a per-triangle transformation matrix trades memory for speed, yielding 3-6% faster rendering in PBRT3 and up to 37% on synthetic benchmarks.
2. **Pruning provides watertightness** — the signed-area edge tests guarantee no cracks between adjacent triangles, unlike algorithms that test the third edge via `u+v`.
3. **Probability-based reordering helps** — precomputing per-triangle rejection probabilities and reordering tests reduces pruning steps by ~15-20%.
4. **GPU performance is worse** — the extra memory per triangle causes register spilling on GPU, making the approach counterproductive for GPU workloads.
5. **Precision**: 99.999995% agreement with Möller-Trumbore. The ~1 in 20M mismatches occur at triangle edges due to different floating-point rounding paths.

## Relevance to pixi-slug

### Direct Relevance: Low-Moderate

This paper addresses **ray-triangle intersection** for 3D mesh rendering, while Slug performs **ray-curve intersection** for 2D glyph rendering. However, several concepts transfer.

### Applicable Concepts

| Concept | Connection to Slug |
|---------|-------------------|
| **Precomputed 2D transformation** | Slug's band texture + curve texture is conceptually similar — precompute per-glyph spatial data (band assignments, curve control points) so the fragment shader only does fast 2D lookups. |
| **Early rejection / fast exit** | Slug uses the magic number `0x2E74` lookup and band culling for early rejection — same philosophy as this paper's cascading rejection tests. The `break` on `max(p12.x, p12.z, p3.x) * pixelsPerEm.x < -0.5` in `frag.glsl` is an early-exit analogous to the AABB test. |
| **Watertightness via signed-area tests** | Slug's winding number approach is inherently watertight for filled regions (no gaps between adjacent curve contributions). The signed-area edge tests used in pruning are related to the sign-based root eligibility checks Slug uses. |
| **GPU register pressure** | The paper's finding that extra per-primitive storage hurts GPU performance is directly relevant — Slug must minimize per-curve data to avoid the same register spilling. The compact RGBA16F curve texture (8 bytes/curve) and RGBA16U band texture are designed with this constraint in mind. |
| **Cascading rejection order** | The probability-weighted test reordering concept could theoretically apply to Slug's band iteration order, though the current sorted-with-early-out approach already achieves a similar effect. |

### Key Takeaway

The paper validates two principles Slug already follows: (1) precompute spatial structures to minimize per-pixel work, and (2) cascade cheap rejection tests before expensive computation. Its GPU findings reinforce why Slug's compact texture-based data layout matters — naive precomputation that increases per-fragment memory access will lose on GPU even if it wins on CPU.
