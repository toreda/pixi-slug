# Font Rendering & Slug Algorithm - Comprehensive Technical Summary

## Document Overview

This summary consolidates key technical information from three reference documents on the Slug font rendering algorithm by Eric Lengyel:

1. **A Decade of Slug** (March 17, 2026) - Historical perspective and recent developments
2. **Dynamic Glyph Dilation** (April 21, 2019) - Technical solution for boundary pixel handling
3. **GPU-Centered Font Rendering Directly from Glyph Outlines** (JCGT 2017) - Foundational paper

---

## 1. High-Level Goals & Overview

### Core Objective
Render antialiased text directly from Bézier curve data on the GPU without precomputed texture maps, distance fields, or cached glyph images.

### Key Requirements
- **Robustness**: No dropped pixels, sparkles, or streaking artifacts under any circumstances
- **Speed**: Render reasonable amounts of text without impacting frame rates (console-class gaming performance)
- **Quality**: Nicely antialiased text with smooth curves and sharp corners at any scale and perspective

### Use Cases
- Real-time 3D game environments with dynamic camera movement
- Perspective-distorted text (oblique viewing angles)
- GUI and HUD rendering in games
- Vector graphics (brackets, radicals, mathematical expressions)
- Resolution-independent UI rendering (DPI-aware applications)
- High-quality equation editors (Radical Pie)

