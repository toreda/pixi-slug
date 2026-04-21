import {booleanValue, numberValue, swapPop} from '@toreda/strong-types';
import {Defaults} from '../../../defaults';
import {SlugFont} from '../font';
import {isSlugFontErrorMode, type SlugFontErrorMode} from './error';
import {SlugFontsRegistryEntry} from './registry/entry';
import {type SlugFontsRegistryOptions} from './registry/options';

function resolveErrorMode(raw: unknown, fallback: SlugFontErrorMode): SlugFontErrorMode {
	return isSlugFontErrorMode(raw) ? raw : fallback;
}


/** Per-entry diagnostic snapshot returned by `SlugFontsRegistry.stats()`. */
export interface SlugFontsRegistryStat {
	key: string;
	source: 'url' | 'name';
	refs: number;
	markedForDestroy: boolean;
	fileSize: number;
	createdAt: number;
}

/**
 * Registry instance hidden from the public API. Holds the font cache
 * and in-flight load promises. Never exported; only reachable through
 * `SlugFonts`' static methods.
 */
export class SlugFontsRegistry {
	public readonly byUrl: Map<string, SlugFontsRegistryEntry>;
	public readonly byName: Map<string, SlugFontsRegistryEntry>;
	public readonly inflight: Map<string, Promise<SlugFont | null>>;
	/**
	 * Unordered list of every registered entry. Canonical source for
	 * iteration so sweep/stats don't allocate a fresh array via
	 * `Map.values()` every frame.
	 */
	public readonly all: SlugFontsRegistryEntry[];
	/** Unordered subset of `all` containing only entries with `markedForDestroy`. */
	public readonly marked: SlugFontsRegistryEntry[];
	public fallback: SlugFont | null;
	/** True once the caller has explicitly set a fallback, so the
	 *  lazy bundled fallback won't overwrite it. */
	public fallbackOverridden: boolean;

	public readonly autoDestroyUnused: boolean;
	public readonly autoDestroyDelayMs: number;
	public readonly autoAttachTicker: boolean;
	/** Minimum ms between sweep runs; `onUpdate` early-outs until elapsed. */
	public readonly updateRate: number;
	/** `performance.now()` timestamp of the last sweep, 0 if never run. */
	public lastUpdate: number;

	/**
	 * How `attachTicker` reacts to a second attach while already bound,
	 * when the caller did not pass `force: true`. Mutable so callers
	 * can change behavior at runtime via `SlugFonts.reattachPolicy`.
	 */
	public reattachPolicy: SlugFontErrorMode;

	/** Detach handle set by `attachTicker`; null when no ticker is bound. */
	public tickerDetach: (() => void) | null;
	/**
	 * The `subscribe` function passed to the last successful
	 * `attachTicker`. Used to short-circuit idempotent re-attaches (same
	 * source passed twice returns silently).
	 */
	public tickerSubscribe: ((cb: (deltaMs: number) => void) => () => void) | null;

	constructor(options?: Partial<SlugFontsRegistryOptions>) {
		this.byUrl = new Map<string, SlugFontsRegistryEntry>();
		this.byName = new Map<string, SlugFontsRegistryEntry>();
		this.inflight = new Map();
		this.all = [];
		this.marked = [];
		this.fallback = null;
		this.fallbackOverridden = false;

		this.autoDestroyUnused = booleanValue(options?.autoDestroyUnused, Defaults.Registry.AutoDestroyUnused);
		const delaySec = numberValue(options?.autoDestroyDelay, Defaults.Registry.AutoDestroyDelay);
		this.autoDestroyDelayMs = Math.max(0, delaySec) * 1000;
		this.autoAttachTicker = booleanValue(options?.autoAttachTicker, Defaults.Registry.AutoAttachTicker);
		this.updateRate = Math.max(0, numberValue(options?.updateRate, Defaults.Registry.UpdateRate));
		this.lastUpdate = 0;
		this.reattachPolicy = resolveErrorMode(options?.reattachPolicy, Defaults.Registry.ReattachPolicy);

		this.tickerDetach = null;
		this.tickerSubscribe = null;
	}

	/**
	 * Add an entry to `all` if it isn't already present. Callers use this
	 * whenever a new `SlugFontsRegistryEntry` is first inserted into a map.
	 */
	public addToAll(entry: SlugFontsRegistryEntry): void {
		if (this.all.indexOf(entry) !== -1) {
			return;
		}

		this.all.push(entry);
	}

	/** Swap-and-pop remove from `all`. No-op when the entry is absent. */
	public removeFromAll(entry: SlugFontsRegistryEntry): void {
		swapPop(this.all, this.all.indexOf(entry));
	}

