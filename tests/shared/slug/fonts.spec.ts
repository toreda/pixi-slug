import {SlugFont} from '../../../src/shared/slug/font';
import {SlugFonts} from '../../../src/shared/slug/fonts';

/**
 * Contract tests for `SlugFonts`. Each public method gets:
 *  - valid-input cases that confirm the documented return value and,
 *    for stateful methods, the documented internal mutation observed
 *    via the public surface (`get`/`has`/`stats`/`owns`/`fallback`).
 *  - invalid-input cases that confirm graceful handling — `null`
 *    inputs, non-owned fonts, unknown keys, etc.
 *
 * Skipped here (covered by their own specs or deferred):
 *  - `fromUrl`     — needs a `fetch` mock with valid font bytes.
 *  - ticker API    — covered by `fonts/attach-ticker.spec.ts`.
 *  - `onUpdate` / `sweepImmediate` — timing-sensitive.
 *
 * `SlugFonts` is a process-global singleton; every test starts from a
 * cleared registry so prior tests can't leak state into the next.
 */
describe('SlugFonts', () => {
	beforeEach(() => {
		SlugFonts.clear();
	});

	afterAll(() => {
		SlugFonts.clear();
	});

	describe('register', () => {
		it('binds a name to a SlugFont so `get(name)` returns it', () => {
			const font = new SlugFont();
			SlugFonts.register('my-font', font);
			expect(SlugFonts.get('my-font')).toBe(font);
		});

		it('makes `has(name)` return true', () => {
			SlugFonts.register('my-font', new SlugFont());
			expect(SlugFonts.has('my-font')).toBe(true);
		});

		it('makes `owns(font)` return true', () => {
			const font = new SlugFont();
			SlugFonts.register('my-font', font);
			expect(SlugFonts.owns(font)).toBe(true);
		});

		it('produces exactly one stats entry for one registration', () => {
			SlugFonts.register('a', new SlugFont());
			expect(SlugFonts.stats()).toHaveLength(1);
		});

		it('reuses the same underlying entry when one font is registered under multiple names', () => {
			// `stats()` enumerates name bindings, so registering one font
			// under two names returns two stats entries — both backed by
			// the same internal entry. Verify the shared backing by
			// retaining once and observing the ref count surface on
			// BOTH stat entries.
			const font = new SlugFont();
			SlugFonts.register('a', font);
			SlugFonts.register('b', font);
			expect(SlugFonts.get('a')).toBe(font);
			expect(SlugFonts.get('b')).toBe(font);
			SlugFonts.retain(font);
			const stats = SlugFonts.stats();
			expect(stats).toHaveLength(2);
			expect(stats[0].refs).toBe(1);
			expect(stats[1].refs).toBe(1);
		});

		it('overwrites the binding when the same name is registered with a different font', () => {
			const a = new SlugFont();
			const b = new SlugFont();
			SlugFonts.register('shared-name', a);
			SlugFonts.register('shared-name', b);
			expect(SlugFonts.get('shared-name')).toBe(b);
		});
	});

	describe('unregister', () => {
		it('removes a name binding so `get(name)` returns null', () => {
			SlugFonts.register('my-font', new SlugFont());
			SlugFonts.unregister('my-font');
			expect(SlugFonts.get('my-font')).toBeNull();
		});

		it('makes `has(name)` return false after the binding is removed', () => {
			SlugFonts.register('my-font', new SlugFont());
			SlugFonts.unregister('my-font');
			expect(SlugFonts.has('my-font')).toBe(false);
		});

		it('is a no-op when the name was never registered', () => {
			expect(() => SlugFonts.unregister('never-existed')).not.toThrow();
			expect(SlugFonts.stats()).toHaveLength(0);
		});

		it('only drops the name binding when the same font is registered under multiple names', () => {
			const font = new SlugFont();
			SlugFonts.register('a', font);
			SlugFonts.register('b', font);
			SlugFonts.unregister('a');
			expect(SlugFonts.get('a')).toBeNull();
			expect(SlugFonts.get('b')).toBe(font);
		});
	});

	describe('get', () => {
		it('returns the font for a known name', () => {
			const font = new SlugFont();
			SlugFonts.register('my-font', font);
			expect(SlugFonts.get('my-font')).toBe(font);
		});

		it('returns null for an unknown key', () => {
			expect(SlugFonts.get('does-not-exist')).toBeNull();
		});

		it('returns null on a cleared registry', () => {
			SlugFonts.register('my-font', new SlugFont());
			SlugFonts.clear();
			expect(SlugFonts.get('my-font')).toBeNull();
		});
	});

	describe('has', () => {
		it('returns true for a registered name', () => {
			SlugFonts.register('my-font', new SlugFont());
			expect(SlugFonts.has('my-font')).toBe(true);
		});

		it('returns false for an unknown key', () => {
			expect(SlugFonts.has('does-not-exist')).toBe(false);
		});

		it('returns false after the name is unregistered', () => {
			SlugFonts.register('my-font', new SlugFont());
			SlugFonts.unregister('my-font');
			expect(SlugFonts.has('my-font')).toBe(false);
		});
	});

	describe('owns', () => {
		it('returns true for a registered font', () => {
			const font = new SlugFont();
			SlugFonts.register('my-font', font);
			expect(SlugFonts.owns(font)).toBe(true);
		});

		it('returns false for a font the registry has never seen', () => {
			expect(SlugFonts.owns(new SlugFont())).toBe(false);
		});

		it('returns false for null', () => {
			expect(SlugFonts.owns(null)).toBe(false);
		});

		it('returns false after the registry is cleared', () => {
			const font = new SlugFont();
			SlugFonts.register('my-font', font);
			SlugFonts.clear();
			expect(SlugFonts.owns(font)).toBe(false);
		});
	});

	describe('stats', () => {
		it('returns an empty array when nothing is registered', () => {
			expect(SlugFonts.stats()).toEqual([]);
		});

		it('returns one stat entry per registered font', () => {
			SlugFonts.register('a', new SlugFont());
			SlugFonts.register('b', new SlugFont());
			expect(SlugFonts.stats()).toHaveLength(2);
		});

		it('reports refs=0 and markedForDestroy=false for a freshly registered font', () => {
			SlugFonts.register('my-font', new SlugFont());
			const stat = SlugFonts.stats()[0];
			expect(stat.refs).toBe(0);
			expect(stat.markedForDestroy).toBe(false);
		});

		it('reports source="name" and key matching the registered name', () => {
			SlugFonts.register('my-font', new SlugFont());
			const stat = SlugFonts.stats()[0];
			expect(stat.source).toBe('name');
			expect(stat.key).toBe('my-font');
		});

		it('reports fileSize=0 for `register`-installed fonts (source size unknown)', () => {
			SlugFonts.register('my-font', new SlugFont());
			expect(SlugFonts.stats()[0].fileSize).toBe(0);
		});

		it('reports a non-negative finite createdAt timestamp', () => {
			SlugFonts.register('my-font', new SlugFont());
			const t = SlugFonts.stats()[0].createdAt;
			expect(typeof t).toBe('number');
			expect(Number.isFinite(t)).toBe(true);
			expect(t).toBeGreaterThanOrEqual(0);
		});
	});

	describe('retain', () => {
		it('increments refs for an owned font (visible via stats)', () => {
			const font = new SlugFont();
			SlugFonts.register('my-font', font);
			SlugFonts.retain(font);
			expect(SlugFonts.stats()[0].refs).toBe(1);
		});

		it('increments refs by 1 per call', () => {
			const font = new SlugFont();
			SlugFonts.register('my-font', font);
			SlugFonts.retain(font);
			SlugFonts.retain(font);
			SlugFonts.retain(font);
			expect(SlugFonts.stats()[0].refs).toBe(3);
		});

		it('is a no-op for null', () => {
			expect(() => SlugFonts.retain(null)).not.toThrow();
		});

		it('is a no-op for a font the registry does not own', () => {
			const stranger = new SlugFont();
			expect(() => SlugFonts.retain(stranger)).not.toThrow();
			// Registry was empty before; remains empty.
			expect(SlugFonts.stats()).toHaveLength(0);
		});

		it('is a no-op when the font is the current fallback', () => {
			const fb = SlugFonts.fallback();
			// `fallback()` returns null only if the bundled bytes failed to
			// parse; in tests we expect a real font.
			if (!fb) return;
			expect(() => SlugFonts.retain(fb)).not.toThrow();
			// Fallback isn't part of the regular stats entries — the
			// no-op should not surface it there either.
			expect(SlugFonts.stats().some((s) => s.refs > 0)).toBe(false);
		});
	});

	describe('release', () => {
		it('decrements refs for an owned font', () => {
			const font = new SlugFont();
			SlugFonts.register('my-font', font);
			SlugFonts.retain(font);
			SlugFonts.retain(font);
			SlugFonts.release(font);
			expect(SlugFonts.stats()[0].refs).toBe(1);
		});

		it('clamps refs at 0 — never goes negative', () => {
			const font = new SlugFont();
			SlugFonts.register('my-font', font);
			SlugFonts.release(font);
			SlugFonts.release(font);
			SlugFonts.release(font);
			expect(SlugFonts.stats()[0].refs).toBe(0);
		});

		it('is a no-op for null', () => {
			expect(() => SlugFonts.release(null)).not.toThrow();
		});

		it('is a no-op for a font the registry does not own', () => {
			const stranger = new SlugFont();
			expect(() => SlugFonts.release(stranger)).not.toThrow();
			expect(SlugFonts.stats()).toHaveLength(0);
		});
	});

	describe('setFallback / fallback', () => {
		it('returns the bundled fallback on first call when none has been set', () => {
			const fb = SlugFonts.fallback();
			// In the test environment the bundled Roboto bytes parse
			// successfully and a SlugFont is returned.
			expect(fb).toBeInstanceOf(SlugFont);
		});

		it('returns the same instance across repeated calls', () => {
			const a = SlugFonts.fallback();
			const b = SlugFonts.fallback();
			expect(a).toBe(b);
		});

		it('returns null after `setFallback(null)` and skips the bundled install', () => {
			SlugFonts.setFallback(null);
			expect(SlugFonts.fallback()).toBeNull();
			// And again — should still be null, not lazy-install.
			expect(SlugFonts.fallback()).toBeNull();
		});

		it('returns the explicitly set font after `setFallback(font)`', () => {
			const custom = new SlugFont();
			SlugFonts.setFallback(custom);
			expect(SlugFonts.fallback()).toBe(custom);
		});

		it('does not include the fallback in `stats()`', () => {
			SlugFonts.fallback(); // triggers bundled install
			expect(SlugFonts.stats()).toEqual([]);
		});
	});

	describe('from', () => {
		it('returns the same SlugFont when one is passed in', async () => {
			const font = new SlugFont();
			const result = await SlugFonts.from(font);
			expect(result).toBe(font);
		});

		it('resolves a registered name to its bound font', async () => {
			const font = new SlugFont();
			SlugFonts.register('my-font', font);
			const result = await SlugFonts.from('my-font');
			expect(result).toBe(font);
		});

		it('returns null for an unknown string when no fetch path resolves', async () => {
			// 'never-existed' isn't a registered name and isn't a URL the
			// runtime can fetch in jest — `fromUrl` will fail and return
			// null. The contract is that `from` propagates that null.
			// `fromUrl` logs a `console.error` on fetch failure; suppress
			// it here since the failure is the expected path under test.
			const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
			const result = await SlugFonts.from('never-existed');
			expect(result).toBeNull();
			errSpy.mockRestore();
		});

		it('returns null for unsupported input types', async () => {
			// `from` is typed strictly but the contract documents a null
			// return for unrecognized values. Cast to `any` to exercise
			// the runtime fallback.
			expect(await SlugFonts.from(null as any)).toBeNull();
			expect(await SlugFonts.from(undefined as any)).toBeNull();
			expect(await SlugFonts.from(42 as any)).toBeNull();
			expect(await SlugFonts.from({} as any)).toBeNull();
		});
	});

	describe('fromArrayBuffer', () => {
		it('returns null for empty input bytes', async () => {
			const result = await SlugFonts.fromArrayBuffer(new ArrayBuffer(0));
			expect(result).toBeNull();
		});

		it('returns null for non-font bytes', async () => {
			const garbage = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
			const result = await SlugFonts.fromArrayBuffer(garbage.buffer);
			expect(result).toBeNull();
		});

		it('does NOT cache the parsed font (no entry shows up in stats)', async () => {
			// Even on a successful parse, fromArrayBuffer is documented as
			// non-caching. Rather than rely on a specific font byte fixture
			// we assert the contract via the byte-stream we already have:
			// invalid input → null, no entry. When this codebase exposes a
			// canonical font fixture we can extend this with a positive
			// case; for now the contract that matters is "never silently
			// caches".
			await SlugFonts.fromArrayBuffer(new Uint8Array([0, 1, 2]).buffer);
			expect(SlugFonts.stats()).toHaveLength(0);
		});
	});

	describe('clear', () => {
		it('removes all named bindings', () => {
			SlugFonts.register('a', new SlugFont());
			SlugFonts.register('b', new SlugFont());
			SlugFonts.clear();
			expect(SlugFonts.has('a')).toBe(false);
			expect(SlugFonts.has('b')).toBe(false);
		});

		it('empties stats()', () => {
			SlugFonts.register('a', new SlugFont());
			SlugFonts.register('b', new SlugFont());
			SlugFonts.clear();
			expect(SlugFonts.stats()).toEqual([]);
		});

		it('clears the fallback and resets the override flag', () => {
			SlugFonts.fallback(); // lazy-install
			SlugFonts.clear();
			// After clear, calling fallback() again should re-lazy-install
			// the bundled Roboto rather than return null.
			expect(SlugFonts.fallback()).toBeInstanceOf(SlugFont);
		});

		it('is safe to call when the registry is already empty', () => {
			expect(() => SlugFonts.clear()).not.toThrow();
		});
	});
});
