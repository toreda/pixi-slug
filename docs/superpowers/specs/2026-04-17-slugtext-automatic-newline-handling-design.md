# SlugText Automatic Newline Handling — Design

**Date:** 2026-04-17
**Scope:** PixiJS v8 (ports to v6/v7 deferred until v8 is verified)

## Problem

`SlugText` only produces multi-line output when `wordWrap === true` and `wordWrapWidth > 0`. When a caller passes text containing `\n` without enabling `wordWrap`, the newline is treated as an ordinary character and the text renders as a single line. Multi-line rendering and word-wrapping are distinct features and should not be coupled.

## Goals

- `\n` in the input string always produces a line break, regardless of `wordWrap`.
- `wordWrap` remains an independent, opt-in feature for width-limited wrapping.
- When both are active, each explicit newline resets the width counter so width-wrapping applies per logical line.
- Single-line text with no `\n` and no `wordWrap` continues to use the existing single-line fast path (no perf regression).

## Non-Goals

- No change to the word-wrap algorithm for width-based breaking.
- No new public API surface. No new config flag.
- No v6/v7 changes in this spec. Port work is a follow-up after v8 is verified.

## Design

### 1. `slugTextWrap` becomes the single authority for line breaking

`slugTextWrap` in [src/shared/slug/text/wrap.ts](../../../src/shared/slug/text/wrap.ts) already handles `\n` inside its main loop and already resets `lineWidth = 0` and `lastBreak = -1` on newline. The only blocker is the early-return at the top of the function that bails out when `maxWidth <= 0`.

Framing: newline-triggered breaks and width-triggered breaks are two independent inputs that produce the same output (an array of lines). `slugTextWrap` should handle both.

**Change:** remove the `if (maxWidth <= 0) return {lines: [text]}` early-return. In its place, gate the width-overflow branch with `maxWidth > 0` so that when no width limit is set the loop still processes `\n` breaks but never triggers a width-based break.

After the change, the function's contract is:
- `maxWidth > 0` → break on `\n` AND on width overflow (current behavior).
- `maxWidth <= 0` → break on `\n` only.
- Both cases share the same final-push logic for the trailing line and the trailing-newline empty-line case.

### 2. `text.ts` call sites use the multiline path whenever `\n` is present

Two call sites in [src/v8/slug/text.ts](../../../src/v8/slug/text.ts) currently guard the multiline path with `this._wordWrap && this._wordWrapWidth > 0`:
- `_makeQuads` (around line 109)
- Decorations block (around line 225)

Both change to: enter the multiline path when wrapping is enabled OR when the text contains `\n`. Pass `wordWrapWidth` when wrapping is enabled, otherwise pass `0` (no width limit).

Pseudocode:

```ts
const hasNewline = text.indexOf('\n') >= 0;
const wrapping = this._wordWrap && this._wordWrapWidth > 0;
if (wrapping || hasNewline) {
    const width = wrapping ? this._wordWrapWidth : 0;
    const {lines} = slugTextWrap(text, font.advances, scale, width, this._breakWords);
    // existing multiline quad-build path
}
```

When neither wrapping nor `\n` applies, the existing single-line `slugGlyphQuads` fast path runs — identical to today.

### 3. Behavior summary

| `\n` in text | `wordWrap` | Result |
|---|---|---|
| no | off | Single-line fast path (unchanged) |
| no | on | Width-wrap only (unchanged) |
| yes | off | Split on `\n` only, no width limit (NEW) |
| yes | on | Split on `\n`, then width-wrap each segment independently (line-width counter resets at each `\n`, already correct in `slugTextWrap`) |

## Testing

Manual/visual checks in the v8 demo:
- `"foo\nbar"` with wordWrap off → two lines stacked by `lineHeight`, no width limit applied.
- `"foo\nbar"` with wordWrap on at a narrow width → `\n` forces a break; each segment wraps independently; width counter resets at `\n`.
- `""`, `"foo"`, `"\n"`, `"\nfoo"`, `"foo\n"` → exercise the empty-line and trailing-newline paths at the bottom of `slugTextWrap`.
- `"foo"` (no newline, no wrap) → must still take the single-line `slugGlyphQuads` path. Verify by checking vertex count and bounds are identical to current behavior.
- Underline/strikethrough decorations on multi-line input without wrap → one decoration rect per line at the correct `lineY`.

## Risks

- **Early-return removal changes `slugTextWrap`'s contract.** Any other caller that relies on `maxWidth <= 0` returning `{lines: [text]}` regardless of `\n` would see different output. The call sites in `text.ts` are the only callers in scope; a quick grep before implementation will confirm.
- **Performance.** An `indexOf('\n')` scan is added to the common path. Linear in string length but O(n) anyway for glyph iteration, so negligible.

## Out of Scope (Follow-up)

- Port the `text.ts` guard changes to `src/v6/` and `src/v7/` equivalents after v8 is verified working, per the project's v8-first workflow.
- No change needed to `slugTextWrap` for v6/v7 — it lives in `src/shared/` and is already shared.
