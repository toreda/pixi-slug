# Text Base

Common text style properties for `SlugText` that map to `PIXI.TextStyle` options. These cover alignment, font configuration, spacing, and line join behavior.

## Requirements

| Done | Option | Type | Description |
|------|--------|------|-------------|
| [ ] | `align` | `string` | Alignment for multiline text (`'left'`, `'center'` or `'right'`), does not affect single line text. |
| [ ] | `fontFamily` | `string \| string[]` | The font family. |
| [ ] | `fontSize` | `number \| string` | The font size (as a number it converts to px, but as a string, equivalents are `'26px'`, `'20pt'`, `'160%'` or `'1.6em'`). |
| [ ] | `fontStyle` | `string` | The font style (`'normal'`, `'italic'` or `'oblique'`). |
| [ ] | `fontVariant` | `string` | The font variant (`'normal'` or `'small-caps'`). |
| [ ] | `leading` | `number` | The space between lines. |
| [ ] | `letterSpacing` | `number` | The amount of spacing between letters, default is `0`. |
| [ ] | `lineHeight` | `number` | The line height, a number that represents the vertical space that a letter uses. |
| [ ] | `lineJoin` | `string` | The lineJoin property sets the type of corner created, it can resolve spiked text issues. Default is `'miter'` (creates a sharp corner). |
