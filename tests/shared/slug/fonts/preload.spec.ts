import {readFileSync} from 'fs';
import {resolve} from 'path';
import {SlugFont} from '../../../../src/shared/slug/font';
import {slugFontRunPreload} from '../../../../src/shared/slug/fonts/preload';

function loadFontFixture(filename: string): ArrayBuffer {
	const buf = readFileSync(resolve(__dirname, '../../../../assets/fonts', filename));
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

async function loadedFont(): Promise<SlugFont> {
	const font = new SlugFont();
	await font.load(loadFontFixture('roboto-fallback.ttf'));
	return font;
}

describe('slugFontRunPreload', () => {
	describe('no preload requested', () => {
		it('returns immediately when preload is undefined', async () => {
			const font = await loadedFont();
			const before = font.glyphs.size;
			await slugFontRunPreload(font, {});
			expect(font.glyphs.size).toBe(before);
		});

		it('returns immediately when preload is false', async () => {
			const font = await loadedFont();
			const before = font.glyphs.size;
			await slugFontRunPreload(font, {preload: false});
			expect(font.glyphs.size).toBe(before);
		});

		it('does not invoke any callbacks when preload is omitted', async () => {
			const font = await loadedFont();
			const onProgress = jest.fn();
			const onComplete = jest.fn();
			const onError = jest.fn();
			await slugFontRunPreload(font, {
				onPreloadProgress: onProgress,
				onPreloadComplete: onComplete,
				onPreloadError: onError
			});
			expect(onProgress).not.toHaveBeenCalled();
			expect(onComplete).not.toHaveBeenCalled();
			expect(onError).not.toHaveBeenCalled();
		});
	});

	describe('fixed-set preload (synchronous)', () => {
		it('preloads each codepoint in a string', async () => {
			const font = await loadedFont();
			expect(font.glyphs.size).toBe(0);
			await slugFontRunPreload(font, {preload: 'Hello'});
			// Unique codepoints in "Hello" → H, e, l, o (4 distinct)
			expect(font.glyphs.has('H'.charCodeAt(0))).toBe(true);
			expect(font.glyphs.has('e'.charCodeAt(0))).toBe(true);
			expect(font.glyphs.has('l'.charCodeAt(0))).toBe(true);
			expect(font.glyphs.has('o'.charCodeAt(0))).toBe(true);
		});

		it('dedupes repeated codepoints within the input string', async () => {
			const font = await loadedFont();
			await slugFontRunPreload(font, {preload: 'lll'});
			// All three are the same codepoint — only one entry created.
			expect(font.glyphs.has('l'.charCodeAt(0))).toBe(true);
		});

		it('accepts a string array', async () => {
			const font = await loadedFont();
			await slugFontRunPreload(font, {preload: ['AB', 'CD']});
			expect(font.glyphs.has('A'.charCodeAt(0))).toBe(true);
			expect(font.glyphs.has('B'.charCodeAt(0))).toBe(true);
			expect(font.glyphs.has('C'.charCodeAt(0))).toBe(true);
			expect(font.glyphs.has('D'.charCodeAt(0))).toBe(true);
		});

		it('accepts a raw codepoint iterable', async () => {
			const font = await loadedFont();
			await slugFontRunPreload(font, {preload: [65, 66]}); // A, B
			expect(font.glyphs.has(65)).toBe(true);
			expect(font.glyphs.has(66)).toBe(true);
		});

		it('fires onPreloadComplete on the synchronous path', async () => {
			const font = await loadedFont();
			const onComplete = jest.fn();
			await slugFontRunPreload(font, {preload: 'A', onPreloadComplete: onComplete});
			expect(onComplete).toHaveBeenCalledTimes(1);
		});

		it('does NOT fire onPreloadProgress on the synchronous path', async () => {
			const font = await loadedFont();
			const onProgress = jest.fn();
			await slugFontRunPreload(font, {preload: 'AB', onPreloadProgress: onProgress});
			expect(onProgress).not.toHaveBeenCalled();
		});

		it('still fires onPreloadComplete for an empty preload set', async () => {
			const font = await loadedFont();
			const onComplete = jest.fn();
			await slugFontRunPreload(font, {preload: '', onPreloadComplete: onComplete});
			expect(onComplete).toHaveBeenCalledTimes(1);
		});

		it('silently skips codepoints not in the font cmap', async () => {
			const font = await loadedFont();
			// U+1F600 (😀) is almost certainly not in Roboto's cmap.
			await expect(
				slugFontRunPreload(font, {preload: 'A\u{1F600}B'})
			).resolves.toBeUndefined();
			expect(font.glyphs.has(65)).toBe(true); // A
			expect(font.glyphs.has(66)).toBe(true); // B
		});
	});

	describe('time-sliced preload (preload: true)', () => {
		it('preloads every renderable codepoint in the cmap', async () => {
			const font = await loadedFont();
			await slugFontRunPreload(font, {preload: true});
			// Roboto fallback should populate at least the basic Latin
			// renderable subset.
			expect(font.glyphs.size).toBeGreaterThan(50);
		});

		it('fires onPreloadProgress at least once', async () => {
			const font = await loadedFont();
			const onProgress = jest.fn();
			await slugFontRunPreload(font, {
				preload: true,
				preloadSliceMs: 1,
				onPreloadProgress: onProgress
			});
			expect(onProgress).toHaveBeenCalled();
			// Last call's `done` should equal `total`.
			const lastCall = onProgress.mock.calls[onProgress.mock.calls.length - 1];
			expect(lastCall[0]).toBe(lastCall[1]);
		});

		it('reports monotonically increasing done across slices', async () => {
			const font = await loadedFont();
			const onProgress = jest.fn();
			await slugFontRunPreload(font, {
				preload: true,
				preloadSliceMs: 1,
				onPreloadProgress: onProgress
			});

			let prev = 0;
			for (const [done] of onProgress.mock.calls) {
				expect(done).toBeGreaterThan(prev);
				prev = done;
			}
		});

		it('fires onPreloadComplete after all slices finish', async () => {
			const font = await loadedFont();
			const order: string[] = [];
			await slugFontRunPreload(font, {
				preload: true,
				preloadSliceMs: 1,
				onPreloadProgress: () => order.push('progress'),
				onPreloadComplete: () => order.push('complete')
			});
			expect(order[order.length - 1]).toBe('complete');
		});
	});

	describe('error handling', () => {
		it('forwards a thrown error to onPreloadError and rejects the promise', async () => {
			const font = await loadedFont();
			const onError = jest.fn();
			// Force an error by stubbing ensureGlyphsForCodepoints.
			const originalEnsure = font.ensureGlyphsForCodepoints.bind(font);
			(font as unknown as {ensureGlyphsForCodepoints: typeof font.ensureGlyphsForCodepoints})
				.ensureGlyphsForCodepoints = () => {
				throw new Error('synthetic preload failure');
			};

			await expect(
				slugFontRunPreload(font, {preload: 'A', onPreloadError: onError})
			).rejects.toThrow('synthetic preload failure');
			expect(onError).toHaveBeenCalledTimes(1);
			expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);

			// Restore so other tests don't see a broken font.
			(font as unknown as {ensureGlyphsForCodepoints: typeof font.ensureGlyphsForCodepoints})
				.ensureGlyphsForCodepoints = originalEnsure;
		});

		it('still rejects when the user-provided onPreloadError itself throws', async () => {
			const font = await loadedFont();
			const original = font.ensureGlyphsForCodepoints.bind(font);
			(font as unknown as {ensureGlyphsForCodepoints: typeof font.ensureGlyphsForCodepoints})
				.ensureGlyphsForCodepoints = () => {
				throw new Error('original error');
			};

			await expect(
				slugFontRunPreload(font, {
					preload: 'A',
					onPreloadError: () => {
						throw new Error('callback error');
					}
				})
			).rejects.toThrow('original error');

			(font as unknown as {ensureGlyphsForCodepoints: typeof font.ensureGlyphsForCodepoints})
				.ensureGlyphsForCodepoints = original;
		});
	});

	describe('empty cmap', () => {
		it('completes immediately when the font has no renderable codepoints', async () => {
			const font = new SlugFont();
			// No load → cmap is empty.
			const onComplete = jest.fn();
			await slugFontRunPreload(font, {preload: true, onPreloadComplete: onComplete});
			expect(onComplete).toHaveBeenCalledTimes(1);
		});
	});
});