### Historical Context
- **Developed**: Fall 2016 (Eric Lengyel)
- **Published**: June 2017 (Journal of Computer Graphics Techniques)
- **Patent**: Granted 2019 (#10,373,352), **publicly dedicated to public domain March 17, 2026**
- **Adoption**: Widely licensed by Activision, Blizzard, id Software, 2K Games, Ubisoft, Warner Brothers, Adobe, and many others

---

## 2. Core Algorithm Concepts

### 2.1 Winding Number Calculation

The fundamental approach to determine if a pixel is inside a glyph outline.

#### Method
1. Fire a ray from the pixel center in an arbitrary direction (typically x or y axis)
2. Detect intersections with glyph contours
3. Track which direction each contour crosses the ray
4. Accumulate winding number:
   - +1 for left-to-right crossing
   - -1 for right-to-left crossing
5. **Inside glyph**: winding number ≠ 0
6. **Outside glyph**: winding number = 0

#### Mathematical Foundation

For a quadratic Bézier curve (TrueType format):
```
C(t) = (1-t)²p₁ + 2t(1-t)p₂ + t²p₃
where p₁, p₂, p₃ are 2D control points, t ∈ [0,1]
```

For a horizontal ray (y=0 after translating pixel to origin):
- Solve: `Cy(t) = 0` using roots from quadratic formula
- Check if `Cx(ti) ≥ 0` to confirm intersection

#### Root Calculation
```
a = y₁ - 2y₂ + y₃
b = y₁ - y₂
c = y₁

t₁ = (b - √(b² - ac)) / a
t₂ = (b + √(b² - ac)) / a

Special case: If a ≈ 0, use t = c / 2b
```

### 2.2 Root Eligibility & Equivalence Classes (Robustness Solution)

#### The Problem
Traditional floating-point root checking fails due to precision errors when:
- Control points are near the ray
- Curves are tangent to the ray at endpoints
- Shared control points between consecutive curves

Results in: **Sparkle and streak artifacts**

#### The Solution: 8 Equivalence Classes

Instead of checking if `t ∈ [0,1)`, classify each Bézier curve based on a **3-bit state**:
```
Each y-coordinate: 1 if yᵢ > 0, else 0

Input code = ((y₁ > 0) ? 2 : 0) + ((y₂ > 0) ? 4 : 0) + ((y₃ > 0) ? 8 : 0)
```

This creates 8 equivalence classes (A through H), each with consistent behavior:

| Class | y₃ | y₂ | y₁ | Behavior |
|-------|----|----|----|----|
| A | 0 | 0 | 0 | No transitions |
| B | 0 | 0 | 1 | Contribution at t₂ |
| C | 0 | 1 | 0 | Special case handling |
| D | 0 | 1 | 1 | Contribution at t₁ |
| E | 1 | 0 | 0 | Contribution at t₂ |
| F | 1 | 0 | 1 | Special case handling |
| G | 1 | 1 | 0 | Contribution at t₁ |
| H | 1 | 1 | 1 | No transitions |

#### Lookup Table Implementation

Use a 16-bit lookup table: `0x2E74`
- Shift right by `input_code`
- Lowest 2 bits indicate which roots contribute
- Bit 0: whether t₁ contributes (+1 to winding)
- Bit 1: whether t₂ contributes (-1 to winding)

This eliminates all precision-based root eligibility checks while guaranteeing robustness.

### 2.3 Coverage Calculation (Antialiasing)

#### Fractional Coverage
Instead of discrete winding numbers, accumulate coverage fractions to antialias:

```
f = sat(m·Cₓ(tᵢ) + 0.5)

where:
  m = pixels per em (font size)
  sat() = saturate to [0,1]
  Cₓ(tᵢ) = x-position of intersection
```

#### Multiple Ray Directions
- Fire rays parallel to both x and y axes for better antialiasing
- Accumulate coverage values from both
- Isotropic antialiasing requires multiple ray directions (performance tradeoff)

---

## 3. Performance Optimization Techniques

### 3.1 Band-Based Curve Culling

#### Problem
Processing all curves for every pixel is inefficient; most curves don't intersect a given pixel.

#### Solution: Horizontal & Vertical Bands

Divide each glyph into equal-width bands:
1. **Horizontal bands**: For rays pointing in x-direction
2. **Vertical bands**: For rays pointing in y-direction
3. **Typical count**: Number of curves / 4, max 16 per direction

#### Curve Organization
For each band:
1. Create list of intersecting curves
2. Sort by maximum coordinate (descending) for forward rays
3. Sort by minimum coordinate (ascending) for backward rays

#### Early-Out Condition
```
For positive rays:
  if max{x₁, x₂, x₃}/m < -0.5: break

For negative rays:
  if min{x₁, x₂, x₃}/m > 0.5: break
```

### 3.2 Band Splitting Optimization

#### Concept
Split each band at median curve position to use rays pointing away from center:
- **Left pixels**: Fire negative rays
- **Right pixels**: Fire positive rays
- Reduces curves to process per pixel

#### Tradeoff
- **Benefit**: Speed increase for large glyphs
- **Cost**: Divergence in pixel shader hurts performance at small sizes
- **Decision**: Optional, enabled for known large-size rendering

### 3.3 Geometry Clipping

#### Problem
Glyph bounding boxes contain much empty space (especially at corners).

#### Solution
1. Create tighter bounding polygons (up to 8 sides)
2. Consider multiple normal directions at corners
3. Calculate support planes against all control points
4. Clip triangles larger than minimum threshold

#### Tradeoff
- **Benefit**: Significant pixel reduction at large sizes
- **Cost**: Tiny triangles reduce GPU occupancy at small sizes
- **Decision**: Optional optimization

### 3.4 Removed Optimizations (2017-2026 Evolution)

#### Band Split Optimization (Removed)
- Modest speed improvement
- Required dual-sorted curve lists (doubled storage)
- Introduced shader divergence
- Reduced band texture from 4 channels to 2 channels (16-bit components)

#### Supersampling (Removed)
- Only benefited text too small to read
- Dynamic dilation provides better aliasing solution
- Simplified pixel shader
- Minimal performance impact when disabled

#### Multi-Color Emoji Loop (Changed)
- Original: Rendered all layers with single bounding polygon
- Problem: Many layers covered only small fractions of area
- Solution: Render each color layer independently with own bounding polygon
- Result: Better performance, simpler pixel shader

---

## 4. Dynamic Glyph Dilation (2019 Enhancement)

### 4.1 The Problem Before Dynamic Dilation

#### Rasterizer Behavior
GPU rasterizes only pixels whose **center** falls inside triangle.

**Example**: Pixel on boundary of letter "D"
- Center falls outside bounding polygon
- Pixel is skipped by rasterizer
- Large portion of pixel interior is covered by glyph
- Results in poor antialiasing at boundaries

#### Manual Dilation Limitations
Users had to manually specify constant dilation distance for all glyphs:

**Disadvantage 1**: Choose too small
- Glyphs at small sizes exhibit aliasing artifacts along boundaries
- Loss of quality

**Disadvantage 2**: Choose too large
- Glyphs at large sizes have excessive padding
- Wastes GPU time on empty pixels
- No perfect compromise

### 4.2 Dynamic Dilation Solution

#### Concept
Automatically calculate optimal dilation per-vertex in vertex shader, recalculated every frame.

#### Goal
Expand bounding polygon by **0.5 pixels** in viewport space by moving vertices outward along their normal directions in object space.

#### Mathematical Foundation

**Inputs**:
- Object-space vertex position: `p = (pₓ, pᵧ, 0, 1)`
- Normal vector (scaled): `n = (nₓ, nᵧ, 0, 0)`
- Unit normal: `n^ = (n^ₓ, n^ᵧ, 0)`
- MVP matrix: `m` (4×4)
- Viewport dimensions: `w` (width), `h` (height)

**Goal**: Find distance `d` along unit normal such that vertex offset in viewport space equals 0.5 pixels.

**Resulting Quadratic Equation**:
```
Let s = m₃₀pₓ + m₃₁pᵧ + m₃₃  (perspective term)
Let t = m₃₀n^ₓ + m₃₁n^ᵧ      (normal projection)

Let u = w(s(m₀₀n^ₓ + m₀₁n^ᵧ) - t(m₀₀pₓ + m₀₁pᵧ + m₀₃))
Let v = h(s(m₁₀n^ₓ + m₁₁n^ᵧ) - t(m₁₀pₓ + m₁₁pᵧ + m₁₃))

Final equation:
(u² + v² - s²t²)d² - 2s³td - s⁴ = 0

Solution:
d = (s³t ± √(s²u² + v²)) / (u² + v² - s²t²)

Choose + sign for outward dilation.
```

#### Key Properties
1. **Perspective-aware**: Dilation distance varies per vertex when viewing at angles
2. **Optimal**: Never produces unnecessary padding
3. **Automatic**: CPU not involved in calculations
4. **Per-frame**: Recalculated for dynamic transforms

#### Sampling Coordinate Offset
To maintain original glyph size, also offset em-space sampling coordinates:
- Store 2×2 inverse Jacobian matrix with each vertex
- Transforms object-space displacement to em-space offset
- Jacobian includes: scale, stretch, skew, coordinate flips

#### Benefits (2019)
1. **Small glyphs**: Proper antialiasing for all boundary pixels
2. **Large glyphs**: 2-4x performance boost from tight bounding boxes
3. **Adaptive supersampling**: Can remain enabled with minimal overhead
4. **Moire patterns**: Supersampling eliminates shimmer when zoomed out

---

## 5. Technical Implementation Details

### 5.1 Data Storage (Texture-Based)

#### Control Point Texture
- **Format**: 4-channel 16-bit floating-point (RGBA16F)
- **Layout**: Two control points per texel (x,y,z,w), third point reused as first point of next curve
- **Efficiency**: Shared texels between adjacent curves (~8 bytes per curve)
- **Access**: Curves stored contiguously in rows

#### Band Data Texture
- **Format**: 4-channel 16-bit integer (RGBA16U or similar)
- **Layout**:
  - One texel header per band (horizontal + vertical)
  - Followed by curve location lists

**Header Contents** (one texel per band):
- Red channel: Curve count
- Green channel: Offset to curve list
- Blue channel: Band split location (if used)
- Alpha channel: Additional data

**Curve Lists**:
- Red & Green channels: Positive ray curve locations
- Blue & Alpha channels: Negative ray curve locations
- Each location is (x,y) coordinate in control point texture

#### Texture Dimensions
- **Control points**: Varies by font (e.g., 4096×6 to 4096×100+)
- **Band data**: Smaller, proportional to curve count (e.g., 4096×5 to 4096×23)

### 5.2 Vertex Shader Operations

#### Inputs per Vertex
- Position: Object-space vertex coordinate
- Normal: Scaled normal vector (encoded in vertex data)
- glyphParam: Band data location and band counts (12+4 bits)
- bandParam: Band scale and offsets
- texcoord: Vertex em-space coordinate (interpolated to pixel)
- Jacobian matrix (2×2 inverse, for dilation)

#### Operations
1. Calculate dynamic dilation distance `d` (quadratic solution)
2. Apply dilation: `p' = p + d·n`
3. Transform to viewport space using MVP matrix
4. Offset sampling coordinates using Jacobian

#### Outputs
- Rasterized position (perspective divide applied)
- Interpolated em-space texcoord
- Band data parameters
- Sampling coordinate offsets

### 5.3 Pixel Shader Operations

**For each pixel**:

1. **Band lookup**: Use pixelPosition to find band indices (x and y)
2. **Band headers**: Fetch from band texture
3. **Curve iteration**:
   - Read curve locations from band data
   - Process in sorted order until early-out condition
4. **For each curve**:
   - Fetch control points from control point texture
   - Calculate shift code from y-coordinates: `((y₁ > 0) ? 2 : 0) + ((y₂ > 0) ? 4 : 0) + ((y₃ > 0) ? 8 : 0)`
   - Shift lookup table: `0x2E74 >> (shift_code * 2)`
   - Check lowest 2 bits to see if roots contribute
   - If yes, calculate roots using quadratic formula
   - Calculate coverage using Cₓ(tᵢ)
   - Accumulate to winding/coverage total
5. **Color blending**: Apply accumulated coverage to fragment color

### 5.4 No Branching Requirement

- All calculations proceed without conditionals based on coverage values
- Coverage calculation always executes (may produce 0 result)
- Results in high GPU thread coherence (warp utilization)
- Predictable performance across varied glyph complexity

---

## 6. Key Constraints & Considerations

### 6.1 Precision Handling

**Critical**: Floating-point precision is fundamental to robustness.

- Equivalence class approach uses **only sign checks** (robust)
- Root calculations use high-precision arithmetic (checked within shader precision)
- Y-coordinate states are **invariant** along rays (exact calculation)
- Early-out condition guarantees well-defined transition

### 6.2 Band Width Selection

```
Band width = max(total_curves / 4, limited to 16 bands max)
```

**Consideration**: Smaller fonts require proportionally larger band width
- If font size < 1/4 normal size, multiply band width reciprocally
- Ensures curves are found within bands

### 6.3 Perspective Projection

**Dynamic Dilation Requirement**:
- Must use correct MVP matrix for each glyph
- Viewport dimensions must be current
- Perspective divide must be applied correctly
- Handles oblique viewing automatically

### 6.4 Quadratic Bezier Limitation

- Only supports quadratic curves (TrueType)
- Not directly compatible with cubic curves (OpenType CFF)
- Would require different root-finding approach for cubics

### 6.5 Performance Characteristics

**Timing** (GeForce GTX 1060, 2-megapixel area, 50 lines at 32 pixels per em):

| Font | Complexity | Time |
|------|-----------|------|
| Arial | 23 curves | 1.1 ms |
| Times | 35 curves | 1.3 ms |
| Centaur | 48 curves | 3.8 ms |
| Hallowed | 96 curves | 13.1 ms |

**vs. Texture-based approach**: 14× slower for complex fonts, but unlimited scalability

### 6.6 Supported GPU Features

**Minimum Requirements**:
- OpenGL 3.x or DirectX 10
- 16-bit float texture support
- 16-bit integer texture support
- Standard texture filtering

**No special features required**:
- No conservative rasterization needed (though possible to use)
- No compute shaders needed
- No advanced features leveraged

### 6.7 Color Variants (Emoji & Pictographs)

Can render multi-color glyphs by:
1. Additional loop in pixel shader per color layer
2. Store color data in extra texture (COLR/CPAL tables from font)
3. Render each layer with independent bounding polygon
- Better than single-loop approach (reduces wasted shading)

---

## 7. Algorithm Evolution & Refinements (2017-2026)

### 7.1 Removed Features

| Feature | Reason Removed | Impact |
|---------|----------------|--------|
| Band Split Optimization | Modest improvement, shader divergence cost | Simplification |
| Supersampling | Dynamic dilation provides better result | Cleaner code |
| Multi-layer emoji loop | Inefficient for sparse coverage | Better performance |

### 7.2 Data Storage Improvements

**Band Texture Reduction**:
- Original: 4 channels × 16-bit = 8 bytes per band header
- Current: 2 channels × 16-bit = 4 bytes per band header
- Result: Band texture size **halved**

**Complexity Reduction**:
- Removed dual-sorted curve lists
- Single sort order sufficient
- Simpler band data layout

### 7.3 Dynamic Dilation Impact

- Eliminates choice of compromise dilation value
- Optimal results at all scales automatically
- Better quality at small sizes
- Better performance at large sizes
- Enables leaving supersampling on by default

---

## 8. Reference Implementation

### 8.1 Available Resources

**GitHub Repository** (MIT License):
- Reference vertex shader (includes dynamic dilation)
- Reference pixel shader (upgraded vs. JCGT paper)
- Demonstrates full implementation

**JCGT Paper Code**:
- Pixel shader implementation
- Lacks dynamic dilation (implemented 2019)
- Educational reference for core algorithm

### 8.2 Integration Points

For projects implementing Slug:

1. **Font Processing**: Extract Bézier curves from TrueType fonts
2. **Band Generation**: Create band structure and curve lists
3. **Texture Population**: Build control point and band data textures
4. **Vertex Setup**: Implement dilation calculations
5. **Pixel Shader**: Core rendering logic

---

## 9. Key Mathematical Formulas Reference

### Winding Number Ray Test
```
For horizontal ray (y=0 after translation):
  Solve: (y₁ - 2y₂ + y₃)t² - 2(y₁ - y₂)t + y₁ = 0

  a = y₁ - 2y₂ + y₃
  b = y₁ - y₂

  t = (-b ± √(b² - ac)) / a
```

### Coverage Fraction
```
Forward ray (positive direction):
  f = sat(m·Cₓ(tᵢ) + 0.5)

Backward ray (negative direction):
  f = sat(0.5 - m·Cₓ(tᵢ))

where m = pixels per em
```

### Dynamic Dilation (Simplified)
```
Quadratic: (u² + v² - s²t²)d² - 2s³td - s⁴ = 0

Solution: d = (s³t + √(s²u² + v²)) / (u² + v² - s²t²)

Output vertex position: p' = p + d·n^
```

### Equivalence Class Lookup
```
Input code = ((y₁ > 0) ? 2 : 0) + ((y₂ > 0) ? 4 : 0) + ((y₃ > 0) ? 8 : 0)
Lookup table: 0x2E74
Output = (0x2E74 >> (input_code * 2)) & 0x3
```

---

## 10. Related Applications

- **GUI text rendering**: Resolution-independent UI
- **In-world 3D text**: Game levels with perspective
- **Scientific visualization**: Large-scale technical diagrams
- **CAD software**: Precision text and graphics
- **Medical equipment**: High-quality display text
- **Planetarium software**: Perspective-correct rendering
- **Video editing**: Scalable text effects
- **Equation editors**: Perfect mathematical notation rendering

---

## Summary

The Slug algorithm represents a elegant solution to GPU font rendering that:

1. **Eliminates textures entirely** through direct Bézier curve evaluation
2. **Guarantees robustness** via equivalence class lookup (no precision errors)
3. **Optimizes performance** through band-based curve culling
4. **Enables dynamic scaling** with dynamic dilation per vertex
5. **Supports all transformations** including perspective and rotation
6. **Achieves production quality** antialiasing and rendering

The combination of mathematical rigor (winding number via curve classification) and GPU optimization techniques (band culling, early-out) makes Slug a complete, practical solution for real-time text rendering in demanding applications.

Patent now public domain enables widespread adoption for future implementations.
