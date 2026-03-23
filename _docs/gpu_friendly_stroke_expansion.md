# GPU-friendly Stroke Expansion — Summary

**Paper:** "GPU-friendly Stroke Expansion"
**Authors:** Raph Levien, Arman Uguray (Google)
**Source:** `_references/GPU-friendly Stroke Expansion-2405.00127v2.pdf` (17 pages)

## Overview

This paper presents a fully parallel, GPU-compute-shader-based algorithm for **stroke expansion** — converting a stroked vector path into a filled outline suitable for rasterization. The technique generates the offset curves (parallel curves) that form the outline of a stroke applied to a path of cubic Bézier segments, handling all standard SVG stroke features: variable-width strokes, line/round/square caps, bevel/miter/round joins, and dashing.

## Key Concepts

### Stroke Expansion as a Global Problem
Unlike filled paths (where each segment can be processed independently), stroked paths are a *global* problem:
- **Joins** between segments depend on both adjoining segments.
- **Caps** depend on whether the path is open or closed.
- **Dashing** requires cumulative arc-length calculations along the entire path.

### Strong vs. Weak Correctness
The paper defines two levels of stroke correctness:
- **Weakly correct:** Parallel curves are drawn but may self-intersect or have incorrect winding when curvature exceeds the reciprocal of the half-width.
- **Strongly correct:** Includes **evolute segments** (the locus of centers of curvature) and **inner contour joins** where curvature is high. These additional segments ensure the outline has correct winding and no artifacts.

### Euler Spirals as Intermediate Representation
Rather than working directly with cubic Béziers (whose parallel curves are 10th-order algebraic curves), the algorithm:
1. **Lowers cubic Béziers to Euler spiral segments** via geometric Hermite interpolation.
2. Euler spirals have curvature linear in arc length (`κ(s) = κ₀ + κ₁·s`), making their parallel curves analytically tractable.
3. The parallel curve of an Euler spiral has a closed-form Cesàro representation: `κ(s) = κ₀(s - s₀) / (1 + δ·κ₁)` where δ is the offset distance.
4. Euler spirals can model inflection points natively — no need to subdivide at inflections (unlike quadratic Bézier lowering).

### Error Metrics and Subdivision
- **Invertible error metrics** predict the number of subdivisions needed analytically, avoiding expensive cut-then-measure loops.
- For flattening Euler spirals to line segments: subdivision points follow a power-law formula with exponent 2/3.
- For arc approximation: a closed-form formula gives the subdivision count, and the same arc approximation works for both sides of a stroke.
- Error tolerance is typically 0.25 device pixels (the threshold of visibility).

### Evolutes and Cusps
When curvature exceeds `1/δ` (reciprocal of stroke half-width), the parallel curve develops a cusp. The algorithm:
- Detects cusp locations by checking if curvature × offset crosses the chord length.
- Draws evolute segments (connecting arcs at cusp locations) to maintain correct winding.
- Handles cusps in the source curve by re-sampling tangents at perturbed parameter values.

## GPU Implementation

### Pipeline Design
- Fully data-parallel: one GPU thread per input path segment.
- Single compute shader dispatch with workgroup size 256.
- No CPU preprocessing beyond basic path encoding.
- Supports Metal, Vulkan, D3D12, and **WebGPU** (implemented in WGSL).

### Input Encoding
- Paths encoded as two parallel streams: **path tags** (8-bit per segment) and **path data** (point coordinates).
- A **tag monoid** structure enables parallel prefix sums to compute stream offsets.
- Transform and style data use one-to-many mapping — a single transform/style entry can apply to multiple path segments.

### Recursive Subdivision Without Recursion
Since GPU compute shaders don't support recursion, the adaptive subdivision stack is encoded in just two scalar values:
- `dt`: the current range size
- `t0_u`: the scaled range start
- Push = halve `dt`, double `t0_u`; Pop = use `countTrailingZeros` to determine how many levels to ascend.

### Output
The shader produces a "line soup" — an unordered set of line or circular arc segments. A subsequent tiling/rasterization pass sorts and renders them.

### Performance Results
Tested on Mali-G78 (mobile), Apple M1 Max (laptop), GTX 980Ti, and RTX 4090:
- `waves.svg` (13,308 input segments → 475,855 output lines): **~3.5ms on mobile**, sub-millisecond on desktop.
- `mmark-120k` (120,000 input segments → 2.7M output lines): under 20ms on M1 Max.
- Arc output mode reduces segment count (and time) by ~2× compared to line output.

## Relevance to pixi-slug SlugText

### Text Stroke (Outline)

**High relevance.** This paper solves the exact problem that SlugText stroke needs: generating offset curves from glyph outlines. However, pixi-slug's current stroke approach is fundamentally different and simpler:

- **Current approach:** SlugText expands the glyph quad by `strokeWidth` pixels on all sides and re-renders the Slug winding-number test at the wider area. The stroke is achieved by rendering the expanded glyph in the stroke color *behind* the fill pass. This works because the Slug algorithm evaluates curve coverage at any point in em-space — expanding the sample area naturally produces an outline effect.

- **Paper's approach:** Generate explicit offset curve geometry on the GPU, then rasterize as filled paths. This is the "correct" vector graphics approach but requires:
  - Compute shader support (WebGPU, not available in WebGL2)
  - Significant implementation complexity (Euler spiral fitting, evolute handling, cusp detection)
  - A full stroke-to-fill conversion pipeline

**Assessment:** The paper's approach is overkill for pixi-slug's use case. SlugText's quad-expansion method produces visually adequate strokes for text rendering at typical sizes. The paper's technique would be relevant if:
- Extremely thick strokes are needed (where the winding-number approach breaks down at high curvature regions)
- Precise SVG-compliant stroke rendering is required
- The project migrates to WebGPU compute shaders

### Text Fill

**Low relevance.** Fill rendering is already handled by the Slug algorithm's winding-number test. The paper's fill path is simply "flatten cubic Bézier with offset=0" — the Slug algorithm is a more efficient approach for glyph fill rendering since it operates directly on the quadratic Bézier curves without flattening.

### Drop Shadow

**No direct relevance.** Drop shadows in SlugText are implemented as a color-shifted, offset copy of the fill pass — purely a rendering-order concern with no path manipulation.

### General Takeaways for pixi-slug

1. **Euler spirals** are an excellent intermediate representation between cubic Béziers and rendered output — worth knowing about if pixi-slug ever needs to support cubic (CFF/OpenType) fonts.
2. **Invertible error metrics** could inform future work on adaptive quality/performance tradeoffs.
3. The **WebGPU/WGSL implementation** confirms this class of algorithm is feasible in the browser, relevant for a future pixi-slug WebGPU backend.
4. For current WebGL2-based rendering, the existing quad-expansion stroke method remains the pragmatic choice.
