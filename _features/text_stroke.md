# Text Stroke

Render an outline stroke around `SlugText` glyphs, matching the `PIXI.TextStyle` stroke options. Supports configurable stroke color and thickness.

## Requirements

| Done | Option | Type | Default | Description |
|------|--------|------|---------|-------------|
| [x] | `stroke` | `SlugStroke` | `null` | Stroke config with `color` as `[r,g,b,a]` in 0-1 range and `width` in pixels. |
| [x] | `strokeThickness` | `number` | `0` | Stroke width in pixels (via `strokeWidth` property or `stroke.width`). |
