# Decision Log

Architectural and implementation decisions with rationale. Newest first.

---

## 2026-03-20: Band Texture Upload — Bit-Pattern Reinterpretation via floatBitsToUint

### Context

The band texture contains uint32 data (curve counts, offsets, texel coordinates) that the fragment shader needs as unsigned integers. The reference Slug implementation uses a native integer texture format (RGBA16U/RGBA32UI) with `usampler2D` so the shader reads `uvec4` directly.

### Problem

PixiJS v8 has a bug in its WebGL format mapping (`mapFormatToGlFormat`): all integer texture formats (`rgba32uint`, `rgba16uint`, etc.) map to `gl.RGBA` instead of `gl.RGBA_INTEGER`. WebGL2 requires `RGBA_INTEGER` as the format parameter when the internal format is an integer type (e.g. `RGBA32UI`). This causes `GL_INVALID_OPERATION` on `glTexImage2D`.

**Affected PixiJS v8 file**: `node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapFormatToGlFormat.js`
```js
// Bug: should be gl.RGBA_INTEGER for integer formats
rgba32uint: gl.RGBA,   // ← wrong
rgba16uint: gl.RGBA,   // ← wrong
```

PixiJS v6/v7 may have the same issue with `FORMATS.RGBA_INTEGER` + `TYPES.UNSIGNED_INT` via `BaseTexture.fromBuffer` — untested because we adopted the workaround for all versions.

### Decision

Upload the `Uint32Array` band data as `rgba32float` using a zero-cost `Float32Array` view over the same `ArrayBuffer` (bit-pattern reinterpretation, not value conversion). The shader recovers exact uint32 values via `floatBitsToUint()`.

```typescript
// CPU: zero-cost ArrayBuffer aliasing — no copy, no conversion
const bandDataAsFloat = new Float32Array(font.bandData.buffer, font.bandData.byteOffset, font.bandData.length);
// Upload as rgba32float (works on all PixiJS versions)
```

```glsl
// Shader: lossless bit-level recovery
uvec2 fetchBand(ivec2 coord)
{
    vec2 raw = texelFetch(uBandTexture, coord, 0).xy;
    return uvec2(floatBitsToUint(raw.x), floatBitsToUint(raw.y));
}
```

### Why this is better than the previous approach

| Aspect | Old (value conversion) | New (bit reinterpretation) |
|--------|----------------------|---------------------------|
| CPU cost | O(n) loop converting each uint32 → float64 → float32 | Zero — ArrayBuffer alias |
| Memory | Duplicate Float32Array (`bandDataFloat32`) | No extra allocation |
| Precision | Lossy for values > 2^24 (float32 mantissa limit) | Exact for all uint32 values |
| Shader | `uint(raw.x + 0.5)` rounding hack | `floatBitsToUint(raw.x)` — exact |

### When to revisit

**If PixiJS fixes the `mapFormatToGlFormat` bug** (maps integer formats to `gl.RGBA_INTEGER`), switch to native integer textures for a cleaner path:

1. Change `font/gpu.ts` (all versions) to upload `Uint32Array` with `rgba32uint` / `RGBA_INTEGER + UNSIGNED_INT`
2. Change shader to `uniform usampler2D uBandTexture` — `texelFetch` returns `uvec4` directly
3. Simplify `fetchBand` to `return texelFetch(uBandTexture, coord, 0).xy`

This would eliminate the `floatBitsToUint` call from the shader's per-pixel hot path and use the GPU's native integer texture sampling hardware.

**Track**: PixiJS issue / PR for `mapFormatToGlFormat` integer format fix.

### Files changed

- `src/shared/shader/slug/frag.glsl` — `fetchBand` uses `floatBitsToUint`
- `src/shared/slug/font.ts` — removed `bandDataFloat32` property and conversion loop
- `src/v8/slug/font/gpu.ts` — ArrayBuffer alias + `rgba32float`
- `src/v7/slug/font/gpu.ts` — ArrayBuffer alias + `RGBA` + `FLOAT`
- `src/v6/slug/font/gpu.ts` — ArrayBuffer alias + `RGBA` + `FLOAT`

---

## 2026-03-20: Shared-Endpoint Curve Texture Packing

### Context

The reference Slug implementation stores curve control points with shared endpoints between adjacent curves in a contour: curve N's p3 equals curve N+1's p1. This allows packing N curves in N+1 texels (N p12 texels + 1 sentinel) instead of 2N texels.

### Decision

Implemented the shared-endpoint optimization in `texture/pack.ts`. Added contour boundary tracking (`contourStarts` array) to `SlugGlyphData` and `slugGlyphCurves`.

**Layout per contour of N curves:**
```
Texel 0:   [c0.p1x, c0.p1y, c0.p2x, c0.p2y]   ← curve 0
Texel 1:   [c1.p1x, c1.p1y, c1.p2x, c1.p2y]   ← curve 1 (c1.p1 == c0.p3)
...
Texel N-1: [cN-1.p1x, ...]                       ← last curve
Texel N:   [cN-1.p3x, cN-1.p3y, 0, 0]           ← sentinel
```

The shader reads `p3 = texelFetch(curveLoc.x + 1, curveLoc.y).xy` — unchanged. For curves 0..N-2 this hits the next curve's p12 (whose .xy == current curve's p3). For the last curve it hits the sentinel.

### Result

~45% reduction in curve texture size. No shader changes required.

### Files changed

- `src/shared/slug/glyph/curves.ts` — returns `{curves, contourStarts}`
- `src/shared/slug/glyph/data.ts` — added `contourStarts: number[]`
- `src/shared/slug/font.ts` — passes contour info through
- `src/shared/slug/texture/pack.ts` — new shared-endpoint packing layout
