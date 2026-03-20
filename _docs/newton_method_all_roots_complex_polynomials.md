# How to Find All Roots of Complex Polynomials by Newton's Method — Hubbard, Schleicher, Sutherland

**Source**: [how-to-find-all-roots-of-complex-polynomials-by-newtons-method.pdf](../_references/how-to-find-all-roots-of-complex-polynomials-by-newtons-method.pdf)
**Authors**: John Hubbard (Cornell), Dierk Schleicher (International University Bremen), Scott Sutherland (Stony Brook)
**Published**: Inventiones mathematicae (2001), ~27 pages
**Domain**: Complex dynamics, holomorphic iteration, computational algebra

## Purpose

Construct a **universal finite set of starting points** for Newton's method such that, for *every* normalized polynomial of degree `d` and *each* of its roots, at least one starting point converges to that root. This solves the problem of finding **all** roots without deflation (which is numerically unstable for high-degree polynomials).

## Main Theorem

> For every degree `d ≥ 2`, there exists a set `S_d` of at most **1.11·d·(log₂d)²** points in ℂ such that for every polynomial of degree `d` (normalized so all roots lie in the open unit disk) and each of its roots, at least one point in `S_d` is in the basin of attraction of that root under Newton's iteration.

For polynomials with **all real roots**: a set of at most **1.30·d** points suffices.

## Why This Is Hard

Newton's method `N_p(z) = z - p(z)/p'(z)` has treacherous global dynamics:
- Even for cubics, there can be **attracting periodic orbits** that trap open sets of starting points (they never converge to any root)
- McMullen proved no purely iterative algorithm can converge for all degree-4+ polynomials — a positive-measure set of starting points will always fail
- Basins of attraction have **fractal boundaries** (Julia sets)
- Deflation (dividing out found roots) is numerically catastrophic for high degree

## Core Mathematical Framework

### 1. Channels to Infinity

Every root's **immediate basin** (the connected component of the basin containing the root) is simply connected and has **accesses to infinity** — unbounded paths from the root to ∞ within the basin. These are called **channels**.

**Key fact** (Proposition 6): If the immediate basin contains `m` critical points of `N_p` (counting multiplicity), it has exactly `m` channels. Since every simple root is itself a critical point, every root has at least one channel.

### 2. Channel Width (Modulus)

The width of a channel is measured conformally: restrict it to the exterior of the unit disk, take the quotient by the dynamics, and measure the **conformal modulus** of the resulting annulus.

**Lower bound** (Proposition 7): Every root has at least one channel with modulus ≥ `π / log(d)`.

This is tight — achieved by `p(z) = z(z^{d-1} - 1)`.

### 3. The Point Grid Construction

Outside the unit disk, Newton's map is approximately linear: `N_p(z) ≈ ((d-1)/d)·z`. A fundamental domain is an annulus between radii `R` and `R·d/(d-1)`.

**Strategy**: Subdivide this annulus into `s = α·log(d)` concentric sub-annuli, place `β·d·log(d)` equally-spaced points on the core circle of each sub-annulus. Total: `αβ·d·(log d)²` points.

The proof that this works uses:
- **Extremal length** arguments to bound the modulus of channels avoiding the grid
- The **elliptic modular function** via conformal mappings
- **Elliptic integrals** `A(P)` and `B(P)` computed via the **arithmetic-geometric mean** (AGM) for numerical efficiency

### 4. Optimal Constants

Minimizing `αβ` yields:
- `α ≈ 0.2663` (number of circles ≈ `0.2663·log d`)
- `β ≈ 4.1627` (points per circle ≈ `4.1627·d·log d`)
- **Total ≈ 1.1086·d·(log d)²**

### 5. Real Roots Special Case

When all roots are real:
- Every non-extremal root has exactly 2 channels
- Every channel has modulus ≥ `π / log 3` (independent of degree!)
- A single circle suffices: **≈ 1.30·d** points (77% efficiency — 1.3 starting points per root)

### 6. Single Circle (General Case)

If forced to use only one circle: **≈ 2.47·d^{3/2}** points are needed — much worse than the multi-circle grid.

## The Practical Recipe (Section 9)

For a degree-`d` polynomial with all roots in the unit disk:

1. Compute `s = ⌈0.2663·log₂(d)⌉` (number of circles)
2. Compute `n = ⌈4.1627·d·log₂(d)⌉` (points per circle)
3. For each circle `ℓ = 1, ..., s`:
   - Radius: `r_ℓ = R · ((d-1)/d)^{(ℓ-1/2)/s}`
   - Place `n` points equally spaced: `r_ℓ · exp(2πik/n)` for `k = 0, ..., n-1`
4. Run Newton's iteration from each of the `s·n ≈ 1.11·d·(log d)²` starting points

**Convergence**: A compactness argument guarantees a finite number `N(d, ε)` of iterations suffices for any desired accuracy `ε`, though explicit bounds are given elsewhere.

## Motivation

The authors needed to find all roots of polynomials of degree 256 to 16,384 arising from Hénon map dynamics. These polynomials are defined iteratively (not by coefficients), making deflation impossible. The roots are densely packed along fractal curves with spacing ~10⁻⁸.

## Relevance to pixi-slug

### Direct Relevance: Low

Slug solves quadratic equations (degree 2) per pixel in the fragment shader using the quadratic formula directly — not Newton's iteration. The paper addresses polynomials of degree hundreds to thousands.

### Indirect/Theoretical Value

| Concept | Connection to Slug |
|---------|-------------------|
| **Root finding for Bézier curves** | Slug's fragment shader finds roots of quadratic Bézier curves (the `t1`, `t2` values at [frag.glsl:96-103](src/shared/shader/slug/frag.glsl#L96-L103)). For quadratics, the closed-form discriminant is always superior to iteration. If Slug ever needed to support cubic Bézier (CFF/OpenType), Newton's method would become relevant. |
| **Basin geometry / convergence guarantees** | The paper's key insight — that basins have channels of guaranteed minimum width — is a convergence guarantee. Slug's equivalent guarantee comes from the `0x2E74` lookup: the sign-based classification ensures every pixel is correctly classified without iteration. |
| **Avoiding deflation** | The paper avoids deflation because it's numerically unstable. Slug similarly avoids sequential root-finding: it computes both roots `t1` and `t2` simultaneously from the discriminant, never deflating the quadratic after finding the first root. |
| **Conformal modulus as "width" measure** | The paper measures channel width via conformal modulus — a coordinate-independent size metric. Slug's `pixelsPerEm` serves a similar role: converting coordinate-dependent em-space values to coordinate-independent pixel-space coverage. |
| **High-degree polynomial root finding** | If a future extension needed to evaluate cubic or quartic curves (e.g., for CFF fonts or subdivision surfaces), this paper's framework could guide the design of a robust iterative solver — though GPU branch divergence would make Newton iteration expensive in a fragment shader. |

### Key Takeaway

This paper solves a deep problem in computational complex analysis that doesn't directly apply to Slug's quadratic-only pipeline. Its relevance is as a theoretical reference for polynomial root finding — if the project ever needed to handle higher-degree curves, the paper provides the mathematical foundation for guaranteed-convergent root finding without deflation. For the current quadratic case, the closed-form solution in `frag.glsl` is categorically superior.
