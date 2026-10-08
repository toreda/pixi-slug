import type {Font as OpentypeFont} from 'opentype.js';

/**
 * Read a font's cap height in font units. Prefers the OS/2 table's
 * `sCapHeight` (present from table version 2 on); when it is missing or
 * zero, measures the top of the `H` glyph's bounding box. Returns 0 when
 * neither source yields a positive value.
 */
export function slugFontCapHeight(font: OpentypeFont): number {
	const os2 = (font as unknown as {tables?: {os2?: {sCapHeight?: number}}}).tables?.os2;
	const fromTable = os2?.sCapHeight;
	if (typeof fromTable === 'number' && fromTable > 0) {
		return fromTable;
	}

	try {
		const h = font.charToGlyph('H');
		if (h && h.path && h.path.commands.length > 0) {
			const box = h.getBoundingBox();
			if (box.y2 > 0) {
				return box.y2;
			}
		}
	} catch {
		// Fall through to unknown.
	}

	return 0;
}
