# SlugText Automatic Newline Handling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `SlugText` (v8) render `\n` as a line break automatically, without requiring `wordWrap` to be enabled. `wordWrap` remains an independent opt-in for width-based wrapping.

**Architecture:** The shared `slugTextWrap` function becomes the single authority for converting a string into lines. It handles two independent break triggers: `\n` in the input (always breaks) and width overflow (breaks only when `maxWidth > 0`). The v8 `SlugText` class routes through the multi-line path whenever the text contains `\n` OR `wordWrap` is enabled.

**Tech Stack:** TypeScript, PixiJS v8, Jest (tests), CommonJS output.

**Spec:** [docs/superpowers/specs/2026-04-17-slugtext-automatic-newline-handling-design.md](../specs/2026-04-17-slugtext-automatic-newline-handling-design.md)

**Out of scope (follow-up, per user instruction to pause for confirmation):** Ports to `src/v6/slug/text.ts` and `src/v7/slug/text.ts`.

---

## File Structure

**Modify:**
- `src/shared/slug/text/wrap.ts` — remove the `maxWidth <= 0` early-return; gate the width-overflow branch on `maxWidth > 0`.
- `src/v8/slug/text.ts` — change the two `_wordWrap && _wordWrapWidth > 0` guards so the multi-line path also fires when `\n` is present.

**Create:**
- `tests/shared/slug/text/wrap.spec.ts` — covers `slugTextWrap` behavior for both break triggers and their interaction.

**No changes to:** public API, `SlugTextInit`, defaults, v6/v7.

---

## Task 1: Add failing tests for `slugTextWrap` newline-only mode

**Files:**
- Create: `tests/shared/slug/text/wrap.spec.ts`

- [ ] **Step 1: Write the failing test file**

Create `tests/shared/slug/text/wrap.spec.ts` with:

```ts
import {slugTextWrap} from '../../../../src/shared/slug/text/wrap';

describe('slugTextWrap', () => {
	// Uniform 10 em-space advance per character, scale 1.0 → 10px per char.
	const advances = new Map<number, number>();
	for (let i = 0; i < 128; i++) {
		advances.set(i, 10);
	}
	// Newline (10) has zero advance in practice; set explicitly for safety.
	advances.set(10, 0);
	const scale = 1.0;

	describe('newline handling with no width limit (maxWidth = 0)', () => {
		it('splits on \\n when maxWidth is 0', () => {
			const {lines} = slugTextWrap('foo\nbar', advances, scale, 0, false);
			expect(lines).toEqual(['foo', 'bar']);
		});

		it('splits on \\n when maxWidth is negative', () => {
			const {lines} = slugTextWrap('foo\nbar', advances, scale, -1, false);
			expect(lines).toEqual(['foo', 'bar']);
		});

		it('returns a single line for text with no \\n and no width limit', () => {
			const {lines} = slugTextWrap('foobar', advances, scale, 0, false);
			expect(lines).toEqual(['foobar']);
		});

		it('handles empty string', () => {
			const {lines} = slugTextWrap('', advances, scale, 0, false);
			expect(lines).toEqual([]);
		});

		it('handles single \\n as two empty lines', () => {
			const {lines} = slugTextWrap('\n', advances, scale, 0, false);
			expect(lines).toEqual(['', '']);
		});

		it('handles leading \\n', () => {
			const {lines} = slugTextWrap('\nfoo', advances, scale, 0, false);
			expect(lines).toEqual(['', 'foo']);
		});

		it('handles trailing \\n with empty final line', () => {
			const {lines} = slugTextWrap('foo\n', advances, scale, 0, false);
			expect(lines).toEqual(['foo', '']);
		});

		it('handles consecutive \\n characters', () => {
			const {lines} = slugTextWrap('foo\n\nbar', advances, scale, 0, false);
			expect(lines).toEqual(['foo', '', 'bar']);
		});

		it('does not width-wrap long text when maxWidth is 0', () => {
			// 'abcdefghij' = 10 chars × 10px = 100px. Would wrap at maxWidth=50,
			// but with maxWidth=0 must stay on one line.
			const {lines} = slugTextWrap('abcdefghij', advances, scale, 0, false);
			expect(lines).toEqual(['abcdefghij']);
		});
	});

	describe('width-based wrapping (existing behavior)', () => {
		it('wraps on space when line exceeds maxWidth', () => {
			// 'foo bar baz' with 10px each = 110px total. maxWidth=60 should break
			// after 'foo bar' (70px triggers break at last space).
			const {lines} = slugTextWrap('foo bar baz', advances, scale, 60, false);
			expect(lines).toEqual(['foo', 'bar baz']);
		});

		it('does not break mid-word when breakWords is false', () => {
			const {lines} = slugTextWrap('abcdefghij', advances, scale, 50, false);
			expect(lines).toEqual(['abcdefghij']);
		});

		it('breaks mid-word when breakWords is true', () => {
			const {lines} = slugTextWrap('abcdefghij', advances, scale, 50, true);
			// 5 chars × 10px = 50px; adding 6th char overflows to 60 > 50 → break before 6th.
			expect(lines).toEqual(['abcde', 'fghij']);
		});
	});

	describe('newline + width-based wrapping combined', () => {
		it('resets line-width counter at \\n so each segment wraps independently', () => {
			// 'foo bar\nbaz qux quux' with maxWidth=60:
			//   segment 1: 'foo bar' = 70px → would wrap but fits as-is (break at space gives 'foo' then 'bar')
			//   segment 2: 'baz qux quux' wraps as if fresh line
			const {lines} = slugTextWrap('foo bar\nbaz qux quux', advances, scale, 60, false);
			expect(lines).toEqual(['foo', 'bar', 'baz qux', 'quux']);
		});

		it('breaks on \\n even when the segment would fit within maxWidth', () => {
			// Each segment is 30px, maxWidth=100 — width-wise both fit on one line,
			// but \n must still force a break.
			const {lines} = slugTextWrap('foo\nbar', advances, scale, 100, false);
			expect(lines).toEqual(['foo', 'bar']);
		});
	});
});
```

