# Word Wrap

Enable automatic word wrapping for `SlugText`, matching the `PIXI.TextStyle` word wrap options. Text wraps at a specified pixel width when enabled.

## Requirements

| Done | Option | Type | Description |
|------|--------|------|-------------|
| [x] | `wordWrap` | `boolean` | Indicates if word wrap should be used. |
| [x] | `wordWrapWidth` | `number` | The width at which text will wrap. Requires `wordWrap` to be set to `true`. |

## Implementation

Word wrap is a CPU-side layout operation in `rebuild()`, before any GPU work:

1. **`slugTextWrap()`** (`src/shared/slug/text/wrap.ts`) — greedy word-wrap algorithm that breaks text into lines by summing advance widths and splitting at spaces when the accumulated width exceeds `wordWrapWidth`. Supports `breakWords` for mid-word breaks and respects explicit newlines (`\n`).

2. **`slugGlyphQuadsMultiline()`** (`src/shared/slug/glyph/quad.ts`) — builds quads for multiple lines into a single vertex/index buffer. Each line is offset vertically by `lineIndex * lineHeight` pixels. Line height is derived from `(font.ascender - font.descender) * scale`.

3. **`_makeQuads()`** (v8 `text.ts`) — private helper that routes to single-line or multi-line quad generation based on `_wordWrap` state. Used by all three render passes (shadow, stroke, fill) so word wrap applies consistently.

Re-evaluates automatically on text change, font size change, or wrap width change since all trigger `rebuild()`.
