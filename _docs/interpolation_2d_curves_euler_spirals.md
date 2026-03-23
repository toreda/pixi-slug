# Interpolation of Two-Dimensional Curves with Euler Spirals — Summary

**Paper:** "Interpolation of two-dimensional curves with Euler spirals"
**Authors:** Dale Connor, Lilia Krivodonova (University of Waterloo)
**Published:** Journal of Computational and Applied Mathematics 261 (2014) 320–332
**Source:** `_references/interp-of-2d-curves-1-s2.0-S0377042713006286-main.pdf` (13 pages)

## Overview

This paper proposes an algorithm for interpolating 2D curves using **Euler spirals** (also called Cornu spirals or clothoids). Given an ordered set of sample points, the algorithm connects consecutive points with Euler spiral segments, producing a G¹-continuous interpolation in smooth regions while handling discontinuities (sharp corners) gracefully through adaptive stencil selection.

## Key Concepts

### Euler Spirals — Definition
An Euler spiral is a curve whose curvature changes **linearly with arc length**:
```
κ(s) = β·t/a
```
where `a` is a scale factor, `β` controls curvature rate, and `t` parameterizes arc length. This makes Euler spirals the "next geometric shape" after lines (zero curvature) and circles (constant curvature).

The canonical Euler spiral is defined by Fresnel integrals:
```
C(t) = ∫₀ᵗ cos(βs²/2) ds
S(t) = ∫₀ᵗ sin(βs²/2) ds
```

An arbitrary Euler spiral is obtained by scaling (`a`), rotating (`θ`), and translating (`P₀`) the canonical form.

### G¹ Hermite Interpolation
Given two points P₁, P₂ with associated tangent directions T₁, T₂, an Euler spiral can be fitted that:
- Passes through both points
- Matches the prescribed tangent at each point
- Has the shortest arc length without completing a full coil

The paper uses the **Walton-Meek algorithm** for this fitting, which handles both S-shaped segments (containing an inflection point) and C-shaped segments (monotone curvature).

### Hierarchical Adaptive Stencil
The algorithm works in two stages:

1. **Tangent estimation:** For each sample point Pᵢ, three circles are constructed using neighboring stencils: {Pᵢ₋₂, Pᵢ₋₁, Pᵢ}, {Pᵢ₋₁, Pᵢ, Pᵢ₊₁}, {Pᵢ, Pᵢ₊₁, Pᵢ₊₂}. The circle with the smallest curvature gives a low-order approximation. The tangent at Pᵢ is then computed from the two circles on each side with the smallest curvature — if they agree (smooth region), a weighted average is used; if they disagree (discontinuity), a one-sided tangent is selected.

2. **Spiral fitting:** Once tangents are determined at all points, consecutive point pairs are connected with Euler spiral segments using the Walton-Meek G¹ Hermite interpolation.

### Handling Discontinuities
The algorithm detects sharp corners and discontinuities by comparing tangent estimates from left and right stencils. When a discontinuity is detected:
- The interpolant is allowed to have a **tangent discontinuity** at that sample point (G⁰ instead of G¹).
- This prevents oscillations from propagating across corners.
- The approach is analogous to ENO (Essentially Non-Oscillatory) schemes in numerical PDE methods — hence the ancestor algorithm was named "GENO" (Geometrical ENO).

### Coordinate Independence
Unlike polynomial interpolation (cubic splines, etc.), Euler spiral interpolation is **independent of coordinate system choice**. Polynomial methods require parameterization and can produce oscillations with poor parameter choices. Euler spirals are purely geometric, defined by curvature relationships rather than coordinate functions.

## Properties of the Interpolation

| Property | Value |
|----------|-------|
| Continuity | G¹ in smooth regions, G⁰ at detected corners |
| Curvature | Piecewise linear in arc length (C⁰ curvature) |
| Stencil size | 1–4 additional neighboring points per interval |
| Corner detection | Automatic via tangent comparison |
| Coordinate dependence | None (purely geometric) |
| Self-intersections | Not handled (assumed non-self-intersecting input) |

## Numerical Results

The paper demonstrates the algorithm on several test cases:
- **Smooth curves** (circles, ellipses, NACA airfoils): G¹ interpolation with visually smooth results.
- **Curves with corners** (airfoil trailing edges, L-shaped domains): Automatic corner detection and tangent discontinuity placement.
- **Closed curves:** Handled by extending the point set cyclically.
- **Comparison with cubic splines:** Euler spiral interpolation avoids the oscillations that plague polynomial methods near corners and rapid direction changes.

The original motivation was computational fluid dynamics — reconstructing curved boundaries from mesh vertices for more accurate boundary condition application.

## Relevance to pixi-slug SlugText

### Text Stroke (Outline)

**Moderate relevance as background theory.** The Euler spiral interpolation algorithm described here is the mathematical foundation that the GPU-friendly Stroke Expansion paper builds upon. Understanding how Euler spirals fit between points with tangent matching helps explain *why* they are effective as an intermediate representation for computing parallel curves (offset curves = stroke outlines).

However, for pixi-slug specifically:
- TrueType fonts use **quadratic** Bézier curves, not cubic — the Euler spiral intermediate step is less necessary since quadratic Béziers already have tractable parallel curves.
- SlugText's current stroke approach (quad expansion + winding-number re-evaluation) bypasses path offset computation entirely.

### Curve Fitting and Font Processing

**Low-to-moderate relevance.** If pixi-slug ever needs to:
- Support **CFF/OpenType fonts** (cubic Bézier outlines), Euler spiral lowering could provide a path to convert cubics into a form compatible with the quadratic-Bézier-based Slug algorithm.
- Implement **curve simplification** or **level-of-detail** for glyphs at very small sizes, the adaptive stencil approach could inform decimation strategies.

### Text Fill

**No direct relevance.** Fill rendering uses the Slug winding-number algorithm operating directly on the font's quadratic Bézier curves. No interpolation or curve fitting is needed.

### Drop Shadow / General Effects

**No relevance.** These features operate at the rendering layer (color, offset, blur), not at the curve geometry level.

### General Takeaways for pixi-slug

1. **Euler spirals are the natural "next step" beyond quadratic Béziers** in the hierarchy of curve complexity (lines → circles → Euler spirals → quadratic Béziers → cubic Béziers). This paper provides the mathematical grounding for understanding where quadratic Béziers sit in that hierarchy.

2. **G¹ continuity via tangent matching** is the same constraint that governs TrueType font outlines — on-curve points with implied tangent continuity from the surrounding off-curve control points. The paper's tangent estimation techniques could be useful if pixi-slug ever needs to reconstruct or resample glyph outlines.

3. **Adaptive corner detection** is conceptually similar to the problem of identifying sharp angles in glyph outlines (e.g., the V apex, X crossing, R leg junction) where the Slug algorithm's artifact investigation documented rendering challenges. The stencil-based smoothness detection could inform future artifact mitigation strategies.

4. **For current pixi-slug development, this paper is primarily reference material** — it establishes mathematical context rather than providing directly implementable techniques. The GPU-friendly Stroke Expansion paper (which builds on this work) is more immediately applicable.
