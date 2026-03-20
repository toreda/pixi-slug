# GLSL Bézier Line Given Four Control Points — Victoria Rudakova

**Source**: [glsl-bezier-line-given-four-control-points-victoria-rudakova.pdf](../_references/glsl-bezier-line-given-four-control-points-victoria-rudakova.pdf)
**Author**: Victoria Rudakova (Computer Graphics Researcher, Yale University)
**Published**: ~2016 (updated October 21, 2016)
**Code**: `shader-3dcurve` GitHub repository (OpenSceneGraph + GLSL)

## Purpose

Demonstrates a GLSL geometry shader that draws **thick, smooth cubic Bézier curves in 3D** by:
1. Converting `GL_LINE_STRIP_ADJACENCY` into a triangular strip (thick smooth lines).
2. Sampling curve data from four control points using the cubic Bézier formula.

## Core Algorithm

### Cubic Bézier Evaluation

Standard cubic Bézier formula evaluated at parameter `t`:

```
B(t) = (1-t)³·P₀ + 3(1-t)²·t·P₁ + 3(1-t)·t²·P₂ + t³·P₃
```

where `P₀..P₃` are the four control points (two endpoints, two interior controls).

### GLSL Implementation

```glsl
vec4 toBezier(float delta, int i, vec4 P0, vec4 P1, vec4 P2, vec4 P3)
{
    float t = delta * float(i);
    float t2 = t * t;
    float one_minus_t = 1.0 - t;
    float one_minus_t2 = one_minus_t * one_minus_t;
    return (P0 * one_minus_t2 * one_minus_t
          + P1 * 3.0 * t * one_minus_t2
          + P2 * 3.0 * t2 * one_minus_t
          + P3 * t2 * t);
}
```

### Rendering Loop (Geometry Shader)

The curve is tessellated into `nSegments` linear segments inside the geometry shader:

```
for i in 0..nSegments:
    1. Sample curve point:   Points[i] = toBezier(delta, i, P0, P1, P2, P3)
    2. Interpolate colors between segment endpoints
    3. Transform to screen space
    4. Extract z-values (preserve depth ordering)
    5. Emit triangular strip segments via drawSegment()
```

`nSegments` can be a uniform or a shader constant. `delta = 1.0 / nSegments`.

### De Casteljau Alternative (from comments)

A commenter (Larry W) noted the `mix()`-based De Casteljau evaluation, which maps directly to GLSL built-ins:

```glsl
vec4 cubic_bezier(vec4 A, vec4 B, vec4 C, vec4 D, float t)
{
    vec4 E = mix(A, B, t);
    vec4 F = mix(B, C, t);
    vec4 G = mix(C, D, t);
    vec4 H = mix(E, F, t);
    vec4 I = mix(F, G, t);
    return mix(H, I, t);
}
```

This is the recursive linear interpolation form — geometrically intuitive and potentially faster due to `mix()` hardware optimization.

## Relevance to pixi-slug

### Similarities
- Both render Bézier curves in GLSL shaders.
- Both must handle precision and smooth rendering at varying scales.

### Key Differences

| Aspect | Rudakova | pixi-slug (Slug) |
|--------|----------|-------------------|
| **Curve order** | Cubic (4 control points) | Quadratic (3 control points, TrueType) |
| **Approach** | Tessellate curve into line segments, rasterize as triangle strip | Analytical per-pixel winding number test — no tessellation |
| **Shader stage** | Geometry shader (tessellation) | Fragment shader (ray-curve intersection) |
| **Rendering** | Stroke (thick line along curve) | Fill (glyph interior) |
| **Use case** | General 3D curve visualization | Font/glyph rendering |
| **GPU requirement** | Geometry shader support | Fragment shader with texture lookups |
| **Antialiasing** | Implicit from triangle strip width | Coverage-based with dynamic dilation |

### Takeaways

1. **Tessellation approach is fundamentally different** from Slug's analytical method. Rudakova subdivides curves into segments and draws them as geometry; Slug evaluates curves per-pixel in the fragment shader.
2. **The `mix()`-based De Casteljau form** is a useful pattern for any GLSL Bézier evaluation, including potential debug/visualization tools.
3. **Not directly applicable** to the Slug implementation — Slug's advantage is precisely that it avoids tessellation, achieving resolution-independent rendering with O(curves-per-band) fragment shader cost.
4. **Useful as contrast**: demonstrates the tessellation-based alternative that Slug's analytical approach replaces for glyph rendering.
