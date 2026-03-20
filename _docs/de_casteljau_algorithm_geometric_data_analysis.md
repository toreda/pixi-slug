# De Casteljau's Algorithm in Geometric Data Analysis — Hanik, Nava-Yazdani, von Tycowicz

**Source**: [de-casteljaus-2402.07550v1.pdf](../_references/de-casteljaus-2402.07550v1.pdf)
**Authors**: Martin Hanik (Freie Universität Berlin), Esfandiar Nava-Yazdani & Christoph von Tycowicz (Zuse Institute Berlin)
**Published**: arXiv:2402.07550v1, February 12, 2024
**Type**: Survey/review paper (35 pages, 100+ references)

## Purpose

Comprehensive survey of de Casteljau's algorithm generalized from flat Euclidean space to curved Riemannian manifolds, and its applications in geometric data analysis (regression, hierarchical modeling, shape analysis). This is a theoretical mathematics paper, not a GPU/shader implementation paper.

## Core Algorithm

### Classical De Casteljau's Algorithm (Euclidean)

Given `k+1` control points `p₀, ..., pₖ ∈ ℝᵈ`, the Bézier curve value at parameter `t ∈ [0,1]` is computed iteratively:

```
β⁰ᵢ(t) := pᵢ                                          (base case)
βʳᵢ(t) := (1-t)·βʳ⁻¹ᵢ(t) + t·βʳ⁻¹ᵢ₊₁(t)              (recursive step)
    r = 1,...,k    i = 0,...,k-r
```

The result `β⁰ₖ(t)` equals the Bernstein-basis expansion:

```
γ(t) = Σⱼ₌₀ᵏ pⱼ · bⱼᵏ(t)    where    bⱼᵏ(t) = C(k,j)·(1-t)ᵏ⁻ʲ·tʲ
```

**Key insight**: Each recursive step is a linear interpolation ("follow a straight line") from `βʳ⁻¹ᵢ` to `βʳ⁻¹ᵢ₊₁` for time `t`. Since straight lines are geodesics in Euclidean space, the algorithm generalizes to any space where geodesics can be computed.

### Generalized Algorithm (Riemannian Manifolds)

Replace linear interpolation with geodesic interpolation:

```
β⁰ᵢ(t) := pᵢ
βʳᵢ(t) := γ(t; βʳ⁻¹ᵢ(t), βʳ⁻¹ᵢ₊₁(t))
```

where `γ(t; p, q)` is the unique length-minimizing geodesic from `p` to `q` in a normal convex neighborhood `U ⊂ M`.

### Properties of Generalized Bézier Curves (Theorem 1)

For a degree-`k` curve `γ` with control points `p₀, ..., pₖ`:

1. **Endpoint interpolation**: `γ(0) = p₀` and `γ(1) = pₖ`
2. **Tangent at endpoints**: `γ'(0) = k·log_{p₀}(p₁)` and `γ'(1) = -k·log_{pₖ}(pₖ₋₁)`
3. **Second derivative**: Depends on first 3 (or last 3) control points
4. **Control point recovery**: `p₁` and `pₖ₋₁` can be recovered from endpoint derivatives

These properties enable construction of **C¹ and C² Bézier splines** on manifolds via geometric conditions on control points — no global coordinate system needed.

## Bézier Splines on Manifolds

### C¹ Spline Construction

`L` cubic Bézier segments joined with continuity conditions:

```
p⁽ⁱ⁾_kᵢ = p⁽ⁱ⁺¹⁾₀                   (position continuity)
γ(κ; p⁽ⁱ⁾_{kᵢ-1}, p⁽ⁱ⁺¹⁾₁) = p⁽ⁱ⁾_kᵢ  (tangent continuity, κ = kᵢ/(kᵢ+kᵢ₊₁))
```

**Independent control points** for a non-closed spline with segments of degrees `k₀,...,k_{L-1}`:

```
K = k₀ + k₁ + ... + k_{L-1} - L + 1
```

Closed splines have `K̃ = K - 2` independent control points.

## Bézierfolds: Manifolds of Bézier Splines

A central theoretical contribution: the **set of all Bézier splines** of a given type over a convex neighborhood forms a finite-dimensional smooth manifold.

**Theorem 2**: For degrees `k ∈ {0,1,2,3,4,5}`, the Bézierfold `B¹ₖ(U)` is a `(k+1)d`-dimensional manifold (where `d = dim(M)`). Conjectured to hold for all `k ≥ 6`.

### Riemannian Metrics on Bézierfolds

Two metrics are defined for measuring distances between splines:

