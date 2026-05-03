import {readFileSync} from 'fs';
import {resolve} from 'path';
import {SlugFonts} from '../../../src/shared/slug/fonts';

function loadFontFixture(filename: string): ArrayBuffer {
	const buf = readFileSync(resolve(__dirname, '../../../assets/fonts', filename));
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

afterEach(() => {
	SlugFonts.clear();
});

describe('SlugFonts load options', () => {
	describe('fromArrayBuffer — backward compatible signature', () => {
		it('accepts a number as the second arg (legacy textureWidth)', async () => {
			const data = loadFontFixture('roboto-fallback.ttf');
			const font = await SlugFonts.fromArrayBuffer(data, 4096);
			expect(font).not.toBeNull();
			expect(font?.textureWidth).toBe(4096);
		});

		it('accepts no second arg (defaults to TEXTURE_SIZE)', async () => {
			const data = loadFontFixture('roboto-fallback.ttf');
			const font = await SlugFonts.fromArrayBuffer(data);
			expect(font).not.toBeNull();
			expect(font?.textureWidth).toBe(4096);
		});

		it('accepts an options object with textureWidth', async () => {
			const data = loadFontFixture('roboto-fallback.ttf');
			const font = await SlugFonts.fromArrayBuffer(data, {textureWidth: 4096});
			expect(font).not.toBeNull();
			expect(font?.textureWidth).toBe(4096);
		});
	});

	describe('fromArrayBuffer — preload', () => {
		it('does not preload glyphs when preload is omitted', async () => {
			const data = loadFontFixture('roboto-fallback.ttf');
			const font = await SlugFonts.fromArrayBuffer(data);
			expect(font?.glyphs.size).toBe(0);
		});

		it('preloads exactly the codepoints listed in a string', async () => {
			const data = loadFontFixture('roboto-fallback.ttf');
			const font = await SlugFonts.fromArrayBuffer(data, {preload: 'AB'});
			expect(font?.glyphs.has(65)).toBe(true);
			expect(font?.glyphs.has(66)).toBe(true);
			// Lazy: every other codepoint stays unprocessed.
			expect(font?.glyphs.has(67)).toBe(false);
		});

		it('fires onPreloadComplete after preload finishes', async () => {
			const data = loadFontFixture('roboto-fallback.ttf');
			const onComplete = jest.fn();
			await SlugFonts.fromArrayBuffer(data, {preload: 'A', onPreloadComplete: onComplete});
			expect(onComplete).toHaveBeenCalledTimes(1);
		});

		it('preloads the entire cmap when preload is true', async () => {
			const data = loadFontFixture('roboto-fallback.ttf');
			const font = await SlugFonts.fromArrayBuffer(data, {
				preload: true,
				preloadSliceMs: 1
			});
			expect(font?.glyphs.size).toBeGreaterThan(50);
		});

		it('returns null without throwing if the bytes are garbage; preload is skipped', async () => {
			const garbage = new Uint8Array([0, 1, 2, 3]).buffer;
			const onComplete = jest.fn();
			const onError = jest.fn();
			const font = await SlugFonts.fromArrayBuffer(garbage, {
				preload: 'A',
				onPreloadComplete: onComplete,
				onPreloadError: onError
			});
			expect(font).toBeNull();
			// Failed parse → preload never starts → no callbacks fire.
			expect(onComplete).not.toHaveBeenCalled();
			expect(onError).not.toHaveBeenCalled();
		});
	});

	describe('from — preload propagation through string-input route', () => {
		it('runs preload against an already-registered named font', async () => {
			const data = loadFontFixture('roboto-fallback.ttf');
			const font = await SlugFonts.fromArrayBuffer(data);
			expect(font).not.toBeNull();
			SlugFonts.register('test-roboto', font!);

			const onComplete = jest.fn();
			const result = await SlugFonts.from('test-roboto', {
				preload: 'X',
				onPreloadComplete: onComplete
			});
			expect(result).toBe(font);
			expect(font?.glyphs.has('X'.charCodeAt(0))).toBe(true);
			expect(onComplete).toHaveBeenCalledTimes(1);
		});

		it('runs preload against an existing SlugFont passed directly', async () => {
			const data = loadFontFixture('roboto-fallback.ttf');
			const font = await SlugFonts.fromArrayBuffer(data);
			expect(font).not.toBeNull();

			const onComplete = jest.fn();
			const result = await SlugFonts.from(font!, {
				preload: 'Y',
				onPreloadComplete: onComplete
			});
			expect(result).toBe(font);
			expect(font?.glyphs.has('Y'.charCodeAt(0))).toBe(true);
			expect(onComplete).toHaveBeenCalledTimes(1);
		});
	});
});
