/**
 * Measure the pixel width of a text string using advance widths.
 *
 * @param text		Text string to measure.
 * @param advances	Advance width map (char code → em-space width).
 * @param scale		Conversion factor from em-space to pixels (fontSize / unitsPerEm).
 */
export function slugMeasureText(
	text: string,
	advances: Map<number, number>,
	scale: number
): number {
	let width = 0;
	for (let i = 0; i < text.length; i++) {
		width += (advances.get(text.charCodeAt(i)) ?? 0) * scale;
	}
	return width;
}
