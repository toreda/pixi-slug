import {SlugFont} from '../../../../src/shared/slug/font';
import {SlugFontsRegistry} from '../../../../src/shared/slug/fonts/registry';
import {SlugFontsRegistryEntry} from '../../../../src/shared/slug/fonts/registry/entry';
import {Defaults} from '../../../../src/defaults';

/**
 * Build a registry entry around a fresh `SlugFont`. Tests rarely care
 * about the exact byte size — pass 0 unless the test asserts on it.
 */
function makeEntry(fileSize: number = 0): SlugFontsRegistryEntry {
	return new SlugFontsRegistryEntry(new SlugFont(), fileSize);
}

/**
 * Insert an entry into both the `byUrl`/`byName` maps and the `all`
 * tracking array, mirroring how the production registry creates a fresh
 * cached entry. The class methods under test only manage `all`/`marked`
 * and ref counts — they don't insert into the lookup maps — so tests
 * that rely on `_destroyEntry`/`stats` populate the maps explicitly.
 */
function seed(
	registry: SlugFontsRegistry,
	entry: SlugFontsRegistryEntry,
	opts: {url?: string; name?: string} = {}
): void {
	registry.addToAll(entry);
	if (opts.url) registry.byUrl.set(opts.url, entry);
	if (opts.name) registry.byName.set(opts.name, entry);
}

