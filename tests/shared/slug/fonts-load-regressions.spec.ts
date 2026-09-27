import {readFileSync} from 'fs';
import {resolve} from 'path';
import {Defaults} from '../../../src/defaults';
import {SlugFonts} from '../../../src/shared/slug/fonts';

function loadFontFixture(filename: string): ArrayBuffer {
	const buf = readFileSync(resolve(__dirname, '../../../assets/fonts', filename));
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function okResponse(data: ArrayBuffer): Response {
	return {ok: true, arrayBuffer: async () => data.slice(0)} as unknown as Response;
}

const URL_A = 'https://example.test/a.ttf';
const originalFetch = globalThis.fetch;

afterEach(() => {
	globalThis.fetch = originalFetch;
	SlugFonts.clear();
	SlugFonts._resetRegistry();
	jest.restoreAllMocks();
});

describe('SlugFonts load regressions', () => {
	describe('normalizeLoadOptions', () => {
		it('falls back to the default textureWidth when the option is explicitly undefined', async () => {
			const data = loadFontFixture('roboto-fallback.ttf');
			const font = await SlugFonts.fromArrayBuffer(data, {textureWidth: undefined});
			expect(font?.textureWidth).toBe(Defaults.TEXTURE_SIZE);
		});

		it('falls back to the default textureWidth when the option is null', async () => {
			const data = loadFontFixture('roboto-fallback.ttf');
			const font = await SlugFonts.fromArrayBuffer(data, {
				textureWidth: null as unknown as number
			});
			expect(font?.textureWidth).toBe(Defaults.TEXTURE_SIZE);
		});
	});

	describe('fromArrayBuffer preload errors', () => {
		it('rejects instead of resolving null when preload throws', async () => {
			const data = loadFontFixture('roboto-fallback.ttf');
			const err = new Error('preload boom');
			await expect(
				SlugFonts.fromArrayBuffer(data, {
					preload: 'A',
					onPreloadComplete: () => {
						throw err;
					}
				})
			).rejects.toBe(err);
		});
	});

	describe('fromUrl inflight bookkeeping', () => {
		it('does not cache a null task when fetch throws synchronously', async () => {
			jest.spyOn(console, 'error').mockImplementation(() => {});
			globalThis.fetch = (() => {
				throw new TypeError('fetch unavailable');
			}) as typeof fetch;

			expect(await SlugFonts.fromUrl(URL_A)).toBeNull();

			const data = loadFontFixture('roboto-fallback.ttf');
			globalThis.fetch = (async () => okResponse(data)) as typeof fetch;

			const font = await SlugFonts.fromUrl(URL_A);
			expect(font).not.toBeNull();
			expect(SlugFonts.has(URL_A)).toBe(true);
		});

		it('discards a load that completes after clear()', async () => {
			const data = loadFontFixture('roboto-fallback.ttf');
			let release!: () => void;
			const gate = new Promise<void>((r) => (release = r));
			globalThis.fetch = (async () => {
				await gate;
				return okResponse(data);
			}) as typeof fetch;

			const pending = SlugFonts.fromUrl(URL_A);
			SlugFonts.clear();
			release();

			expect(await pending).toBeNull();
			expect(SlugFonts.has(URL_A)).toBe(false);
			expect(SlugFonts.stats()).toHaveLength(0);
		});

		it('a load started after clear() is not evicted by the stale load', async () => {
			const data = loadFontFixture('roboto-fallback.ttf');
			let releaseFirst!: () => void;
			const firstGate = new Promise<void>((r) => (releaseFirst = r));
			let calls = 0;
			globalThis.fetch = (async () => {
				calls++;
				if (calls === 1) await firstGate;
				return okResponse(data);
			}) as typeof fetch;

			const stale = SlugFonts.fromUrl(URL_A);
			SlugFonts.clear();
			const fresh = SlugFonts.fromUrl(URL_A);
			releaseFirst();

			expect(await stale).toBeNull();
			expect(await fresh).not.toBeNull();
			expect(SlugFonts.has(URL_A)).toBe(true);
		});
	});

	describe('fromUrl cache hit prewarm', () => {
		it('runs the prewarm hook on a URL cache hit', async () => {
			SlugFonts._resetRegistry();
			const hook = jest.fn(async () => true);
			SlugFonts._installPrewarmHook(hook);
			SlugFonts.attachRenderer({});

			const data = loadFontFixture('roboto-fallback.ttf');
			globalThis.fetch = (async () => okResponse(data)) as typeof fetch;

			await SlugFonts.fromUrl(URL_A);
			const callsAfterLoad = hook.mock.calls.length;

			await SlugFonts.fromUrl(URL_A);
			expect(hook.mock.calls.length).toBe(callsAfterLoad + 1);

			SlugFonts._installPrewarmHook(null);
		});
	});

	describe('attachTicker re-attach message', () => {
		it('points at setReattachPolicy()', () => {
			const detach = () => {};
			SlugFonts.attachTicker(() => detach);
			expect(() => SlugFonts.attachTicker(() => detach)).toThrow(/setReattachPolicy\(\)/);
		});
	});
});
