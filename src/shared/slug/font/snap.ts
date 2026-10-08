/**
 * Adjust a font size so the font's cap height lands on a whole number of
 * device pixels. The Slug renderer ignores hinting, but choosing a size
 * where `fontSize × capHeight / unitsPerEm × resolution` is an integer
 * puts the tops of capitals exactly on the pixel grid, which keeps their
 * horizontal stems crisp. Pair with `SlugText`'s `snapBaseline` option so
 * the baseline is on the grid too.
 *
 * Returns the nearest size with an integer cap height in device pixels,
 * never less than one device pixel tall. When the font has no usable cap
 * height (or `unitsPerEm` / `resolution` is not positive) the input size
 * is returned unchanged.
 *
 * @param fontSize		Requested size in CSS pixels.
 * @param capHeight		Cap height in font units (OS/2 `sCapHeight`).
 * @param unitsPerEm	Font units per em.
 * @param resolution	Device pixels per CSS pixel (renderer resolution).
 */
export function slugFontSnap(
	fontSize: number,
	capHeight: number,
	unitsPerEm: number,
	resolution: number = 1
): number {
	if (!(capHeight > 0) || !(unitsPerEm > 0) || !(resolution > 0) || !(fontSize > 0)) {
		return fontSize;
	}

	const capPerPx = (capHeight / unitsPerEm) * resolution;
	const capPx = Math.max(1, Math.round(fontSize * capPerPx));
	return capPx / capPerPx;
}