describe('SlugFontsRegistry', () => {
	// =========================================================
	// Constructor Tests
	// =========================================================
	describe('constructor', () => {
		describe('argument validation', () => {
			it('should accept being called with no options argument', () => {
				expect(() => new SlugFontsRegistry()).not.toThrow();
			});

			it('should accept an empty options object', () => {
				expect(() => new SlugFontsRegistry({})).not.toThrow();
			});

			it('should accept a fully populated options object', () => {
				expect(
					() =>
						new SlugFontsRegistry({
							autoDestroyUnused: false,
							autoDestroyDelay: 5,
							autoAttachTicker: false,
							updateRate: 250,
							reattachPolicy: 'silent'
						})
				).not.toThrow();
			});

			it('should clamp a negative autoDestroyDelay to 0', () => {
				const r = new SlugFontsRegistry({autoDestroyDelay: -10});
				expect(r.autoDestroyDelayMs).toBe(0);
			});

			it('should clamp a negative updateRate to 0', () => {
				const r = new SlugFontsRegistry({updateRate: -10});
				expect(r.updateRate).toBe(0);
			});

			it('should fall back to the default reattachPolicy for an invalid string', () => {
				const r = new SlugFontsRegistry({
					reattachPolicy: 'not-a-mode' as unknown as 'throw'
				});
				expect(r.reattachPolicy).toBe(Defaults.Registry.ReattachPolicy);
			});

			it('should fall back to the default reattachPolicy for a non-string value', () => {
				const r = new SlugFontsRegistry({
					reattachPolicy: 123 as unknown as 'throw'
				});
				expect(r.reattachPolicy).toBe(Defaults.Registry.ReattachPolicy);
			});

			it('should accept each valid reattachPolicy literal', () => {
				expect(new SlugFontsRegistry({reattachPolicy: 'throw'}).reattachPolicy).toBe('throw');
				expect(new SlugFontsRegistry({reattachPolicy: 'error'}).reattachPolicy).toBe('error');
				expect(new SlugFontsRegistry({reattachPolicy: 'warn'}).reattachPolicy).toBe('warn');
				expect(new SlugFontsRegistry({reattachPolicy: 'silent'}).reattachPolicy).toBe('silent');
			});

			it('should convert autoDestroyDelay from seconds to milliseconds', () => {
				const r = new SlugFontsRegistry({autoDestroyDelay: 7});
				expect(r.autoDestroyDelayMs).toBe(7000);
			});
		});

		describe('initial public property values', () => {
			let r: SlugFontsRegistry;

			beforeEach(() => {
				r = new SlugFontsRegistry();
			});

			it('should initialize byUrl as an empty Map', () => {
				expect(r.byUrl).toBeInstanceOf(Map);
				expect(r.byUrl.size).toBe(0);
			});

			it('should initialize byName as an empty Map', () => {
				expect(r.byName).toBeInstanceOf(Map);
				expect(r.byName.size).toBe(0);
			});

			it('should initialize inflight as an empty Map', () => {
				expect(r.inflight).toBeInstanceOf(Map);
				expect(r.inflight.size).toBe(0);
			});

			it('should initialize all as an empty array', () => {
				expect(Array.isArray(r.all)).toBe(true);
				expect(r.all.length).toBe(0);
			});

			it('should initialize marked as an empty array', () => {
				expect(Array.isArray(r.marked)).toBe(true);
				expect(r.marked.length).toBe(0);
			});

			it('should initialize fallback to null', () => {
				expect(r.fallback).toBeNull();
			});

			it('should initialize fallbackOverridden to false', () => {
				expect(r.fallbackOverridden).toBe(false);
			});

			it('should initialize lastUpdate to 0', () => {
				expect(r.lastUpdate).toBe(0);
			});

			it('should initialize tickerDetach to null', () => {
				expect(r.tickerDetach).toBeNull();
			});

			it('should initialize tickerSubscribe to null', () => {
				expect(r.tickerSubscribe).toBeNull();
			});

			it('should default autoDestroyUnused from Defaults.Registry', () => {
				expect(r.autoDestroyUnused).toBe(Defaults.Registry.AutoDestroyUnused);
			});

			it('should default autoDestroyDelayMs from Defaults.Registry (seconds → ms)', () => {
				expect(r.autoDestroyDelayMs).toBe(Defaults.Registry.AutoDestroyDelay * 1000);
			});

			it('should default autoAttachTicker from Defaults.Registry', () => {
				expect(r.autoAttachTicker).toBe(Defaults.Registry.AutoAttachTicker);
			});

			it('should default updateRate from Defaults.Registry', () => {
				expect(r.updateRate).toBe(Defaults.Registry.UpdateRate);
			});

			it('should default reattachPolicy from Defaults.Registry', () => {
				expect(r.reattachPolicy).toBe(Defaults.Registry.ReattachPolicy);
			});
		});
	});

	// =========================================================
	// Implementation
	// =========================================================
	describe('implementation', () => {
		describe('addToAll', () => {
			it('should append an entry that is not yet present', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				r.addToAll(e);
				expect(r.all).toContain(e);
				expect(r.all.length).toBe(1);
			});

			it('should not add the same entry twice', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				r.addToAll(e);
				r.addToAll(e);
				expect(r.all.length).toBe(1);
			});

			it('should add multiple distinct entries', () => {
				const r = new SlugFontsRegistry();
				const a = makeEntry();
				const b = makeEntry();
				r.addToAll(a);
				r.addToAll(b);
				expect(r.all.length).toBe(2);
				expect(r.all).toContain(a);
				expect(r.all).toContain(b);
			});

			it('should not mutate the marked array', () => {
				const r = new SlugFontsRegistry();
				r.addToAll(makeEntry());
				expect(r.marked.length).toBe(0);
			});
		});

		describe('removeFromAll', () => {
			it('should remove a previously added entry', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				r.addToAll(e);
				r.removeFromAll(e);
				expect(r.all).not.toContain(e);
				expect(r.all.length).toBe(0);
			});

			it('should be a no-op for an entry that was never added', () => {
				const r = new SlugFontsRegistry();
				const present = makeEntry();
				const absent = makeEntry();
				r.addToAll(present);
				r.removeFromAll(absent);
				expect(r.all).toContain(present);
				expect(r.all.length).toBe(1);
			});

			it('should leave other entries intact when removing one', () => {
				const r = new SlugFontsRegistry();
				const a = makeEntry();
				const b = makeEntry();
				const c = makeEntry();
				r.addToAll(a);
				r.addToAll(b);
				r.addToAll(c);
				r.removeFromAll(b);
				expect(r.all).toContain(a);
				expect(r.all).toContain(c);
				expect(r.all).not.toContain(b);
				expect(r.all.length).toBe(2);
			});
		});

		describe('addToMarked', () => {
			it('should append an entry that is not yet present', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				r.addToMarked(e);
				expect(r.marked).toContain(e);
				expect(r.marked.length).toBe(1);
			});

			it('should not add the same entry twice', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				r.addToMarked(e);
				r.addToMarked(e);
				expect(r.marked.length).toBe(1);
			});

			it('should not mutate the all array', () => {
				const r = new SlugFontsRegistry();
				r.addToMarked(makeEntry());
				expect(r.all.length).toBe(0);
			});
		});

		describe('removeFromMarked', () => {
			it('should remove a previously added entry', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				r.addToMarked(e);
				r.removeFromMarked(e);
				expect(r.marked).not.toContain(e);
				expect(r.marked.length).toBe(0);
			});

			it('should be a no-op for an entry that was never added', () => {
				const r = new SlugFontsRegistry();
				const present = makeEntry();
				const absent = makeEntry();
				r.addToMarked(present);
				r.removeFromMarked(absent);
				expect(r.marked).toContain(present);
				expect(r.marked.length).toBe(1);
			});
		});

		describe('entryForFont', () => {
			it('should return the entry whose `font` matches the argument', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				r.addToAll(e);
				expect(r.entryForFont(e.font)).toBe(e);
			});

			it('should return null when given null', () => {
				const r = new SlugFontsRegistry();
				expect(r.entryForFont(null)).toBeNull();
			});

			it('should return null when the font is not registered', () => {
				const r = new SlugFontsRegistry();
				const stranger = new SlugFont();
				r.addToAll(makeEntry());
				expect(r.entryForFont(stranger)).toBeNull();
			});

			it('should return the correct entry when multiple are registered', () => {
				const r = new SlugFontsRegistry();
				const a = makeEntry();
				const b = makeEntry();
				const c = makeEntry();
				r.addToAll(a);
				r.addToAll(b);
				r.addToAll(c);
				expect(r.entryForFont(b.font)).toBe(b);
			});

			it('should not mutate the all array', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				r.addToAll(e);
				const before = r.all.length;
				r.entryForFont(e.font);
				expect(r.all.length).toBe(before);
			});
		});

		describe('incRef', () => {
			it('should increment refs from 0 to 1', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				r.incRef(e);
				expect(e.refs).toBe(1);
			});

			it('should be a no-op when given null', () => {
				const r = new SlugFontsRegistry();
				expect(() => r.incRef(null)).not.toThrow();
			});

			it('should increment again on a second call', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				r.incRef(e);
				r.incRef(e);
				expect(e.refs).toBe(2);
			});

			it('should clear markedForDestroy and remove the entry from `marked`', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				e.markedForDestroy = true;
				e.markedAt = 1234;
				r.addToMarked(e);
				r.incRef(e);
				expect(e.markedForDestroy).toBe(false);
				expect(e.markedAt).toBe(0);
				expect(r.marked).not.toContain(e);
			});

			it('should leave refs unchanged when given null', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				e.refs = 3;
				r.incRef(null);
				expect(e.refs).toBe(3);
			});
		});

		describe('decRef', () => {
			it('should decrement refs by 1 when refs > 0', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				e.refs = 3;
				r.decRef(e);
				expect(e.refs).toBe(2);
			});

			it('should be a no-op when given null', () => {
				const r = new SlugFontsRegistry();
				expect(() => r.decRef(null)).not.toThrow();
			});

			it('should clamp refs to 0 when called on an entry already at 0', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				e.refs = 0;
				r.decRef(e);
				expect(e.refs).toBe(0);
				expect(e.markedForDestroy).toBe(false);
			});

			it('should clamp negative refs back to 0', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				e.refs = -2;
				r.decRef(e);
				expect(e.refs).toBe(0);
			});

			it('should mark the entry for destroy when refs drop to 0 and autoDestroyUnused is true', () => {
				const r = new SlugFontsRegistry({autoDestroyUnused: true});
				const e = makeEntry();
				e.refs = 1;
				r.decRef(e);
				expect(e.refs).toBe(0);
				expect(e.markedForDestroy).toBe(true);
				expect(r.marked).toContain(e);
			});

			it('should NOT mark the entry for destroy when autoDestroyUnused is false', () => {
				const r = new SlugFontsRegistry({autoDestroyUnused: false});
				const e = makeEntry();
				e.refs = 1;
				r.decRef(e);
				expect(e.refs).toBe(0);
				expect(e.markedForDestroy).toBe(false);
				expect(r.marked).not.toContain(e);
			});

			it('should set markedAt to a non-negative timestamp when marking', () => {
				const r = new SlugFontsRegistry({autoDestroyUnused: true});
				const e = makeEntry();
				e.refs = 1;
				r.decRef(e);
				expect(e.markedAt).toBeGreaterThanOrEqual(0);
			});

			it('should not double-mark when called past zero with autoDestroyUnused on', () => {
				const r = new SlugFontsRegistry({autoDestroyUnused: true});
				const e = makeEntry();
				e.refs = 1;
				r.decRef(e); // 1→0, marks
				r.decRef(e); // already 0, must remain marked exactly once
				expect(r.marked.length).toBe(1);
				expect(r.marked[0]).toBe(e);
			});
		});

		describe('onUpdate', () => {
			let nowSpy: jest.SpyInstance;

			afterEach(() => {
				nowSpy?.mockRestore();
			});

			it('should run a sweep on the first call', () => {
				const r = new SlugFontsRegistry({updateRate: 1000});
				const sweepSpy = jest.spyOn(r, 'sweep');
				nowSpy = jest.spyOn(performance, 'now').mockReturnValue(5000);
				r.onUpdate(16);
				expect(sweepSpy).toHaveBeenCalledTimes(1);
				expect(sweepSpy).toHaveBeenCalledWith(5000);
			});

			it('should advance lastUpdate to the current timestamp on a sweep', () => {
				const r = new SlugFontsRegistry({updateRate: 1000});
				nowSpy = jest.spyOn(performance, 'now').mockReturnValue(7777);
				r.onUpdate(16);
				expect(r.lastUpdate).toBe(7777);
			});

			it('should NOT sweep again until updateRate has elapsed', () => {
				const r = new SlugFontsRegistry({updateRate: 1000});
				const sweepSpy = jest.spyOn(r, 'sweep');
				// Start at a non-zero clock so the first call passes the
				// `now - lastUpdate < updateRate` guard (lastUpdate starts 0).
				nowSpy = jest.spyOn(performance, 'now').mockReturnValue(5000);
				r.onUpdate(16);
				expect(sweepSpy).toHaveBeenCalledTimes(1);
				nowSpy.mockReturnValue(5500); // 500ms later — still throttled
				r.onUpdate(16);
				expect(sweepSpy).toHaveBeenCalledTimes(1);
			});

			it('should sweep again after updateRate has elapsed', () => {
				const r = new SlugFontsRegistry({updateRate: 1000});
				const sweepSpy = jest.spyOn(r, 'sweep');
				nowSpy = jest.spyOn(performance, 'now').mockReturnValue(5000);
				r.onUpdate(16);
				nowSpy.mockReturnValue(6500); // 1500ms later — past throttle
				r.onUpdate(16);
				expect(sweepSpy).toHaveBeenCalledTimes(2);
			});

			it('should ignore the deltaMs argument value when deciding whether to sweep', () => {
				const r = new SlugFontsRegistry({updateRate: 1000});
				const sweepSpy = jest.spyOn(r, 'sweep');
				nowSpy = jest.spyOn(performance, 'now').mockReturnValue(5000);
				r.onUpdate(99999); // huge frame delta — must not bypass throttle
				nowSpy.mockReturnValue(5500);
				r.onUpdate(99999);
				expect(sweepSpy).toHaveBeenCalledTimes(1);
			});

			it('should not throw when no entries are present', () => {
				const r = new SlugFontsRegistry();
				nowSpy = jest.spyOn(performance, 'now').mockReturnValue(1000);
				expect(() => r.onUpdate(16)).not.toThrow();
			});
		});

		describe('sweep', () => {
			it('should be a no-op when autoDestroyUnused is false', () => {
				const r = new SlugFontsRegistry({autoDestroyUnused: false});
				const e = makeEntry();
				e.markedForDestroy = true;
				e.refs = 0;
				e.markedAt = 0;
				seed(r, e);
				r.addToMarked(e);
				r.sweep(99999);
				expect(r.all).toContain(e);
				expect(r.marked).toContain(e);
			});

			it('should be a no-op when no entries are marked', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				seed(r, e);
				expect(() => r.sweep(99999)).not.toThrow();
				expect(r.all).toContain(e);
			});

			it('should NOT destroy a marked entry before the grace period elapses', () => {
				const r = new SlugFontsRegistry({autoDestroyUnused: true, autoDestroyDelay: 60});
				const e = makeEntry();
				e.markedForDestroy = true;
				e.markedAt = 1000;
				e.refs = 0;
				seed(r, e);
				r.addToMarked(e);
				r.sweep(1000); // 0ms elapsed
				expect(r.marked).toContain(e);
				expect(r.all).toContain(e);
			});

			it('should destroy a marked entry once the grace period has elapsed', () => {
				const r = new SlugFontsRegistry({autoDestroyUnused: true, autoDestroyDelay: 1});
				const e = makeEntry();
				const destroyFn = jest.fn();
				e.font.setGpuDestroy(destroyFn);
				e.markedForDestroy = true;
				e.markedAt = 1000;
				e.refs = 0;
				seed(r, e, {url: 'u', name: 'n'});
				r.addToMarked(e);
				r.sweep(1000 + 1000); // grace = 1s = 1000ms elapsed
				expect(destroyFn).toHaveBeenCalledTimes(1);
				expect(r.all).not.toContain(e);
				expect(r.marked).not.toContain(e);
				expect(r.byUrl.has('u')).toBe(false);
				expect(r.byName.has('n')).toBe(false);
			});

			it('should NOT destroy a marked entry that has live refs', () => {
				const r = new SlugFontsRegistry({autoDestroyUnused: true, autoDestroyDelay: 0});
				const e = makeEntry();
				e.markedForDestroy = true;
				e.markedAt = 0;
				e.refs = 1; // live refs prevent destroy even after grace period
				seed(r, e);
				r.addToMarked(e);
				r.sweep(99999);
				expect(r.all).toContain(e);
			});

			it('should leave entries that are not markedForDestroy alone', () => {
				const r = new SlugFontsRegistry({autoDestroyUnused: true, autoDestroyDelay: 0});
				const e = makeEntry();
				// Entry is in `marked` but flag is false — defensive guard.
				e.markedForDestroy = false;
				seed(r, e);
				r.addToMarked(e);
				r.sweep(99999);
				expect(r.all).toContain(e);
			});

			it('should destroy multiple eligible entries in a single sweep', () => {
				const r = new SlugFontsRegistry({autoDestroyUnused: true, autoDestroyDelay: 0});
				const a = makeEntry();
				const b = makeEntry();
				for (const e of [a, b]) {
					e.markedForDestroy = true;
					e.markedAt = 0;
					e.refs = 0;
					seed(r, e);
					r.addToMarked(e);
				}
				r.sweep(1000);
				expect(r.all.length).toBe(0);
				expect(r.marked.length).toBe(0);
			});
		});

		describe('sweepImmediate', () => {
			it('should be a no-op when no entries are marked', () => {
				const r = new SlugFontsRegistry();
				expect(() => r.sweepImmediate()).not.toThrow();
			});

			it('should destroy a marked entry regardless of the grace period', () => {
				// Note: autoDestroyDelay is huge — sweepImmediate must ignore it.
				const r = new SlugFontsRegistry({autoDestroyUnused: true, autoDestroyDelay: 999999});
				const e = makeEntry();
				const destroyFn = jest.fn();
				e.font.setGpuDestroy(destroyFn);
				e.markedForDestroy = true;
				e.markedAt = 0;
				e.refs = 0;
				seed(r, e, {url: 'u'});
				r.addToMarked(e);
				r.sweepImmediate();
				expect(destroyFn).toHaveBeenCalledTimes(1);
				expect(r.all).not.toContain(e);
				expect(r.marked).not.toContain(e);
				expect(r.byUrl.size).toBe(0);
			});

			it('should NOT destroy entries with live refs', () => {
				const r = new SlugFontsRegistry({autoDestroyUnused: true});
				const e = makeEntry();
				e.markedForDestroy = true;
				e.refs = 2;
				seed(r, e);
				r.addToMarked(e);
				r.sweepImmediate();
				expect(r.all).toContain(e);
			});

			it('should NOT destroy entries whose markedForDestroy is false', () => {
				const r = new SlugFontsRegistry({autoDestroyUnused: true});
				const e = makeEntry();
				e.markedForDestroy = false;
				seed(r, e);
				r.addToMarked(e);
				r.sweepImmediate();
				expect(r.all).toContain(e);
			});

			it('should ignore autoDestroyUnused (its purpose is end-of-life teardown)', () => {
				// autoDestroyUnused gates the auto-mark path, but
				// sweepImmediate operates on already-marked entries —
				// disabling auto-mark must not block forced cleanup.
				const r = new SlugFontsRegistry({autoDestroyUnused: false});
				const e = makeEntry();
				e.markedForDestroy = true;
				e.refs = 0;
				seed(r, e);
				r.addToMarked(e);
				r.sweepImmediate();
				expect(r.all).not.toContain(e);
			});
		});

		describe('_destroyEntry', () => {
			it('should call destroyGpu on the entry font', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				const destroyFn = jest.fn();
				e.font.setGpuDestroy(destroyFn);
				seed(r, e);
				r._destroyEntry(e);
				expect(destroyFn).toHaveBeenCalledTimes(1);
			});

			it('should remove the entry from byUrl', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				seed(r, e, {url: 'https://example.com/font.ttf'});
				r._destroyEntry(e);
				expect(r.byUrl.size).toBe(0);
			});

			it('should remove the entry from byName', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				seed(r, e, {name: 'my-font'});
				r._destroyEntry(e);
				expect(r.byName.size).toBe(0);
			});

			it('should remove every name binding when the entry has multiple aliases', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				seed(r, e);
				r.byName.set('alias-a', e);
				r.byName.set('alias-b', e);
				r._destroyEntry(e);
				expect(r.byName.has('alias-a')).toBe(false);
				expect(r.byName.has('alias-b')).toBe(false);
			});

			it('should leave unrelated map entries intact', () => {
				const r = new SlugFontsRegistry();
				const target = makeEntry();
				const other = makeEntry();
				seed(r, target, {name: 'target'});
				seed(r, other, {name: 'other'});
				r._destroyEntry(target);
				expect(r.byName.has('target')).toBe(false);
				expect(r.byName.get('other')).toBe(other);
				expect(r.all).toContain(other);
			});

			it('should remove the entry from `all`', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				seed(r, e);
				r._destroyEntry(e);
				expect(r.all).not.toContain(e);
			});

			it('should remove the entry from `marked` if present', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				seed(r, e);
				r.addToMarked(e);
				r._destroyEntry(e);
				expect(r.marked).not.toContain(e);
			});
		});

		describe('stats', () => {
			it('should return an empty array when nothing is registered', () => {
				const r = new SlugFontsRegistry();
				expect(r.stats()).toEqual([]);
			});

			it('should report a single entry registered by URL with source "url"', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry(2048);
				e.refs = 1;
				seed(r, e, {url: 'https://example.com/font.ttf'});
				const stats = r.stats();
				expect(stats).toHaveLength(1);
				expect(stats[0]).toMatchObject({
					key: 'https://example.com/font.ttf',
					source: 'url',
					refs: 1,
					markedForDestroy: false,
					fileSize: 2048
				});
			});

			it('should report a single entry registered by name with source "name"', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				seed(r, e, {name: 'my-font'});
				const stats = r.stats();
				expect(stats).toHaveLength(1);
				expect(stats[0]).toMatchObject({
					key: 'my-font',
					source: 'name'
				});
			});

			it('should produce one stats entry per name binding when one font has multiple aliases', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				seed(r, e);
				r.byName.set('a', e);
				r.byName.set('b', e);
				const stats = r.stats();
				expect(stats).toHaveLength(2);
				const keys = stats.map((s) => s.key).sort();
				expect(keys).toEqual(['a', 'b']);
			});

			it('should reflect markedForDestroy state', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				e.markedForDestroy = true;
				seed(r, e, {name: 'doomed'});
				const stats = r.stats();
				expect(stats[0].markedForDestroy).toBe(true);
			});

			it('should include createdAt from the entry', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				seed(r, e, {name: 'test'});
				const stats = r.stats();
				expect(stats[0].createdAt).toBe(e.createdAt);
			});

			it('should not mutate the registry when called', () => {
				const r = new SlugFontsRegistry();
				const e = makeEntry();
				seed(r, e, {url: 'u', name: 'n'});
				r.stats();
				expect(r.byUrl.size).toBe(1);
				expect(r.byName.size).toBe(1);
				expect(r.all.length).toBe(1);
			});
		});
	});
});
