# Text Fill

Apply fill color or gradient to `SlugText`, matching the `PIXI.TextStyle` fill options. Supports solid colors, arrays of colors for gradients, and gradient direction control.

## Requirements

| Done | Option | Type | Description |
|------|--------|------|-------------|
| [x] | `fill` | `[number, number, number, number]` | Fill color as [r,g,b,a] in 0-1 range. Default `[1,1,1,1]` (white). |
| [ ] | `fillGradientStops` | `number[]` | Gradient stop positions. |
| [ ] | `fillGradientType` | `PIXI.TEXT_GRADIENT` | If fill is an array of colours to create a gradient, this can change the type/direction of the gradient. |