1. **Integral-based metric**: `⟨X,Y⟩_B = ∫₀ᴸ ⟨X(t),Y(t)⟩_{B(t)} dt` — general, works for any spline type
2. **Sasakian metric** (cubic splines only): Pullback of Sasaki metric on `(TM)^{L+1}`, making the Bézierfold isometric to a product of tangent bundles — computationally advantageous since all operations reduce to tangent bundle operations

## Statistical Applications

### Regression on Manifolds (Section 4)

Generalization of polynomial regression to curved spaces:

```
Q(t) = exp_{B(t; p₀,...,pₖ)} ε(t)
```

where `B` is a Bézier spline (the "trend"), `ε` is manifold-valued noise, and `exp` is the Riemannian exponential map. Reduces to ordinary polynomial regression in Euclidean space and to geodesic regression for 2 control points.

**Least-squares estimation**: Minimize sum-of-squared geodesic distances via Riemannian gradient descent. In symmetric spaces, this coincides with maximum likelihood under a generalized Gaussian distribution (Theorem 3).

### Normalization via Regression (Section 4.4)

Remove confounding variable effects from manifold-valued data:
1. Regress each group's data to get trend splines `B⁽ˢ⁾`
2. Compute residuals as logarithmic maps: `R̃ⱼ = log_{B⁽ˢ⁾(tⱼ)} qⱼ`
3. Parallel-translate residuals along the spline to a reference parameter `t₀`
4. Map back to manifold via exponential map

### Hierarchical / Mixed-Effects Models (Section 5)

Two-level model for longitudinal data:
- **Individual level**: Each subject's data follows its own Bézier spline regression
- **Group level**: Individual splines are perturbations of a common mean spline in the Bézierfold

Parameter estimation is a two-step process: (1) regress individual trends in parallel, (2) compute Fréchet mean in the Bézierfold.

## Real-World Applications (Section 6)

| Application | Domain | Spline Type | Key Result |
|---|---|---|---|
| Mitral valve motion | Medicine | Closed cubic, 2 segments | Captures cyclic cardiac motion including prolapsing leaflet |
| Knee bone remodeling (OA) | Medicine | Cubic curve | Non-geodesic regression reveals accelerated bone changes in late-stage OA |
| OA trajectory classification | Medicine | Cubic, hierarchical | 64% accuracy (vs 59% Euclidean), SVM on PGA descriptors |
| Ancient sundial shapes | Archaeology | Geodesic regression | Latitude-dependent bending detected; unknown site localized to ~80km |
| Hurricane tracks | Meteorology | Cubic, 2-segment splines | 61% intensity classification accuracy (vs ~49% state-of-art) |

## Numerical Stability

The paper notes that Bézier curves exhibit "excellent numerical stability" (citing Farouki & Rajan, 1987), which is one reason they were adopted over other polynomial representations. The de Casteljau algorithm evaluates via nested linear interpolations, avoiding direct polynomial evaluation and its associated cancellation errors.

## Historical Context

- **1912**: Bernstein polynomials introduced (pure theory)
- **~1959**: Paul de Casteljau develops the algorithm at Citroën (kept secret)
- **~1962**: Pierre Bézier independently develops curves at Renault (published first)
- **~1995**: First generalization to Riemannian manifolds (Park & Ravani)
- **2024**: This survey — the algorithm now underpins geometric data science

## Relevance to pixi-slug

### Direct Relevance: Low

This paper operates in a fundamentally different domain — Riemannian geometry and statistical modeling on curved manifolds — not GPU rendering.

### Indirect Value

| Concept | Connection to Slug |
|---|---|
| **De Casteljau recursion** | The `mix()`-based Bézier evaluation in GLSL is exactly the Euclidean de Casteljau algorithm. Slug evaluates quadratic Bézier curves (k=2) per pixel in the fragment shader using this same recursive interpolation. |
| **Numerical stability** | The paper confirms that de Casteljau evaluation (nested `mix()`) is numerically superior to direct Bernstein polynomial evaluation — relevant to float32 precision concerns in Slug's fragment shader. |
| **Spline continuity conditions** | The C¹ conditions for joining Bézier segments mirror the constraints TrueType fonts impose at glyph contour joints — ensuring smooth curves at shared control points. |
| **Quadratic case (k=2)** | TrueType uses quadratic Bézier curves exclusively. In de Casteljau form: `β(t) = γ(t; γ(t; p₀, p₁), γ(t; p₁, p₂))` — one level of recursion, two `mix()` calls, matching Slug's curve evaluation. |

### Key Takeaway

The de Casteljau algorithm that Slug uses for per-pixel curve evaluation in the fragment shader is mathematically the same algorithm this paper generalizes to curved spaces. The paper provides deep theoretical grounding for *why* this algorithm is numerically stable and geometrically well-behaved — properties that directly benefit Slug's float32 GPU implementation. However, the manifold generalization and statistical machinery are not applicable to glyph rendering.
