import {Defaults} from '../../defaults';
import {SlugFont} from './font';
import {robotoFallbackBytes} from './fonts/fallback/roboto';
import {SlugFontsRegistry, type SlugFontsRegistryStat} from './fonts/registry';
import {SlugFontsRegistryEntry} from './fonts/registry/entry';

/**
 * Central Slug Font Registry. Loads, caches, and hands out `SlugFont`
 * instances so callers can pass a URL or name anywhere a `SlugFont` is
 * accepted.
 *
 * All state is stored on a process-global singleton hidden from the
 * public API. Callers use only the static methods on this class.
 */
export class SlugFonts {
	/**
	 * Return the registry singleton. If a prior copy of this module
	 * created one on `globalThis`, reuse it so duplicate bundles still
	 * share the same cache.
	 */
	private static _reg(): SlugFontsRegistry {
		const g = globalThis as Record<string, unknown>;
		let reg = g[Defaults.GLOBAL_KEY] as SlugFontsRegistry | undefined;
		if (!reg) {
			reg = new SlugFontsRegistry();
			g[Defaults.GLOBAL_KEY] = reg;
		}
		return reg;
	}

	/**
	 * Resolve any supported font input to a loaded `SlugFont`.
	 * Accepts:
	 *  - an existing `SlugFont` (returned as-is)
	 *  - a URL string (fetched, parsed, and cached)
	 *  - a registered name (looked up in the name map)
	 *  - an `ArrayBuffer` or `Uint8Array` (parsed, not cached)
	 *
	 * Returns `null` if the input cannot be resolved.
	 */
	public static async from(input: SlugFont | string | ArrayBuffer | Uint8Array): Promise<SlugFont | null> {
		if (input instanceof SlugFont) {
			return input;
		}
		if (typeof input === 'string') {
			const named = SlugFonts._reg().byName.get(input);
			if (named) return named.font;
			return SlugFonts.fromUrl(input);
		}
		if (input instanceof ArrayBuffer) {
			return SlugFonts.fromArrayBuffer(input);
		}
		if (input instanceof Uint8Array) {
			const buf = input.buffer.slice(
				input.byteOffset,
				input.byteOffset + input.byteLength
			) as ArrayBuffer;
			return SlugFonts.fromArrayBuffer(buf);
		}
		return null;
	}

	/**
	 * Parse raw font bytes into a `SlugFont`. The result is not cached
	 * because there is no natural key for raw bytes — pass a `name`
	 * via {@link register} afterwards if caching is desired.
	 */
	public static async fromArrayBuffer(
		data: ArrayBuffer,
		textureWidth: number = Defaults.TEXTURE_SIZE
	): Promise<SlugFont | null> {
		try {
			const font = new SlugFont(textureWidth);
			await font.load(data);
			return font;
		} catch {
			return null;
		}
	}

	/**
	 * Fetch a font from a URL, parse it, and cache the result keyed by
	 * the URL. Concurrent calls for the same URL share a single fetch.
	 */
	public static async fromUrl(
		url: string,
		textureWidth: number = Defaults.TEXTURE_SIZE
	): Promise<SlugFont | null> {
		const reg = SlugFonts._reg();
		const cached = reg.byUrl.get(url);
		if (cached) return cached.font;

		const pending = reg.inflight.get(url);
		if (pending) return pending;

		const task = (async () => {
			try {
				const response = await fetch(url);
				if (!response.ok) return null;
				const data = await response.arrayBuffer();
				const font = new SlugFont(textureWidth);
				await font.load(data);
				const entry = new SlugFontsRegistryEntry(font, data.byteLength);
				reg.byUrl.set(url, entry);
				reg.addToAll(entry);
				return font;
			} catch {
				return null;
			} finally {
				reg.inflight.delete(url);
			}
		})();

		reg.inflight.set(url, task);
		return task;
	}

	/**
	 * Register a `SlugFont` under a friendly name so it can be looked
	 * up later with {@link get} or passed by name anywhere a font is
	 * accepted.
	 */
	public static register(name: string, font: SlugFont): void {
		const reg = SlugFonts._reg();
		const existing = reg.entryForFont(font);
		if (existing) {
			reg.byName.set(name, existing);
			return;
		}
		const entry = new SlugFontsRegistryEntry(font, 0);
		reg.byName.set(name, entry);
		reg.addToAll(entry);
	}

	/**
	 * Look up a previously registered font by name, or a previously
	 * loaded font by URL. Returns `null` if unknown.
	 */
	public static get(key: string): SlugFont | null {
		const reg = SlugFonts._reg();
		return reg.byName.get(key)?.font ?? reg.byUrl.get(key)?.font ?? null;
	}

