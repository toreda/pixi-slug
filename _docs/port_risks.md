# Port Risks

Risks identified when porting the Slug algorithm from its original C++/HLSL/DirectX implementation to TypeScript/GLSL ES 3.00/WebGL2 via PixiJS. Organized by which layer of the port introduces the risk.

---

## Table of Contents

**Port from HLSL to GLSL**
- [GLSL-1: Matrix storage order (row-major → column-major)](#glsl-1-matrix-storage-order-row-major--column-major)
- [GLSL-2: Negative zero sign bit behavior](#glsl-2-negative-zero-sign-bit-behavior)
- [GLSL-3: Division by zero is undefined in GLSL ES](#glsl-3-division-by-zero-is-undefined-in-glsl-es)
- [GLSL-4: Texture format downgrade — RGBA16F/RGBA16U → RGBA32F](#glsl-4-texture-format-downgrade--rgba16frgba16u--rgba32f)
- [GLSL-5: Missing `usampler2D` — no native integer texture sampling](#glsl-5-missing-usampler2d--no-native-integer-texture-sampling)
- [GLSL-6: `saturate()` does not exist in GLSL](#glsl-6-saturate-does-not-exist-in-glsl)
- [GLSL-7: `flat` varying interpolation qualifier](#glsl-7-flat-varying-interpolation-qualifier)
- [GLSL-8: `dFdx`/`dFdy` are not `ddx`/`ddy` — spec differences](#glsl-8-dfdxdfdy-are-not-ddxddy--spec-differences)
- [GLSL-9: No `Texture2D.Load()` with offset — `texelFetch` has no built-in bounds check](#glsl-9-no-texture2dload-with-offset--texelfetch-has-no-built-in-bounds-check)
- [GLSL-10: Integer bitwise operation precision guarantees](#glsl-10-integer-bitwise-operation-precision-guarantees)
- [GLSL-11: `#version` directive placement](#glsl-11-version-directive-placement)
- [GLSL-12: `precision` qualifiers — no equivalent in HLSL](#glsl-12-precision-qualifiers--no-equivalent-in-hlsl)
- [GLSL-13: Ternary logic instruction optimization not available](#glsl-13-ternary-logic-instruction-optimization-not-available)
- [GLSL-14: Loop iteration limits on mobile](#glsl-14-loop-iteration-limits-on-mobile)

**Port to JavaScript**
- [JS-1: Band assignment float64/float32 mismatch](#js-1-band-assignment-float64float32-mismatch)
- [JS-2: Band texture uint32-as-float32 conversion](#js-2-band-texture-uint32-as-float32-conversion)
- [JS-3: NaN bit patterns in packed vertex attributes](#js-3-nan-bit-patterns-in-packed-vertex-attributes)
- [JS-4: Cubic-to-quadratic approximation error](#js-4-cubic-to-quadratic-approximation-error)
- [JS-5: Texture alpha premultiplication](#js-5-texture-alpha-premultiplication)
- [JS-6: WebGL2 availability](#js-6-webgl2-availability)
- [JS-7: `dFdx`/`dFdy` derivative precision on mobile](#js-7-dfdxdfdy-derivative-precision-on-mobile)

[Summary Matrix](#summary-matrix)

---

# Port from HLSL to GLSL

Risks caused by behavioral, semantic, or capability differences between HLSL (DirectX) and GLSL ES 3.00 (WebGL2). These affect the shader code directly.

---

## GLSL-1: Matrix Storage Order (Row-Major → Column-Major)

**Severity**: HIGH
**Status**: Mitigated in current code

### Root Cause

HLSL defaults to **row-major** matrix storage. `float4x4 M; M[0]` returns the first *row*. Matrix-vector multiplication is `mul(vector, matrix)` (row vector on the left).

GLSL uses **column-major** storage. `mat4 M; M[0]` returns the first *column*. Matrix-vector multiplication is `matrix * vector` (column vector on the right).

The original HLSL reference shader for Slug uses `mul()` with the HLSL convention. A naive transcription that swaps `mul(v, M)` to `M * v` without transposing the matrix construction will silently produce incorrect transforms — the dilation distance will be wrong, vertices will be displaced incorrectly, and glyphs will be garbled.

### Symptoms If Wrong

- Glyphs distorted, stretched, or collapsed to zero size
- Dilation pushing vertices in wrong direction (inward instead of outward, or sideways)
- Text appearing mirrored or skewed

### Current Mitigation

The vertex shader constructs `mat4 mvp` explicitly in column-major order from PixiJS's column-major `mat3`:

```glsl
mat4 mvp = mat4(
    m[0][0], m[0][1], 0.0, 0.0,  // column 0
    m[1][0], m[1][1], 0.0, 0.0,  // column 1
    0.0,     0.0,     1.0, 0.0,  // column 2
    m[2][0], m[2][1], 0.0, 1.0   // column 3
);
```

This is correct. The `SlugDilate` function uses `mvp * vec4(...)` which is the GLSL convention.

### Recommended Fix

Already fixed. Any future changes to the matrix construction must preserve column-major order. If porting additional HLSL code (e.g., adding perspective projection), every `mul(v, M)` must become `transpose(M) * v` or the matrix must be constructed transposed.

---

## GLSL-2: Negative Zero Sign Bit Behavior

**Severity**: HIGH
**Status**: Safe in current code, but fragile

### Root Cause

The Slug algorithm's robustness depends entirely on extracting the **sign bit** of floating-point control point coordinates. The `CalcRootCode` function uses `floatBitsToUint(y) >> 31u` to classify whether each y-coordinate is negative.

In IEEE 754, **negative zero** (`-0.0`) has the sign bit set (`0x80000000`), while **positive zero** (`+0.0`) has the sign bit clear (`0x00000000`). Both compare equal (`-0.0 == +0.0` is true), but their bit patterns differ.

In HLSL, `asuint()` is guaranteed to return the exact bit pattern. In GLSL ES 3.00, `floatBitsToUint()` is also specified to return the exact bit pattern (Section 8.3 of the spec). However:

1. **Compiler optimizations**: Some GLSL compilers may optimize `-0.0` to `+0.0` during constant folding or arithmetic simplification. If a curve's y-coordinate is computed as `0.0 - 0.0`, the result *should* be `+0.0` per IEEE 754, but intermediate optimizations could theoretically produce `-0.0`.

2. **Texture fetch**: When control points are stored in a float32 texture, a value of `-0.0` stored on the CPU will be read as `-0.0` by `texelFetch`. The sign bit survives the texture round-trip. This is correct.

3. **Subtraction**: In the fragment shader, control points are translated by `p12 - vec4(renderCoord, renderCoord)`. If a control point's y equals the pixel's y exactly, the result is `±0.0` depending on the subtraction's sign. IEEE 754 says `x - x = +0.0` for all finite x, so this produces `+0.0` → sign bit 0 → classified as "not negative". This is the correct behavior.

### Why This Matters

If a y-coordinate is incorrectly classified (sign bit 1 instead of 0, or vice versa), the wrong equivalence class is selected, the wrong roots are declared eligible, and the winding number for that pixel is wrong. A single misclassified pixel produces a sparkle or hole.

The patent explicitly chose the "negative vs. not-negative" classification (rather than "positive vs. not-positive") because it maps directly to the IEEE 754 sign bit, avoiding any threshold comparison. This is equally true in GLSL.

### Symptoms If Wrong

- Isolated bright or dark pixels along glyph contours (sparkle artifacts)
- Horizontal or vertical streaks where contours are tangent to the ray

### Current State

The current shader correctly uses `floatBitsToUint(y) >> 31u` which extracts the sign bit directly. No arithmetic is performed on the y-coordinates between the texture fetch (which subtracts `renderCoord`) and the sign-bit extraction. This is safe.

### Recommended Fix

Do not insert any arithmetic between the control-point subtraction and the `CalcRootCode` call. Specifically, never:
- Multiply y-coordinates by a scale factor before classification (could flip sign of zero)
- Apply `abs()` or `sign()` before classification
- Reorder the subtraction (e.g., `renderCoord - p12` would flip all signs)

---

## GLSL-3: Division by Zero Is Undefined in GLSL ES

**Severity**: MEDIUM
**Status**: Partially guarded

### Root Cause

In HLSL/DirectX, dividing a nonzero float by zero produces ±infinity (per IEEE 754). This is well-defined and the result participates in subsequent comparisons predictably.

In GLSL ES 3.00, division by zero yields **undefined** results (Section 4.7.1). The spec does not guarantee IEEE 754 infinity — the result could be NaN, infinity, or any other value, depending on the GPU driver.

The Slug shader divides by potentially-zero values in several places:

| Location | Expression | Guard |
|----------|-----------|-------|
| `SolveHorizPoly` | `1.0 / a.y` | `if (abs(a.y) < 1.0/65536.0)` — switches to linear path |
| `SolveHorizPoly` | `0.5 / b.y` | Only used when `abs(a.y) < 1.0/65536.0`, but `b.y` could also be zero |
| `SolveVertPoly` | `1.0 / a.x`, `0.5 / b.x` | Same pattern |
| `SlugRender` | `pixelsPerEm = 1.0 / max(emsPerPixel, 1.0/65536.0)` | Clamped — safe |
| `CalcCoverage` | `/ max(xwgt + ywgt, 1.0/65536.0)` | Clamped — safe |
| `SlugDilate` | `/ (uv - st * st)` | **No guard** — if `uv == st*st`, division by zero |

### Symptoms If Wrong

- On most desktop GPUs (via ANGLE): produces infinity, which gets clamped by subsequent `clamp()` calls — appears to work.
- On some mobile GPUs: may produce NaN, which propagates through all subsequent math. Result: black pixels, white pixels, or flickering.
- Dilation division-by-zero: vertex displaced to an extreme position, causing a massively oversized triangle that wastes GPU time or produces visual garbage.

### Current State

The `1.0 / a.y` path is protected by the near-zero check. But `0.5 / b.y` is only reached when `a.y` is near zero — it does not check whether `b.y` is also near zero. If both `a.y` and `b.y` are near zero (a horizontal line segment at the ray height), `0.5 / b.y` is undefined.

The dilation `(uv - st * st)` denominator has no guard. For orthographic 2D (PixiJS default), `t = Mn.w = 0` because the normal is `(nx, ny, 0, 0)` and the W row of the MVP is `(0, 0, 0, 1)`. So `st = 0` and the denominator simplifies to `uv = u*u + v*v`, which is zero only if both `u` and `v` are zero — meaning the normal projects to zero screen-space length. This could happen if the MVP matrix is degenerate (e.g., zero scale).

### Recommended Fix

1. **`SolveHorizPoly`/`SolveVertPoly`**: Add a guard for the linear-case divisor:
   ```glsl
   float rb = 0.5 / max(abs(b.y), 1.0/65536.0) * sign(b.y);
   ```
   Or: if both `a.y` and `b.y` are near zero, set both roots to zero (curve is degenerate).

2. **`SlugDilate`**: Add a guard for the denominator:
   ```glsl
   float denom = uv - st * st;
   if (abs(denom) < 1e-10) { vpos = pos.xy; return tex.xy; }  // skip dilation
   ```

---

## GLSL-4: Texture Format Downgrade — RGBA16F/RGBA16U → RGBA32F

**Severity**: MEDIUM
**Status**: Functional but suboptimal

### Root Cause

The original C++/HLSL reference implementation uses:
- **Curve texture**: `RGBA16F` (4 × 16-bit float = 8 bytes/texel)
- **Band texture**: `RGBA16U` (4 × 16-bit unsigned integer = 8 bytes/texel)

Our WebGL2 implementation uses:
- **Curve texture**: `RGBA32F` (4 × 32-bit float = 16 bytes/texel) — **2× memory**
- **Band texture**: `RGBA32F` (4 × 32-bit float = 16 bytes/texel) — **2× memory**, integer data stored as float

This difference has several implications:

**Memory**: Curve and band textures are each 2× larger than the reference. For a typical font this adds ~100–500 KB. Not a serious concern for desktop, but relevant on mobile.

**Bandwidth**: Each `texelFetch` reads 16 bytes instead of 8. The fragment shader fetches 2–3 texels per curve. For a glyph with 30 curves in a band, that's 60–90 fetches per pixel. The bandwidth increase could reduce performance on bandwidth-limited mobile GPUs.

**Precision**: Float16 has only 10 mantissa bits (3–4 decimal digits), representing integers exactly up to 2048. TrueType coordinates in a 2048 unitsPerEm font just barely fit. Float32 has 23 mantissa bits — far more than needed. The extra precision is wasted.

**Correctness**: Using float32 instead of float16 for curve coordinates avoids any precision issues. Float16 for coordinates up to 2048 is exact, but coordinates from cubic-to-quadratic conversion can have fractional values that float16 would round. Float32 is strictly safer.

### Symptoms

- No visual difference (float32 is more precise than float16, not less)
- Higher GPU memory usage
- Potentially lower performance on bandwidth-limited GPUs (mobile)

### Recommended Fix

**Short-term**: Keep RGBA32F. It's correct, simple, and the memory overhead is small.

**Long-term optimization**: Switch curve texture to `RGBA16F` (`'rgba16float'` in PixiJS if supported). This requires:
1. Verifying that all curve coordinates fit within float16's exact integer range (0–2048)
2. Storing curves as `Uint16Array` of float16 values (use a float32→float16 conversion library)
3. The shader code does not change — `texelFetch` on a float16 texture returns `vec4` of full-precision float.

For the band texture: switch to `RGBA16UI` (`'rgba16uint'`) or `RG32UI` (`'rg32uint'`) when PixiJS supports integer texture formats. This would require changing the shader to use `usampler2D` and `texelFetch` returning `uvec4`.

---

## GLSL-5: Missing `usampler2D` — No Native Integer Texture Sampling

**Severity**: MEDIUM
**Status**: Workaround in place

### Root Cause

HLSL can bind integer textures (`Texture2D<uint4>`) and read them directly as integers with `.Load()`. This is the natural way to store band data (curve counts, offsets, texel coordinates).

GLSL ES 3.00 supports `usampler2D` for integer textures, but **PixiJS does not expose integer texture formats** through its `BufferImageSource` API. WebGL2 itself supports `GL_RGBA32UI` and `GL_RGBA16UI` internal formats, but the PixiJS abstraction layer doesn't pass them through.

The workaround is to store integer values as float values in an `RGBA32F` texture and cast back to int in the shader:

```glsl
vec2 raw = texelFetch(uBandTexture, coord, 0).xy;
return uvec2(uint(raw.x), uint(raw.y));
```

### Why This Is Risky

1. **Precision ceiling**: Float32 represents integers exactly only up to 2^24. See [JS-2](#js-2-band-texture-uint32-as-float32-conversion).
2. **Type confusion**: The shader declares `uniform sampler2D uBandTexture` (float sampler) when the data is logically integer. Any accidental use of texture filtering would corrupt the data.
3. **Performance**: Float32 textures may be slower to sample than uint16 textures on some GPUs because float32 requires wider memory paths.

### Recommended Fix

If PixiJS adds integer texture support, switch to:
```glsl
uniform usampler2D uBandTexture;
uvec4 data = texelFetch(uBandTexture, coord, 0);  // direct uint read
```

Alternatively, bypass PixiJS's texture API and call `gl.texImage2D()` directly with `GL_RGBA32UI` format, then bind the resulting WebGL texture to the shader uniform manually.

---

## GLSL-6: `saturate()` Does Not Exist in GLSL

**Severity**: LOW
**Status**: Already translated

### Root Cause

HLSL provides `saturate(x)` as a built-in that clamps to [0, 1]. GLSL has no `saturate()` — the equivalent is `clamp(x, 0.0, 1.0)`.

The patent's coverage formula (Equation 5) uses `sat()`:
```
f = sat(m · Cx(ti) + 0.5)
```

If a port naively writes `saturate(...)` in GLSL, the shader fails to compile.

### Current State

All instances are already translated to `clamp(x, 0.0, 1.0)`. Correct.

### Recommended Fix

None needed. If adding new shader code from HLSL reference, search-and-replace `saturate(` → `clamp(` with `, 0.0, 1.0)`.

---

## GLSL-7: `flat` Varying Interpolation Qualifier

**Severity**: MEDIUM
**Status**: Already translated, subtle risk remains

### Root Cause

HLSL uses `nointerpolation` to prevent the rasterizer from interpolating a varying between vertices. GLSL ES 3.00 uses `flat`. Both mean the same thing: the provoking vertex's value is used for all fragments in the triangle.

The Slug shaders pass `vGlyph` (ivec4) and `vBanding` (vec4) as `flat` — these contain per-glyph metadata that must be identical for all pixels in a glyph quad.

The subtle risk: **which vertex is the provoking vertex?** In WebGL2, the provoking vertex is always the **last** vertex of each triangle (GLSL ES 3.00 spec, Section 4.3.4). In DirectX, it's typically the **first** vertex. If the vertex data differs between corners of the quad (it doesn't currently — all 4 corners carry the same glyph metadata), the provoking vertex convention would matter.

### Current State

All 4 corners of each glyph quad are written with identical `aTexcoord.zw` (packed glyph loc and band max) and identical `aBanding`. The `flat` qualifier produces the correct result regardless of which vertex is provoking.

### Recommended Fix

None needed, but document the invariant: all vertices in a glyph quad MUST have identical values for flat-qualified attributes. If future changes introduce per-vertex variation in these attributes, the provoking vertex convention must be accounted for.

---

## GLSL-8: `dFdx`/`dFdy` Are Not `ddx`/`ddy` — Spec Differences

**Severity**: LOW
**Status**: Already translated, behavioral difference documented

### Root Cause

HLSL `ddx()`/`ddy()` and GLSL `dFdx()`/`dFdy()` compute the same thing conceptually (screen-space partial derivatives), but the specs differ in edge cases:

1. **Precision**: HLSL guarantees `ddx`/`ddy` are computed per-pixel on modern GPUs. GLSL ES 3.00 only requires them to be "within a 2×2 pixel neighborhood" — the same derivative value may be used for 2 or 4 adjacent pixels (implementation-defined).

2. **Sign convention**: Both use the same sign convention (increasing values produce positive derivatives), but GLSL ES 3.00 permits `dFdx`/`dFdy` to be "undefined" in non-uniform control flow (inside an `if` where some pixels in the 2×2 quad take different branches). The Slug shader calls `dFdx`/`dFdy` at the top of `SlugRender`, before any branching. Safe.

3. **At triangle edges**: Derivatives at the boundary between two triangles may be computed from pixels in different triangles. This can produce slightly different `pixelsPerEm` values at quad boundaries.

### Current State

`dFdx(renderCoord.x)` and `dFdy(renderCoord.y)` are called at the start of `SlugRender` in uniform control flow. Safe.

### Recommended Fix

None needed. The derivative imprecision affects antialiasing smoothness at quad edges, not correctness. This matches the original implementation's behavior.

---

## GLSL-9: No `Texture2D.Load()` With Offset — `texelFetch` Has No Built-in Bounds Check

**Severity**: LOW
**Status**: Safe if data is packed correctly

### Root Cause

HLSL `Texture2D.Load(int3(x, y, mip))` has defined out-of-bounds behavior: it returns zero. GLSL ES 3.00's `texelFetch(sampler, ivec2(x, y), lod)` returns **undefined** values for out-of-bounds coordinates (Section 8.9).

The Slug shader accesses textures with computed coordinates:
```glsl
texelFetch(uCurveTexture, curveLoc, 0)
texelFetch(uCurveTexture, ivec2(curveLoc.x + 1, curveLoc.y), 0)
texelFetch(uBandTexture, ivec2(...), 0)
```

If a bug in texture packing produces an out-of-bounds coordinate, HLSL would return zeros (probably causing a visual glitch but not a crash). GLSL may return garbage, NaN, or cause a GPU fault on some drivers.

### Current State

The packing code in `pack.ts` carefully ensures:
- Curve pairs never straddle row boundaries (`curveLoc.x + 1` stays on the same row)
- Band headers fit within a single row
- Curve lists fit within a single row
- All texel indices are within the allocated texture dimensions

### Recommended Fix

Add debug-mode bounds checking in the shader:
```glsl
#ifdef DEBUG
if (curveLoc.x < 0 || curveLoc.y < 0 || curveLoc.x >= textureWidth || curveLoc.y >= textureHeight) {
    fragColor = vec4(1.0, 0.0, 1.0, 1.0); return; // magenta = error
}
#endif
```

Or add a `texelFetch` wrapper function that clamps coordinates.

---

## GLSL-10: Integer Bitwise Operation Precision Guarantees

**Severity**: LOW
**Status**: Safe

### Root Cause

HLSL guarantees 32-bit integer precision for all bitwise operations. GLSL ES 3.00 guarantees `highp int` is at least 32-bit (Section 4.5.2), but `mediump int` is only 16-bit.

The Slug shader uses bitwise operations extensively:
```glsl
uint i1 = floatBitsToUint(y1) >> 31u;
uint shift = (i2 & 2u) | (i1 & ~2u);
return ((0x2E74u >> shift) & 0x0101u);
```

If these operations ran at `mediump`, the 0x0101 mask and the 0x2E74 constant would be truncated, producing wrong root codes.

### Current State

Both shaders declare `precision highp int;` — all integer operations are 32-bit. The `CalcRootCode` function's `uint` variables inherit `highp` precision. Safe.

### Recommended Fix

Never change the `precision highp int;` declaration. If adding new shader files, always include both `precision highp float;` and `precision highp int;`.

---

## GLSL-11: `#version` Directive Placement

**Severity**: MEDIUM
**Status**: Active bug in `vert.glsl`

### Root Cause

GLSL ES 3.00 (Section 3.3) requires `#version 300 es` to be the **first non-whitespace token** in the shader source. HLSL has no equivalent requirement.

In `vert.glsl`, the `#version` directive is at line 1 in the file, but the file starts with a `#version 300 es` line followed by comments — **wait, let me re-check**: the current file actually has `#version 300 es` on line 1, with comments on lines 2–7, then a blank line, then the `precision` qualifier block starting at line 18. **However**, the `#version` is followed by a blank line before the `precision` directives, and the comments are after it. This appears correct.

**Update from re-read**: `vert.glsl` line 1 is `#version 300 es`. The earlier report in `webgl-requirements.md` was based on a prior version of the file. The `#version` placement is currently correct in both shaders.

### Current State

- `frag.glsl` line 1: `#version 300 es` — correct
- `vert.glsl` line 1: `#version 300 es` — correct

### Recommended Fix

Already correct. If the shader source is ever concatenated with a prefix (e.g., PixiJS injecting `#define` lines), ensure the `#version` line remains first. Some PixiJS shader processing pipelines strip and re-add the `#version` directive — verify this does not occur.

---

## GLSL-12: `precision` Qualifiers — No Equivalent in HLSL

**Severity**: HIGH
**Status**: Correctly specified

### Root Cause

HLSL has no precision qualifiers. All operations run at the declared type's precision (`float` = 32-bit, `half` = 16-bit, chosen explicitly per variable).

GLSL ES 3.00 requires a **default precision** declaration for every type used. If `precision mediump float;` is declared (or if a mobile driver defaults to it), all float operations drop to 16-bit (10-bit mantissa). This is catastrophically insufficient for the Slug algorithm:

- Curve coordinates (0–2048 range) at mediump: only ~1 unit of precision
- Root solving: the discriminant `b²-ac` would lose all significance
- Coverage accumulation: fractional values would be coarsely quantized

### Current State

Both shaders declare:
```glsl
precision highp float;    // 32-bit
precision highp int;      // 32-bit
precision highp sampler2D;// full-precision fetch
```

This is correct and mandatory.

### Recommended Fix

Never reduce precision qualifiers. If adding helper functions in separate shader includes, ensure they inherit `highp` precision (GLSL ES 3.00 does not automatically propagate precision across compilation units if using `#include` mechanisms).

---

## GLSL-13: Ternary Logic Instruction Optimization Not Available

**Severity**: LOW
**Status**: N/A — no action needed

### Root Cause

The patent (column 6, lines 25–35) describes an alternative to the `0x2E74` lookup table using a sequence of ternary logic operations (`~k & k₃` etc.) that exploits HLSL/DirectX's ternary logic instructions available on some GPU architectures. These instructions operate on the sign bits of IEEE 754 floats reinterpreted as signed integers.

GLSL ES 3.00 does not expose ternary logic instructions. The bit manipulation must be done with standard bitwise AND/OR/NOT/SHIFT operations. The current shader implements this as:

```glsl
uint i1 = floatBitsToUint(y1) >> 31u;
uint i2 = floatBitsToUint(y2) >> 30u;
uint i3 = floatBitsToUint(y3) >> 29u;
uint shift = (i2 & 2u) | (i1 & ~2u);
shift = (i3 & 4u) | (shift & ~4u);
return ((0x2E74u >> shift) & 0x0101u);
```

This is functionally equivalent to the patent's ternary logic approach but uses more instructions (6 bitwise ops + 3 shifts + 1 lookup vs. 2–3 ternary ops). The performance difference is negligible on modern GPUs.

### Recommended Fix

None. The current implementation is correct. The lookup-table approach is actually simpler and more portable than the ternary-logic alternative.

---

## GLSL-14: Loop Iteration Limits on Mobile

**Severity**: LOW
**Status**: Unlikely to trigger

### Root Cause

Some mobile GLSL ES compilers impose a maximum loop iteration count for static analysis (e.g., 256 or 1024 iterations). If the compiler cannot determine an upper bound on a loop, it may refuse to compile the shader or silently clamp the iteration count.

The Slug fragment shader has two loops:
```glsl
for (curveIndex = 0; curveIndex < int(hbandData.x); curveIndex++) { ... }
for (curveIndex = 0; curveIndex < int(vbandData.x); curveIndex++) { ... }
```

The upper bound `hbandData.x` / `vbandData.x` is a runtime value fetched from the band texture. The compiler cannot determine a static upper bound.

### Current State

Most modern mobile GLSL ES 3.00 compilers (ARM Mali, Qualcomm Adreno, Apple GPU) handle dynamic loop bounds correctly. Very old or low-end chipsets might have issues.

In practice, `hbandData.x` (curves per band) rarely exceeds 100 even for complex glyphs. The default `BAND_COUNT = 32` distributes curves across many bands.

### Recommended Fix

If compilation fails on a target device, add a static upper bound:
```glsl
for (curveIndex = 0; curveIndex < min(int(hbandData.x), 256); curveIndex++)
```

This caps iteration at 256, which is far more than any band should contain.

---

# Port to JavaScript

Risks caused by JavaScript's type system, PixiJS's API abstractions, and the CPU→GPU data transfer layer. These affect the TypeScript preprocessing code and texture/buffer uploads.

---

## JS-1: Band Assignment Float64/Float32 Mismatch

**Severity**: HIGH
**Status**: Partially mitigated

### Root Cause

JavaScript `number` is float64 (52-bit mantissa). GPU `float` is float32 (23-bit mantissa). The CPU assigns curves to bands, and the GPU selects bands per-pixel. If they disagree on a band index, the pixel looks up a band that does not contain the curve it needs.

The existing code already performs a Float32Array round-trip for `bandScale` and `bandOffset` (the values shared between CPU and GPU). However, `curveBounds()` in `bands.ts` computes each curve's bounding box using the original float64 coordinates. The curve texture stores those same coordinates truncated to float32. A curve whose float64 bounding box barely reaches into band N may, after float32 truncation, no longer reach band N on the GPU.

### Symptoms

- Thin horizontal or vertical slices missing from glyph outlines
- Artifacts that appear/disappear at specific font sizes or positions
- Curves visually "cut off" at band boundaries

### Affected Files

- [src/shared/slug/glyph/bands.ts](../src/shared/slug/glyph/bands.ts) — `curveBounds()` (lines 20–53) and the band assignment loop (lines 110–126)

### Current Mitigation

`bands.ts:100–108` and `quad.ts:128–136` both compute band scale/offset through a `Float32Array` round-trip. This ensures the *transform* matches, but the *curve coordinates* fed into the band assignment are still float64.

### Recommended Fix

**Option A** (precise): Compute `curveBounds()` from float32-truncated coordinates. Add a round-trip before the bounding-box calculation:

```typescript
const _f = new Float32Array(6);
_f[0] = curve.p1x; _f[1] = curve.p1y;
_f[2] = curve.p2x; _f[3] = curve.p2y;
_f[4] = curve.p3x; _f[5] = curve.p3y;
// Use _f[0]–_f[5] for the bounding box math
```

**Option B** (conservative): Extend each curve's band assignment by ±1 band. Simpler, but increases curves-per-band and slightly reduces early-out efficiency.

---

## JS-2: Band Texture Uint32-as-Float32 Conversion

**Severity**: MEDIUM
**Status**: Safe for current data, no guard in place

### Root Cause

WebGL2 supports `RGBA32UI` integer textures natively, but PixiJS `BufferImageSource` does not expose this format. The workaround is to convert `Uint32Array` integer values to `Float32Array` float values and upload as `rgba32float`. The fragment shader casts the float back to uint: `uint(raw.x)`.

Float32 can only represent integers exactly up to 2^24 (16,777,216). Any band texture value ≥ 2^24 would silently lose low bits during the conversion:

```
Uint32: 16,777,217  →  Float32: 16,777,216.0  →  uint(): 16,777,216  (off by 1)
```

### Symptoms

- Wrong curve count in a band → too few or too many curves processed → missing outlines or garbage
- Wrong curve list offset → shader fetches from wrong texture position → corrupted curve data
- Wrong curve texel coordinate → shader reads wrong control points → wildly incorrect curves

### Affected Files

- [src/v8/slug/text.ts](../src/v8/slug/text.ts) — band texture upload (line 166)
- [src/shared/slug/texture/pack.ts](../src/shared/slug/texture/pack.ts) — all values written to `bandData`

### Current State

All values currently stored in the band texture:

| Field | Typical range | Maximum possible | Safe? |
|-------|--------------|-----------------|-------|
| curveCount | 0–200 | ~1,000 | Yes |
| curveListOffset | 0–50,000 | ~200,000 | Yes |
| curveTexelX | 0–4,095 | 4,095 | Yes |
| curveTexelY | 0–100 | ~4,095 | Yes |

All well under 2^24. No data loss occurs today.

### Recommended Fix

1. **Short-term**: Add a debug-mode assertion in `slugTexturePack()` that no value written to `bandData` exceeds 2^24:
   ```typescript
   if (value > 0x00FF_FFFF) throw new Error(`Band value ${value} exceeds float32 exact integer range`);
   ```

2. **Long-term**: If PixiJS adds `rgba32uint` or `rgba32sint` support for `BufferImageSource`, switch to a native integer texture with `usampler2D` in the shader. This removes the 2^24 ceiling entirely.

3. **Alternative long-term**: Use bit-pattern reinterpretation instead of value conversion. Share the `ArrayBuffer` between `Uint32Array` and `Float32Array` so the bits pass through unchanged, then use `floatBitsToUint()` in the shader. This is exact for all uint32 values that don't map to NaN (values < ~2 billion). The current small-integer data is safe. See JS-3 for the NaN concern.

---

## JS-3: NaN Bit Patterns in Packed Vertex Attributes

**Severity**: LOW
**Status**: Safe for current data

### Root Cause

Two vertex attribute components (`aTexcoord.z` and `aTexcoord.w`) carry packed uint32 data through float32 channels. The packing uses `ArrayBuffer` aliasing to reinterpret uint32 bits as float32:

```typescript
new Uint32Array(buf)[0] = uint32;
return new Float32Array(buf)[0];  // bit-pattern reinterpretation
```

The returned JS `number` (float64) is then written back into a `Float32Array` (the vertex buffer). This float64→float32 round-trip is exact for all float32 bit patterns **except NaN**. IEEE 754 permits implementations to "quiet" NaN payloads, potentially altering bits [22:0] during the round-trip.

A uint32 bit pattern is NaN when the exponent field (bits [30:23]) is all 1s and the mantissa (bits [22:0]) is nonzero. In the packed format `(high16 << 16) | low16`, this requires `high16` to be in the range `0x7F80`–`0x7FFF` or `0xFF80`–`0xFFFF` (i.e., high16 ≥ 32,640).

### Symptoms

If triggered: the vertex shader's `floatBitsToUint()` would recover a different uint32 than was packed. The unpacked `glyphLoc` or `bandMax` would be wrong, causing the fragment shader to read from incorrect texture positions. Result: garbled or missing glyphs.

### Affected Files

- [src/shared/slug/glyph/quad.ts](../src/shared/slug/glyph/quad.ts) — `packUint16Pair()` (lines 32–39)

### Current State

The `high16` values packed are:

| Packed field | high16 value | Typical range | NaN threshold |
|-------------|-------------|--------------|---------------|
| glyphLoc (tex.z) | `glyphLocY` (band texture row) | 0–100 | 32,640 |
| bandMax (tex.w) | `hBandCount - 1` | 0–31 | 32,640 |

Both are far below the NaN threshold.

### When This Would Trigger

Only if the band texture grows beyond 32,640 rows (requiring ~134 million band texels). No font will produce this.

### Recommended Fix

No code change needed. Document the constraint:

> Packed `high16` values must be < 32,640 (0x7F80) to avoid NaN bit patterns in the float32 channel.

If this constraint ever becomes restrictive, swap the high/low positions in the packing (put the larger value in `low16`, which occupies mantissa bits and cannot cause NaN regardless of value).

---

## JS-4: Cubic-to-Quadratic Approximation Error

**Severity**: LOW
**Status**: Known limitation

### Root Cause

The Slug algorithm is designed for TrueType fonts, which use quadratic Bézier curves natively. OpenType CFF fonts use cubic Bézier curves. The current implementation converts each cubic to **2 quadratic** segments by splitting at t=0.5 via de Casteljau, then approximating each half.

This is a lossy conversion. A single cubic curve with high curvature (e.g., a tight S-curve in a decorative script font) may not be well-approximated by just 2 quadratics. The maximum deviation between the cubic and its quadratic approximation depends on the cubic's curvature — for gentle curves the error is sub-pixel, for tight curves it can be multiple pixels at large font sizes.

### Symptoms

- Slight shape deviations visible at large font sizes on OTF/CFF fonts
- Rounded corners where the original font has sharper curves
- Subtle outline wobble on complex decorative glyphs

### Affected Files

- [src/shared/slug/glyph/curves.ts](../src/shared/slug/glyph/curves.ts) — `cubicToQuadratics()` (lines 9–57)

### Does NOT Affect

- TrueType (.ttf) fonts — these are already quadratic, no conversion needed
- Fonts loaded via opentype.js that only emit `Q` commands — passed through unchanged

### Recommended Fix

**Option A** (adaptive subdivision): Measure the maximum deviation between the cubic and the 2-quadratic approximation. If it exceeds a threshold (e.g., 0.5 em units), recursively subdivide and produce 4, 8, or 16 quadratics until the error is acceptable.

**Option B** (fixed higher count): Always split into 4 quadratics per cubic (subdivide at t=0.25, 0.5, 0.75). Doubles the curve count for cubics but provides much better fidelity. Simple to implement.

**Option C** (document limitation): Only advertise TrueType font support. Most commonly-used web fonts (Inter, Roboto, Open Sans, etc.) ship TrueType variants.

---

## JS-5: Texture Alpha Premultiplication

**Severity**: HIGH (if misconfigured)
**Status**: Currently mitigated

### Root Cause

PixiJS can premultiply alpha on texture upload, multiplying each RGB component by the alpha component. For normal image textures this is correct. For the Slug data textures, it would be catastrophic: the curve texture stores Bézier control point coordinates in all 4 RGBA channels, and the band texture stores integer indices. Premultiplication would multiply `p1.x`, `p1.y`, `p2.x` by `p2.y` (the alpha channel of the first texel), destroying the coordinate values.

### Symptoms

If premultiplication were applied:
- All curve coordinates would be scaled by the off-curve control point's y-coordinate
- Glyphs would be completely garbled — random shapes instead of letters
- Band texture indices would be corrupted similarly

### Affected Files

- [src/v8/slug/text.ts](../src/v8/slug/text.ts) — `BufferImageSource` construction (lines 149–174)

### Current Mitigation

Both textures are created with `alphaMode: 'no-premultiply-alpha'`:

```typescript
new BufferImageSource({
    // ...
    alphaMode: 'no-premultiply-alpha'
})
```

This is correct and must never be changed.

### Recommended Fix

1. Add a comment in the code explaining **why** `no-premultiply-alpha` is required (data textures, not images).
2. Consider adding a runtime verification: upload a known test pattern, `readPixels` it back, and assert the values match. This would catch PixiJS version changes that alter default behavior.
3. If creating a shared texture utility, ensure `no-premultiply-alpha` is hardcoded and not configurable.

---

## JS-6: WebGL2 Availability

**Severity**: MEDIUM
**Status**: Architectural constraint

### Root Cause

The Slug shader implementation uses features exclusive to WebGL2 / GLSL ES 3.00:

| Feature | Used in | WebGL1 equivalent |
|---------|---------|-------------------|
| `texelFetch()` | `frag.glsl` — all curve and band texture reads | None (only `texture2D` with normalized coords) |
| `flat` varyings | `vert.glsl` → `frag.glsl` — `vBanding`, `vGlyph` | None |
| `floatBitsToUint()` | Both shaders — packed int unpacking, root code | None |
| `uint` / `uvec2` / `ivec4` | `frag.glsl` — extensively | None |
| `RGBA32F` textures | Both data textures | Requires `OES_texture_float` + limited support |

There is **no viable WebGL1 fallback**. The algorithm fundamentally depends on integer texel addressing (`texelFetch`), integer types, and bit manipulation.

### Symptoms

On devices without WebGL2: shader compilation failure, no rendering, JS errors.

### Current State

WebGL2 is supported by:
- Chrome 56+ (Jan 2017), Firefox 51+ (Jan 2017), Safari 15+ (Sep 2021), Edge 79+ (Jan 2020)
- All modern mobile browsers (iOS 15+, Android Chrome 56+)
- NOT supported: IE11, very old iOS Safari (<15), some embedded/kiosk browsers

### Recommended Fix

1. Detect WebGL2 availability at initialization and surface a clear error message if unavailable.
2. For PixiJS v6, the application must configure `preferWebGLVersion: 2` explicitly.
3. Document WebGL2 as a hard requirement in README/docs.

---

## JS-7: `dFdx`/`dFdy` Derivative Precision on Mobile

**Severity**: LOW
**Status**: Known limitation, no fix needed

### Root Cause

GLSL ES 3.00 computes `dFdx()`/`dFdy()` using finite differences across a 2×2 pixel quad. This means derivatives are identical for all 4 pixels in the quad, producing a "staircase" pattern in the `pixelsPerEm` value at quad boundaries. On mobile GPUs, the derivative computation may be even coarser or less accurate.

### Symptoms

- Slightly uneven antialiasing at the edges of glyph quads (where one quad's derivative differs from the adjacent quad's)
- Very subtle — only visible under careful inspection at specific zoom levels

### Does NOT Affect

- Winding number correctness (unrelated to derivatives)
- Root eligibility or the 0x2E74 lookup (unrelated)
- Coverage calculation logic (only the `pixelsPerEm` scale factor is affected)

### Recommended Fix

No fix needed. This is inherent to GPU fragment shader derivatives and affects all GPU text rendering methods equally. The visual impact is negligible.

---

# Summary Matrix

## Port from HLSL to GLSL

| # | Risk | Severity | Status | Fix Effort |
|---|------|----------|--------|------------|
| GLSL-1 | Matrix storage order (row → column major) | HIGH | Mitigated | None — already correct |
| GLSL-2 | Negative zero sign bit behavior | HIGH | Safe, fragile | None — document constraint |
| GLSL-3 | Division by zero undefined in GLSL ES | MEDIUM | Partially guarded | Small — add guards in solver and dilation |
| GLSL-4 | Texture format RGBA16F/16U → RGBA32F (2× memory) | MEDIUM | Functional | Medium — optimize later |
| GLSL-5 | No native `usampler2D` (PixiJS limitation) | MEDIUM | Workaround in place | Medium — bypass PixiJS or wait for support |
| GLSL-6 | `saturate()` → `clamp()` | LOW | Already translated | None |
| GLSL-7 | `flat` varying provoking vertex | MEDIUM | Safe (identical vertex data) | None — document invariant |
| GLSL-8 | `dFdx`/`dFdy` vs `ddx`/`ddy` spec | LOW | Already translated | None |
| GLSL-9 | `texelFetch` out-of-bounds undefined | LOW | Safe if packing correct | Small — debug bounds check |
| GLSL-10 | Integer bitwise precision | LOW | Safe (`highp int`) | None |
| GLSL-11 | `#version` directive placement | MEDIUM | Correct in both shaders | None |
| GLSL-12 | `precision` qualifiers required | HIGH | Correctly specified | None — never reduce |
| GLSL-13 | Ternary logic instruction not available | LOW | N/A | None |
| GLSL-14 | Loop iteration limits on mobile | LOW | Unlikely to trigger | Small — add static cap if needed |

## Port to JavaScript

| # | Risk | Severity | Status | Fix Effort |
|---|------|----------|--------|------------|
| JS-1 | Band assignment float64/float32 mismatch | HIGH | Partially mitigated | Small — float32 round-trip in `curveBounds()` |
| JS-2 | Band texture uint32→float32 (values > 2^24) | MEDIUM | Safe today, no guard | Small — add assertion |
| JS-3 | NaN in packed vertex attributes | LOW | Safe today | None needed — document constraint |
| JS-4 | Cubic-to-quadratic approximation | LOW | Known limitation | Medium — adaptive subdivision |
| JS-5 | Texture alpha premultiplication | HIGH if wrong | Mitigated | None — keep `no-premultiply-alpha` |
| JS-6 | WebGL2 availability | MEDIUM | Architectural | Small — detect and error |
| JS-7 | `dFdx`/`dFdy` mobile precision | LOW | Inherent | None needed |
