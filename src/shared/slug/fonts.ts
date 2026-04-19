import {Defaults} from '../../defaults';
import {SlugFont} from './font';
import {robotoFallbackBytes} from './fonts/fallback/roboto';

/**
 * Global key used to share the `SlugFonts` registry instance across
 * module duplicates (e.g. when multiple bundles load `pixi-slug` on
 * the same page). Callers never see this — it is an internal detail.
 */
const GLOBAL_KEY = '__pixiSlugFontsRegistry__';

/**
 * Registry instance hidden from the public API. Holds the font cache
 * and in-flight load promises. Never exported; only reachable through
 * `SlugFonts`' static methods.
 */
class SlugFontsRegistry {
	public readonly byUrl: Map<string, SlugFont>;
	public readonly byName: Map<string, SlugFont>;
	public readonly inflight: Map<string, Promise<SlugFont | null>>;
	public fallback: SlugFont | null;
	/** True once the caller has explicitly set a fallback, so the
	 *  lazy bundled fallback won't overwrite it. */
	public fallbackOverridden: boolean;

	constructor() {
		this.byUrl = new Map();
		this.byName = new Map();
		this.inflight = new Map();
		this.fallback = null;
		this.fallbackOverridden = false;
	}
}

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
		let reg = g[GLOBAL_KEY] as SlugFontsRegistry | undefined;
		if (!reg) {
			reg = new SlugFontsRegistry();
			g[GLOBAL_KEY] = reg;
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
	public static async from(
		input: SlugFont | string | ArrayBuffer | Uint8Array
	): Promise<SlugFont | null> {
		if (input instanceof SlugFont) {
			return input;
		}
		if (typeof input === 'string') {
			const named = SlugFonts._reg().byName.get(input);
			if (named) return named;
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
		if (cached) return cached;

		const pending = reg.inflight.get(url);
		if (pending) return pending;

		const task = (async () => {
			try {
				const response = await fetch(url);
				if (!response.ok) return null;
				const data = await response.arrayBuffer();
				const font = new SlugFont(textureWidth);
				await font.load(data);
				reg.byUrl.set(url, font);
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
		SlugFonts._reg().byName.set(name, font);
	}

	/**
	 * Look up a previously registered font by name, or a previously
	 * loaded font by URL. Returns `null` if unknown.
	 */
	public static get(key: string): SlugFont | null {
		const reg = SlugFonts._reg();
		return reg.byName.get(key) ?? reg.byUrl.get(key) ?? null;
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
	 * Remove all cached fonts and the fallback. GPU resources owned by
	 * the cached fonts are destroyed. Intended for tests and teardown.
	 */
	public static clear(): void {
		const reg = SlugFonts._reg();
		for (const font of reg.byUrl.values()) font.destroyGpu();
		for (const font of reg.byName.values()) font.destroyGpu();
		if (reg.fallback) reg.fallback.destroyGpu();
		reg.byUrl.clear();
		reg.byName.clear();
		reg.inflight.clear();
		reg.fallback = null;
		reg.fallbackOverridden = false;
	}
}
