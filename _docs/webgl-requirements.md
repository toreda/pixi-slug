# WebGL + PixiJS + TypeScript Implementation Requirements

This document specifies the requirements for implementing the Slug algorithm in TypeScript/JavaScript targeting WebGL via PixiJS. It covers the HLSL→GLSL translation, every typed array in the data pipeline, and a thorough analysis of where JavaScript's float64 `number` type can silently corrupt data destined for float32/uint32 GPU consumption.

---

## Table of Contents

1. [Platform Constraints: WebGL vs. the Original C++/HLSL](#1-platform-constraints)
2. [HLSL → GLSL ES 3.00 Translation](#2-hlsl--glsl-es-300-translation)
3. [Typed Array Audit: Every CPU→GPU Data Path](#3-typed-array-audit)
4. [Precision Analysis: Where JS float64 Can Cause Drift](#4-precision-analysis)
5. [Band Texture Upload: The Uint32-as-Float32 Problem](#5-band-texture-upload)
6. [Packed Integer Attributes: Bit-Pattern Fidelity](#6-packed-integer-attributes)
7. [WebGL Texture Format Requirements](#7-webgl-texture-format-requirements)
8. [PixiJS Integration Requirements](#8-pixijs-integration-requirements)
9. [Identified Risks & Mitigations](#9-identified-risks--mitigations)
10. [Checklist of Invariants](#10-checklist-of-invariants)

---

## 1. Platform Constraints

### 1.1 Original Implementation (C++ / HLSL / DirectX)

| Aspect | Original |
|--------|----------|
| CPU language | C++ (native float/double, exact uint32) |
| GPU language | HLSL |
| Texture formats | R32G32B32A32_FLOAT, R16G16B16A16_UINT, etc. |
| Integer textures | Native UINT textures read directly as uint |
| Vertex attributes | Typed precisely (FLOAT, UINT, etc.) |
| Bit reinterpretation | `asuint()` / `asfloat()` — zero-cost, always exact |

### 1.2 Our Implementation (TypeScript / GLSL ES 3.00 / WebGL2)

| Aspect | Ours |
|--------|------|
| CPU language | TypeScript/JavaScript — **all numbers are float64**, typed arrays truncate on write |
| GPU language | GLSL ES 3.00 (`#version 300 es`) |
| Texture formats | `rgba32float` (universal), `rgba32uint` or `rgba16uint` (requires `EXT_color_buffer_float` or careful fallback) |
| Integer textures | **Not guaranteed** — WebGL2 supports integer internal formats but PixiJS may not expose them cleanly |
| Vertex attributes | All passed through `Float32Array` — integer data must be bit-packed into float32 |
| Bit reinterpretation | `floatBitsToUint()` / `uintBitsToFloat()` in GLSL; `Float32Array`/`Uint32Array` shared `ArrayBuffer` in JS |

### 1.3 Key Differences That Affect Correctness

| Concern | C++ | JavaScript | Impact |
|---------|-----|------------|--------|
| Integer arithmetic | Exact uint32 | float64 (exact to 2^53) | Safe for values < 2^53 |
| Float32 storage | `float` type is 32-bit | `number` is 64-bit; truncated on `Float32Array` write | **Drift risk** — see Section 4 |
| Uint32 storage | Native `uint32_t` | No native uint32; `Uint32Array` element access is exact | Safe via typed arrays |
| Bitwise ops on floats | `asuint(float)` — exact | Requires `ArrayBuffer` aliasing trick | Safe if done correctly |
| Integer texture upload | Direct `glTexImage2D` with `GL_RGBA32UI` | PixiJS `BufferImageSource` — must choose correct format | **Risk** — see Section 5 |

---

## 2. HLSL → GLSL ES 3.00 Translation

### 2.1 Already-Translated Constructs

The current shaders are already GLSL ES 3.00. Key translations already done:

| HLSL | GLSL ES 3.00 | Status |
|------|-------------|--------|
| `SV_Position` | `gl_Position` | Done |
| `float4` | `vec4` | Done |
| `int4` | `ivec4` | Done |
| `uint4` | `uvec4` | Done |
| `Texture2D.Load()` | `texelFetch(sampler2D, ivec2, 0)` | Done |
| `asuint(float)` | `floatBitsToUint(float)` | Done |
| `asfloat(uint)` | `uintBitsToFloat(uint)` | Done |
| `saturate(x)` | `clamp(x, 0.0, 1.0)` | Done |
| `nointerpolation` | `flat` | Done |
| `ddx()` / `ddy()` | `dFdx()` / `dFdy()` | Done |
| `cbuffer` | `uniform` | Done |
| `float3x3` | `mat3` | Done (column-major) |

### 2.2 Matrix Convention Difference

HLSL uses **row-major** matrices by default. GLSL uses **column-major**. The vertex shader already handles this by constructing the `mat4 mvp` in column-major order from PixiJS's column-major `mat3` uniforms. This is correct.

### 2.3 Precision Qualifiers

GLSL ES 3.00 requires explicit precision qualifiers. The shaders declare:
```glsl
precision highp float;    // float32 — REQUIRED for Slug
precision highp int;      // 32-bit integers — REQUIRED for bit ops
precision highp sampler2D;// full-precision texture fetches
```

`mediump` would be float16 on many mobile GPUs — **catastrophically insufficient** for curve coordinates and root solving.

### 2.4 Remaining GLSL Concerns

| Issue | Detail | Severity |
|-------|--------|----------|
| `#version 300 es` placement | Must be **first line** of the shader string (before any comments) | **Bug in vert.glsl** — currently comments precede the `#version` directive. The `#version` line appears at line 16, after 15 lines of comments. This works only if the GLSL compiler is lenient. Strictly, `#version` must be the first non-whitespace, non-comment line. |
| `dFdx`/`dFdy` precision | GLSL ES 3.00 spec says derivatives are undefined outside fragment shader and may be coarse (2×2 quad granularity) | Expected. Affects antialiasing quality slightly at edges of quads, not correctness. |
| Integer overflow in shifts | `0x2E74u >> shift` — shift values 0–7 are safe (no undefined behavior in GLSL) | Safe |
| `sqrt(0.0)` | Well-defined in GLSL ES 3.00, returns 0.0 | Safe |
| Division by zero | `1.0 / a.y` when `a.y` is near zero — protected by the `abs(a.y) < 1.0/65536.0` guard | Safe |

---

## 3. Typed Array Audit

Every CPU→GPU data transfer in the pipeline, with the JS typed array used and the GPU type that consumes it.

### 3.1 Curve Texture

| Property | Value |
|----------|-------|
| JS typed array | `Float32Array` |
| GPU upload format | `rgba32float` |
| Shader reads as | `float` via `texelFetch(uCurveTexture, ...)` |
| Data stored | Bézier control point coordinates (p1x, p1y, p2x, p2y, p3x, p3y) |
| Source values | `number` (float64) from opentype.js glyph data |
| Truncation point | When written to `Float32Array` in `pack.ts:120–131` |

**Precision path**: `opentype.js (float64)` → `SlugGlyphCurve.p1x (float64)` → `curveData[i] = value (float64→float32 truncation)` → GPU `texelFetch` (float32)

**Verdict**: **Safe**. Font coordinates are small integers or simple fractions (typically 0–2048 range for 1000 or 2048 unitsPerEm fonts). Float32 has 24 bits of mantissa, which represents integers up to 2^24 = 16,777,216 exactly. All TrueType coordinates fit within this range. The truncation from float64→float32 loses at most ~1e-7 relative precision, which is irrelevant for glyph coordinates.

### 3.2 Band Texture

| Property | Value |
|----------|-------|
| JS typed array | `Uint32Array` |
| GPU upload format | `rgba32float` (after manual conversion!) |
| Shader reads as | `float`, then cast to `uint` via `uint(raw.x)` |
| Data stored | Curve counts, offsets, texel coordinates |
| Source values | Integer indices (0–4095 range for texture coordinates) |

**Precision path**: `Uint32Array[i] = intValue` → manually copied to `Float32Array` as `f[i] = bandData[i]` (integer→float64→float32) → GPU `texelFetch` returns `float` → shader does `uint(raw.x)` cast

**THIS IS THE MOST DANGEROUS PATH IN THE ENTIRE PIPELINE.** See Section 5.

### 3.3 Vertex Buffer

| Property | Value |
|----------|-------|
| JS typed array | `Float32Array` |
| GPU attribute format | `float32x4` |
| Shader reads as | `vec4` (float) |

The vertex buffer carries 5 vec4 attributes. Each has different precision characteristics:

#### Attribute 0: `aPositionNormal` — Position XY + Normal ZW

| Component | Source | Range | Precision concern |
|-----------|--------|-------|-------------------|
| pos.x | `cursorX + bounds.minX * scale` | 0 to ~10,000 pixels | None — float32 has sub-pixel precision up to ~16M |
| pos.y | `-bounds.maxY * scale` | ~-1000 to ~1000 | None |
| normal.x | Literal -1 or +1 | Exact | None |
| normal.y | Literal -1 or +1 | Exact | None |

**Verdict**: **Safe**.

#### Attribute 1: `aTexcoord` — Em-space UV + Packed Integers

| Component | Source | Precision concern |
|-----------|--------|-------------------|
| tex.x (em-space U) | `bounds.minX` or `bounds.maxX` (float64→float32) | Safe — small integers |
| tex.y (em-space V) | `bounds.minY` or `bounds.maxY` (float64→float32) | Safe — small integers |
| tex.z (packed glyphLoc) | `packUint16Pair(glyphLocX, glyphLocY)` | **Critical** — see Section 6 |
| tex.w (packed bandMax) | `packUint16Pair(vBandCount-1, hBandCount-1)` | **Critical** — see Section 6 |

#### Attribute 2: `aJacobian` — Inverse Jacobian 2×2

| Component | Source | Precision concern |
|-----------|--------|-------------------|
| jac.x | `1 / scale` | Moderate — e.g., `1 / (24/2048) = 85.33...` truncated to float32 |
| jac.y | 0 | Exact |
| jac.z | 0 | Exact |
| jac.w | `-1 / scale` | Same as jac.x, negated |

**Verdict**: **Safe**. The Jacobian is used to offset em-space coords after dilation. The dilation distance `d` is typically < 1 pixel. The Jacobian values (e.g., 85.33) mapped through float32 lose at most ~1e-5 relative precision. The resulting em-space offset error is < 0.001 em units — invisible.

#### Attribute 3: `aBanding` — Band Scale/Offset

| Component | Source | Precision concern |
|-----------|--------|-------------------|
| bandScaleX | `vBandCount / glyphWidth` | **Critical** — see Section 4 |
| bandScaleY | `hBandCount / glyphHeight` | **Critical** — see Section 4 |
| bandOffsetX | `-bounds.minX * bandScaleX` | **Critical** — see Section 4 |
| bandOffsetY | `-bounds.minY * bandScaleY` | **Critical** — see Section 4 |

#### Attribute 4: `aColor` — RGBA

| Component | Source | Precision concern |
|-----------|--------|-------------------|
| r, g, b, a | User-supplied 0.0–1.0 | None |

**Verdict**: **Safe**.

### 3.4 Index Buffer

| Property | Value |
|----------|-------|
| JS typed array | `Uint32Array` |
| GPU usage | Element index buffer |
| Range | 0 to `quadCount * 4` |

**Verdict**: **Safe**. WebGL2 supports `UNSIGNED_INT` indices.

---

## 4. Precision Analysis: Where JS float64 Can Cause Drift

### 4.1 The Core Problem

JavaScript `number` is IEEE 754 float64 (52-bit mantissa, ~15 decimal digits). GPU `float` is IEEE 754 float32 (23-bit mantissa, ~7 decimal digits). Any value computed in JS float64 and then stored into a `Float32Array` gets **silently truncated**. If the GPU later performs the same computation on the float32 value, it may get a different result than JS computed with float64.

### 4.2 Where This Matters: Band Assignment

**This is the single most dangerous precision mismatch in the entire implementation.**

The band assignment pipeline works as follows:

```
CPU (bands.ts):   bandIndex = floor(curveCoord * bandScale + bandOffset)    // float64 arithmetic
CPU (quad.ts):    write bandScale, bandOffset to Float32Array              // truncated to float32
GPU (frag.glsl):  bandIndex = int(renderCoord * bandTransform.xy + bandTransform.zw)  // float32 arithmetic
```

If the CPU assigns curve C to band B, but the GPU computes a different band index for a pixel that should have matched band B, that pixel will look up a band that **doesn't contain curve C**. Result: **missing curve segments, visible holes in glyphs**.

#### Current Mitigation (Already Implemented)

`bands.ts` and `quad.ts` both use a `Float32Array` round-trip:

```typescript
const _f32 = new Float32Array(4);
_f32[0] = hBandCount / height;     // float64 → float32 truncation
_f32[1] = -boundsMinY * _f32[0];   // uses float32 value of [0]
```

This ensures the CPU uses the **same float32 values** the GPU will see. The band assignment arithmetic (`cMinY * hBandScale + hBandOffset`) then operates on float64 versions of these float32 values, which is strictly more precise than the GPU's float32 computation — so if anything, the CPU assigns curves to a slightly wider range of bands than the GPU selects, which is the safe direction.

#### Remaining Risk

The `curveBounds()` function in `bands.ts` computes curve bounding boxes in float64. These bounds determine which bands a curve is assigned to. The control point coordinates themselves were computed in float64 and haven't been through a float32 round-trip yet at this point. The actual coordinates stored in the curve texture ARE float32 (truncated during `pack.ts`). So:

```
CPU curveBounds:  computed from float64 coordinates
GPU sees:         float32-truncated coordinates (from curve texture)
```

If a curve's bounding box in float64 is [100.00000001, 200.0] but in float32 it truncates to [100.0, 200.0], the CPU may assign it to a slightly different band set than where the GPU's float32 coordinates would place it. However, the `floor()` operations and the fact that the band assignment is intentionally conservative (curves assigned to all overlapping bands) provide a safety margin.

**Recommendation**: For maximum safety, `curveBounds()` should also operate on float32-truncated coordinates. Currently it does not. This is a latent bug that could manifest with fonts whose coordinates produce different `floor()` results after float32 truncation.

### 4.3 Where This Does NOT Matter

#### Curve Coordinates in the Curve Texture

Font coordinates are small integers (typical range 0–2048). Float32 represents all integers up to 2^24 exactly. The truncation from float64→float32 changes nothing for integer coordinates. Even for fractional coordinates from cubic→quadratic conversion (de Casteljau midpoints), the error is ~1e-7 relative — sub-pixel at any reasonable font size.

#### Root Solving in the Fragment Shader

All root computation happens entirely in GPU float32. There's no CPU/GPU precision mismatch because the CPU doesn't compute roots. The shader's `CalcRootCode` uses `floatBitsToUint` to extract the sign bit — this is exact regardless of precision.

#### Coverage Accumulation

Coverage values are computed and consumed entirely in the fragment shader (float32). No CPU involvement, no precision mismatch.

#### Dilation Calculation

The dilation math (`SlugDilate`) runs entirely in the vertex shader. The Jacobian is passed as float32 vertex attributes. There's no float64/float32 mismatch because the Jacobian is written directly to a `Float32Array`.

### 4.4 Cursor Accumulation (Minor Risk)

```typescript
cursorX += glyph.advanceWidth * scale;
```

This accumulates in float64 on the CPU, then each glyph's `x0 = cursorX + bounds.minX * scale` is written to Float32Array. For long strings, `cursorX` grows large (e.g., 5000+ pixels for 200+ characters). Float32 has ~7 decimal digits of precision, so at x=5000, the precision is ~0.0005 pixels. This is sub-pixel and visually undetectable.

However, if someone renders extremely long single-line text (10,000+ characters), positions beyond ~100,000 pixels would have ~0.01 pixel jitter. This is unlikely in practice.

**Recommendation**: No action needed for typical use. For extreme cases, the cursor could be periodically snapped to float32 precision, but this is over-engineering.

---

## 5. Band Texture Upload: The Uint32-as-Float32 Problem

### 5.1 The Current Approach

The band texture stores integer data (curve counts, offsets, texel coordinates) in a `Uint32Array`. But PixiJS's `BufferImageSource` doesn't support `rgba32uint` directly, so the code does this:

```typescript
// text.ts:166
resource: (() => {
    const f = new Float32Array(this._font.bandData.length);
    for (let i = 0; i < this._font.bandData.length; i++)
        f[i] = this._font.bandData[i];  // uint32 → float64 → float32
    return f;
})(),
format: 'rgba32float',
```

The shader then reads it as:
```glsl
vec2 raw = texelFetch(uBandTexture, coord, 0).xy;
return uvec2(uint(raw.x), uint(raw.y));
```

### 5.2 Why This Is Dangerous

The conversion chain is: `Uint32Array[i]` → JS `number` (float64) → `Float32Array[i]` (float32) → GPU `texelFetch` returns `float` → `uint()` cast.

**Float32 can exactly represent all integers up to 2^24 = 16,777,216.** The values stored in the band texture are:

| Value | Typical Range | Max Possible | Safe? |
|-------|---------------|-------------|-------|
| `curveCount` (curves per band) | 0–200 | ~1000 | Yes |
| `curveListOffset` (relative to bandOffset) | 0–50,000 | ~200,000 | Yes — well under 2^24 |
| `curveTexelX` | 0–4095 | 4095 | Yes |
| `curveTexelY` | 0–4095 | ~100 typical | Yes |

All values are well under 2^24, so the uint32→float32 conversion is **lossless** for the current data range.

### 5.3 When This Would Break

If ANY band texture value exceeds 16,777,216 (2^24), the float32 representation would lose the low bits:
- 16,777,217 stored as float32 → reads back as 16,777,216 (off by 1)
- This would corrupt curve counts or texture coordinates

**Risk**: A font with enormous numbers of curves per glyph (>16M) or a texture taller than ~4096 rows could theoretically hit this. In practice, no font approaches these limits.

### 5.4 The Correct Approach (If Integer Textures Are Needed)

The proper solution would be to upload as an actual integer texture:

```typescript
// Ideal (if PixiJS supported it):
format: 'rgba32uint'  // WebGL2 GL_RGBA32UI
```

And in the shader:
```glsl
uniform usampler2D uBandTexture;  // unsigned integer sampler
uvec4 data = texelFetch(uBandTexture, coord, 0);  // returns uvec4 directly
```

This would be exact for all uint32 values. However, PixiJS's `BufferImageSource` may not support `rgba32uint`. The current float32 workaround is safe given the actual data ranges.

### 5.5 Alternative: Bit-Pattern Reinterpretation

Instead of converting uint32 values to their float equivalents (which loses precision above 2^24), the code could reinterpret the bit patterns:

```typescript
// Share the same ArrayBuffer between Uint32Array and Float32Array:
const f = new Float32Array(bandData.buffer, bandData.byteOffset, bandData.length);
```

Then the shader would use `floatBitsToUint()`:
```glsl
uvec4 data = floatBitsToUint(texelFetch(uBandTexture, coord, 0));
```

**This preserves all 32 bits exactly, regardless of value range.** However, some uint32 bit patterns correspond to NaN or infinity as float32, which might be handled unpredictably by texture uploads or GPU drivers. Specifically:
- Uint32 values with exponent bits = 0xFF (i.e., 0x7F800001–0x7FFFFFFF and 0xFF800001–0xFFFFFFFF) are NaN
- The values in the band texture (small integers like 0–4095) never produce these bit patterns, so **this approach is also safe for current data ranges**

**Current implementation**: Does value conversion (`f[i] = bandData[i]`), NOT bit-pattern reinterpretation. This is fine because all values are < 2^24.

---

## 6. Packed Integer Attributes: Bit-Pattern Fidelity

### 6.1 The Packing Mechanism

Two vertex attribute components carry packed uint32 data through float32 channels:

```typescript
// quad.ts:32-39
function packUint16Pair(low: number, high: number): number {
    const uint32 = ((high & 0xFFFF) << 16) | (low & 0xFFFF);
    const buf = new ArrayBuffer(4);
    new Uint32Array(buf)[0] = uint32;
    return new Float32Array(buf)[0];  // reinterpret bits as float32
}
```

The shader unpacks with:
```glsl
uvec2 g = floatBitsToUint(tex.zw);  // exact bit-pattern recovery
vgly = ivec4(
    int(g.x & 0xFFFFu),             // low 16 bits
    int(g.x >> 16u),                 // high 16 bits
    int(g.y & 0xFFFFu),
    int(g.y >> 16u)
);
```

### 6.2 Analysis: Is This Bit-Exact?

The flow is:

1. **JS**: `uint32` value → write to `Uint32Array[0]` → read from `Float32Array[0]` (same `ArrayBuffer`)
2. **JS**: The `number` returned from `Float32Array[0]` is a float64 representation of the float32 bit pattern
3. **JS**: This `number` is written to `vertices[offset + 6]` which is a `Float32Array` → **truncated back to float32**
4. **GPU**: Reads as `float`, applies `floatBitsToUint()` to recover the original uint32

**Step 3 is the critical moment.** When JS reads a float32 from a `Float32Array`, it promotes to float64. When it writes that float64 back to another `Float32Array`, it truncates back to float32. **This round-trip is exact** — the float64 representation of any float32 value, when truncated back to float32, produces the original bits.

**EXCEPT**: If the uint32 bit pattern corresponds to a float32 NaN. IEEE 754 allows implementations to "quiet" NaN payloads during operations. A float32 NaN read into float64 and written back to float32 *might* have its payload bits altered.

**Which uint32 values produce NaN?** Any value where bits [30:23] are all 1s (exponent = 255) AND bits [22:0] are nonzero. In hex: `0x7F800001` through `0x7FFFFFFF` and `0xFF800001` through `0xFFFFFFFF`.

**Can the packed values produce NaN?** The packed format is `(high16 << 16) | low16`. For NaN:
- Bits [30:23] = `0xFF` requires bytes [3:2] to have pattern `x1111111 1xxxxxxx` where at least one x in bits [22:0] is 1
- `high16` occupies bits [31:16], `low16` occupies bits [15:0]
- If `high16` has value `0x7F80`–`0x7FFF` or `0xFF80`–`0xFFFF`, the result is NaN

Since `high16` encodes `glyphLocY` (band texture row, range 0–~100) or `hBandCount-1` (range 0–31), these values are far below `0x7F80`. **NaN is impossible for current data ranges.**

### 6.3 Verdict

**The packed integer attribute path is bit-exact for all values this implementation will produce.** No drift, no corruption.

If future data ranges could produce `high16 >= 0x7F80` (i.e., band texture row >= 32,640), NaN corruption would become possible and an alternative encoding would be needed.

---

## 7. WebGL Texture Format Requirements

### 7.1 Curve Texture

| Requirement | Value |
|-------------|-------|
| WebGL internal format | `RGBA32F` |
| PixiJS format string | `'rgba32float'` |
| WebGL extension needed | `EXT_color_buffer_float` (for rendering to; not needed for read-only textures) |
| `texelFetch` support | WebGL2 required |
| Filter mode | `NEAREST` (no interpolation — texel-exact fetch) |
| Mipmaps | None |

### 7.2 Band Texture

| Requirement | Value |
|-------------|-------|
| WebGL internal format | `RGBA32F` (current — stores uint-as-float) |
| Ideal internal format | `RGBA32UI` (if PixiJS supports it) |
| PixiJS format string | `'rgba32float'` (current) |
| Filter mode | `NEAREST` (critical — any filtering would corrupt integer data) |
| Mipmaps | None |

### 7.3 Required WebGL2 Features

| Feature | Used By | Fallback |
|---------|---------|----------|
| `texelFetch()` | Fragment shader (curve + band lookups) | None — WebGL1 cannot do this |
| `flat` varying | Vertex→fragment glyph metadata | None — WebGL1 has no flat interpolation |
| `floatBitsToUint()` | Fragment shader (root code), vertex shader (unpack) | None |
| Integer types (`uint`, `ivec4`, `uvec2`) | Fragment shader extensively | None |
| `#version 300 es` | Both shaders | None |
| `RGBA32F` texture format | Both textures | None usable |

**WebGL1 is NOT supported. WebGL2 is mandatory.**

### 7.4 Mobile GPU Considerations

| Concern | Detail |
|---------|--------|
| `highp float` precision | GLSL ES 3.00 guarantees `highp float` is IEEE 754 float32 (23-bit mantissa). Safe. |
| `highp int` precision | Guaranteed 32-bit in GLSL ES 3.00. Safe. |
| `RGBA32F` texture support | Required by WebGL2 spec for `texelFetch`. Some very old mobile GPUs may not support it for rendering, but read-only is required by spec. |
| `dFdx`/`dFdy` precision | May be coarse on some mobile (2×2 quad-level). Affects antialiasing smoothness, not correctness. |

---

## 8. PixiJS Integration Requirements

### 8.1 Version-Specific Uniform Names

| PixiJS Version | Projection Matrix | World Transform | Viewport Size |
|----------------|-------------------|-----------------|---------------|
| v8 | `uProjectionMatrix` (mat3) | `uTransformMatrix` (mat3) | `uResolution` (vec2) |
| v7 | `projectionMatrix` (mat3) | `translationMatrix` (mat3) | Custom uniform |
| v6 | Passed via `shader.uniforms` | Passed via `shader.uniforms` | Custom uniform |

The current vertex shader is v8-specific. V6/v7 would need different uniform names.

### 8.2 Texture Upload Requirements

PixiJS `BufferImageSource` requirements:

```typescript
new BufferImageSource({
    resource: Float32Array | Uint8Array,   // typed array
    width: number,
    height: number,
    format: 'rgba32float' | 'rgba8unorm',  // etc.
    autoGenerateMipmaps: false,            // MUST be false for data textures
    scaleMode: 'nearest',                  // MUST be nearest for integer data
    alphaMode: 'no-premultiply-alpha'      // MUST NOT premultiply (corrupts data)
})
```

**Critical**: `alphaMode: 'no-premultiply-alpha'` is essential. If PixiJS premultiplies alpha, it would multiply RGB by A, corrupting curve coordinates where the alpha channel (p2y or 0.0) affects the other channels.

### 8.3 Geometry/Mesh Requirements

```typescript
// Interleaved vertex buffer with 5 vec4 attributes
const stride = 80;  // 20 floats × 4 bytes
{
    aPositionNormal: { buffer, format: 'float32x4', stride, offset: 0 },
    aTexcoord:       { buffer, format: 'float32x4', stride, offset: 16 },
    aJacobian:       { buffer, format: 'float32x4', stride, offset: 32 },
    aBanding:        { buffer, format: 'float32x4', stride, offset: 48 },
    aColor:          { buffer, format: 'float32x4', stride, offset: 64 }
}
```

All attributes use `float32x4` because the packed integers are smuggled through float32 channels.

### 8.4 Shader Compilation

Both shaders must be compiled as a pair. The `#version 300 es` directive must be the **first line** of the source string passed to `gl.shaderSource()`.

**Current issue in `vert.glsl`**: The `#version` directive is at line 16, preceded by comments. While most desktop drivers accept this, the GLSL ES 3.00 spec (Section 3.3) requires `#version` to be the first non-whitespace token. Some mobile drivers will reject this. The comments should be moved after the `#version` line or the directive should be prepended by the shader loader.

---

## 9. Identified Risks & Mitigations

### Risk 1: Band Assignment Mismatch (Severity: HIGH)

**What**: CPU assigns curves to bands using float64 arithmetic; GPU selects bands using float32 arithmetic. If they disagree, pixels see empty bands → missing glyph segments.

**Current mitigation**: Float32 round-trip in `bands.ts` and `quad.ts`.

**Remaining gap**: `curveBounds()` computes bounds in float64 from float64 coordinates. The curve texture stores float32 coordinates. A curve's float64 bounding box could place it in band N, but the GPU's float32 coordinates could place the curve's influence in band N-1 or N+1.

**Recommendation**: Either (a) compute `curveBounds()` from float32-truncated coordinates, or (b) extend each curve's band assignment by ±1 band as a safety margin. Option (b) is simpler but increases the number of curves per band slightly.

### Risk 2: Band Texture Integer Fidelity (Severity: MEDIUM)

**What**: Uint32 band data converted to float32 for upload. Values > 2^24 would be corrupted.

**Current state**: All values are well under 2^24. Safe for current fonts.

**Recommendation**: Add a debug assertion that no band texture value exceeds 2^24. If PixiJS adds `rgba32uint` support, switch to it.

### Risk 3: NaN in Packed Attributes (Severity: LOW)

**What**: Certain uint32 bit patterns, when reinterpreted as float32, produce NaN. NaN payloads might be altered during float64 round-trip.

**Current state**: All packed values produce non-NaN bit patterns. Safe.

**Recommendation**: No action needed. Document the constraint that `high16` values must be < 0x7F80 (32,640).

### Risk 4: `#version` Directive Position (Severity: MEDIUM)

**What**: `vert.glsl` has comments before `#version 300 es`. Strict GLSL ES parsers will reject this.

**Recommendation**: Move `#version` to line 1, or prepend it in the shader loader code. The fragment shader already has `#version` as line 1 — vertex shader should match.

### Risk 5: Cubic-to-Quadratic Approximation Quality (Severity: LOW)

**What**: OTF fonts with cubic curves get split into 2 quadratics per cubic via de Casteljau at t=0.5. This is a coarse approximation — complex curves may show visible deviation.

**Current state**: Works for simple curves. Complex CFF outlines (e.g., decorative fonts) may show slight shape inaccuracies.

**Recommendation**: For higher fidelity, increase the subdivision count (split into 4 or 8 quadratics per cubic). The reference implementation targets TrueType (already quadratic), so this only affects OTF/CFF fonts.

### Risk 6: `alphaMode` Premultiplication (Severity: HIGH if wrong)

**What**: If PixiJS premultiplies alpha on texture upload, the curve texture's control point coordinates get multiplied by the alpha channel value (p2.y or 0.0), destroying the data.

**Current mitigation**: `alphaMode: 'no-premultiply-alpha'` is set. Correct.

**Recommendation**: Verify this with a test that uploads known control point data and reads it back via `readPixels` to confirm no premultiplication occurred.

---

## 10. Checklist of Invariants

These invariants must hold for correct rendering. Violating any one will produce visible artifacts.

### Data Integrity

- [ ] **INV-1**: All curve texture values are float32 (written via `Float32Array`). No float64 intermediaries reach the GPU.
- [ ] **INV-2**: All band texture integer values are < 2^24 (16,777,216), ensuring exact float32 representation.
- [ ] **INV-3**: Packed uint16 pairs in vertex attributes produce non-NaN float32 bit patterns (high16 < 0x7F80).
- [ ] **INV-4**: Textures are uploaded with `scaleMode: 'nearest'` and `alphaMode: 'no-premultiply-alpha'`.
- [ ] **INV-5**: Texture width = 4096, matching `kLogBandTextureWidth = 12` in `frag.glsl`.
- [ ] **INV-6**: Curve texture pairs (p12, p3) never straddle a row boundary.
- [ ] **INV-7**: Band headers for each glyph fit within a single texture row.
- [ ] **INV-8**: Each band's curve reference list fits within a single texture row.

### Precision Matching

- [ ] **INV-9**: Band scale/offset values in vertex attributes are computed through a Float32Array round-trip.
- [ ] **INV-10**: Band assignment on CPU uses the same float32 scale/offset values the GPU will use.
- [ ] **INV-11**: Curve bounding boxes used for band assignment are computed from float32-truncated coordinates (currently NOT guaranteed — see Risk 1).

### Shader Requirements

- [ ] **INV-12**: `precision highp float` and `precision highp int` are declared in both shaders.
- [ ] **INV-13**: `#version 300 es` is the first non-whitespace line in both shader source strings (currently violated in `vert.glsl` — see Risk 4).
- [ ] **INV-14**: WebGL2 context is available (WebGL1 is NOT supported).

### PixiJS Integration

- [ ] **INV-15**: Uniform names match the PixiJS version in use (e.g., v8: `uProjectionMatrix`, `uTransformMatrix`, `uResolution`).
- [ ] **INV-16**: Vertex attribute locations match `layout(location = N)` declarations in the vertex shader.
- [ ] **INV-17**: Mipmap generation is disabled for both textures.
