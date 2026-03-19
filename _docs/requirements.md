# Slug Algorithm - Detailed Technical Requirements

## 1. Mathematical Requirements

### 1.1 Quadratic Bézier Curve Evaluation
- Support TrueType quadratic Bézier curves: `C(t) = (1-t)²p₁ + 2t(1-t)p₂ + t²p₃`
- Ability to solve for roots: `Cy(t) = 0` → find `t` where curve crosses ray
- Root calculation using quadratic formula with coefficients:
  - `a = y₁ - 2y₂ + y₃`
  - `b = y₁ - y₂`
  - `c = y₁`
- Special case: when `a ≈ 0`, use linear solution: `t = c / 2b`

### 1.2 Winding Number Calculation
- Fire rays from pixel center in arbitrary direction (typically axis-aligned)
- Track ray-contour intersections using winding number accumulation:
  - +1 for left-to-right crossing
  - -1 for right-to-left crossing
- Support for both horizontal and vertical rays (better antialiasing)
- Coverage value: `f = sat(m·Cₓ(tᵢ) + 0.5)` where `m = pixels per em`

### 1.3 Root Eligibility via Equivalence Classes
- **CRITICAL**: Use lookup-table approach, NOT floating-point range checks
- Classify curves using 3-bit y-coordinate state:
  - `Input code = ((y₁ > 0) ? 2 : 0) + ((y₂ > 0) ? 4 : 0) + ((y₃ > 0) ? 8 : 0)`
- Lookup table: `0x2E74` (16-bit value)
- Extract result: `(0x2E74 >> (input_code * 2)) & 0x3`
  - Bit 0: whether t₁ contributes
  - Bit 1: whether t₂ contributes
- This eliminates ALL precision-based sparkle/streak artifacts

### 1.4 Dynamic Dilation (Perspective-Aware)
**Goal**: Expand bounding polygon by 0.5 pixels in viewport space

**Inputs**:
- Object-space vertex: `p = (pₓ, pᵧ, 0, 1)`
- Scaled normal vector: `n = (nₓ, nᵧ, 0, 0)`
- Unit normal: `n^ = normalize(n)`
- MVP matrix: `m` (4×4)
- Viewport dimensions: `w, h`

**Quadratic Equation**:
```
s = m₃₀pₓ + m₃₁pᵧ + m₃₃  (perspective term)
t = m₃₀n̂ₓ + m₃₁n̂ᵧ        (normal projection)

u = w(s(m₀₀n̂ₓ + m₀₁n̂ᵧ) - t(m₀₀pₓ + m₀₁pᵧ + m₀₃))
v = h(s(m₁₀n̂ₓ + m₁₁n̂ᵧ) - t(m₁₀pₓ + m₁₁pᵧ + m₁₃))

(u² + v² - s²t²)d² - 2s³td - s⁴ = 0

d = (s³t + √(s²u² + v²)) / (u² + v² - s²t²)  [choose + for outward]
```

**Output**: `p' = p + d·n̂`

- Must recalculate per frame for dynamic transforms
- Jacobian matrix required to offset em-space sampling coordinates
- Handles perspective and rotation automatically

## 2. Data Storage Requirements

### 2.1 Control Point Texture
- **Format**: RGBA16F (4-channel 16-bit floating-point)
- **Layout**: Two control points per texel (x,y,z,w), third point reused as first of next curve
- **Memory efficiency**: ~8 bytes per curve (shared texel between adjacent curves)
- **Access pattern**: Curves stored contiguously in rows
- **Typical dimensions**: 4096×6 to 4096×100+ depending on font complexity

### 2.2 Band Data Texture
- **Format**: RGBA16U (4-channel 16-bit unsigned integer) or similar
- **Header per band**: One texel per band (horizontal + vertical)
  - Red: Curve count
  - Green: Offset to curve list
  - Blue: Band split location (optional)
  - Alpha: Additional data
- **Curve lists**: (x,y) coordinates in control point texture
  - Red & Green: Positive ray curve locations
  - Blue & Alpha: Negative ray curve locations
- **Typical dimensions**: 4096×5 to 4096×23 depending on curve count

### 2.3 Texture Access Patterns
- Control point fetches must be fast (core pixel shader bottleneck)
- Band header lookup via pixel position (fast, local)
- Curve list iteration in sorted order with early-out conditions
- No random-access patterns that hurt cache coherence

## 3. Shader Implementation Requirements

### 3.1 Vertex Shader
**Inputs per vertex**:
- Position (object-space)
- Normal (scaled, for dilation)
- glyphParam: Band data location and counts (12+4 bits)
- bandParam: Band scale and offsets
- texcoord: Vertex em-space coordinate (interpolated)
- 2×2 inverse Jacobian matrix

