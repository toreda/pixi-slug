/**
 * Measure the pixel width of a text string using advance widths.
 * Iterates by Unicode code point so astral-plane characters (surrogate
 * pairs) resolve as a single advance lookup.
 *
 * @param text		Text string to measure.
 * @param advances	Advance width map (code point → em-space width).
 * @param scale		Conversion factor from em-space to pixels (fontSize / unitsPerEm).
 */
export function slugMeasureText(
	text: string,
	advances: Map<number, number>,
	scale: number
): number {
	let width = 0;
	let charLen = 1;
	for (let i = 0; i < text.length; i += charLen) {
		const code = text.codePointAt(i) as number;
		charLen = code > 0xffff ? 2 : 1;
		width += (advances.get(code) ?? 0) * scale;
	}
	return width;
}
