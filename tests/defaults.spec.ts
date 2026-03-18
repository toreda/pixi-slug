import { Defaults } from '../src/defaults';

describe('Defaults', () => {
	it('should have TEXTURE_SIZE as a power of 2', () => {
		expect(Defaults.TEXTURE_SIZE).toBeGreaterThan(0);
		expect(Defaults.TEXTURE_SIZE & (Defaults.TEXTURE_SIZE - 1)).toBe(0);
	});

	it('should have BAND_COUNT greater than 0', () => {
		expect(Defaults.BAND_COUNT).toBeGreaterThan(0);
	});

	it('should have FONT_SIZE greater than 0', () => {
		expect(Defaults.FONT_SIZE).toBeGreaterThan(0);
	});
});
