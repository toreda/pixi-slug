/**
 * Result of word-wrapping a text string.
 */
export interface SlugTextLines {
	/** Array of line strings after wrapping. */
	lines: string[];
}

/**
 * Break a text string into lines that fit within a maximum pixel width.
 * Uses a greedy word-wrap algorithm: fills each line as much as possible
 * before breaking to the next line.
 *
 * @param text			The full text string.
 * @param advances		Advance width map (char code → em-space width).
 * @param scale			Conversion factor from em-space to pixels (fontSize / unitsPerEm).
 * @param maxWidth		Maximum line width in pixels.
 * @param breakWords	If true, break mid-word when a single word exceeds maxWidth.
 */
export function slugTextWrap(
	text: string,
	advances: Map<number, number>,
	scale: number,
	maxWidth: number,
	breakWords: boolean = false
): SlugTextLines {
	if (maxWidth <= 0) {
		return {lines: [text]};
	}

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

		if (lineWidth > maxWidth && i > lineStart) {
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

	// Push remaining text
	if (lineStart < text.length) {
		lines.push(text.substring(lineStart));
	} else if (lineStart === text.length) {
		// Text ended with a newline — add empty final line
		lines.push('');
	}

	return {lines};
}
