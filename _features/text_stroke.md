# Text Stroke

Render an outline stroke around `SlugText` glyphs. Supports configurable stroke color, thickness, and alpha behavior. Extends the `PIXI.TextStyle` stroke API with SlugText-specific per-pixel alpha gradient support.

## Requirements

| Done | Option | Type | Default | Description |
|------|--------|------|---------|-------------|
| [x] | `stroke` | `SlugStroke` | `null` | Stroke config object. Stroke is enabled when `width > 0`. |
| [x] | `stroke.width` | `number` | `0` | Stroke width in pixels. Also accessible via `strokeWidth` property. |
| [x] | `stroke.color` | `[r,g,b,a]` | `[0,0,0,1]` | Stroke color in 0-1 range. Also accessible via `strokeColor` property. |
| [x] | `stroke.alphaMode` | `SlugStrokeAlphaMode` | `'uniform'` | Controls how alpha is applied across the stroke width. See Alpha Modes below. |
| [x] | `stroke.alphaStart` | `number` | `1` | Starting alpha value for the innermost stroke pixel (closest to glyph boundary). Applied in both `'uniform'` and `'gradient'` modes. |
| [x] | `stroke.alphaRate` | `number` | `0` | Alpha change per pixel moving outward from the glyph boundary. Only used in `'gradient'` mode. |

## Alpha Modes

### `'uniform'`

All pixels across the stroke width share the same alpha. The alpha value is controlled by `alphaStart`. An `alphaStart` of `1` produces a fully opaque stroke; `0.5` produces a semi-transparent stroke.

`alphaRate` is ignored in this mode (forced to `0` internally).

**Use cases:**
- Standard opaque stroke outline.
- Semi-transparent stroke for subtle emphasis or layered text effects.

### `'gradient'`

Alpha varies per pixel from the glyph boundary outward. The innermost pixel of stroke (adjacent to the glyph fill edge) uses `alphaStart`. Each subsequent pixel outward changes by `alphaRate`.

**Formula per pixel:**
```
pixelAlpha = clamp(alphaStart + alphaRate * distFromBoundary, 0, 1)
```

Where `distFromBoundary` is the pixel's distance from the original glyph boundary in pixels (0 at the inner edge, up to `width - 1` at the outer edge).

**The outermost pixel alpha:**
```
outerAlpha = clamp(alphaStart + alphaRate * (width - 1), 0, 1)
```

**Examples with `width: 5`:**

| alphaStart | alphaRate | Pixel alphas (inner → outer) | Effect |
|------------|-----------|------------------------------|--------|
| `1.0` | `-0.2` | 1.0, 0.8, 0.6, 0.4, 0.2 | Fade out from glyph edge |
| `0.2` | `+0.2` | 0.2, 0.4, 0.6, 0.8, 1.0 | Fade in toward outer edge |
| `1.0` | `0` | 1.0, 1.0, 1.0, 1.0, 1.0 | Equivalent to uniform mode |
| `0.5` | `-0.1` | 0.5, 0.4, 0.3, 0.2, 0.1 | Subtle fade from half-opacity |

**Use cases:**
- Glow/halo effects (fade out from glyph edge).
- Outer glow with transparent inner edge (fade in toward outer edge).
- Soft-edged outlines for stylized text.

## Implementation Notes

### Shader Approach

Stroke is rendered as a separate mesh pass behind the fill pass. The fragment shader dilates the glyph boundary by shifting curve intersection distances in the coverage computation:

- **Entry crossings** (adding to winding number): shifted by `+strokePx` on horizontal ray, `-strokePx` on vertical ray (Y-axis is flipped between em-space and screen space).
- **Exit crossings** (subtracting from winding number): shifted by `-strokePx` on horizontal ray, `+strokePx` on vertical ray.
- **Early-out thresholds** extended by `strokePx` so curves within stroke range are not skipped.

This produces uniform dilation of the glyph shape on all sides without requiring offset curve precomputation.

### Gradient Alpha Distance Estimation

For gradient mode, the shader tracks `minBoundaryDist` — the minimum absolute distance from the pixel to any curve crossing — during the existing ray-curve intersection loops. This is essentially free (one `min()` per crossing, no extra texture fetches). The distance is clamped to `[0, strokePx]` and used in the alpha formula.

### Uniforms

| Uniform | Type | Description |
|---------|------|-------------|
| `uStrokeExpand` | `float` | Stroke expansion in pixels. `0` for fill pass. |
| `uStrokeAlphaStart` | `float` | Starting alpha. Defaults to `1.0`. |
| `uStrokeAlphaRate` | `float` | Alpha change per pixel. `0` in uniform mode. |
