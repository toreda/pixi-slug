import type {SlugTextStylePhysicalAlign} from '../style/align';
import type {SlugTextJustify} from '../style/justify';

/**
 * Per-line metadata used to apply text-align and text-justify after
 * the quad builder has emitted glyph vertices at their natural
 * positions. Produced by `slugComputeLineLayout` and consumed by
 * `slugApplyLineLayoutX` once per quad buffer (shadow / stroke / fill).
 *
 * `effectiveLineWidth[l]` is the rendered extent of line `l` after
 * justify expansion. Decoration code uses it to size length-restricted
 * decorations against the actual line box (which equals `boxWidth` for
 * justified lines and the natural `lineWidths[l]` otherwise).
 */
export interface SlugLineLayout {
	/** Whole-line X offset to apply to every glyph on line `l`. */
	lineOffsetX: Float32Array;
	/**
	 * For justify: per-glyph cumulative X shift in line-major order
	 * matching `slugGlyphQuadsMultiline`'s emission. `null` when no
	 * line on this block needs justify expansion (the common case).
	 */
	perGlyphShiftX: Float32Array | null;
	/** Effective rendered width per line (post-justify). */
	effectiveLineWidth: Float32Array;
}

/**
 * Compute the per-line X offset and (for `justify`) per-glyph X shift
 * needed to apply block-level text-align to a multi-line buffer.
 *
 * Inputs use the natural per-line widths from `slugMeasureText` and
 * the text strings (needed only when justify is active, to count word
 * gaps and renderable glyphs per line). All counts are independent of
 * the GPU buffer — the helper that applies them walks the buffer in
 * the same line-major order the quad builder uses.
 *
 * Justify falls back to `start` (CSS default) on:
 *  - the last line of the block,
 *  - lines with zero gaps in the chosen strategy (e.g. inter-word
 *    on a line with no spaces, or inter-character on a line with one
 *    or zero renderable glyphs),
 *  - lines whose natural width already meets/exceeds `boxWidth`.
 *
 * @param lines				Per-line text strings — only used for justify
 *							(space-counting and glyph-counting). Pass the
 *							same array used by the quad builder.
 * @param lineWidths		Per-line natural widths in pixels.
 * @param boxWidth			Block width in pixels. For `justify` and
 *							`center` / `right`, this is the box edge
 *							alignment is measured against.
 * @param physicalAlign		Resolved physical alignment.
 * @param justifyMode		Strategy used when `physicalAlign === 'justify'`.
 *							Ignored otherwise.
 * @param glyphsPresent		Predicate returning whether a char code at a
 *							given line/index produces a quad. Mirrors
 *							the `glyphs.has(...)` test in the quad
 *							builder so per-glyph indices line up.
 */
export function slugComputeLineLayout(
	lines: string[],
	lineWidths: Float32Array | number[],
	boxWidth: number,
	physicalAlign: SlugTextStylePhysicalAlign,
	justifyMode: SlugTextJustify,
	glyphsPresent: (charCode: number) => boolean
): SlugLineLayout {
	const lineCount = lines.length;
	const lineOffsetX = new Float32Array(lineCount);
	const effectiveLineWidth = new Float32Array(lineCount);
	let perGlyphShiftX: Float32Array | null = null;

	if (physicalAlign === 'justify') {
		const totalRenderable = countRenderableGlyphs(lines, glyphsPresent);
		perGlyphShiftX = new Float32Array(totalRenderable);
	}

	let glyphCursor = 0;
	const isLastLine = (l: number) => l === lineCount - 1;

	for (let l = 0; l < lineCount; l++) {
		const line = lines[l];
		const lineW = lineWidths[l];
		let effW = lineW;

		if (
			physicalAlign === 'justify' &&
			!isLastLine(l) &&
			lineW < boxWidth &&
			perGlyphShiftX !== null
		) {
			const extra = boxWidth - lineW;
			let applied = false;
			if (justifyMode === 'inter-character') {
				// Distribute extra width across every gap between
				// adjacent renderable glyphs on the line — both word
				// gaps and inter-letter gaps stretch by the same
				// amount. A line with 0 or 1 renderable glyphs has
				// nowhere to put the extra width and falls back to
				// `start`.
				const renderable = countLineRenderable(line, glyphsPresent);
				if (renderable >= 2) {
					const perGap = extra / (renderable - 1);
					distributeInterCharacterShifts(
						line,
						perGap,
						perGlyphShiftX,
						glyphCursor,
						glyphsPresent
					);
					applied = true;
				}
			} else {
				// inter-word: collapse runs of spaces to a single gap.
				// Trailing space is not a gap because no glyph follows
				// it. Lines with zero gaps fall back to `start`.
				const gaps = countInterWordGaps(line);
				if (gaps > 0) {
					const perGap = extra / gaps;
					distributeInterWordShifts(
						line,
						perGap,
						perGlyphShiftX,
						glyphCursor,
						glyphsPresent
					);
					applied = true;
				}
			}
			if (applied) effW = boxWidth;
		}

		// Whole-line offset against the (possibly justified) effective
		// width. For justify lines that fall back to start, effW ===
		// lineW so the offset is 0.
		lineOffsetX[l] = xForBlockAlign(boxWidth, effW, physicalAlign);
		effectiveLineWidth[l] = effW;

		// Advance the per-line glyph cursor regardless of justify, so
		// the cursor stays in sync with the quad builder's emission.
		if (perGlyphShiftX !== null) {
			glyphCursor += countLineRenderable(line, glyphsPresent);
		}
	}

	return {lineOffsetX, perGlyphShiftX, effectiveLineWidth};
}

