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

describe('slugGlyphBands — reference-implementation rules', () => {
	// A 10×10 glyph split into 5 bands of 2 units. With unitsPerEm = 0 the
	// overlap epsilon (unitsPerEm / 1024) vanishes, so band membership is
	// driven purely by the curve's extent.
	const ZERO_UPM = 0;

	function diagonal(x0: number, y0: number, x1: number, y1: number): SlugGlyphCurve {
		return {p1x: x0, p1y: y0, p2x: (x0 + x1) / 2, p2y: (y0 + y1) / 2 + 0.1, p3x: x1, p3y: y1};
	}

	it('does not add a whole neighbouring band of margin', () => {
		// Five curves so bandCount is not clamped below 5.
		const curves: SlugGlyphCurve[] = [
			diagonal(0, 0, 2, 2),
			diagonal(2, 2, 4, 4),
			diagonal(4, 4, 6, 6),
			diagonal(6, 6, 8, 8),
			diagonal(8, 8, 10, 10)
		];
		const result = slugGlyphBands(curves, 0, 0, 10, 10, 5, ZERO_UPM);
		// Curve 2 spans y ∈ [4, 6] → bands 2 and 3 only (6 lands on the
		// boundary of band 3), never bands 1 or 4.
		expect(result.hBands[1]).not.toContain(2);
		expect(result.hBands[2]).toContain(2);
		expect(result.hBands[3]).toContain(2);
		expect(result.hBands[4]).not.toContain(2);
	});

	it('overlaps bands by the epsilon derived from unitsPerEm', () => {
		const curves: SlugGlyphCurve[] = [
			diagonal(0, 0, 2, 2),
			diagonal(2, 2, 4, 4),
			diagonal(4, 4, 6, 6),
			diagonal(6, 6, 8, 8),
			diagonal(8, 8, 10, 10)
		];
		// unitsPerEm = 1024 → epsilon = 1 unit, half a band.
		const result = slugGlyphBands(curves, 0, 0, 10, 10, 5, 1024);
		// Curve 2 (y ∈ [4, 6]) now reaches into [3, 7] → bands 1..3.
		expect(result.hBands[1]).toContain(2);
		expect(result.hBands[2]).toContain(2);
		expect(result.hBands[3]).toContain(2);
		expect(result.hBands[4]).not.toContain(2);
	});

	it('excludes straight horizontal lines from horizontal bands but keeps them in vertical bands', () => {
		const hLine: SlugGlyphCurve = {p1x: 0, p1y: 5, p2x: 10, p2y: 5, p3x: 10, p3y: 5};
		const curves: SlugGlyphCurve[] = [hLine, diagonal(0, 0, 10, 10), diagonal(10, 0, 0, 10)];
		const result = slugGlyphBands(curves, 0, 0, 10, 10, 3, ZERO_UPM);
		for (const band of result.hBands) {
			expect(band).not.toContain(0);
		}
		const inSomeVBand = result.vBands.some((band) => band.includes(0));
		expect(inSomeVBand).toBe(true);
	});

	it('excludes straight vertical lines from vertical bands but keeps them in horizontal bands', () => {
		const vLine: SlugGlyphCurve = {p1x: 5, p1y: 0, p2x: 5, p2y: 10, p3x: 5, p3y: 10};
		const curves: SlugGlyphCurve[] = [vLine, diagonal(0, 0, 10, 10), diagonal(10, 0, 0, 10)];
		const result = slugGlyphBands(curves, 0, 0, 10, 10, 3, ZERO_UPM);
		for (const band of result.vBands) {
			expect(band).not.toContain(0);
		}
		const inSomeHBand = result.hBands.some((band) => band.includes(0));
		expect(inSomeHBand).toBe(true);
	});

	it('does not treat a curve with level end points but a raised control point as a horizontal line', () => {
		const arch: SlugGlyphCurve = {p1x: 0, p1y: 5, p2x: 5, p2y: 9, p3x: 10, p3y: 5};
		const curves: SlugGlyphCurve[] = [arch, diagonal(0, 0, 10, 10), diagonal(10, 0, 0, 10)];
		const result = slugGlyphBands(curves, 0, 0, 10, 10, 3, ZERO_UPM);
		const inSomeHBand = result.hBands.some((band) => band.includes(0));
		expect(inSomeHBand).toBe(true);
	});

	it('sorts horizontal bands by descending max x and vertical bands by descending max y', () => {
		const curves: SlugGlyphCurve[] = [
			diagonal(0, 0, 3, 10),
			diagonal(0, 0, 9, 10),
			diagonal(0, 0, 6, 10),
			{p1x: 0, p1y: 0, p2x: 10, p2y: 2, p3x: 10, p3y: 8},
			{p1x: 0, p1y: 0, p2x: 10, p2y: 1, p3x: 10, p3y: 4}
		];
		const result = slugGlyphBands(curves, 0, 0, 10, 10, 1, ZERO_UPM);
		const maxX = (i: number) => Math.max(curves[i].p1x, curves[i].p2x, curves[i].p3x);
		const maxY = (i: number) => Math.max(curves[i].p1y, curves[i].p2y, curves[i].p3y);
		const h = result.hBands[0];
		for (let k = 1; k < h.length; k++) {
			expect(maxX(h[k - 1])).toBeGreaterThanOrEqual(maxX(h[k]));
		}
		const v = result.vBands[0];
		for (let k = 1; k < v.length; k++) {
			expect(maxY(v[k - 1])).toBeGreaterThanOrEqual(maxY(v[k]));
		}
	});

	it('quantizes control points to half precision before deciding band membership', () => {
		// 2047.5 is not representable in half precision (the step is 1 between
		// 1024 and 2048) and rounds to even → 2048. A curve whose float64
		// extent dips to 2047.5 would land in band 0 of a 2-band, 4096-unit
		// glyph; its quantized extent starts at 2048 and belongs to band 1 only.
		const curves: SlugGlyphCurve[] = [
			diagonal(0, 0, 2048, 1024),
			diagonal(2048, 1024, 4096, 2048),
			{p1x: 0, p1y: 2047.5, p2x: 2048, p2y: 3000, p3x: 4096, p3y: 4096},
			diagonal(4096, 4096, 0, 0)
		];
		const result = slugGlyphBands(curves, 0, 0, 4096, 4096, 2, ZERO_UPM);
		expect(result.hBands[0]).not.toContain(2);
		expect(result.hBands[1]).toContain(2);
	});
});
