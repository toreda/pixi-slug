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

		it('removes all manually anchored fonts', () => {
			const a = new SlugFont();
			const b = new SlugFont();
			SlugFonts.addManual(a);
			SlugFonts.addManual(b);
			SlugFonts.clear();
			expect(SlugFonts.isManual(a)).toBe(false);
			expect(SlugFonts.isManual(b)).toBe(false);
		});

		it('destroys GPU resources on manually anchored fonts', () => {
			const font = new SlugFont();
			const spy = jest.spyOn(font, 'destroyGpu');
			SlugFonts.addManual(font);
			SlugFonts.clear();
			expect(spy).toHaveBeenCalled();
		});

		it('is safe to call when the registry is already empty', () => {
			expect(() => SlugFonts.clear()).not.toThrow();
		});
	});

	describe('addManual', () => {
		it('returns the same font reference passed in', () => {
			const font = new SlugFont();
			expect(SlugFonts.addManual(font)).toBe(font);
		});

		it('makes `isManual(font)` return true', () => {
			const font = new SlugFont();
			SlugFonts.addManual(font);
			expect(SlugFonts.isManual(font)).toBe(true);
		});

		it('does not make the font reachable via `get` by URL or name', () => {
			const font = new SlugFont();
			SlugFonts.addManual(font);
			expect(SlugFonts.get('any-name')).toBeNull();
			expect(SlugFonts.has('any-name')).toBe(false);
		});

		it('does not affect `owns(font)` — manual is separate from registry-managed', () => {
			const font = new SlugFont();
			SlugFonts.addManual(font);
			expect(SlugFonts.owns(font)).toBe(false);
		});

		it('emits a stats entry with source "manual" and refs 0', () => {
			SlugFonts.addManual(new SlugFont());
			const stats = SlugFonts.stats();
			expect(stats).toHaveLength(1);
			expect(stats[0]).toMatchObject({source: 'manual', refs: 0, markedForDestroy: false});
		});

		it('populates the `font` field on the stats entry so callers can correlate', () => {
			const font = new SlugFont();
			SlugFonts.addManual(font);
			const stats = SlugFonts.stats();
			expect(stats[0].font).toBe(font);
		});

		it('is idempotent — anchoring the same font twice produces one stats entry', () => {
			const font = new SlugFont();
			SlugFonts.addManual(font);
			SlugFonts.addManual(font);
			expect(SlugFonts.stats().filter((s) => s.source === 'manual')).toHaveLength(1);
		});

		it('returns null for a null input', () => {
			expect(SlugFonts.addManual(null)).toBeNull();
		});

		it('returns the font but does not anchor it when it equals the registry fallback', () => {
			const fb = SlugFonts.fallback();
			expect(SlugFonts.addManual(fb)).toBe(fb);
			expect(SlugFonts.isManual(fb!)).toBe(false);
		});

		it('returns the font but does not anchor it when it is already registry-managed', () => {
			const font = new SlugFont();
			SlugFonts.register('shared', font);
			expect(SlugFonts.addManual(font)).toBe(font);
			expect(SlugFonts.isManual(font)).toBe(false);
		});

		it('allows duplicating an already-registered font as a separate manual instance', () => {
			// Caller intentionally loads a second SlugFont instance for a
			// font that is also registered. Both should coexist and be
			// independently tracked — duplication is allowed by design.
			const registered = new SlugFont();
			SlugFonts.register('shared', registered);
			const manualCopy = new SlugFont();
			SlugFonts.addManual(manualCopy);
			expect(SlugFonts.owns(registered)).toBe(true);
			expect(SlugFonts.isManual(manualCopy)).toBe(true);
			expect(registered).not.toBe(manualCopy);
		});
	});

	describe('removeManual', () => {
		it('returns true when removing a previously anchored font', () => {
			const font = new SlugFont();
			SlugFonts.addManual(font);
			expect(SlugFonts.removeManual(font)).toBe(true);
		});

		it('makes `isManual(font)` return false after removal', () => {
			const font = new SlugFont();
			SlugFonts.addManual(font);
			SlugFonts.removeManual(font);
			expect(SlugFonts.isManual(font)).toBe(false);
		});

		it('removes the corresponding stats entry', () => {
			const font = new SlugFont();
			SlugFonts.addManual(font);
			SlugFonts.removeManual(font);
			expect(SlugFonts.stats().some((s) => s.font === font)).toBe(false);
		});

		it('calls `destroyGpu` on the removed font', () => {
			const font = new SlugFont();
			const spy = jest.spyOn(font, 'destroyGpu');
			SlugFonts.addManual(font);
			SlugFonts.removeManual(font);
			expect(spy).toHaveBeenCalledTimes(1);
		});

		it('returns false for a font that was never anchored', () => {
			const font = new SlugFont();
			expect(SlugFonts.removeManual(font)).toBe(false);
		});

		it('returns false for null', () => {
			expect(SlugFonts.removeManual(null)).toBe(false);
		});

		it('returns false for a registry-managed font (manual store is separate)', () => {
			const font = new SlugFont();
			SlugFonts.register('reg', font);
			expect(SlugFonts.removeManual(font)).toBe(false);
		});

		it('does not affect other manually anchored fonts', () => {
			const a = new SlugFont();
			const b = new SlugFont();
			SlugFonts.addManual(a);
			SlugFonts.addManual(b);
			SlugFonts.removeManual(a);
			expect(SlugFonts.isManual(a)).toBe(false);
			expect(SlugFonts.isManual(b)).toBe(true);
		});

		it('does not affect a registered font that happens to share identity intent with a manual one', () => {
			// A registered font and a separately loaded manual copy are
			// two distinct SlugFont instances. Removing the manual one
			// must never touch the registered one.
			const registered = new SlugFont();
			SlugFonts.register('shared', registered);
			const manualCopy = new SlugFont();
			SlugFonts.addManual(manualCopy);
			SlugFonts.removeManual(manualCopy);
			expect(SlugFonts.owns(registered)).toBe(true);
			expect(SlugFonts.has('shared')).toBe(true);
		});
	});

	describe('isManual', () => {
		it('returns false for a font that has never been anchored', () => {
			expect(SlugFonts.isManual(new SlugFont())).toBe(false);
		});

		it('returns false for a registry-managed font', () => {
			const font = new SlugFont();
			SlugFonts.register('reg', font);
			expect(SlugFonts.isManual(font)).toBe(false);
		});

		it('returns false for null', () => {
			expect(SlugFonts.isManual(null)).toBe(false);
		});

		it('returns true between `addManual` and `removeManual`', () => {
			const font = new SlugFont();
			SlugFonts.addManual(font);
			expect(SlugFonts.isManual(font)).toBe(true);
			SlugFonts.removeManual(font);
			expect(SlugFonts.isManual(font)).toBe(false);
		});
	});

	describe('manual + retain/release interaction', () => {
		it('retain on a manual font is a no-op (no refs surface in stats)', () => {
			const font = new SlugFont();
			SlugFonts.addManual(font);
			SlugFonts.retain(font);
			SlugFonts.retain(font);
			const stat = SlugFonts.stats().find((s) => s.font === font);
			expect(stat?.refs).toBe(0);
		});

		it('release on a manual font is a no-op and does not remove it', () => {
			const font = new SlugFont();
			SlugFonts.addManual(font);
			SlugFonts.release(font);
			expect(SlugFonts.isManual(font)).toBe(true);
		});
	});

	describe('removeRegisteredFont', () => {
		it('returns ok:true when removing a registered font with refs == 0', () => {
			const font = new SlugFont();
			SlugFonts.register('a', font);
			expect(SlugFonts.removeRegisteredFont(font)).toEqual({ok: true});
		});

		it('removes the font from `owns`, `has`, and `stats` after success', () => {
			const font = new SlugFont();
			SlugFonts.register('a', font);
			SlugFonts.removeRegisteredFont(font);
			expect(SlugFonts.owns(font)).toBe(false);
			expect(SlugFonts.has('a')).toBe(false);
			expect(SlugFonts.stats()).toHaveLength(0);
		});

		it('calls `destroyGpu` on the removed font', () => {
			const font = new SlugFont();
			const spy = jest.spyOn(font, 'destroyGpu');
			SlugFonts.register('a', font);
			SlugFonts.removeRegisteredFont(font);
			expect(spy).toHaveBeenCalledTimes(1);
		});

		it('drops every name binding when the font is registered under multiple names', () => {
			const font = new SlugFont();
			SlugFonts.register('a', font);
			SlugFonts.register('b', font);
			SlugFonts.removeRegisteredFont(font);
			expect(SlugFonts.has('a')).toBe(false);
			expect(SlugFonts.has('b')).toBe(false);
		});

		it('returns refs-active when refs > 0 and force is false', () => {
			const font = new SlugFont();
			SlugFonts.register('a', font);
			SlugFonts.retain(font);
			expect(SlugFonts.removeRegisteredFont(font)).toEqual({ok: false, reason: 'refs-active'});
			expect(SlugFonts.owns(font)).toBe(true);
		});

		it('removes a font with refs > 0 when force is true', () => {
			const font = new SlugFont();
			SlugFonts.register('a', font);
			SlugFonts.retain(font);
			expect(SlugFonts.removeRegisteredFont(font, true)).toEqual({ok: true});
			expect(SlugFonts.owns(font)).toBe(false);
		});

		it('still calls `destroyGpu` on a forced-removed font with refs > 0', () => {
			const font = new SlugFont();
			const spy = jest.spyOn(font, 'destroyGpu');
			SlugFonts.register('a', font);
			SlugFonts.retain(font);
			SlugFonts.removeRegisteredFont(font, true);
			expect(spy).toHaveBeenCalledTimes(1);
		});

		it('returns not-found for an unknown font', () => {
			expect(SlugFonts.removeRegisteredFont(new SlugFont())).toEqual({ok: false, reason: 'not-found'});
		});

		it('returns forbidden-fallback for the registry fallback', () => {
			const fb = SlugFonts.fallback();
			expect(SlugFonts.removeRegisteredFont(fb!)).toEqual({ok: false, reason: 'forbidden-fallback'});
			expect(SlugFonts.fallback()).toBe(fb);
		});

		it('returns forbidden-manual for a manually anchored font (use removeManual instead)', () => {
			const font = new SlugFont();
			SlugFonts.addManual(font);
			expect(SlugFonts.removeRegisteredFont(font)).toEqual({ok: false, reason: 'forbidden-manual'});
			expect(SlugFonts.isManual(font)).toBe(true);
		});

		it('returns invalid-input for null', () => {
			expect(SlugFonts.removeRegisteredFont(null)).toEqual({ok: false, reason: 'invalid-input'});
		});

		it('does not affect other registered fonts', () => {
			const a = new SlugFont();
			const b = new SlugFont();
			SlugFonts.register('a', a);
			SlugFonts.register('b', b);
			SlugFonts.removeRegisteredFont(a);
			expect(SlugFonts.owns(a)).toBe(false);
			expect(SlugFonts.owns(b)).toBe(true);
			expect(SlugFonts.has('b')).toBe(true);
		});
	});

	describe('removeRegisteredKey', () => {
		it('routes an alias-shaped key to the byName lookup', () => {
			SlugFonts.register('a', new SlugFont());
			expect(SlugFonts.removeRegisteredKey('a')).toEqual({ok: true});
			expect(SlugFonts.has('a')).toBe(false);
		});

		it('routes a URL-shaped key to the byUrl lookup', () => {
			const font = new SlugFont();
			SlugFonts.register('manual-url-test', font);
			// Inject a URL binding by hand — register only writes byName.
			const reg = (SlugFonts as unknown as {_reg: () => {byUrl: Map<string, unknown>; entryForFont: (f: SlugFont) => unknown}})._reg();
			reg.byUrl.set('https://example.com/a.ttf', reg.entryForFont(font));
			expect(SlugFonts.removeRegisteredKey('https://example.com/a.ttf')).toEqual({ok: true});
		});

		it('does not match a byUrl entry when the key is alias-shaped (strict dispatch)', () => {
			// Both stores hold an entry under the same string key. The
			// alias-shaped key 'shared' routes to removeRegisteredAlias,
			// so the byUrl entry under the same string is left alone.
			const aliasFont = new SlugFont();
			const urlFont = new SlugFont();
			SlugFonts.register('shared', aliasFont);
			const reg = (SlugFonts as unknown as {_reg: () => {byUrl: Map<string, unknown>; byName: Map<string, unknown>}})._reg();
			reg.byUrl.set('shared', {font: urlFont, refs: 0, markedForDestroy: false});
			SlugFonts.removeRegisteredKey('shared');
			expect(SlugFonts.owns(aliasFont)).toBe(false);
			expect(reg.byUrl.has('shared')).toBe(true);
		});

		it('does not match a byName entry when the key is URL-shaped (strict dispatch)', () => {
			// A degenerate but possible setup: an alias was registered
			// under a URL-shaped string. The dispatcher routes URL-shaped
			// keys to byUrl only, so the alias entry is unreachable from
			// removeRegisteredKey and the call returns not-found.
			const font = new SlugFont();
			SlugFonts.register('https://oddly-named-alias.ttf', font);
			expect(SlugFonts.removeRegisteredKey('https://oddly-named-alias.ttf')).toEqual({ok: false, reason: 'not-found'});
			expect(SlugFonts.owns(font)).toBe(true);
		});

		it('returns refs-active when refs > 0 without force', () => {
			const font = new SlugFont();
			SlugFonts.register('a', font);
			SlugFonts.retain(font);
			expect(SlugFonts.removeRegisteredKey('a')).toEqual({ok: false, reason: 'refs-active'});
			expect(SlugFonts.has('a')).toBe(true);
		});

		it('removes when refs > 0 with force', () => {
			const font = new SlugFont();
			SlugFonts.register('a', font);
			SlugFonts.retain(font);
			expect(SlugFonts.removeRegisteredKey('a', true)).toEqual({ok: true});
			expect(SlugFonts.has('a')).toBe(false);
		});

		it('returns not-found for an unknown alias-shaped key', () => {
			expect(SlugFonts.removeRegisteredKey('never-registered')).toEqual({ok: false, reason: 'not-found'});
		});

		it('returns not-found for an unknown URL-shaped key', () => {
			expect(SlugFonts.removeRegisteredKey('https://nope.ttf')).toEqual({ok: false, reason: 'not-found'});
		});

		it('returns invalid-input for an empty string', () => {
			expect(SlugFonts.removeRegisteredKey('')).toEqual({ok: false, reason: 'invalid-input'});
		});

		it('returns invalid-input for a non-string input', () => {
			expect(SlugFonts.removeRegisteredKey(null as unknown as string)).toEqual({ok: false, reason: 'invalid-input'});
			expect(SlugFonts.removeRegisteredKey(undefined as unknown as string)).toEqual({ok: false, reason: 'invalid-input'});
			expect(SlugFonts.removeRegisteredKey(123 as unknown as string)).toEqual({ok: false, reason: 'invalid-input'});
		});
	});

	describe('removeRegisteredAlias', () => {
		it('removes a font registered by alias', () => {
			SlugFonts.register('a', new SlugFont());
			expect(SlugFonts.removeRegisteredAlias('a')).toEqual({ok: true});
			expect(SlugFonts.has('a')).toBe(false);
		});

		it('does not look at byUrl entries even when the key matches a URL entry', () => {
			const urlFont = new SlugFont();
			const reg = (SlugFonts as unknown as {_reg: () => {byUrl: Map<string, unknown>}})._reg();
			reg.byUrl.set('shared', {font: urlFont, refs: 0, markedForDestroy: false});
			expect(SlugFonts.removeRegisteredAlias('shared')).toEqual({ok: false, reason: 'not-found'});
			expect(reg.byUrl.has('shared')).toBe(true);
		});

		it('returns refs-active when refs > 0 without force', () => {
			const font = new SlugFont();
			SlugFonts.register('a', font);
			SlugFonts.retain(font);
			expect(SlugFonts.removeRegisteredAlias('a')).toEqual({ok: false, reason: 'refs-active'});
		});

		it('removes when refs > 0 with force', () => {
			const font = new SlugFont();
			SlugFonts.register('a', font);
			SlugFonts.retain(font);
			expect(SlugFonts.removeRegisteredAlias('a', true)).toEqual({ok: true});
		});

		it('returns not-found for an unknown alias', () => {
			expect(SlugFonts.removeRegisteredAlias('never-registered')).toEqual({ok: false, reason: 'not-found'});
		});

		it('returns invalid-input for an empty string', () => {
			expect(SlugFonts.removeRegisteredAlias('')).toEqual({ok: false, reason: 'invalid-input'});
		});

		it('returns invalid-input for a non-string input', () => {
			expect(SlugFonts.removeRegisteredAlias(null as unknown as string)).toEqual({ok: false, reason: 'invalid-input'});
			expect(SlugFonts.removeRegisteredAlias(undefined as unknown as string)).toEqual({ok: false, reason: 'invalid-input'});
			expect(SlugFonts.removeRegisteredAlias(123 as unknown as string)).toEqual({ok: false, reason: 'invalid-input'});
		});
	});

	describe('removeRegisteredUrl', () => {
		it('removes a font registered by URL', () => {
			const font = new SlugFont();
			SlugFonts.register('a', font);
			const reg = (SlugFonts as unknown as {_reg: () => {byUrl: Map<string, unknown>; entryForFont: (f: SlugFont) => unknown}})._reg();
			reg.byUrl.set('https://example.com/a.ttf', reg.entryForFont(font));
			expect(SlugFonts.removeRegisteredUrl('https://example.com/a.ttf')).toEqual({ok: true});
			expect(reg.byUrl.has('https://example.com/a.ttf')).toBe(false);
		});

		it('does not look at byName entries when given a URL-shaped key that an alias happens to share', () => {
			const aliasFont = new SlugFont();
			SlugFonts.register('https://shared.ttf', aliasFont);
			expect(SlugFonts.removeRegisteredUrl('https://shared.ttf')).toEqual({ok: false, reason: 'not-found'});
			expect(SlugFonts.owns(aliasFont)).toBe(true);
		});

		it('returns invalid-input for a non-URL-shaped string', () => {
			// Strict input: non-URL strings are rejected outright instead
			// of producing a byUrl miss.
			expect(SlugFonts.removeRegisteredUrl('plain-alias')).toEqual({ok: false, reason: 'invalid-input'});
		});

		it('returns refs-active when refs > 0 without force', () => {
			const font = new SlugFont();
			SlugFonts.register('a', font);
			const reg = (SlugFonts as unknown as {_reg: () => {byUrl: Map<string, unknown>; entryForFont: (f: SlugFont) => unknown}})._reg();
			reg.byUrl.set('https://example.com/a.ttf', reg.entryForFont(font));
			SlugFonts.retain(font);
			expect(SlugFonts.removeRegisteredUrl('https://example.com/a.ttf')).toEqual({ok: false, reason: 'refs-active'});
		});

		it('removes when refs > 0 with force', () => {
			const font = new SlugFont();
			SlugFonts.register('a', font);
			const reg = (SlugFonts as unknown as {_reg: () => {byUrl: Map<string, unknown>; entryForFont: (f: SlugFont) => unknown}})._reg();
			reg.byUrl.set('https://example.com/a.ttf', reg.entryForFont(font));
			SlugFonts.retain(font);
			expect(SlugFonts.removeRegisteredUrl('https://example.com/a.ttf', true)).toEqual({ok: true});
		});

		it('returns not-found for an unknown but URL-shaped string', () => {
			expect(SlugFonts.removeRegisteredUrl('https://nope.ttf')).toEqual({ok: false, reason: 'not-found'});
		});

		it('returns invalid-input for an empty string', () => {
			expect(SlugFonts.removeRegisteredUrl('')).toEqual({ok: false, reason: 'invalid-input'});
		});

		it('returns invalid-input for a non-string input', () => {
			expect(SlugFonts.removeRegisteredUrl(null as unknown as string)).toEqual({ok: false, reason: 'invalid-input'});
			expect(SlugFonts.removeRegisteredUrl(undefined as unknown as string)).toEqual({ok: false, reason: 'invalid-input'});
			expect(SlugFonts.removeRegisteredUrl(123 as unknown as string)).toEqual({ok: false, reason: 'invalid-input'});
		});
	});

	describe('removeRegistered (dispatcher)', () => {
		it('routes a SlugFont input to removeRegisteredFont', () => {
			const font = new SlugFont();
			SlugFonts.register('a', font);
			expect(SlugFonts.removeRegistered(font)).toEqual({ok: true});
			expect(SlugFonts.owns(font)).toBe(false);
		});

		it('routes a string input to removeRegisteredKey', () => {
			SlugFonts.register('a', new SlugFont());
			expect(SlugFonts.removeRegistered('a')).toEqual({ok: true});
			expect(SlugFonts.has('a')).toBe(false);
		});

		it('forwards the force flag to the underlying helper for SlugFont input', () => {
			const font = new SlugFont();
			SlugFonts.register('a', font);
			SlugFonts.retain(font);
			expect(SlugFonts.removeRegistered(font)).toEqual({ok: false, reason: 'refs-active'});
			expect(SlugFonts.removeRegistered(font, true)).toEqual({ok: true});
		});

		it('forwards the force flag to the underlying helper for string input', () => {
			const font = new SlugFont();
			SlugFonts.register('a', font);
			SlugFonts.retain(font);
			expect(SlugFonts.removeRegistered('a')).toEqual({ok: false, reason: 'refs-active'});
			expect(SlugFonts.removeRegistered('a', true)).toEqual({ok: true});
		});

		it('returns invalid-input for null', () => {
			expect(SlugFonts.removeRegistered(null)).toEqual({ok: false, reason: 'invalid-input'});
		});

		it('propagates failure reasons from the dispatched helper', () => {
			expect(SlugFonts.removeRegistered('never-registered')).toEqual({ok: false, reason: 'not-found'});
			expect(SlugFonts.removeRegistered(new SlugFont())).toEqual({ok: false, reason: 'not-found'});
			const fb = SlugFonts.fallback();
			expect(SlugFonts.removeRegistered(fb!)).toEqual({ok: false, reason: 'forbidden-fallback'});
		});
	});
});