/**
 * Block-level x-offset for a non-justify alignment. `justify` returns
 * 0 here — its width fill happens via `perGlyphShiftX`, not a whole-
 * line offset.
 */
function xForBlockAlign(
	boxW: number,
	lineW: number,
	align: SlugTextStylePhysicalAlign
): number {
	if (align === 'right') return boxW - lineW;
	if (align === 'center') return (boxW - lineW) / 2;
	return 0;
}

/**
 * Count inter-word gaps in a line. Consecutive spaces collapse to a
 * single gap (matching the natural rendering — they all expand
 * together in CSS inter-word justify). Trailing spaces don't count
 * because no glyph follows them on this line.
 */
function countInterWordGaps(line: string): number {
	let gaps = 0;
	let inSpace = false;
	let sawNonSpace = false;
	let trailingSpace = false;
	for (let i = 0; i < line.length; i++) {
		const c = line.charCodeAt(i);
		if (c === 32) {
			if (sawNonSpace && !inSpace) {
				gaps++;
				inSpace = true;
				trailingSpace = true;
			}
		} else {
			sawNonSpace = true;
			inSpace = false;
			trailingSpace = false;
		}
	}
	if (trailingSpace) gaps--;
	return gaps;
}

/**
 * Walk a line's characters, writing the cumulative inter-word shift
 * for each renderable glyph into `out` starting at `outOffset`. Each
 * inter-word gap (collapsed runs of spaces between glyphs) increments
 * the running shift by `perGap`; trailing spaces are ignored.
 */
function distributeInterWordShifts(
	line: string,
	perGap: number,
	out: Float32Array,
	outOffset: number,
	glyphsPresent: (charCode: number) => boolean
): void {
	let shift = 0;
	let inSpace = false;
	let sawNonSpace = false;
	let pendingGap = false;
	let writeIdx = outOffset;

	for (let i = 0; i < line.length; i++) {
		const c = line.charCodeAt(i);
		if (c === 32) {
			if (sawNonSpace && !inSpace) {
				inSpace = true;
				pendingGap = true;
			}
			continue;
		}
		// Non-space glyph (or invisible char without quad — same logic).
		if (pendingGap) {
			shift += perGap;
			pendingGap = false;
		}
		sawNonSpace = true;
		inSpace = false;
		if (glyphsPresent(c)) {
			out[writeIdx++] = shift;
		}
	}
}

/**
 * Walk a line's renderable glyphs, writing the cumulative inter-
 * character shift for each into `out` starting at `outOffset`. The
 * first renderable glyph stays at shift 0; each subsequent renderable
 * glyph is offset by an additional `perGap`. Whether or not a space
 * (or any other unrenderable char) sits between two renderable
 * glyphs, the gap counts once — every adjacent pair of renderables on
 * the line gets the same stretch.
 */
function distributeInterCharacterShifts(
	line: string,
	perGap: number,
	out: Float32Array,
	outOffset: number,
	glyphsPresent: (charCode: number) => boolean
): void {
	let shift = 0;
	let writeIdx = outOffset;
	let seenAny = false;

	for (let i = 0; i < line.length; i++) {
		const c = line.charCodeAt(i);
		if (!glyphsPresent(c)) continue;
		if (seenAny) shift += perGap;
		out[writeIdx++] = shift;
		seenAny = true;
	}
}

/** Number of glyphs that produce quads for a single line. */
function countLineRenderable(
	line: string,
	glyphsPresent: (charCode: number) => boolean
): number {
	let n = 0;
	for (let i = 0; i < line.length; i++) {
		if (glyphsPresent(line.charCodeAt(i))) n++;
	}
	return n;
}

/** Total renderable glyphs across all lines. */
function countRenderableGlyphs(
	lines: string[],
	glyphsPresent: (charCode: number) => boolean
): number {
	let n = 0;
	for (let l = 0; l < lines.length; l++) {
		n += countLineRenderable(lines[l], glyphsPresent);
	}
	return n;
}
