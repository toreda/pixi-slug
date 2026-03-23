# Text Fill

Apply fill color or gradient to `SlugText`, matching the `PIXI.TextStyle` fill options. Supports solid colors, arrays of colors for gradients, and gradient direction control.

## Requirements

| Done | Option | Type | Description |
|------|--------|------|-------------|
| [ ] | `fill` | `string \| Array<string> \| number \| Array<number> \| CanvasGradient \| CanvasPattern` | A canvas fillstyle that will be used on the text e.g `'red'`, `'#00FF00'`. |
| [ ] | `fillGradientStops` | `number[]` | Gradient stop positions. |
| [ ] | `fillGradientType` | `PIXI.TEXT_GRADIENT` | If fill is an array of colours to create a gradient, this can change the type/direction of the gradient. |
