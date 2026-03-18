import { slugTexturePack } from '../../../../src/shared/slug/texture/pack';
import type { SlugGlyphData } from '../../../../src/shared/slug/glyph/data';

function makeGlyph(charCode: number): SlugGlyphData {
	return {
		charCode,
		curves: [
			{ p1x: 0, p1y: 0, p2x: 5, p2y: 10, p3x: 10, p3y: 0 },
			{ p1x: 10, p1y: 0, p2x: 15, p2y: 10, p3x: 20, p3y: 0 }
		],
		bounds: { minX: 0, minY: 0, maxX: 20, maxY: 10 },
		advanceWidth: 22,
		lsb: 0,
		hBandCount: 2,
		vBandCount: 2,
		hBands: [[0, 1], [0]],
		vBands: [[0], [1]],
		curveOffset: 0,
		bandOffset: 0
	};
}

describe('slugTexturePack', () => {
	it('should return empty textures for empty glyph list', () => {
		const result = slugTexturePack([], 4096);
		expect(result.curveData.length).toBeGreaterThan(0);
		expect(result.bandData.length).toBeGreaterThan(0);
	});

	it('should pack curve data with 2 texels per curve', () => {
		const glyph = makeGlyph(65);
		const result = slugTexturePack([glyph], 4096);

		// 2 curves * 2 texels * 4 components = 16 floats minimum
		// First curve, texel 0: [p1x, p1y, p2x, p2y]
		expect(result.curveData[0]).toBe(0);
		expect(result.curveData[1]).toBe(0);
		expect(result.curveData[2]).toBe(5);
		expect(result.curveData[3]).toBe(10);

		// First curve, texel 1: [p3x, p3y, 0, 0]
		expect(result.curveData[4]).toBe(10);
		expect(result.curveData[5]).toBe(0);
	});

	it('should set curveOffset and bandOffset on glyph data', () => {
		const glyph = makeGlyph(65);
		slugTexturePack([glyph], 4096);
		expect(glyph.curveOffset).toBe(0);
		expect(glyph.bandOffset).toBeDefined();
	});

	it('should pack band headers with correct curve counts', () => {
		const glyph = makeGlyph(65);
		const result = slugTexturePack([glyph], 4096);

		// First hBand header: 2 curves
		const headerBase = glyph.bandOffset * 4;
		expect(result.bandData[headerBase]).toBe(2);

		// Second hBand header: 1 curve
		expect(result.bandData[headerBase + 4]).toBe(1);
	});
});
