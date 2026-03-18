import { slugGlyphBands } from '../../../../src/shared/slug/glyph/bands';
import type { SlugGlyphCurve } from '../../../../src/shared/slug/glyph/data';

describe('slugGlyphBands', () => {
	it('should return zero bands for empty curves', () => {
		const result = slugGlyphBands([], 0, 0, 10, 10);
		expect(result.hBandCount).toBe(0);
		expect(result.vBandCount).toBe(0);
	});

	it('should return zero bands for zero-area bounding box', () => {
		const curve: SlugGlyphCurve = { p1x: 0, p1y: 0, p2x: 5, p2y: 0, p3x: 10, p3y: 0 };
		const result = slugGlyphBands([curve], 0, 0, 10, 0);
		expect(result.hBandCount).toBe(0);
	});

	it('should assign a curve spanning the full bounding box to all bands', () => {
		// Band count is capped to min(bandCount, curves.length), so need enough curves
		const curves: SlugGlyphCurve[] = [
			{ p1x: 0, p1y: 0, p2x: 2.5, p2y: 2.5, p3x: 5, p3y: 5 },
			{ p1x: 5, p1y: 5, p2x: 7.5, p2y: 7.5, p3x: 10, p3y: 10 },
			{ p1x: 0, p1y: 5, p2x: 2.5, p2y: 7.5, p3x: 5, p3y: 10 },
			{ p1x: 5, p1y: 0, p2x: 7.5, p2y: 2.5, p3x: 10, p3y: 5 }
		];
		const result = slugGlyphBands(curves, 0, 0, 10, 10, 4);
		expect(result.hBandCount).toBe(4);
		expect(result.vBandCount).toBe(4);
	});

	it('should assign a small curve to only overlapping bands', () => {
		const curves: SlugGlyphCurve[] = [
			{ p1x: 0, p1y: 0, p2x: 1, p2y: 1, p3x: 2, p3y: 2 },
			{ p1x: 3, p1y: 3, p2x: 5, p2y: 5, p3x: 7, p3y: 7 },
			{ p1x: 6, p1y: 6, p2x: 7, p2y: 7, p3x: 8, p3y: 8 },
			{ p1x: 8, p1y: 8, p2x: 9, p2y: 9, p3x: 10, p3y: 10 },
			{ p1x: 4, p1y: 4, p2x: 5, p2y: 5, p3x: 6, p3y: 6 }
		];
		const result = slugGlyphBands(curves, 0, 0, 10, 10, 5);
		// First curve (0-2 range) should be in first band but not last
		expect(result.hBands[0]).toContain(0);
		expect(result.vBands[0]).toContain(0);
		expect(result.hBands[4]).not.toContain(0);
		expect(result.vBands[4]).not.toContain(0);
	});

	it('should cap band count to curve count', () => {
		const curve: SlugGlyphCurve = { p1x: 0, p1y: 0, p2x: 5, p2y: 5, p3x: 10, p3y: 10 };
		const result = slugGlyphBands([curve], 0, 0, 10, 10, 16);
		expect(result.hBandCount).toBe(1);
		expect(result.vBandCount).toBe(1);
	});
});
