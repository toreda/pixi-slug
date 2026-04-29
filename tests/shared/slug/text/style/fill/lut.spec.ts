import {SLUG_FILL_LUT_WIDTH, slugBakeFillLut} from '../../../../../../src/shared/slug/text/style/fill/lut';

describe('slugBakeFillLut', () => {
	it('produces a Uint8Array of length 256*4', () => {
		const lut = slugBakeFillLut([
			{offset: 0, color: [0, 0, 0, 1]},
			{offset: 1, color: [1, 1, 1, 1]}
		]);
		expect(lut).toBeInstanceOf(Uint8Array);
		expect(lut.length).toBe(SLUG_FILL_LUT_WIDTH * 4);
	});

	it('snaps the first pixel to the first stop and last to the last stop', () => {
		const lut = slugBakeFillLut([
			{offset: 0, color: [1, 0, 0, 1]},
			{offset: 1, color: [0, 0, 1, 1]}
		]);
		expect(lut[0]).toBe(255);
		expect(lut[1]).toBe(0);
		expect(lut[2]).toBe(0);
		expect(lut[3]).toBe(255);
		const lastIdx = (SLUG_FILL_LUT_WIDTH - 1) * 4;
		expect(lut[lastIdx]).toBe(0);
		expect(lut[lastIdx + 1]).toBe(0);
		expect(lut[lastIdx + 2]).toBe(255);
		expect(lut[lastIdx + 3]).toBe(255);
	});

	it('linearly interpolates between adjacent stops', () => {
		const lut = slugBakeFillLut([
			{offset: 0, color: [0, 0, 0, 1]},
			{offset: 1, color: [1, 1, 1, 1]}
		]);
		// Mid-pixel should be ~127/128 (linear ramp from 0 to 255 across 256 samples).
		const mid = Math.floor(SLUG_FILL_LUT_WIDTH / 2) * 4;
		expect(lut[mid]).toBeGreaterThanOrEqual(126);
		expect(lut[mid]).toBeLessThanOrEqual(129);
	});

	it('snaps pixels outside the stop range to the nearest end', () => {
		const lut = slugBakeFillLut([
			{offset: 0.4, color: [1, 0, 0, 1]},
			{offset: 0.6, color: [0, 0, 1, 1]}
		]);
		// First 40% of pixels should be solid red.
		const earlyIdx = Math.floor(SLUG_FILL_LUT_WIDTH * 0.2) * 4;
		expect(lut[earlyIdx]).toBe(255);
		expect(lut[earlyIdx + 2]).toBe(0);
		// Last 40% of pixels should be solid blue.
		const lateIdx = Math.floor(SLUG_FILL_LUT_WIDTH * 0.8) * 4;
		expect(lut[lateIdx]).toBe(0);
		expect(lut[lateIdx + 2]).toBe(255);
	});

	it('handles three stops', () => {
		const lut = slugBakeFillLut([
			{offset: 0, color: [1, 0, 0, 1]},
			{offset: 0.5, color: [0, 1, 0, 1]},
			{offset: 1, color: [0, 0, 1, 1]}
		]);
		const midIdx = Math.floor(SLUG_FILL_LUT_WIDTH / 2) * 4;
		expect(lut[midIdx + 1]).toBeGreaterThanOrEqual(250);
	});

	it('returns a zeroed buffer for empty stops', () => {
		const lut = slugBakeFillLut([]);
		expect(lut.length).toBe(SLUG_FILL_LUT_WIDTH * 4);
		for (let i = 0; i < lut.length; i++) {
			expect(lut[i]).toBe(0);
		}
	});
});
