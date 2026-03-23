# Fast Approaches to Simplify and Offset Bézier Curves — Summary

**Paper:** "Fast approaches to simplify and offset Bezier curves within specified error limits"
**Author:** Fabian Yzerman (Blend2D)
**Published:** January 18, 2020 (Master's thesis, Revision 1.1)
**Source:** `_references/simplify_and_offset_bezier_curves.pdf` (42 pages)

## Overview

This thesis develops several algorithms for **flattening** (converting curves to polylines) and **offsetting** (computing parallel curves for stroking) planar Bézier curves — quadratic, cubic, and rational quadratic. The key innovation is using quadratic Bézier curves as a universal intermediate representation: cubic and rational curves are first approximated by quadratic ones, then the fast quadratic-specific methods are applied for flattening and offsetting. All methods provide bounded approximation errors measured by maximum Euclidean distance.

The author is the developer of **Blend2D**, a high-performance 2D vector graphics engine, and this work forms the mathematical foundation for its rendering pipeline.

## Key Concepts

### Curve Hierarchy and Simplification

The thesis covers three curve types relevant to SVG path rendering:
- **Quadratic Bézier** (degree 2): 3 control points — the primary workhorse
- **Cubic Bézier** (degree 3): 4 control points — used in most vector graphics formats
- **Rational quadratic Bézier**: weighted quadratic — represents conic sections (elliptical arcs)

**Strategy:** Lower all curve types to quadratic Bézier approximations with bounded error, then apply fast quadratic-specific algorithms.

### Simplification (Degree Reduction)

#### Quadratic Curves
- Maximum error between a quadratic curve and its chord has a closed-form expression.
- The error is symmetric: maximum deviation always occurs at `t = 0.5`.
- Subdivision produces uniform error distribution — each sub-segment has the same maximum error.
- **Subdivision count formula:** `n = ceil(1 / (8·ε) · max(|P₂ - 2P₁ + P₀|))` where ε is the error tolerance.

#### Cubic → Quadratic Approximation
- A cubic curve `C₃(t)` is approximated by a quadratic curve `C₂(t)` whose control point is `P₁ = (3(P₁_cubic + P₂_cubic) - P₀ - P₃) / 4`.
- Maximum error has a closed-form bound: `e_max = max(|P₃ - 3P₂ + 3P₁ - P₀|) / (6·√3)` (simplified).
- When error exceeds tolerance, subdivide the cubic at `t = 0.5` and approximate each half.
- An alternative approach fits two quadratic curves per cubic subdivision for tighter approximation.

#### Rational Quadratic → Quadratic Approximation
- Rational quadratic curves (used for arcs/conics) are approximated by ordinary quadratic curves.
- The weight `w` controls how much the curve deviates from a standard quadratic — the approximation error depends on `|1 - w|`.
- Subdivision at `t = 0.5` produces sub-curves with weights closer to 1, reducing error.

### Flattening (Curve → Polyline)

#### Key Insight for Quadratic Curves
The maximum distance between a quadratic Bézier and its chord at uniformly spaced parameter intervals is **constant** across all intervals. This means:
- The number of line segments is determined by a single formula.
- Each point of the flattened curve can be computed directly (no adaptive subdivision needed).
- The flattening is truly incremental: `P(t + Δt) = P(t) + C'(t)·Δt + ½C''·Δt²` where `C''` is constant for quadratics.

#### Performance Optimizations
- Forward differencing: compute successive points by adding constant second differences.
- The step count for a given tolerance ε is: `n = ceil(√(‖P₂ - 2P₁ + P₀‖ / (8ε)))`.
- For transformed curves: apply the affine transformation to the error bound rather than transforming all points, then flatten in device space.

### Offsetting (Parallel Curves for Stroking)

#### The Offset Curve Problem
The offset curve of `C(t)` at distance `δ` is: `C̃(t) = C(t) + δ·n(t)` where `n(t)` is the unit normal. This cannot be expressed as a polynomial Bézier curve of the same degree — it must be approximated.

#### Control Polygon Translation Method
For quadratic Bézier curves, a simple and effective offset approximation:
1. Compute unit normals at `t = 0` and `t = 1` (the endpoints).
2. Translate `P₀` and `P₂` by `δ` along their respective normals.
3. Compute `P̃₁` as the intersection of the translated tangent lines.

**Error characteristics:**
- Maximum error always occurs at `t = 0.5` (midpoint of the curve).
- Error depends only on the angle φ between the two legs `P₁P₀` and `P₂P₁`: `ε_max(φ) = 2·sin⁴(φ/4) / cos(φ/2)` (relative error).
- Error is independent of curve scale — it depends only on the bend angle and offset distance.

#### Angle-Based Splitting
To keep the offset error below tolerance:
1. Compute the maximum allowable angle φ for the desired error tolerance.
2. Split the curve at parameter `tₛ` where the tangent rotation reaches φ.
3. Offset each sub-segment independently.
4. Process iteratively until the remaining curve's angle is within tolerance.

#### Cusp Handling
When the local curvature radius falls below the offset distance, the inner offset curve develops a **cusp** — a point where the direction reverses. The algorithm:
1. Computes critical parameters `t₁, t₂` by solving `R(t) = δ` (curvature radius equals offset distance).
2. Splits the curve at these parameters before offsetting.
3. The cusps then appear precisely at split points, producing cleaner offset paths.

### Complete Offsetting Algorithm (Pseudocode)
```
OffsetQuadraticCurve(curve, δ, max_angle):
  1. Find cusp parameters t₁, t₂ where curvature radius = δ
  2. Split at t₁ and t₂ if they're in (0,1)
  3. For each sub-segment:
     a. Find tₛ where angle condition is met
     b. If tₛ in (0,1): split, offset left half, continue with right half
     c. Otherwise: offset the whole segment (final piece)
```

### Quality and Performance Results

#### Quality Comparison (4 methods)
- **New (curves):** Fewest control points (e.g., 3+3 for slightly curved), retains curve information.
- **New+Flatten:** Comparable to Hain's method in vertex count, slightly irregular vertex spacing at splits.
- **AGG (Anti-Grain Geometry):** Recursive subdivision, tends to overshoot vertex count.
- **Hain's iterative:** Generally fewest flattened vertices but fails on cusps — not robust for arbitrary input.

#### Performance Benchmarks
- Offset-as-curves (no flattening) is 3–5× faster than any flattened approach.
- Flattening is the dominant cost — the offset computation itself is cheap.
- All flattened methods converge in performance for large curve areas.
- Performance scales with bend angle (sharper curves need more splits) but not with offset width.

## Relevance to pixi-slug SlugText

### Text Stroke (Outline) — HIGH RELEVANCE

This paper is the **most directly applicable** reference for pixi-slug's stroke implementation among the offset-curve papers in the project's references. Key reasons:

1. **Quadratic Bézier focus:** TrueType fonts use quadratic Bézier curves — exactly what this paper optimizes for. Unlike the GPU-friendly Stroke Expansion paper (which targets cubic Béziers and requires compute shaders), this work operates directly on the same curve type that SlugText already processes.

2. **Control polygon translation:** The simple offset method (translate control polygon edges by δ along normals) could provide an alternative stroke approach to the current quad-expansion method. Instead of expanding the glyph bounding quad and re-evaluating the Slug winding-number test at a wider area, pixi-slug could pre-compute offset control points and render them as a separate fill pass. This would produce geometrically correct strokes rather than the current approximation.

3. **Error bound formula:** The angle-based error formula `ε_max(φ) = 2·sin⁴(φ/4) / cos(φ/2)` could be used to determine when the current quad-expansion approach produces acceptable results vs. when a more precise offset method is needed (e.g., for very thick strokes on high-curvature glyph features).

4. **Cusp detection formula:** The explicit formula for finding cusp parameters in quadratic Bézier offset curves (`R(t) = δ`) is directly applicable to detecting where stroke rendering might fail or produce artifacts. This could help diagnose and fix stroke artifacts at sharp glyph features (V apex, X crossing, etc.).

**Current vs. paper approach:**
- **Current (quad expansion):** Fast, simple, GPU-friendly. Works well for thin-to-moderate strokes. May produce incorrect results for very thick strokes where the inner offset develops cusps.
- **Paper approach:** Geometrically correct offset curves. Requires CPU preprocessing (splitting, offsetting) but produces proper stroke geometry. Could be used as a preprocessing step before the Slug shader renders the offset curves.

### Text Fill — MODERATE RELEVANCE

The **simplification** (degree reduction) algorithms are relevant for fill rendering:

1. **Cubic → Quadratic conversion:** If pixi-slug adds CFF/OpenType font support, this paper provides the exact algorithm needed to convert cubic Bézier glyph outlines to the quadratic Béziers that the Slug algorithm requires.

2. **Rational quadratic → Quadratic:** Relevant if any font format uses conic sections (rare but possible in some CAD-derived fonts).

3. **Flattening formulas:** The subdivision count formula for quadratic curves (`n = ceil(√(‖P₂ - 2P₁ + P₀‖ / (8ε)))`) could be useful for level-of-detail decisions — determining how many band subdivisions are needed for a given glyph at a given size.

### Drop Shadow — NO RELEVANCE

Drop shadows are a rendering-layer effect (color shift + position offset) with no curve geometry involvement.

### General Takeaways for pixi-slug

1. **Quadratic Bézier offsetting is a solved problem** with clean, implementable formulas. If the current quad-expansion stroke approach proves insufficient, this paper provides the exact replacement algorithm.

2. **The angle-based error metric** is elegant and could be used for quality assessment of the current stroke method — compute the maximum angle in each glyph curve, apply the error formula, and compare against the stroke width to predict where artifacts might occur.

3. **The "offset as curves, flatten later" philosophy** aligns well with pixi-slug's architecture: compute offset curves on the CPU during font loading, then render them through the Slug shader like normal glyph curves. This would make strokes resolution-independent and transformation-independent, unlike polyline-based approaches.

4. **Blend2D** (the author's rendering engine) is a production-quality implementation of these algorithms and could serve as a reference implementation if pixi-slug adopts this approach.
