# Drop Shadow

Render a configurable drop shadow behind `SlugText`, matching the `PIXI.TextStyle` drop-shadow options. The shadow is offset at a given angle and distance, with controllable color, opacity, and blur.

## Requirements

| Done | Option | Type | Description |
|------|--------|------|-------------|
| [x] | `dropShadow` | `SlugDropShadow \| null` | Presence of the object enables the drop shadow. Set to `null` to disable. |
| [x] | `dropShadowAlapha` | `number` | Shadow opacity (0-1). Baked into the alpha channel of the shadow color. @default `1` |
| [x] | `dropShadowAngle` | `number` | Shadow angle in radians. 0=right, PI/2=down. @default `Math.PI / 6` |
| [x] | `dropShadowBlur` | `number` | Shadow blur radius in pixels. 0=sharp. Implemented via stroke dilation with alpha fade. @default `0` |
| [x] | `dropShadowColor` | `[r,g,b,a]` | Shadow color in 0-1 range. @default `[0,0,0,1]` |
| [x] | `dropShadowDistance` | `number` | Shadow offset distance in pixels. @default `5` |