**Operations**:
1. Calculate dilation distance `d` using quadratic solver
2. Apply dilation: `p' = p + d·n̂`
3. Transform to viewport space using MVP
4. Offset sampling coordinates using Jacobian
5. Output all necessary parameters for pixel shader

**Output**:
- Rasterized position (post-perspective divide)
- Interpolated em-space texcoord
- Band parameters for pixel shader
- Sampling coordinate offsets

### 3.2 Pixel Shader
**Core algorithm**:
1. Look up band indices from pixel position
2. Fetch band headers from band texture
3. For each band:
   - Read curve locations in sorted order
   - Apply early-out condition: `if max{x₁,x₂,x₃}/m < -0.5: break`
4. For each curve:
   - Fetch control points
   - Calculate shift code from y-coordinates
   - Lookup eligible roots: `(0x2E74 >> (shift_code*2)) & 0x3`
   - Calculate roots if indicated
   - Compute coverage: `f = sat(m·Cₓ(tᵢ) + 0.5)`
   - Accumulate coverage
5. Apply final color with accumulated coverage

**Constraints**:
- NO conditionals based on coverage values
- All paths must execute (may produce 0 result)
- Maximum GPU thread coherence (warp utilization)
- Predictable performance across glyph complexity

## 4. Band Configuration Requirements

### 4.1 Band Width Calculation
```
band_width = max(total_curves / 4, limited to 16 bands)
```

### 4.2 Size Scaling
- For fonts at 1/4 normal size or smaller, multiply band width reciprocally
- Ensures curves are found within bands despite scaling
- Prevents missing curves in band lookup

### 4.3 Curve Organization
**For each band**:
1. Create list of curves whose bounding box intersects band
2. Sort by maximum coordinate (descending) for forward rays
3. Sort by minimum coordinate (ascending) for backward rays

## 5. GPU Feature Requirements

### 5.1 Minimum Capabilities
- OpenGL 3.x or DirectX 10 equivalent
- 16-bit floating-point texture support
- 16-bit integer texture support
- Standard linear texture filtering

### 5.2 NOT Required
- Conservative rasterization
- Compute shaders
- Atomic operations
- Advanced GPU features

## 6. Input Font Requirements

### 6.1 Supported Format
- TrueType fonts with quadratic Bézier curves
- Extract glyf table curves
- Support all glyph types (simple, composite with components)

### 6.2 Unsupported
- Cubic Bézier curves (CFF/OpenType)
- Would require different root-finding approach
- Not compatible without algorithm modification

## 7. Performance Tuning Parameters

### 7.1 Optional Band Split Optimization
- Split bands at median curve position
- Use rays pointing away from center
- Reduces curves processed per pixel
- **Trade-off**: Modest speed at large sizes, shader divergence at small sizes
- **Decision**: Optional, use for known large-size rendering only

### 7.2 Geometry Clipping
- Create tighter bounding polygons (up to 8 sides)
- Calculate support planes against all control points
- Clip triangles larger than minimum threshold
- **Trade-off**: Significant reduction at large sizes, reduced occupancy at small sizes
- **Decision**: Optional optimization

### 7.3 Supersampling
- Fire multiple rays per pixel at different offsets
- Dynamic dilation provides better aliasing solution
- Can remain enabled with minimal overhead
- Modern recommendation: Leave enabled for best quality at all scales

## 8. Precision Requirements

### 8.1 Floating-Point Precision
- Root calculations require good precision (float32 is adequate)
- Y-coordinate states are invariant along rays (exact)
- Early-out condition guarantees well-defined transitions
- NO reliance on epsilon-based comparisons for root eligibility

### 8.2 Critical: Sign-Based Classification Only
- Root eligibility uses ONLY sign checks: `y > 0` vs `y ≤ 0`
- No threshold comparisons
- Robust against all precision issues

## 9. Color Variants (Multi-Color Glyphs)

### 9.1 Implementation
- Additional loop in pixel shader per color layer
- Color data stored in separate texture (COLR/CPAL tables)
- Render each layer with independent bounding polygon

### 9.2 Optimization
- Avoid single-loop multi-color approach
- Better performance with independent polygons per layer
- Reduces wasted shading on sparse coverage areas

## 10. Output Requirements

### 10.1 Color Output
- RGBA output with coverage-blended alpha
- Support standard blend modes
- Correct antialiasing coverage in alpha channel

### 10.2 Precision
- Output precision matches standard graphics pipeline
- No special post-processing required
- Ready for standard composite operations
