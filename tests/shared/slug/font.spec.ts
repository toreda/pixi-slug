import { SlugFont } from '../../../src/shared/slug/font';
import { Defaults } from '../../../src/defaults';

describe('SlugFont', () => {
	describe('constructor', () => {
		it('should use default texture width', () => {
			const font = new SlugFont();
			expect(font.textureWidth).toBe(Defaults.TEXTURE_SIZE);
		});

		it('should accept custom power-of-2 texture width', () => {
			const font = new SlugFont(512);
			expect(font.textureWidth).toBe(512);
		});

		it('should throw on non-power-of-2 texture width', () => {
			expect(() => new SlugFont(300)).toThrow();
		});

		it('should throw on zero texture width', () => {
			expect(() => new SlugFont(0)).toThrow();
		});

		it('should throw on negative texture width', () => {
			expect(() => new SlugFont(-1024)).toThrow();
		});

		it('should initialize with empty curve and band data', () => {
			const font = new SlugFont();
			expect(font.curveData.length).toBe(0);
			expect(font.bandData.length).toBe(0);
		});

		it('should initialize with empty glyph map', () => {
			const font = new SlugFont();
			expect(font.glyphs.size).toBe(0);
		});
	});

	describe('load', () => {
		// TODO: Add tests with real/mock font data
	});
});
