# Slug Algorithm — Complete Implementation Guide

This document provides a step-by-step breakdown of every stage of the Slug algorithm, derived from US Patent 10,373,352 (now public domain). Each step identifies **where** the work takes place: CPU-side native language (TypeScript), vertex shader (GLSL), or fragment shader (GLSL).

---

## Table of Contents

1. [Pipeline Overview](#1-pipeline-overview)
2. [Phase 1: Font Parsing & Curve Extraction (CPU)](#2-phase-1-font-parsing--curve-extraction-cpu)
3. [Phase 2: Band Computation (CPU)](#3-phase-2-band-computation-cpu)
4. [Phase 3: Texture Packing (CPU)](#4-phase-3-texture-packing-cpu)
5. [Phase 4: Quad Construction & Vertex Layout (CPU)](#5-phase-4-quad-construction--vertex-layout-cpu)
6. [Phase 5: Dynamic Dilation (Vertex Shader)](#6-phase-5-dynamic-dilation-vertex-shader)
7. [Phase 6: Winding Number Computation (Fragment Shader)](#7-phase-6-winding-number-computation-fragment-shader)
8. [Phase 7: Coverage Calculation & Output (Fragment Shader)](#8-phase-7-coverage-calculation--output-fragment-shader)
9. [Data Flow Diagram](#9-data-flow-diagram)
10. [Critical Constants & Lookup Tables](#10-critical-constants--lookup-tables)

---

## 1. Pipeline Overview

The Slug algorithm divides work into two domains:

| Domain | Language | When | Purpose |
|--------|----------|------|---------|
| **CPU preprocessing** | TypeScript | Once per font load | Parse font, extract curves, build bands, pack textures, build vertex buffers |
| **Vertex shader** | GLSL | Every frame, per vertex | Dynamic dilation, transform to clip space, pass data to fragment shader |
| **Fragment shader** | GLSL | Every frame, per pixel | Winding number calculation, root finding, coverage computation, antialiasing |

### Execution Order

```
CPU (one-time)                    GPU (per-frame)
─────────────                     ───────────────
1. Parse font file                5. Vertex shader: dilate & transform
2. Extract quadratic curves       6. Rasterizer: interpolate varyings
3. Compute band assignments       7. Fragment shader: winding number
4. Pack textures + build quads    8. Fragment shader: coverage → color
```

---

## 2. Phase 1: Font Parsing & Curve Extraction (CPU)

**Where**: TypeScript (`src/shared/slug/font.ts`, `src/shared/slug/glyph/curves.ts`)
**When**: Once at font load time
**Patent reference**: Patent column 3, lines 30–50 — "control point data 104 corresponding to the set of quadratic Bézier curves defining the outline of the shape"

### Step 1.1: Parse Font File

Load a TrueType/OpenType font file and extract glyph outlines.

```
Input:  ArrayBuffer containing TTF/OTF data
Output: Per-glyph path commands (M, L, Q, C, Z)
Tool:   opentype.js
```

- Parse the font binary using `opentype.parse(fontData)`
- Extract `unitsPerEm` for coordinate normalization
- Iterate all glyphs, recording advance widths for every glyph (including whitespace)

### Step 1.2: Convert Path Commands to Quadratic Bézier Curves

The patent requires **quadratic** Bézier curves exclusively. All other path types must be converted.

```
Input:  opentype.js path commands (moveTo, lineTo, quadraticCurveTo, bezierCurveTo, closePath)
Output: Array of SlugGlyphCurve { p1x, p1y, p2x, p2y, p3x, p3y }
```

**Conversion rules:**

| Source Command | Conversion | Notes |
|---------------|------------|-------|
| `Q` (quadratic) | Direct use | Already quadratic: p1 = start, p2 = control, p3 = end |
| `L` (line) | Degenerate quadratic | p2 = midpoint of p1 and p3 (produces a straight-line Bézier) |
| `C` (cubic) | Split into 2 quadratics | Use de Casteljau subdivision at t=0.5, then approximate each half as a quadratic |
| `M` (moveTo) | Track contour start | Sets current position, no curve emitted |
| `Z` (closePath) | Close contour | If current position ≠ contour start, emit a closing line-to-quadratic |

**Cubic-to-quadratic conversion** (de Casteljau at t=0.5):
```
Given cubic: p0, p1, p2, p3
Split at t=0.5:
  q0 = (p0 + p1) / 2
  q1 = (p1 + p2) / 2
  q2 = (p2 + p3) / 2
  r0 = (q0 + q1) / 2
  r1 = (q1 + q2) / 2
  s  = (r0 + r1) / 2         ← split point

First half quadratic:  { p1: p0,  p2: q0,  p3: s }
Second half quadratic: { p1: s,   p2: q2,  p3: p3 }
```

### Step 1.3: Compute Glyph Bounding Box

For each glyph, compute the axis-aligned bounding box from the glyph metrics (or from control point extrema). This bounding box defines:
- The quad geometry in pixel space
- The em-space texture coordinate range
- The spatial domain for band assignment

**Note**: The bounding box should be computed from the font's metrics (`getBoundingBox()`), not just the control point positions, because a quadratic curve can extend beyond its endpoints due to the off-curve control point.

---

## 3. Phase 2: Band Computation (CPU)

**Where**: TypeScript (`src/shared/slug/glyph/bands.ts`)
**When**: Once per glyph at font load time
**Patent reference**: Patent column 7, lines 55–65 — "partitioning the area containing a shape into several bands that are aligned parallel to the directions of the rays used for intersection testing"

### Why Bands?

The fragment shader must test ray–curve intersections for every pixel. Without bands, it would test *every* curve in the glyph — far too expensive. Bands partition the glyph's bounding box into horizontal and vertical strips so each pixel only tests curves that could possibly intersect it.

### Step 2.1: Determine Band Count

```
bandCount = min(BAND_COUNT, curves.length)
```

Default `BAND_COUNT = 32`. The count is clamped to the curve count because having more bands than curves wastes memory.

Both horizontal and vertical band counts are computed independently (currently equal).

### Step 2.2: Compute Per-Curve Bounding Boxes

For each curve, compute its axis-aligned bounding box. This requires checking not just endpoints (p1, p3) but also the curve extremum:

```
For x-axis: t_extreme = (p1x - p2x) / (p1x - 2*p2x + p3x)
If 0 < t_extreme < 1, evaluate C(t_extreme) to find min/max
Same for y-axis.
```

### Step 2.3: Assign Curves to Bands

For each curve, determine which bands its bounding box overlaps:

```
For horizontal bands (used with horizontal rays):
  hStart = floor(curveMinY * hBandScale + hBandOffset)
  hEnd   = floor(curveMaxY * hBandScale + hBandOffset)
  → Assign curve to hBands[hStart..hEnd]

For vertical bands (used with vertical rays):
  vStart = floor(curveMinX * vBandScale + vBandOffset)
  vEnd   = floor(curveMaxX * vBandScale + vBandOffset)
  → Assign curve to vBands[vStart..vEnd]
```

**Critical: Float32 precision matching**. Band scale/offset values must be computed through a Float32 round-trip to match the GPU's float32 arithmetic exactly. If the CPU uses float64 to compute band indices, curves will be assigned to bands the shader never selects, causing missing-curve artifacts.

```typescript
const _f32 = new Float32Array(4);
_f32[0] = hBandCount / height;        // hBandScale
_f32[1] = -boundsMinY * _f32[0];      // hBandOffset
// Use _f32[0] and _f32[1] from here on
```

### Step 2.4: Sort Curves Within Each Band

**Patent reference**: Implicit in the early-out optimization — curves sorted by descending maximum coordinate enable the fragment shader's break condition.

```
Horizontal bands: sort curves by descending max(p1x, p2x, p3x)
Vertical bands:   sort curves by descending max(p1y, p2y, p3y)
```

This sort order allows the fragment shader to break early: once the maximum coordinate of a curve is too far behind the pixel, all subsequent curves in the sorted list are also too far.

---

## 4. Phase 3: Texture Packing (CPU)

**Where**: TypeScript (`src/shared/slug/texture/pack.ts`)
**When**: Once per font load
**Patent reference**: Patent column 3, lines 44–48 — "control point data 104"

Two GPU textures must be constructed:

### Step 3.1: Curve Texture (Control Points)

**Format**: Float32 RGBA (4 components per texel)
**Width**: 4096 texels (must match `kLogBandTextureWidth = 12` in shader)

Each quadratic Bézier curve occupies **2 consecutive texels**:

```
Texel N:   [p1.x, p1.y, p2.x, p2.y]     ← on-curve start + off-curve control
Texel N+1: [p3.x, p3.y, 0,    0   ]     ← on-curve end
```

**Row alignment constraint**: Both texels of a curve must be on the **same texture row**. If a curve's first texel would land on the last column of a row, skip that column so both texels are on the next row. The shader reads `p3` as `curveLoc.x + 1` — no row-wrapping logic.

### Step 3.2: Band Texture (Band Metadata + Curve Lists)

**Format**: Uint32 RGBA stored as Float32 (shader reads with `floatBitsToUint()` or equivalent)
**Width**: 4096 texels (same as curve texture)

The band texture contains, for each glyph, a contiguous block:

#### A. Band Headers

One texel per band, horizontal bands first, then vertical bands:

```
Header texel: [curveCount, curveListOffset, 0, 0]

curveCount:      Number of curves in this band
curveListOffset: Offset (relative to glyph's bandOffset) to the curve reference list
```

**Row alignment constraint**: All headers for a single glyph must fit within **one texture row**. The shader accesses them as `glyphLoc.x + bandIndex` with a fixed `glyphLoc.y` — no row wrapping. If headers would overflow a row, pad to the start of the next row.

#### B. Curve Reference Lists

Following the headers, one texel per curve reference in each band:

```
Reference texel: [curveTexelX, curveTexelY, 0, 0]

curveTexelX: Column of the curve's p12 texel in the curve texture
curveTexelY: Row of the curve's p12 texel in the curve texture
```

**Row alignment constraint**: Each band's entire curve list must fit within one texture row. Pad to next row if needed.

### Step 3.3: Record Offsets for Vertex Data

After packing, each glyph records:
- `curveOffset`: Index of its first curve texel in the curve texture
- `bandOffset`: Index of its first band header texel in the band texture

These are packed into vertex attributes so the shader can locate each glyph's data.

---

## 5. Phase 4: Quad Construction & Vertex Layout (CPU)

**Where**: TypeScript (`src/shared/slug/glyph/quad.ts`)
**When**: Each time text changes (per string)

### Step 4.1: Build One Quad Per Glyph

Each renderable glyph is drawn as a single quad (4 vertices, 2 triangles). The patent notes this is a key advantage over triangulation-based methods:

> "using only two triangles to cover a glyph's bounding box" (Patent col. 2, line 35)

### Step 4.2: Per-Vertex Attribute Layout

Each vertex has **5 vec4 attributes** (20 floats, 80 bytes stride):

| Attribute | Location | Contents | Purpose |
|-----------|----------|----------|---------|
| `aPositionNormal` | 0 | `[posX, posY, normalX, normalY]` | Screen-space position + dilation normal direction |
| `aTexcoord` | 1 | `[emU, emV, packedGlyphLoc, packedBandMax]` | Em-space coords + packed glyph texture location + band limits |
| `aJacobian` | 2 | `[j00, j01, j10, j11]` | 2×2 inverse Jacobian (maps screen-space dilation back to em-space) |
| `aBanding` | 3 | `[bandScaleX, bandScaleY, bandOffsetX, bandOffsetY]` | Transform from em-space coordinate to band index |
| `aColor` | 4 | `[r, g, b, a]` | Per-vertex color |

### Step 4.3: Position & Normal Vectors

For each glyph quad, 4 corner vertices:

```
Corner 0 (top-left):     pos=(x0,y0), normal=(-1,-1)
Corner 1 (top-right):    pos=(x1,y0), normal=(+1,-1)
Corner 2 (bottom-right): pos=(x1,y1), normal=(+1,+1)
Corner 3 (bottom-left):  pos=(x0,y1), normal=(-1,+1)
```

The normal vectors point **outward** from the quad center. The vertex shader uses them to dilate the quad outward by 0.5 pixels for antialiasing.

**Y-axis flip**: Font coordinates have Y-up, but screen coordinates have Y-down. So:
```
y0 = -bounds.maxY * scale    (screen top = font top)
y1 = -bounds.minY * scale    (screen bottom = font bottom)
```

### Step 4.4: Packed Integer Data

Two packed values are stored as float-reinterpreted uint32:

**Glyph location** (`aTexcoord.z`):
```
uint32 = (glyphLocY << 16) | (glyphLocX & 0xFFFF)
glyphLocX = bandOffset % textureWidth
glyphLocY = floor(bandOffset / textureWidth)
```

**Band max** (`aTexcoord.w`):
```
uint32 = ((vBandCount-1) << 16) | ((hBandCount-1) & 0xFFFF)
```

The shader unpacks these with `floatBitsToUint()`.

### Step 4.5: Inverse Jacobian Matrix

The Jacobian maps screen-space displacement back to em-space, needed to correct sampling coordinates after dilation:

```
For axis-aligned text (no rotation):
  j00 = 1/scale       d(emX)/d(screenX)
  j01 = 0             d(emX)/d(screenY)
  j10 = 0             d(emY)/d(screenX)
  j11 = -1/scale      d(emY)/d(screenY)  — negative due to Y-flip
```

For rotated or skewed text, the Jacobian would be the full 2×2 inverse of the combined transform.

### Step 4.6: Band Transform

Maps em-space pixel position to band index:

```
bandScaleX  = vBandCount / glyphWidth     (X → vertical band index)
bandScaleY  = hBandCount / glyphHeight    (Y → horizontal band index)
bandOffsetX = -bounds.minX * bandScaleX
bandOffsetY = -bounds.minY * bandScaleY
```

Again, these must go through a Float32 round-trip.

### Step 4.7: Index Buffer

Standard quad indices: `[0,1,2, 0,2,3]` per glyph, offset by `baseVertex`.

### Step 4.8: Text Layout (Cursor Advance)

```
For each character:
  emit quad at cursorX
  cursorX += advanceWidth * scale
```

Non-renderable characters (e.g., space) advance the cursor but emit no quad.

---

## 6. Phase 5: Dynamic Dilation (Vertex Shader)

**Where**: GLSL vertex shader (`src/shared/shader/slug/vert.glsl`)
**When**: Every frame, per vertex
**Patent reference**: Not in patent (added 2019 in "Dynamic Glyph Dilation" paper)

### Purpose

The GPU rasterizer only generates fragments for pixels whose **center** falls inside a triangle. Pixels at the glyph boundary may have significant coverage but get skipped because their center is just outside the quad. Dynamic dilation expands the quad by exactly 0.5 pixels in viewport space to capture these boundary pixels.

### Step 5.1: Build MVP Matrix

Combine PixiJS projection and world transform into a 4×4 matrix:

```glsl
mat3 m = uProjectionMatrix * uTransformMatrix;
mat4 mvp = mat4(
    m[0][0], m[0][1], 0.0, 0.0,
    m[1][0], m[1][1], 0.0, 0.0,
    0.0,     0.0,     1.0, 0.0,
    m[2][0], m[2][1], 0.0, 1.0
);
```

### Step 5.2: Calculate Dilation Distance

**Goal**: Find distance `d` along the vertex normal such that the vertex moves 0.5 pixels outward in viewport space.

```glsl
vec2 n = normalize(pos.zw);            // unit normal direction

vec4 Mpos = mvp * vec4(pos.xy, 0, 1);  // projected position
vec4 Mn   = mvp * vec4(n, 0, 0);       // projected normal

float s = Mpos.w;                       // perspective W
float t = Mn.w;                         // normal's W projection

float u = (s * Mn.x - t * Mpos.x) * viewportWidth/2;
float v = (s * Mn.y - t * Mpos.y) * viewportHeight/2;

float s2 = s * s;
float st = s * t;
float uv = u*u + v*v;

// Solve quadratic: (uv - st²)d² - 2s³t·d - s⁴ = 0
vec2 d = pos.zw * (s2 * (st + sqrt(uv)) / (uv - st*st));
```

### Step 5.3: Apply Dilation to Position

```glsl
vec2 dilatedPos = pos.xy + d;
gl_Position = mvp * vec4(dilatedPos, 0.0, 1.0);
```

### Step 5.4: Offset Em-Space Sampling Coordinates

The em-space coordinates must be adjusted to account for the dilation so the fragment shader samples the correct glyph location:

```glsl
vTexcoord = vec2(
    tex.x + dot(d, jac.xy),     // em-space X offset via Jacobian
    tex.y + dot(d, jac.zw)      // em-space Y offset via Jacobian
);
```

### Step 5.5: Unpack & Pass Through Data

The vertex shader unpacks the packed integer glyph data and passes banding info as flat varyings:

```glsl
// Unpack glyph location (glyphLoc.x, glyphLoc.y) and band max from packed uint32s
uvec2 g = floatBitsToUint(tex.zw);
vGlyph = ivec4(g.x & 0xFFFF, g.x >> 16, g.y & 0xFFFF, g.y >> 16);

// Pass banding transform unchanged
vBanding = bnd;

// Pass vertex color
vColor = aColor;
```

---

## 7. Phase 6: Winding Number Computation (Fragment Shader)

**Where**: GLSL fragment shader (`src/shared/shader/slug/frag.glsl`)
**When**: Every frame, per pixel
**Patent reference**: Patent Figure 3 (blocks 300–309), Patent column 4–6

This is the **core of the patent** — the algorithm that determines whether a pixel is inside or outside the glyph outline.

### Step 6.1: Determine Pixels-Per-Em Scale

```glsl
vec2 emsPerPixel = vec2(abs(dFdx(renderCoord.x)), abs(dFdy(renderCoord.y)));
vec2 pixelsPerEm = 1.0 / max(emsPerPixel, vec2(1.0 / 65536.0));
```

`dFdx`/`dFdy` compute the rate of change of em-space coordinates across pixels, giving the effective resolution. This is used to convert curve intersection positions to pixel-space distances for coverage calculation.

### Step 6.2: Determine Band Index

```glsl
ivec2 bandIndex = clamp(
    ivec2(renderCoord * bandTransform.xy + bandTransform.zw),
    ivec2(0, 0),
    bandMax
);
```

The pixel's em-space position selects which horizontal band (for x-rays) and which vertical band (for y-rays) to query.

### Step 6.3: Horizontal Ray Processing

**Patent Figure 3, Block 303**: "Construct ray starting at origin" — a horizontal ray parallel to the +x axis.

For each curve in the horizontal band:

#### A. Fetch Curve Control Points (Block 302)

```glsl
// Translate control points so pixel is at origin (Patent block 302)
vec4 p12 = texelFetch(uCurveTexture, curveLoc, 0) - vec4(renderCoord, renderCoord);
vec2 p3  = texelFetch(uCurveTexture, ivec2(curveLoc.x+1, curveLoc.y), 0).xy - renderCoord;
```

After this translation, the pixel is at (0,0) and the ray extends along +x from the origin — exactly as described in the patent.

#### B. Early-Out Test

```glsl
if (max(max(p12.x, p12.z), p3.x) * pixelsPerEm.x < -0.5) break;
```

If the rightmost x-coordinate of the curve is more than 0.5 pixels to the left of the pixel center, this curve and all subsequent sorted curves cannot contribute. Break out of the loop.

#### C. Classify Control Points (Block 304)

**Patent column 5, lines 30–40**: "classifying the control points... a binary classification of the values y₁, y₂, and y₃, specifically whether each is negative or not negative."

```glsl
uint CalcRootCode(float y1, float y2, float y3) {
    uint i1 = floatBitsToUint(y1) >> 31u;    // 1 if negative, 0 if non-negative
    uint i2 = floatBitsToUint(y2) >> 30u;    // shifted to align with bit position
    uint i3 = floatBitsToUint(y3) >> 29u;    // shifted to align with bit position

    // Combine into 3-bit shift code
    uint shift = (i2 & 2u) | (i1 & ~2u);
    shift = (i3 & 4u) | (shift & ~4u);

    // Lookup in magic number 0x2E74
    return ((0x2E74u >> shift) & 0x0101u);
}
```

**How the shift code works** (Patent column 6, lines 60–65 and Equation 4):

The shift code is built from the sign bits of y₁, y₂, y₃:
```
shift = (y₁ < 0 ? 1 : 0) + (y₂ < 0 ? 2 : 0) + (y₃ < 0 ? 4 : 0)
```

The implementation extracts sign bits directly from IEEE 754 representation for maximum performance (no branching).

#### D. Root Eligibility Lookup (Block 305)

**Patent column 6, lines 60–65**: "The values in columns T1 and T2 of Table 1 form a 16-bit lookup table that can be expressed as the hexadecimal number 2E74."

The magic number `0x2E74` encodes the 8 equivalence classes:

| Shift | Class | y₃<0 | y₂<0 | y₁<0 | T1 (bit 0) | T2 (bit 8) | Meaning |
|-------|-------|------|------|------|------------|------------|---------|
| 0 | A | no | no | no | 0 | 0 | No transitions — skip |
| 1 | B | no | no | yes | 0 | 1 | t₂ contributes (decrement) |
| 2 | C | no | yes | no | 1 | 0 | t₁ contributes (increment) — special case |
| 3 | D | no | yes | yes | 1 | 1 | Both roots contribute |
| 4 | E | yes | no | no | 1 | 1 | Both roots contribute |
| 5 | F | yes | no | yes | 1 | 0 | t₁ contributes — special case |
| 6 | G | yes | yes | no | 0 | 1 | t₂ contributes |
| 7 | H | yes | yes | yes | 0 | 0 | No transitions — skip |

The `& 0x0101u` mask extracts bit 0 (T1 eligibility) and bit 8 (T2 eligibility) simultaneously.

- If `code == 0`: Neither root eligible → skip curve entirely
- If `code & 1`: Root t₁ is eligible → may increment winding
- If `code > 1` (bit 8 set): Root t₂ is eligible → may decrement winding

#### E. Solve Quadratic for Roots (Block 306)

**Patent Equation 2–3**: Find parametric values where the curve crosses the horizontal ray (y=0 after translation):

```glsl
vec2 SolveHorizPoly(vec4 p12, vec2 p3) {
    vec2 a = p12.xy - p12.zw * 2.0 + p3;    // a = p1 - 2*p2 + p3
    vec2 b = p12.xy - p12.zw;                // b = p1 - p2
    float ra = 1.0 / a.y;                    // reciprocal of quadratic coefficient
    float rb = 0.5 / b.y;                    // for linear case

    float d = sqrt(max(b.y*b.y - a.y*p12.y, 0.0));  // discriminant (clamped ≥ 0)
    float t1 = (b.y - d) * ra;               // Patent Eq. 3: first root
    float t2 = (b.y + d) * ra;               // Patent Eq. 3: second root

    // Linear case: if a ≈ 0, use c/2b (Patent: "If a is near zero")
    if (abs(a.y) < 1.0/65536.0) { t1 = p12.y * rb; t2 = p12.y * rb; }

    // Clamp t to [0,1] — safe because eligibility is handled by equivalence classes
    t1 = clamp(t1, 0.0, 1.0);
    t2 = clamp(t2, 0.0, 1.0);

    // Compute x-coordinate of intersection: Cx(t) (Patent block 307)
    return vec2(
        (a.x * t1 - b.x * 2.0) * t1 + p12.x,    // Cx(t1)
        (a.x * t2 - b.x * 2.0) * t2 + p12.x      // Cx(t2)
    );
}
```

**Key insight from patent**: The discriminant `b²-ac` is clamped to zero (not allowed to go negative). In equivalence classes C and F, where y₁ and y₃ have the same state but y₂ differs, the discriminant may be negative. Clamping to zero forces `t1 = t2 = b/a`, and the equal-and-opposite winding contributions cancel out exactly (Patent column 7, lines 50–58).

#### F. Compute Intersection Points (Block 307)

The `SolveHorizPoly` returns `Cx(t1)` and `Cx(t2)` — the x-coordinates where the curve crosses the horizontal ray. These are then scaled to pixel space:

```glsl
vec2 r = SolveHorizPoly(p12, p3) * pixelsPerEm.x;
```

#### G. Modify Winding Number (Block 308)

**Patent Figure 4**: The winding number modification follows a specific pattern:

```glsl
// Patent block 400-402: If root t1 eligible AND Cx(t1) > 0
if ((code & 1u) != 0u) {
    xcov += clamp(r.x + 0.5, 0.0, 1.0);    // fractional coverage (Eq. 5)
}

// Patent block 403-405: If root t2 eligible AND Cx(t2) > 0
if (code > 1u) {
    xcov -= clamp(r.y + 0.5, 0.0, 1.0);    // fractional coverage (subtract)
}
```

**Patent column 4, lines 42–55**: "whenever the root at t₁ is determined eligible ... the winding number is incremented by one ... whenever the root at t₂ is determined eligible ... the winding number is decremented by one."

In the fractional coverage version (Patent Equation 5), `sat(m·Cx(ti) + 0.5)` replaces the binary increment/decrement with a smooth fractional value for antialiasing.

### Step 6.4: Vertical Ray Processing

Same algorithm, but with x and y swapped. Fires rays along the +y axis for vertical coverage:

```glsl
uint code = CalcRootCode(p12.x, p12.z, p3.x);    // classify by x-coordinates
vec2 r = SolveVertPoly(p12, p3) * pixelsPerEm.y;  // solve for y-intersection
```

Vertical coverage accumulates into `ycov` with **inverted** signs relative to horizontal coverage (due to the coordinate system convention).

---

## 8. Phase 7: Coverage Calculation & Output (Fragment Shader)

**Where**: GLSL fragment shader (`src/shared/shader/slug/frag.glsl`)
**Patent reference**: Patent column 7, lines 45–55 — "accumulate fractional coverage values"

### Step 7.1: Combine X and Y Coverage

**Patent**: "The fractional coverage value can be calculated for rays parallel to both the x and y axes and combined to produce a rendered image with antialiasing applied in all directions."

The current implementation uses a weighted combination:

```glsl
float CalcCoverage(float xcov, float ycov, float xwgt, float ywgt, int flags) {
    float coverage = max(
        abs(xcov * xwgt + ycov * ywgt) / max(xwgt + ywgt, 1.0/65536.0),
        min(abs(xcov), abs(ycov))
    );
    coverage = clamp(coverage, 0.0, 1.0);
    return coverage;
}
```

The weight values (`xwgt`, `ywgt`) measure how close the nearest intersection is to the pixel center, providing a smooth blending between horizontal and vertical coverage estimates.

### Step 7.2: Apply Color

```glsl
fragColor = vColor * coverage;
```

The coverage value modulates the alpha (and all color channels if premultiplied alpha is used).

---

## 9. Data Flow Diagram

```
┌─────────────────────── CPU (TypeScript) ───────────────────────┐
│                                                                 │
│  Font File (.ttf)                                               │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────┐                                               │
│  │ Parse Font   │  opentype.js                                  │
│  │ (font.ts)    │                                               │
│  └──────┬───────┘                                               │
│         │ path commands per glyph                               │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │ Extract      │  M/L/Q/C/Z → quadratic Béziers               │
│  │ Curves       │  cubic → 2 quadratics (de Casteljau)          │
│  │ (curves.ts)  │  line → degenerate quadratic                  │
│  └──────┬───────┘                                               │
│         │ SlugGlyphCurve[]                                      │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │ Compute      │  Partition glyph into horizontal/vertical     │
│  │ Bands        │  bands, assign curves, sort for early-out     │
│  │ (bands.ts)   │  Float32 round-trip for precision match       │
│  └──────┬───────┘                                               │
│         │ SlugGlyphBands                                        │
│         ▼                                                       │
│  ┌──────────────┐     ┌───────────────────┐                     │
│  │ Pack into    │────▶│ Curve Texture     │  Float32 RGBA       │
│  │ Textures     │     │ [p1x,p1y,p2x,p2y]│  4096 × N rows     │
│  │ (pack.ts)    │     │ [p3x,p3y, 0 , 0 ]│                     │
│  │              │     └───────────────────┘                     │
│  │              │     ┌───────────────────┐                     │
│  │              │────▶│ Band Texture      │  Uint32-as-Float32  │
│  │              │     │ Headers + Lists   │  4096 × M rows      │
│  └──────┬───────┘     └───────────────────┘                     │
│         │ offsets recorded                                      │
│         ▼                                                       │
│  ┌──────────────┐     ┌───────────────────┐                     │
│  │ Build Quads  │────▶│ Vertex Buffer     │  5 × vec4 per vert  │
│  │ (quad.ts)    │     │ Index Buffer      │  6 indices per quad │
│  └──────────────┘     └───────────────────┘                     │
│                                                                 │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                    ══════════════╪═══════════════
                       GPU Upload │ (textures + buffers)
                    ══════════════╪═══════════════
                                  │
┌─────────────────────── GPU (GLSL) ─────────────────────────────┐
│                                  │                              │
│                                  ▼                              │
│  ┌────────────────────────────────────┐                         │
│  │         VERTEX SHADER (vert.glsl)  │                         │
│  │                                    │                         │
│  │  1. Build MVP from PixiJS uniforms │                         │
│  │  2. Normalize normal vector        │                         │
│  │  3. Compute dilation distance d    │                         │
│  │  4. Dilate: pos' = pos + d·n̂      │                         │
│  │  5. Offset texcoord via Jacobian   │                         │
│  │  6. Unpack glyph/band metadata     │                         │
│  │  7. Output gl_Position, varyings   │                         │
│  └──────────────┬─────────────────────┘                         │
│                 │ rasterization + interpolation                  │
│                 ▼                                                │
│  ┌────────────────────────────────────┐                         │
│  │       FRAGMENT SHADER (frag.glsl)  │                         │
│  │                                    │                         │
│  │  For this pixel's em-space coord:  │                         │
│  │                                    │                         │
│  │  1. Compute pixelsPerEm scale      │                         │
│  │  2. Determine band indices         │                         │
│  │  3. HORIZONTAL RAY LOOP:           │                         │
│  │     a. Fetch curves from h-band    │                         │
│  │     b. Translate to pixel origin   │  ← Patent Block 302    │
│  │     c. Early-out check             │                         │
│  │     d. CalcRootCode (classify)     │  ← Patent Block 304    │
│  │     e. Lookup 0x2E74               │  ← Patent Block 305    │
│  │     f. SolveHorizPoly (roots)      │  ← Patent Block 306    │
│  │     g. Compute Cx(t) intersection  │  ← Patent Block 307    │
│  │     h. Accumulate xcov             │  ← Patent Block 308    │
│  │  4. VERTICAL RAY LOOP (same, swapped)                        │
│  │  5. CalcCoverage(xcov, ycov, ...)  │                         │
│  │  6. fragColor = vColor * coverage  │                         │
│  └────────────────────────────────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Critical Constants & Lookup Tables

### The Magic Number: 0x2E74

**Patent column 6, line 62**: "the hexadecimal number 2E74"

Binary representation: `0010 1110 0111 0100`

```
Bit positions (read right to left):
Position:  F E D C B A 9 8 7 6 5 4 3 2 1 0
Value:     0 0 1 0 1 1 1 0 0 1 1 1 0 1 0 0

Shift 0 (class A): bits [1:0] = 00, bit [8] = 0  → T1=0, T2=0 (no roots)
Shift 1 (class B): bits [1:0] = 10, bit [9] = 1  → T1=0, T2=1
Shift 2 (class C): bits [1:0] = 01, bit [10]= 0  → T1=1, T2=0
Shift 3 (class D): bits [1:0] = 11, bit [11]= 1  → T1=1, T2=1
Shift 4 (class E): bits [1:0] = 11, bit [12]= 1  → T1=1, T2=1
Shift 5 (class F): bits [1:0] = 10, bit [13]= 1  → T1=1, T2=0   ← wait, reading...
```

**Actual extraction method** (from shader):
```
result = (0x2E74 >> shift) & 0x0101
```
- Bit 0 of result = T1 eligibility (root at t₁)
- Bit 8 of result = T2 eligibility (root at t₂)

The `& 0x0101u` mask extracts bits 0 and 8 simultaneously. The shader tests:
- `(code & 1u) != 0u` → root t₁ contributes (+1 to winding)
- `code > 1u` → root t₂ contributes (-1 to winding) (bit 8 makes value > 255)

### Precision Threshold

```glsl
1.0 / 65536.0
```

Used as a near-zero threshold for:
- Detecting degenerate quadratics (`|a| < threshold` → use linear solution)
- Preventing division by zero in `pixelsPerEm` and `CalcCoverage`

### Band Texture Width

```glsl
#define kLogBandTextureWidth 12    // 2^12 = 4096
```

Hardcoded in the shader's `CalcBandLoc` function for row-wrapping arithmetic. The TypeScript `BAND_TEXTURE_WIDTH` must match.

### Coverage Formula

**Patent Equation 5**:
```
f = sat(m · Cx(ti) + 0.5)
```

In the shader:
```glsl
clamp(r.x + 0.5, 0.0, 1.0)    // r.x = Cx(t1) * pixelsPerEm
```

This maps the intersection distance from pixel center to a 0–1 coverage fraction:
- Intersection at pixel center (distance 0) → coverage 0.5
- Intersection 0.5 pixels left of center → coverage 0.0
- Intersection 0.5 pixels right of center → coverage 1.0

---

## Appendix A: Patent Claims Mapped to Implementation

| Patent Claim | Implementation Location |
|-------------|------------------------|
| Claim 1: "identifying Bezier control points" | `curves.ts` — `slugGlyphCurves()` |
| Claim 1: "classifying each said Bezier control point" | `frag.glsl` — `CalcRootCode()` |
| Claim 1: "selecting at least one root" | `frag.glsl` — `0x2E74 >> shift` lookup |
| Claim 1: "computing at least one root" | `frag.glsl` — `SolveHorizPoly()` / `SolveVertPoly()` |
| Claim 1: "computing at least one intersection point" | `frag.glsl` — `Cx(t)` evaluation inside solver |
| Claim 1: "choosing a color" | `frag.glsl` — `CalcCoverage()` + `fragColor = vColor * coverage` |
| Claim 2: "classification is binary" | `frag.glsl` — sign bit extraction (`floatBitsToUint >> 31`) |
| Claim 4: "using a table of values" | `frag.glsl` — `0x2E74u` constant |
| Claim 6: "fractional pixel coverage" | `frag.glsl` — `clamp(r.x + 0.5, 0.0, 1.0)` |
| Claim 9: "executed by a graphics processing unit" | `vert.glsl` + `frag.glsl` — GPU execution |

## Appendix B: Eight Equivalence Classes (Patent Table 1)

The patent's core innovation. Every possible quadratic Bézier curve, after translation so the pixel is at origin, falls into exactly one of these 8 classes based on the signs of y₁, y₂, y₃:

| Class | y₁≥0 | y₂≥0 | y₃≥0 | Shift | t₁ eligible | t₂ eligible | Geometric meaning |
|-------|------|------|------|-------|-------------|-------------|-------------------|
| A | yes | yes | yes | 0 | no | no | Curve entirely above ray — no crossing |
| B | no | yes | yes | 1 | no | yes | Crosses once at t₂ (right-to-left) |
| C | yes | no | yes | 2 | yes | no | Dips below ray, crosses at t₁ (left-to-right) |
| D | no | no | yes | 3 | yes | yes | Crosses at t₁ up, at t₂ down |
| E | yes | yes | no | 4 | yes | yes | Crosses at t₁ down, at t₂ up |
| F | no | yes | no | 5 | yes | no | Rises above ray, crosses at t₁ |
| G | yes | no | no | 6 | no | yes | Crosses once at t₂ (left-to-right) |
| H | no | no | no | 7 | no | no | Curve entirely below ray — no crossing |

**Why this works** (Patent column 5–6): Because eligibility is determined by the *sign classification* alone — not by computing whether `t ∈ [0,1)` — there is no floating-point precision failure possible. The sign of a coordinate is always exact (it's just the MSB of the IEEE 754 representation). Tangent curves at endpoints are handled automatically: when two consecutive curves share a tangent point on the ray, their equal-and-opposite contributions cancel exactly.

## Appendix C: File-to-Step Mapping

| File | Phase | Steps |
|------|-------|-------|
| `src/shared/slug/font.ts` | 1 | Orchestrates font load, curve extraction, band computation, texture packing |
| `src/shared/slug/glyph/curves.ts` | 1 | Steps 1.1–1.2: Parse paths → quadratic Béziers |
| `src/shared/slug/glyph/bands.ts` | 2 | Steps 2.1–2.4: Band assignment and sorting |
| `src/shared/slug/glyph/data.ts` | — | Type definitions for curves and glyph data |
| `src/shared/slug/texture/pack.ts` | 3 | Steps 3.1–3.3: Build curve + band textures |
| `src/shared/slug/glyph/quad.ts` | 4 | Steps 4.1–4.8: Build vertex/index buffers |
| `src/shared/shader/slug/vert.glsl` | 5 | Steps 5.1–5.5: Dynamic dilation + vertex transform |
| `src/shared/shader/slug/frag.glsl` | 6–7 | Steps 6.1–7.2: Winding number + coverage + output |
| `src/v8/slug/shader.ts` | — | PixiJS v8 shader factory |
| `src/v8/slug/text.ts` | — | PixiJS v8 text component (orchestrates rebuild, creates GPU resources) |
| `src/defaults.ts` | — | Default constants (TEXTURE_SIZE=4096, BAND_COUNT=32, FONT_SIZE=24) |
