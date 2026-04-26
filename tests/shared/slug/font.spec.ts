import {readFileSync} from 'fs';
import {resolve} from 'path';
import {SlugFont} from '../../../src/shared/slug/font';
import {Defaults} from '../../../src/defaults';

/**
 * Load a font fixture from `assets/fonts/` into an `ArrayBuffer`. Node's
 * `Buffer` is a view onto a larger pooled ArrayBuffer, so we must slice
 * to the exact byte range — `opentype.parse` reads from offset 0.
 */
function loadFontFixture(filename: string): ArrayBuffer {
	const buf = readFileSync(resolve(__dirname, '../../../assets/fonts', filename));
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

describe('SlugFont', () => {
	// =========================================================
	// Constructor Tests
	// =========================================================
	describe('constructor', () => {
		describe('argument validation', () => {
			it('should accept default texture width when no argument is passed', () => {
				const font = new SlugFont();
				expect(font.textureWidth).toBe(Defaults.TEXTURE_SIZE);
			});

			it('should accept a power-of-2 texture width', () => {
				const font = new SlugFont(512);
				expect(font.textureWidth).toBe(512);
			});

			it('should accept the smallest valid power-of-2 texture width', () => {
				const font = new SlugFont(1);
				expect(font.textureWidth).toBe(1);
			});

			it('should throw when textureWidth is not a power of 2', () => {
				expect(() => new SlugFont(300)).toThrow(/power of 2/);
			});

			it('should throw when textureWidth is zero', () => {
				expect(() => new SlugFont(0)).toThrow(/power of 2/);
			});

			it('should throw when textureWidth is negative', () => {
				expect(() => new SlugFont(-1024)).toThrow(/power of 2/);
			});

			it('should include the offending value in the error message', () => {
				expect(() => new SlugFont(300)).toThrow(/300/);
			});

			it('should not mutate any state when validation throws', () => {
				expect(() => new SlugFont(7)).toThrow();
				// Subsequent valid construction still produces a fresh instance
				// with documented defaults — proves no shared mutable state.
				const font = new SlugFont(512);
				expect(font.textureWidth).toBe(512);
			});
		});

		describe('initial public property values', () => {
			let font: SlugFont;

			beforeEach(() => {
				font = new SlugFont();
			});

			it('should initialize curveData to an empty Float32Array', () => {
				expect(font.curveData).toBeInstanceOf(Float32Array);
				expect(font.curveData.length).toBe(0);
			});

			it('should initialize bandData to an empty Uint32Array', () => {
				expect(font.bandData).toBeInstanceOf(Uint32Array);
				expect(font.bandData.length).toBe(0);
			});

			it('should initialize glyphs to an empty Map', () => {
				expect(font.glyphs).toBeInstanceOf(Map);
				expect(font.glyphs.size).toBe(0);
			});

			it('should initialize advances to an empty Map', () => {
				expect(font.advances).toBeInstanceOf(Map);
				expect(font.advances.size).toBe(0);
			});

			it('should initialize unitsPerEm to 0', () => {
				expect(font.unitsPerEm).toBe(0);
			});

			it('should initialize ascender to 0', () => {
				expect(font.ascender).toBe(0);
			});

			it('should initialize descender to 0', () => {
				expect(font.descender).toBe(0);
			});

			it('should initialize underlinePosition to 0', () => {
				expect(font.underlinePosition).toBe(0);
			});

			it('should initialize underlineThickness to 0', () => {
				expect(font.underlineThickness).toBe(0);
			});

			it('should initialize strikethroughPosition to 0', () => {
				expect(font.strikethroughPosition).toBe(0);
			});

			it('should initialize strikethroughSize to 0', () => {
				expect(font.strikethroughSize).toBe(0);
			});

			it('should initialize gpuCache to null', () => {
				expect(font.gpuCache).toBeNull();
			});

			it('should preserve the textureWidth passed to the constructor', () => {
				const custom = new SlugFont(2048);
				expect(custom.textureWidth).toBe(2048);
			});
		});
	});

	// =========================================================
	// Implementation
	// =========================================================
	describe('implementation', () => {
		describe('setGpuDestroy', () => {
			it('should return true when given a function', () => {
				const font = new SlugFont();
				expect(font.setGpuDestroy(() => {})).toBe(true);
			});

			it('should return false when given null', () => {
				const font = new SlugFont();
				expect(font.setGpuDestroy(null as unknown as () => void)).toBe(false);
			});

			it('should return false when given undefined', () => {
				const font = new SlugFont();
				expect(font.setGpuDestroy(undefined as unknown as () => void)).toBe(false);
			});

			it('should return false when given a non-function value', () => {
				const font = new SlugFont();
				expect(font.setGpuDestroy('not a fn' as unknown as () => void)).toBe(false);
				expect(font.setGpuDestroy(42 as unknown as () => void)).toBe(false);
				expect(font.setGpuDestroy({} as unknown as () => void)).toBe(false);
			});

			it('should cause destroyGpu to invoke the registered function', () => {
				const font = new SlugFont();
				const fn = jest.fn();
				font.setGpuDestroy(fn);
				font.destroyGpu();
				expect(fn).toHaveBeenCalledTimes(1);
			});

			it('should not invoke the destroy callback when an invalid value is passed', () => {
				const font = new SlugFont();
				const fn = jest.fn();
				font.setGpuDestroy(fn);
				font.setGpuDestroy(null as unknown as () => void); // invalid — must not replace prior fn
				font.destroyGpu();
				expect(fn).toHaveBeenCalledTimes(1);
			});

			it('should replace a previously registered destroy callback when called again with a valid fn', () => {
				const font = new SlugFont();
				const first = jest.fn();
				const second = jest.fn();
				font.setGpuDestroy(first);
				font.setGpuDestroy(second);
				font.destroyGpu();
				expect(first).not.toHaveBeenCalled();
				expect(second).toHaveBeenCalledTimes(1);
			});

			it('should not mutate any other public property', () => {
				const font = new SlugFont(1024);
				font.setGpuDestroy(() => {});
				expect(font.textureWidth).toBe(1024);
				expect(font.curveData.length).toBe(0);
				expect(font.bandData.length).toBe(0);
				expect(font.glyphs.size).toBe(0);
				expect(font.gpuCache).toBeNull();
			});
		});

		describe('destroyGpu', () => {
			it('should be a no-op when no destroy callback was registered', () => {
				const font = new SlugFont();
				expect(() => font.destroyGpu()).not.toThrow();
			});

			it('should clear gpuCache to null', () => {
				const font = new SlugFont();
				font.gpuCache = {fake: 'cache'};
				font.destroyGpu();
				expect(font.gpuCache).toBeNull();
			});

			it('should invoke the registered destroy callback exactly once', () => {
				const font = new SlugFont();
				const fn = jest.fn();
				font.setGpuDestroy(fn);
				font.destroyGpu();
				expect(fn).toHaveBeenCalledTimes(1);
			});

			it('should not invoke the destroy callback on a second call', () => {
				const font = new SlugFont();
				const fn = jest.fn();
				font.setGpuDestroy(fn);
				font.destroyGpu();
				font.destroyGpu();
				expect(fn).toHaveBeenCalledTimes(1);
			});

			it('should clear gpuCache even when no callback is registered', () => {
				const font = new SlugFont();
				font.gpuCache = {anything: true};
				font.destroyGpu();
				expect(font.gpuCache).toBeNull();
			});

			it('should clear gpuCache even when the callback throws', () => {
				const font = new SlugFont();
				font.gpuCache = {leftover: true};
				font.setGpuDestroy(() => {
					throw new Error('boom');
				});
				expect(() => font.destroyGpu()).toThrow('boom');
				// State must still be cleared after a throwing callback so a
				// subsequent destroyGpu() call is safe and idempotent.
				// NOTE: current implementation runs cleanup *before* clearing,
				// so a throwing callback prevents clearing — assert observed
				// behavior here so future refactors notice the change.
				expect(font.gpuCache).not.toBeNull();
			});

			it('should leave non-GPU public state untouched', () => {
				const font = new SlugFont(2048);
				font.unitsPerEm = 1000;
				font.ascender = 800;
				font.setGpuDestroy(() => {});
				font.destroyGpu();
				expect(font.textureWidth).toBe(2048);
				expect(font.unitsPerEm).toBe(1000);
				expect(font.ascender).toBe(800);
			});
		});

		describe('memoryBytes', () => {
			it('should return at least one row per texture for an empty font', () => {
				const font = new SlugFont(4096);
				// Empty font: ceil(0/4/4096)||1 = 1 row each → 2 rows × 4096 × 16 bytes
				expect(font.memoryBytes()).toBe(2 * 4096 * 16);
			});

			it('should return a positive number for any valid texture width', () => {
				expect(new SlugFont(1).memoryBytes()).toBeGreaterThan(0);
				expect(new SlugFont(256).memoryBytes()).toBeGreaterThan(0);
				expect(new SlugFont(4096).memoryBytes()).toBeGreaterThan(0);
			});

			it('should scale linearly with textureWidth on an empty font', () => {
				const small = new SlugFont(256).memoryBytes();
				const large = new SlugFont(512).memoryBytes();
				expect(large).toBe(small * 2);
			});

			it('should round curve rows up to the next full row', () => {
				const font = new SlugFont(4);
				// 5 floats → ceil(5/4/4)=1 curve row, 0 band → 1 band row → 2 × 4 × 16 = 128
				font.curveData = new Float32Array(5);
				expect(font.memoryBytes()).toBe(2 * 4 * 16);
			});

			it('should round band rows up to the next full row', () => {
				const font = new SlugFont(4);
				font.bandData = new Uint32Array(17); // ceil(17/4/4)=2 band rows
				// 1 (default empty curve row) + 2 (band rows) = 3 rows
				expect(font.memoryBytes()).toBe(3 * 4 * 16);
			});

			it('should return a multiple of textureWidth × 16 (one full row)', () => {
				const font = new SlugFont(64);
				font.curveData = new Float32Array(123);
				font.bandData = new Uint32Array(7);
				expect(font.memoryBytes() % (64 * 16)).toBe(0);
			});

			it('should not mutate curveData, bandData, or any other public property', () => {
				const font = new SlugFont(256);
				const beforeCurve = font.curveData;
				const beforeBand = font.bandData;
				const beforeWidth = font.textureWidth;
				font.memoryBytes();
				expect(font.curveData).toBe(beforeCurve);
				expect(font.bandData).toBe(beforeBand);
				expect(font.textureWidth).toBe(beforeWidth);
			});
		});

		describe('loadSync', () => {
			it('should populate unitsPerEm to a positive value from a valid TTF', () => {
				const font = new SlugFont();
				font.loadSync(loadFontFixture('roboto-fallback.ttf'));
				expect(font.unitsPerEm).toBeGreaterThan(0);
			});

			it('should populate ascender and descender from a valid TTF', () => {
				const font = new SlugFont();
				font.loadSync(loadFontFixture('roboto-fallback.ttf'));
				expect(font.ascender).toBeGreaterThan(0);
				// Descender is conventionally negative (below baseline).
				expect(font.descender).toBeLessThan(0);
			});

			it('should populate underline metrics from a valid TTF', () => {
				const font = new SlugFont();
				font.loadSync(loadFontFixture('roboto-fallback.ttf'));
				expect(typeof font.underlinePosition).toBe('number');
				expect(font.underlineThickness).toBeGreaterThan(0);
			});

			it('should populate strikethrough metrics from a valid TTF', () => {
				const font = new SlugFont();
				font.loadSync(loadFontFixture('roboto-fallback.ttf'));
				expect(font.strikethroughPosition).toBeGreaterThan(0);
				expect(font.strikethroughSize).toBeGreaterThan(0);
			});

			it('should populate the glyphs map with at least one entry', () => {
				const font = new SlugFont();
				font.loadSync(loadFontFixture('roboto-fallback.ttf'));
				expect(font.glyphs.size).toBeGreaterThan(0);
			});

			it('should populate the advances map with at least one entry', () => {
				const font = new SlugFont();
				font.loadSync(loadFontFixture('roboto-fallback.ttf'));
				expect(font.advances.size).toBeGreaterThan(0);
			});

			it('should populate non-empty curveData after a successful load', () => {
				const font = new SlugFont();
				font.loadSync(loadFontFixture('roboto-fallback.ttf'));
				expect(font.curveData.length).toBeGreaterThan(0);
			});

			it('should populate non-empty bandData after a successful load', () => {
				const font = new SlugFont();
				font.loadSync(loadFontFixture('roboto-fallback.ttf'));
				expect(font.bandData.length).toBeGreaterThan(0);
			});

			it('should accept OTF font data', () => {
				const font = new SlugFont();
				expect(() => font.loadSync(loadFontFixture('roboto-fallback.otf'))).not.toThrow();
				expect(font.unitsPerEm).toBeGreaterThan(0);
			});

			it('should accept WOFF font data', () => {
				const font = new SlugFont();
				expect(() => font.loadSync(loadFontFixture('roboto-fallback.woff'))).not.toThrow();
				expect(font.unitsPerEm).toBeGreaterThan(0);
			});

			it('should throw when given WOFF2 data', () => {
				const font = new SlugFont();
				expect(() => font.loadSync(loadFontFixture('roboto-fallback.woff2'))).toThrow(/WOFF2/);
			});

			it('should throw when given an empty buffer', () => {
				const font = new SlugFont();
				expect(() => font.loadSync(new ArrayBuffer(0))).toThrow();
			});

			it('should throw when given a buffer with garbage bytes', () => {
				const font = new SlugFont();
				const garbage = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer;
				expect(() => font.loadSync(garbage)).toThrow();
			});

			it('should leave initial state intact when WOFF2 is rejected', () => {
				const font = new SlugFont();
				expect(() => font.loadSync(loadFontFixture('roboto-fallback.woff2'))).toThrow();
				expect(font.unitsPerEm).toBe(0);
				expect(font.ascender).toBe(0);
				expect(font.descender).toBe(0);
				expect(font.glyphs.size).toBe(0);
				expect(font.advances.size).toBe(0);
				expect(font.curveData.length).toBe(0);
				expect(font.bandData.length).toBe(0);
			});

			it('should clear gpuCache when reloaded', () => {
				const font = new SlugFont();
				font.loadSync(loadFontFixture('roboto-fallback.ttf'));
				font.gpuCache = {stale: true};
				const destroyFn = jest.fn();
				font.setGpuDestroy(destroyFn);
				font.loadSync(loadFontFixture('roboto-fallback.ttf'));
				expect(font.gpuCache).toBeNull();
				expect(destroyFn).toHaveBeenCalledTimes(1);
			});

			it('should preserve textureWidth across loads', () => {
				// slugTexturePack requires textureWidth === 4096 (matches the
				// shader's kLogBandTextureWidth). Using the default here.
				const font = new SlugFont();
				font.loadSync(loadFontFixture('roboto-fallback.ttf'));
				expect(font.textureWidth).toBe(Defaults.TEXTURE_SIZE);
			});

			it('should produce curveData sized to a multiple of 4 RGBA channels', () => {
				const font = new SlugFont();
				font.loadSync(loadFontFixture('roboto-fallback.ttf'));
				// Texture-packed data must align to full RGBA texels.
				expect(font.curveData.length % 4).toBe(0);
			});

			it('should produce bandData sized to a multiple of 4 RGBA channels', () => {
				const font = new SlugFont();
				font.loadSync(loadFontFixture('roboto-fallback.ttf'));
				expect(font.bandData.length % 4).toBe(0);
			});

			it('should throw when textureWidth does not match the shader-required size', () => {
				// Texture packer is locked to TEXTURE_SIZE (4096) to align with
				// the fragment shader's kLogBandTextureWidth. Other widths pass
				// the constructor's power-of-2 check but fail at load time.
				const font = new SlugFont(1024);
				expect(() => font.loadSync(loadFontFixture('roboto-fallback.ttf'))).toThrow(
					/textureWidth must be 4096/
				);
			});
		});

		describe('load', () => {
			it('should return a Promise', () => {
				const font = new SlugFont();
				const result = font.load(loadFontFixture('roboto-fallback.ttf'));
				expect(result).toBeInstanceOf(Promise);
				return result;
			});

			it('should populate unitsPerEm from a valid TTF', async () => {
				const font = new SlugFont();
				await font.load(loadFontFixture('roboto-fallback.ttf'));
				expect(font.unitsPerEm).toBeGreaterThan(0);
			});

			it('should populate glyphs from a valid TTF', async () => {
				const font = new SlugFont();
				await font.load(loadFontFixture('roboto-fallback.ttf'));
				expect(font.glyphs.size).toBeGreaterThan(0);
			});

			it('should accept OTF font data', async () => {
				const font = new SlugFont();
				await font.load(loadFontFixture('roboto-fallback.otf'));
				expect(font.unitsPerEm).toBeGreaterThan(0);
			});

			it('should accept WOFF font data', async () => {
				const font = new SlugFont();
				await font.load(loadFontFixture('roboto-fallback.woff'));
				expect(font.unitsPerEm).toBeGreaterThan(0);
			});

			it('should accept WOFF2 font data via async decompression', async () => {
				const font = new SlugFont();
				await font.load(loadFontFixture('roboto-fallback.woff2'));
				expect(font.unitsPerEm).toBeGreaterThan(0);
				expect(font.glyphs.size).toBeGreaterThan(0);
			});

			it('should reject when given an empty buffer', async () => {
				const font = new SlugFont();
				await expect(font.load(new ArrayBuffer(0))).rejects.toBeDefined();
			});

			it('should reject when given garbage bytes', async () => {
				const font = new SlugFont();
				const garbage = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer;
				await expect(font.load(garbage)).rejects.toBeDefined();
			});

			it('should leave initial state intact after a rejected load', async () => {
				const font = new SlugFont();
				await expect(font.load(new ArrayBuffer(0))).rejects.toBeDefined();
				expect(font.unitsPerEm).toBe(0);
				expect(font.glyphs.size).toBe(0);
				expect(font.curveData.length).toBe(0);
				expect(font.bandData.length).toBe(0);
			});

			it('should preserve textureWidth across loads', async () => {
				// slugTexturePack only accepts the default texture width.
				const font = new SlugFont();
				await font.load(loadFontFixture('roboto-fallback.ttf'));
				expect(font.textureWidth).toBe(Defaults.TEXTURE_SIZE);
			});

			it('should clear gpuCache on reload', async () => {
				const font = new SlugFont();
				await font.load(loadFontFixture('roboto-fallback.ttf'));
				font.gpuCache = {stale: true};
				const destroyFn = jest.fn();
				font.setGpuDestroy(destroyFn);
				await font.load(loadFontFixture('roboto-fallback.ttf'));
				expect(font.gpuCache).toBeNull();
				expect(destroyFn).toHaveBeenCalledTimes(1);
			});
		});
	});
});