- [ ] **Step 2: Run tests to verify newline-mode tests fail**

Run: `pnpm test -- tests/shared/slug/text/wrap.spec.ts`

Expected: the `maxWidth = 0` and `maxWidth = -1` cases FAIL because `slugTextWrap` currently returns `{lines: [text]}` whenever `maxWidth <= 0`. The width-based tests should PASS (documenting current behavior). The newline-with-width tests should PASS (already correct).

- [ ] **Step 3: Commit the failing tests**

```bash
git add tests/shared/slug/text/wrap.spec.ts
git commit -m "test: add slugTextWrap spec covering newline-only mode"
```

---

## Task 2: Update `slugTextWrap` to handle newlines when `maxWidth <= 0`

**Files:**
- Modify: `src/shared/slug/text/wrap.ts:27-29` and `src/shared/slug/text/wrap.ts:58`

- [ ] **Step 1: Remove the early-return and gate the width-overflow branch on `maxWidth > 0`**

In `src/shared/slug/text/wrap.ts`, delete lines 27-29:

```ts
	if (maxWidth <= 0) {
		return {lines: [text]};
	}
```

Then change line 58 from:

```ts
		if (lineWidth > maxWidth && i > lineStart) {
```

to:

```ts
		if (maxWidth > 0 && lineWidth > maxWidth && i > lineStart) {
```

Final contents of the loop region (lines 26-80 of the updated file) should read:

```ts
): SlugTextLines {
	const spaceCode = 32;
	const lines: string[] = [];
	let lineStart = 0;
	let lastBreak = -1;
	let lineWidth = 0;

	for (let i = 0; i < text.length; i++) {
		const code = text.charCodeAt(i);

		// Newline forces a line break
		if (code === 10) {
			lines.push(text.substring(lineStart, i));
			lineStart = i + 1;
			lastBreak = -1;
			lineWidth = 0;
			continue;
		}

		const advance = (advances.get(code) ?? 0) * scale;

		// Track word boundaries (space is a valid break point)
		if (code === spaceCode) {
			lastBreak = i;
		}

		lineWidth += advance;

		if (maxWidth > 0 && lineWidth > maxWidth && i > lineStart) {
			if (lastBreak >= lineStart) {
				// Break at last space
				lines.push(text.substring(lineStart, lastBreak));
				lineStart = lastBreak + 1;
			} else if (breakWords) {
				// Break mid-word at current character
				lines.push(text.substring(lineStart, i));
				lineStart = i;
			} else {
				// No valid break point — let the word overflow until a space is found
				continue;
			}

			lastBreak = -1;
			// Recalculate width from lineStart to current position
			lineWidth = 0;
			for (let j = lineStart; j <= i; j++) {
				lineWidth += (advances.get(text.charCodeAt(j)) ?? 0) * scale;
			}
		}
	}
```

