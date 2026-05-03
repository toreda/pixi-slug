/**
 * Diagnostic test: verify that lazy glyph processing produces
 * byte-identical output to the legacy eager pack for the same input.
 *
 * Investigates a regression where uppercase A and Z render with a
 * bottom-left line artifact when loaded via the lazy path.
 */
import {readFileSync} from 'fs';
import {resolve} from 'path';
import opentype from 'opentype.js';
import {SlugFont} from '../../../src/shared/slug/font';
import {slugGlyphCurves} from '../../../src/shared/slug/glyph/curves';
import {slugGlyphBands} from '../../../src/shared/slug/glyph/bands';
import {slugTexturePack} from '../../../src/shared/slug/texture/pack';
import type {SlugGlyphData} from '../../../src/shared/slug/glyph/data';

function loadFontFixture(filename: string): ArrayBuffer {
	const buf = readFileSync(resolve(__dirname, '../../../assets/fonts', filename));
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

/**
 * Process a single codepoint through the legacy eager pipeline,
 * pretending it was the only glyph in the font. Used for a 1:1
 * comparison against `SlugFont.ensureGlyphs`.
 */
function processOneEager(buf: ArrayBuffer, codepoint: number): SlugGlyphData | null {
	const font = opentype.parse(buf);
	const ot = font.charToGlyph(String.fromCodePoint(codepoint));
	if (!ot || !ot.path || ot.path.commands.length === 0) {
		return null;
	}

	const {curves, contourStarts} = slugGlyphCurves(ot.path.commands);
	if (curves.length === 0) return null;
	const bounds = ot.getBoundingBox();
	const bands = slugGlyphBands(curves, bounds.x1, bounds.y1, bounds.x2, bounds.y2);

	return {
		charCode: codepoint,
		curves,
		contourStarts,
		bounds: {minX: bounds.x1, minY: bounds.y1, maxX: bounds.x2, maxY: bounds.y2},
		advanceWidth: ot.advanceWidth ?? 0,
		lsb: ot.leftSideBearing ?? 0,
		hBandCount: bands.hBandCount,
		vBandCount: bands.vBandCount,
		hBands: bands.hBands,
		vBands: bands.vBands,
		curveOffset: 0,
		bandOffset: 0
	};
}

describe('lazy vs eager byte-equivalence (regression: A/Z artifact)', () => {
	const TTF = loadFontFixture('roboto-fallback.ttf');

	it('produces byte-identical curveData and bandData for "A" alone', () => {
		const lazy = new SlugFont();
		lazy.loadSync(TTF);
		lazy.ensureGlyphs('A');

		const eagerGlyph = processOneEager(TTF, 'A'.charCodeAt(0));
		expect(eagerGlyph).not.toBeNull();
		const eager = slugTexturePack([eagerGlyph!], 4096);

		// Compare the populated prefix.
		const lazyA = lazy.glyphs.get('A'.charCodeAt(0))!;
		expect(lazyA.curveOffset).toBe(eagerGlyph!.curveOffset);
		expect(lazyA.bandOffset).toBe(eagerGlyph!.bandOffset);

		for (let i = 0; i < eager.curveData.length; i++) {
			if (lazy.curveData[i] !== eager.curveData[i]) {
				throw new Error(`curveData[${i}]: lazy=${lazy.curveData[i]} eager=${eager.curveData[i]}`);
			}
		}
		for (let i = 0; i < eager.bandData.length; i++) {
			if (lazy.bandData[i] !== eager.bandData[i]) {
				throw new Error(`bandData[${i}]: lazy=${lazy.bandData[i]} eager=${eager.bandData[i]}`);
			}
		}
	});

	it('produces byte-identical output for the full Roboto cmap', () => {
		const lazy = new SlugFont();
		lazy.loadSync(TTF);

		// Drive every codepoint in Roboto's cmap through ensureGlyphs in
		// the same order the eager pipeline would have walked them.
		const otFont = opentype.parse(TTF);
		const eagerGlyphs: SlugGlyphData[] = [];
		const lazyOrder: number[] = [];
		for (let i = 0; i < otFont.glyphs.length; i++) {
			const g = otFont.glyphs.get(i);
			const code = g.unicode;
			if (code === undefined) continue;
			if (!g.path || g.path.commands.length === 0) continue;

			const {curves, contourStarts} = slugGlyphCurves(g.path.commands);
			if (curves.length === 0) continue;
			const bounds = g.getBoundingBox();
			const bands = slugGlyphBands(curves, bounds.x1, bounds.y1, bounds.x2, bounds.y2);
			eagerGlyphs.push({
				charCode: code,
				curves,
				contourStarts,
				bounds: {minX: bounds.x1, minY: bounds.y1, maxX: bounds.x2, maxY: bounds.y2},
				advanceWidth: g.advanceWidth ?? 0,
				lsb: g.leftSideBearing ?? 0,
				hBandCount: bands.hBandCount,
				vBandCount: bands.vBandCount,
				hBands: bands.hBands,
				vBands: bands.vBands,
				curveOffset: 0,
				bandOffset: 0
			});
			lazyOrder.push(code);
		}

		lazy.ensureGlyphsForCodepoints(lazyOrder);
		const eager = slugTexturePack(eagerGlyphs, 4096);

		// Per-glyph offset comparison
		for (const eagerGlyph of eagerGlyphs) {
			const lazyGlyph = lazy.glyphs.get(eagerGlyph.charCode)!;
			expect(lazyGlyph).toBeDefined();
			expect(lazyGlyph.curveOffset).toBe(eagerGlyph.curveOffset);
			expect(lazyGlyph.bandOffset).toBe(eagerGlyph.bandOffset);
		}

		for (let i = 0; i < eager.curveData.length; i++) {
			if (lazy.curveData[i] !== eager.curveData[i]) {
				throw new Error(`curveData[${i}] mismatch: lazy=${lazy.curveData[i]} eager=${eager.curveData[i]}`);
			}
		}
		for (let i = 0; i < eager.bandData.length; i++) {
			if (lazy.bandData[i] !== eager.bandData[i]) {
				throw new Error(`bandData[${i}] mismatch: lazy=${lazy.bandData[i]} eager=${eager.bandData[i]}`);
			}
		}
	});
});