	/**
	 * Whether a font is currently cached under this URL or name.
	 */
	public static has(key: string): boolean {
		const reg = SlugFonts._reg();
		return reg.byName.has(key) || reg.byUrl.has(key);
	}

	/**
	 * Set the fallback font used when a requested font fails to load
	 * or is still loading. Overrides the bundled Roboto fallback that
	 * `SlugFonts` otherwise installs lazily on first use. `null` both
	 * clears the current fallback and opts the caller out of the
	 * bundled fallback entirely.
	 */
	public static setFallback(font: SlugFont | null): void {
		const reg = SlugFonts._reg();
		reg.fallback = font;
		reg.fallbackOverridden = true;
	}

	/**
	 * Current fallback font. If none has been set yet, parses and
	 * installs the bundled Roboto subset on first call. Callers can
	 * pre-empt this by calling {@link setFallback} first.
	 */
	public static fallback(): SlugFont | null {
		const reg = SlugFonts._reg();
		if (!reg.fallback && !reg.fallbackOverridden) {
			SlugFonts._installBundledFallback(reg);
		}
		return reg.fallback;
	}

	/**
	 * Parse the bundled Roboto bytes into a `SlugFont` and install it
	 * as the fallback. Guarded by {@link fallbackOverridden} so a user
	 * override always wins. Parse failures are swallowed — the
	 * fallback simply stays `null` and text renders as empty.
	 */
	private static _installBundledFallback(reg: SlugFontsRegistry): void {
		try {
			const font = new SlugFont();
			const bytes = robotoFallbackBytes;
			const copy = bytes.buffer.slice(
				bytes.byteOffset,
				bytes.byteOffset + bytes.byteLength
			) as ArrayBuffer;
			font.loadSync(copy);
			reg.fallback = font;
		} catch {
			// Leave fallback null; SlugText's rebuild() already tolerates
			// a missing or empty font by rendering nothing.
		}
	}

	/**
	 * Increment the ref count for a registry-managed font. No-op when
	 * the font is null, the fallback, or not owned by the registry
	 * (e.g. `new SlugFont()` passed directly by the caller).
	 */
	public static retain(font: SlugFont | null): void {
		if (!font) {
			return;
		}

		const reg = SlugFonts._reg();
		if (font === reg.fallback) {
			return;
		}

		reg.incRef(reg.entryForFont(font));
	}

	/** Decrement counterpart to {@link retain}. Same exclusion rules. */
	public static release(font: SlugFont | null): void {
		if (!font) {
			return;
		}

		const reg = SlugFonts._reg();
		if (font === reg.fallback) {
			return;
		}

		reg.decRef(reg.entryForFont(font));
	}

	/**
	 * Advance the auto-destroy grace-period sweep. Called from a PIXI
	 * `Ticker` callback (auto-attached by version entry points) or
	 * manually by the host app.
	 */
	public static onUpdate(deltaMs: number): void {
		SlugFonts._reg().onUpdate(deltaMs);
	}

	/**
	 * Bind the registry to a tick source. `subscribe` should register
	 * the callback and return a detach function. Replaces any prior
	 * attachment.
	 */
	public static attachTicker(subscribe: (cb: (deltaMs: number) => void) => () => void): void {
		const reg = SlugFonts._reg();
		if (reg.tickerDetach) {
			reg.tickerDetach();
			reg.tickerDetach = null;
		}
		reg.tickerDetach = subscribe((deltaMs) => SlugFonts.onUpdate(deltaMs));
	}

	/** Detach the current ticker binding, if any. */
	public static detachTicker(): void {
		const reg = SlugFonts._reg();
		if (reg.tickerDetach) {
			reg.tickerDetach();
			reg.tickerDetach = null;
		}
	}

	/** Per-entry diagnostics for inspection and tests. */
	public static stats(): SlugFontsRegistryStat[] {
		return SlugFonts._reg().stats();
	}

	/** True when this font is tracked by the registry (URL- or name-keyed). */
	public static owns(font: SlugFont | null): boolean {
		if (!font) {
			return false;
		}

		return SlugFonts._reg().entryForFont(font) !== null;
	}

	/**
	 * Remove all cached fonts and the fallback. GPU resources owned by
	 * the cached fonts are destroyed. Intended for tests and teardown.
	 */
	public static clear(): void {
		const reg = SlugFonts._reg();
		for (let i = 0; i < reg.all.length; i++) {
			reg.all[i].font.destroyGpu();
		}
		if (reg.fallback) reg.fallback.destroyGpu();
		reg.byUrl.clear();
		reg.byName.clear();
		reg.inflight.clear();
		reg.all.length = 0;
		reg.marked.length = 0;
		reg.fallback = null;
		reg.fallbackOverridden = false;
		if (reg.tickerDetach) {
			reg.tickerDetach();
			reg.tickerDetach = null;
		}
	}
}