Also update the function's JSDoc above (around line 18) to reflect the new contract. Change the `maxWidth` param description from:

```
 * @param maxWidth		Maximum line width in pixels.
```

to:

```
 * @param maxWidth		Maximum line width in pixels. Pass 0 (or a negative value)
 *						to disable width-based wrapping; newlines will still
 *						force line breaks.
```

- [ ] **Step 2: Run tests to verify they all pass**

Run: `pnpm test -- tests/shared/slug/text/wrap.spec.ts`

Expected: all tests PASS, including the newline-only and combined cases.

- [ ] **Step 3: Run the full test suite to catch regressions**

Run: `pnpm test`

Expected: all tests PASS. In particular, `tests/v6/slug/text.spec.ts`, `tests/v7/slug/text.spec.ts`, and `tests/v8/slug/text.spec.ts` must still pass — `slugTextWrap` is called from `src/v8/slug/text.ts` only, but shared code changes deserve a full-suite check.

- [ ] **Step 4: Commit**

```bash
git add src/shared/slug/text/wrap.ts
git commit -m "fix(text): handle newlines in slugTextWrap when maxWidth is 0"
```

---

## Task 3: Update v8 `SlugText` to trigger multi-line path when `\n` is present

> **Note:** The plan originally included a v8-level unit test before this task, but `tests/v8/slug/text.spec.ts` contains only `it.todo` stubs — the project has not set up PixiJS v8 renderer mocking. Behavior is fully covered by the Task 1 shared-level tests on `slugTextWrap`. The v8 layer change is a mechanical two-site edit that routes through the same shared function. Manual visual verification happens in Task 4.

**Files:**
- Modify: `src/v8/slug/text.ts:103-122` (the `_makeQuads` method)
- Modify: `src/v8/slug/text.ts:218-229` (the decorations line-computation block)

- [ ] **Step 1: Update `_makeQuads` to enter the multi-line path when `\n` is present**

In `src/v8/slug/text.ts`, replace the body of `_makeQuads` (lines 103-122) so the guard triggers on either wrapping or the presence of `\n`:

```ts
	private _makeQuads(
		font: SlugFont,
		text: string,
		color: [number, number, number, number],
		extraExpand: number = 0
	): SlugGlyphQuads {
		const hasNewline = text.indexOf('\n') >= 0;
		const wrapping = this._wordWrap && this._wordWrapWidth > 0;
		if (wrapping || hasNewline) {
			const scale = this._fontSize / font.unitsPerEm;
			const width = wrapping ? this._wordWrapWidth : 0;
			const {lines} = slugTextWrap(text, font.advances, scale, width, this._breakWords);
			const lineHeight = (font.ascender - font.descender) * scale;
			return slugGlyphQuadsMultiline(
				lines, font.glyphs, font.advances, font.unitsPerEm,
				this._fontSize, font.textureWidth, lineHeight, color, extraExpand
			);
		}
		return slugGlyphQuads(
			text, font.glyphs, font.advances, font.unitsPerEm,
			this._fontSize, font.textureWidth, color, extraExpand
		);
	}
```

- [ ] **Step 2: Update the decorations block to use the same decision**

In `src/v8/slug/text.ts`, within the `rebuild()` method, find the block that currently reads (around lines 223-229):

```ts
			// Determine lines for measurement
			let lines: string[];
			if (this._wordWrap && this._wordWrapWidth > 0) {
				lines = slugTextWrap(this._text, font.advances, scale, this._wordWrapWidth, this._breakWords).lines;
			} else {
				lines = [this._text];
			}
```

Replace it with:

```ts
			// Determine lines for measurement — match the quad builder's decision.
			const hasNewline = this._text.indexOf('\n') >= 0;
			const wrapping = this._wordWrap && this._wordWrapWidth > 0;
			let lines: string[];
			if (wrapping || hasNewline) {
				const width = wrapping ? this._wordWrapWidth : 0;
				lines = slugTextWrap(this._text, font.advances, scale, width, this._breakWords).lines;
			} else {
				lines = [this._text];
			}
```

- [ ] **Step 3: Run the full test suite to confirm no regressions**

Run: `pnpm test`

Expected: all tests PASS. The shared `slugTextWrap` tests from Task 1 cover the behavior change; the v8 text spec still contains only `it.todo` stubs and will remain green.

- [ ] **Step 4: Build the v8 target to confirm it compiles**

Run: `pnpm run build:v8:dev`

