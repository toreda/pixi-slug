# Offset Curve Approximations (Section 11.2.4) — Summary

**Source:** Section 11.2.4 "Approximations" from *Shape Interrogation for Computer Aided Design and Manufacturing*
**Authors:** Nicholas M. Patrikalakis, Takashi Maekawa, Wonjoon Cho (MIT)
**Published:** Springer, Hyperbook Edition (December 2009)
**Source file:** `_references/11.2.4_offset_curve_approximations.pdf` (3 pages, browser print-to-PDF)
**Online:** [MIT Hyperbook](https://web.mit.edu/hyperbook/Patrikalakis-Maekawa-Cho/node222.html)

## Overview

This section is part of Chapter 11 ("Offset Curves and Surfaces") of a graduate-level textbook on computational geometry for CAD/CAM. It provides a **survey and taxonomy of offset curve approximation methods**, explaining why exact offset representations are impractical and cataloguing the main algorithmic families for computing approximate offsets within a prescribed tolerance.

This is a reference/survey section rather than a primary research paper — its value lies in organizing the field and identifying which methods work best for which curve types.

## Key Concepts

### Why Offset Curves Require Approximation

Offset curves are inherently more complex than their progenitor (original) curves because the unit normal vector involves a square root:
```
n(t) = C'(t)⊥ / ‖C'(t)‖
```

When the progenitor is a NURBS curve, the offset is **not representable as a NURBS curve** (except for degenerate cases: straight lines produce parallel lines, circles produce concentric circles). The algebraic degree of the exact offset explodes:

| Progenitor | Offset Degree |
|-----------|--------------|
| Line (degree 1) | 1 (trivial) |
| Parabola (degree 2) | 6 |
| General cubic (degree 3) | 10 |
| Degree n rational polynomial | 2n(n+m) - gcd(n,m) where m = unit normal degree |

This makes exact computation impractical. All real-world systems use approximations.

### Differential Geometry Foundations (from §11.2.1)

The offset curve at signed distance d from progenitor curve P(t) is:
```
P_offset(t) = P(t) + d·N(t)
```

Key properties:
- **Offset curvature:** `κ_offset = κ / (1 + κ·d)` — the offset curve's curvature depends on the progenitor's curvature and the offset distance.
- **Singularity condition:** When `κ·d = -1` (curvature radius equals offset distance), the offset curve has a **cusp**. When `|κ·d| > 1`, the offset develops **self-intersections** (loops).
- **Tangent preservation:** The offset curve's unit tangent equals the progenitor's unit tangent (the curves are parallel in the tangent direction).

### Singularity Classification (from §11.2.2–11.2.3)

Offset curves can develop three types of singularities:
1. **Isolated points** — where the offset degenerates to a point
2. **Cusps** — where the offset direction reverses (curvature radius = offset distance)
3. **Self-intersections** — loops formed when the offset overlaps itself

Detection methods reduce to solving univariate irrational functions (polynomials + square roots of polynomials). For B-spline input, knot insertion decomposes curves into Bézier segments before analysis. The **Interval Projected Polyhedron algorithm** (subdivision-based) solves these systems robustly.

## Taxonomy of Approximation Methods

The section surveys methods along several axes, comparing efficiency by the number of control points needed to achieve a prescribed tolerance:

### 1. Control Polygon Methods

These methods offset the control polygon of the Bézier/B-spline curve rather than the curve itself:

- **Tiller and Hanson [421]:** Translate each edge of the control polygon by distance d in the edge-normal direction. Intersect consecutive offset edges to find new control vertices. The simplest and most direct method. **Performs best for quadratic progenitor curves.**

- **Cobb [62]:** An early control-polygon-based approach.

- **Coquillart [65]:** Variant of control polygon offsetting.

- **Elber and Cohen [86]:** Modifications to improve accuracy of control polygon methods.

### 2. Interpolation Methods

These construct the offset approximation by interpolating exact offset points:

- **Klass [203]:** Interpolation-based offset construction.
- **Pham [312]:** Similar interpolation approach with different point selection.

### 3. Optimization Methods

These minimize an error functional between the approximate and exact offset:

- **Hoschek [174]:** Least-squares optimization — cited as performing well in general comparative studies.
- **Hoschek and Wissel [176]:** Nonlinear optimization variant.
- **Lee et al. [230]:** Circle approximation method — approximates the offset using circular arc segments.

### 4. Hermite Interpolation

- **Sederberg and Buehler [375]:** Approximate the offset of a Bézier curve using Hermite interpolation of any even degree ≥ the progenitor degree. The representation uses an **interval Bézier curve** where only the middle control point is a rectangular interval — the interval size indicates the tightness of the approximation.

### Comparative Finding

> "For quadratic progenitors, Tiller-Hanson outperforms other approaches."

This finding from comparative studies in the literature is significant for pixi-slug since TrueType fonts use quadratic Bézier curves.

### Tiller-Hanson Algorithm (5 Steps)

The textbook describes the algorithm explicitly:

1. **Input:** Rational B-spline progenitor curve with control vertices and knot vector. Set segment index i = 1.
2. **Offset edges:** Translate each leg of the control polygon by offset distance d in the leg's normal direction.
3. **Reconstruct vertices:** Intersect consecutive offset legs to find new control vertices. These define the approximate offset curve.
4. **Check error:** Measure deviation between approximate offset and true offset (evaluated at sample points).
5. **Refine or accept:** If deviation exceeds tolerance, subdivide the progenitor curve and recurse on each half. Otherwise, accept the approximation.

### Self-Intersection Elimination Methods

Once an offset approximation is computed, self-intersection loops must be detected and removed:

- **Elber and Cohen [85]:** Identify cusps by detecting tangent vector reversals, which indicate loop regions.
- **Lee et al. [230]:** Discrete point approximation with dot-product checks to find direction reversals.
- **Kimmel and Bruckstein [201]:** Wavefront propagation approach inspired by fluid dynamics — the correct offset is the "wavefront" of a propagating distance field.
- **Gurbuz and Zeid [138]:** Closed ball union/subtraction — the offset is the boundary of the Minkowski sum of the curve with a disk of radius d.
- **Chiang et al. [55]:** Grid-based approach using distance field evaluation at discrete grid points.

## Relevance to pixi-slug SlugText

### Text Stroke (Outline) — HIGH RELEVANCE (as a survey/decision guide)

This section's primary value for pixi-slug is as a **decision framework** for choosing a stroke implementation strategy. Key takeaways:

1. **Tiller-Hanson is optimal for quadratic curves.** The textbook's comparative finding that Tiller-Hanson outperforms other methods for quadratic progenitors validates the approach described in Yzerman's "Precise Offsetting of Quadratic Bézier Curves" paper (which is essentially the Tiller-Hanson method with rigorous error analysis). This confirms that the simplest approach — translating control polygon edges — is also the best approach for TrueType glyph outlines.

2. **The curvature-offset relationship `κ_offset = κ / (1 + κ·d)` provides a diagnostic tool.** For any glyph curve at a given stroke width d, pixi-slug can compute where `κ·d` approaches -1 to predict where cusps will form in the stroke outline. These are exactly the locations where rendering artifacts are most likely.

3. **Self-intersection elimination is a separate problem from offset computation.** The survey makes clear that computing the offset approximation and removing its self-intersections are distinct algorithmic steps. For pixi-slug's current approach (rendering the offset through the Slug winding-number test), self-intersections may be handled naturally — the winding-number test correctly determines inside/outside even for self-intersecting paths, potentially avoiding the need for explicit loop removal.

4. **The algebraic degree explosion confirms why approximation is necessary.** A quadratic Bézier's exact offset is degree 6 — far beyond what the Slug algorithm's quadratic curve pipeline handles. Any offset-based stroke must use approximate quadratic offset curves, not exact offsets.

### Comparison of Methods for pixi-slug's Use Case

| Method | Pros | Cons | Fit for pixi-slug |
|--------|------|------|-------------------|
| **Tiller-Hanson** (control polygon) | Simplest, best for quadratics, fast | May need subdivision for accuracy | Best choice |
| **Hoschek** (least squares) | Best general accuracy | Complex optimization, slow | Overkill |
| **Sederberg-Buehler** (Hermite) | Tight error bounds via interval rep | Higher-degree output curves | Incompatible (needs quadratic output) |
| **Lee et al.** (circle approx) | Clean arc-based output | Different primitive type | Incompatible with Slug pipeline |
| **Current pixi-slug** (quad expansion) | Zero CPU cost, purely GPU | Approximate, breaks at high curvature | Good default, needs fallback |

### Text Fill — NO RELEVANCE

Fill rendering operates on the original glyph curves. Offset computation is not involved.

### Drop Shadow — NO RELEVANCE

Drop shadows are a rendering-order effect with no curve geometry manipulation.

### Practical Implications

This survey section reinforces the conclusions from the Yzerman papers:

1. **Tiller-Hanson + subdivision is the right algorithm** for computing stroke offset curves from TrueType quadratic Bézier glyph outlines.

2. **The error can be controlled** by subdividing curves whose bend angle exceeds the tolerance threshold (as Yzerman's angle-based formula quantifies precisely).

3. **Cusps are predictable** from the curvature-distance relationship and should be split before offsetting.

4. **The Slug winding-number test may handle self-intersections for free** — a significant advantage over traditional stroke-to-fill conversion pipelines that require explicit self-intersection elimination.

## References Cited in This Section

Key references from the textbook's bibliography relevant to pixi-slug:
- **[421] Tiller, W. and Hanson, E.G.** (1984) "Offsets of Two-Dimensional Profiles" — the foundational control polygon offset method
- **[174] Hoschek, J.** (1988) "Spline Approximation of Offset Curves" — least squares approach
- **[375] Sederberg, T.W. and Buehler, D.** — Hermite interpolation with interval Bézier representation
- **[86] Elber, G. and Cohen, E.** — improved control polygon methods
- **[230] Lee, I.K. et al.** — circle approximation and discrete self-intersection detection
