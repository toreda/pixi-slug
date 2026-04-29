# Text Fill

> **In progress:** gradient and texture fill are being added — see [fill_gradient_texture.md](fill_gradient_texture.md) for the active spec, decisions, and remaining checklist. The table below is the original sketch; the new spec supersedes the gradient rows with a discriminated `fill` union (linear/radial/texture) modeled on PIXI v8's `TextStyle.fill` rather than the older `fillGradientStops` / `fillGradientType` API.

Apply fill color or gradient to `SlugText`, matching the `PIXI.TextStyle` fill options. Supports solid colors, arrays of colors for gradients, and gradient direction control.

## Requirements

| Done | Option | Type | Description |
|------|--------|------|-------------|
| [x] | `fill` | `[number, number, number, number]` | Fill color as [r,g,b,a] in 0-1 range. Default `[1,1,1,1]` (white). |
| [ ] | `fillGradientStops` | `number[]` | Gradient stop positions. |
| [ ] | `fillGradientType` | `PIXI.TEXT_GRADIENT` | If fill is an array of colours to create a gradient, this can change the type/direction of the gradient. |