Expected: webpack + tsc both succeed with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/v8/slug/text.ts
git commit -m "feat(v8): render \\n as line break in SlugText regardless of wordWrap"
```

---

## Task 4: Manual visual verification in the v8 demo

**Files:** (no changes — verification only)

- [ ] **Step 1: Start the dev examples server**

Run: `pnpm run examples:watch`

Expected: webpack compiles `dist/all/*` in watch mode and `serve` starts on http://localhost:3000.

- [ ] **Step 2: Open the v8 example page in a browser**

Browse to: `http://localhost:3000/examples/v8/` (or whichever v8 example page renders `SlugText`).

- [ ] **Step 3: Use the browser DevTools console to verify each case**

In the page's console, create four `SlugText` instances (using whatever `SlugFont` instance the page exposes globally, or via the existing example's constructor patterns) and add each to the stage. Verify visually:

| Case | Input | `wordWrap` | Expected |
|---|---|---|---|
| 1 | `"foo\nbar"` | `false` | Two stacked lines, no width limit |
| 2 | `"foo\nbar"` | `true`, narrow width | Two stacked lines; each segment wraps independently if long enough |
| 3 | `"foo"` | `false` | Single line (unchanged) |
| 4 | `"foo bar baz"` | `true`, narrow width | Width-wrapped as before, no `\n` needed |

If the v8 example page does not already support dynamic `SlugText` creation, editing the example's source HTML/JS to demo the four cases is acceptable — this is verification, not a code change to be committed.

- [ ] **Step 4: Verify underline and strikethrough on multi-line text without wordWrap**

Construct a `SlugText` with `text: "line1\nline2"`, `wordWrap: false`, and `underline: true`. Confirm two underline rects appear, one per line, at the correct `lineY`.

- [ ] **Step 5: Stop the dev server**

Ctrl+C the running `examples:watch` process.

- [ ] **Step 6: Record verification outcome**

No commit for this task. If any case fails, stop and diagnose using systematic-debugging before continuing.

---

## Task 5: Stop and wait for user confirmation before porting to v6/v7

- [ ] **Step 1: Report completion to the user and request confirmation before proceeding to the v6/v7 ports**

Per the user's instruction: "Yes lets continue, but wait for confirmation before proceeding to the v6 and v7 ports."

Post a summary message to the user containing:
- What was changed in v8 (brief).
- Link to the v8 spec/plan.
- The v6/v7 port is a mechanical repeat of Tasks 3-4 applied to `src/v6/slug/text.ts` and `src/v7/slug/text.ts`, pending their approval.

Do **not** begin v6/v7 port work until the user responds affirmatively.

---

## Self-Review

**Spec coverage:**
- ✅ Goal 1 (newline always breaks): Tasks 1-2 (shared) + Tasks 3-4 (v8).
- ✅ Goal 2 (`wordWrap` independent): Task 4's guard uses `wrapping || hasNewline`; each condition is independent.
- ✅ Goal 3 (width counter resets at `\n`): Already true in `slugTextWrap` (line 45 of pre-edit file). Covered by Task 1 test "resets line-width counter at \\n so each segment wraps independently".
- ✅ Goal 4 (single-line fast path preserved): Task 4 Step 1 keeps the `slugGlyphQuads` branch unchanged when `!wrapping && !hasNewline`. Sanity-tested in Task 3 Step 2 "still renders single line".
- ✅ Non-goal (no API change): no changes to `SlugTextInit`, defaults, or exports.
- ✅ Deferred v6/v7 ports: Task 6 explicitly stops before them.

**Placeholder scan:**
- No "TBD", "TODO", "implement later".
- Task 3 Step 2 has `/* existing font fixture from this spec */` — intentional, because the existing v8 text spec's fixture pattern is the source of truth. This is a *directive to read the existing file and match its style*, not a placeholder in the output code. Kept as-is.
- All other steps contain concrete code blocks or exact commands.

**Type consistency:**
- `slugTextWrap` signature unchanged.
- `hasNewline` and `wrapping` local names match between `_makeQuads` and the decorations block.
- `boundsArea` property used in Task 3 matches its use in `src/v8/slug/text.ts:214`.

---

## Execution Notes

- All file paths use forward slashes; adjust for Windows shell if needed but the repo's existing scripts run under bash (see project `shell: bash` environment).
- Commit messages follow the existing project convention observed in recent commits (short present-tense lowercase-prefixed subjects).
- TDD discipline: every code change is preceded by a failing test in this plan.