	/** Add an entry to `marked`. No-op when already present. */
	public addToMarked(entry: SlugFontsRegistryEntry): void {
		if (this.marked.indexOf(entry) !== -1) {
			return;
		}

		this.marked.push(entry);
	}

	/** Swap-and-pop remove from `marked`. No-op when the entry is absent. */
	public removeFromMarked(entry: SlugFontsRegistryEntry): void {
		swapPop(this.marked, this.marked.indexOf(entry));
	}

	/** Reverse-lookup an entry by its `SlugFont`. Null when not registry-owned. */
	public entryForFont(font: SlugFont | null): SlugFontsRegistryEntry | null {
		if (!font) {
            return null;
        }

		for (let i = 0; i < this.all.length; i++) {
			if (this.all[i].font === font) {
				return this.all[i];
			}
		}

		return null;
	}

	public incRef(entry: SlugFontsRegistryEntry | null): void {
		if (!entry) {
            return;
        }

		if (entry.markedForDestroy) {
			entry.markedForDestroy = false;
			entry.markedAt = 0;
			this.removeFromMarked(entry);
		}

		entry.refs++;
	}

	public decRef(entry: SlugFontsRegistryEntry | null): void {
		if (!entry) {
            return;
        }

		if (entry.refs <= 0) {
			entry.refs = 0;
			return;
		}

		entry.refs--;

		if (entry.refs === 0 && this.autoDestroyUnused) {
			entry.markedForDestroy = true;
			entry.markedAt = typeof performance !== 'undefined' ? performance.now() : 0;
			this.addToMarked(entry);
		}
	}

	/**
	 * Ticker entry point. `deltaMs` is accepted but unused; wall-clock
	 * drives sweeps. Throttled by `updateRate` so sweep runs at most
	 * once per that many milliseconds even if the ticker fires every frame.
	 */
	public onUpdate(_deltaMs: number): void {
		const now = typeof performance !== 'undefined' ? performance.now() : 0;
		if (now - this.lastUpdate < this.updateRate) {
			return;
		}

		this.lastUpdate = now;
		this.sweep(now);
	}

	public sweep(nowMs: number): void {
		if (!this.autoDestroyUnused) {
			return;
		}

		if (this.marked.length === 0) {
			return;
		}

		// Iterate backwards so swap-and-pop removals don't skip entries.
		for (let i = this.marked.length - 1; i >= 0; i--) {
			const e = this.marked[i];
			if (e.markedForDestroy && e.refs === 0 && nowMs - e.markedAt >= this.autoDestroyDelayMs) {
				this._destroyEntry(e);
			}
		}
	}

	/**
	 * Force-destroy every marked-unused font right now, ignoring the
	 * grace-period timer. Fonts with live refs (`refs > 0`) are left
	 * alone — the caller cannot yank a font another SlugText is still
	 * using.
	 *
	 * Intended for end-of-lifecycle teardown (e.g. the
	 * `SlugApplicationPlugin.destroy` hook) where waiting out the
	 * `autoDestroyDelay` is pointless because the app is going away.
	 * Convention matches game-engine `destroyImmediate`-style APIs.
	 */
	public sweepImmediate(): void {
		if (this.marked.length === 0) {
			return;
		}

		for (let i = this.marked.length - 1; i >= 0; i--) {
			const e = this.marked[i];
			if (e.markedForDestroy && e.refs === 0) {
				this._destroyEntry(e);
			}
		}
	}

	public _destroyEntry(entry: SlugFontsRegistryEntry): void {
		entry.font.destroyGpu();
		for (const [k, v] of this.byUrl) {
			if (v === entry) {
				this.byUrl.delete(k);
			}
		}
		for (const [k, v] of this.byName) {
			if (v === entry) {
				this.byName.delete(k);
			}
		}
		this.removeFromMarked(entry);
		this.removeFromAll(entry);
	}

	public stats(): SlugFontsRegistryStat[] {
		const out: SlugFontsRegistryStat[] = [];
		for (const [k, e] of this.byUrl) {
			out.push({
				key: k,
				source: 'url',
				refs: e.refs,
				markedForDestroy: e.markedForDestroy,
				fileSize: e.fileSize,
				createdAt: e.createdAt
			});
		}
		for (const [k, e] of this.byName) {
			out.push({
				key: k,
				source: 'name',
				refs: e.refs,
				markedForDestroy: e.markedForDestroy,
				fileSize: e.fileSize,
				createdAt: e.createdAt
			});
		}
		return out;
	}
}
