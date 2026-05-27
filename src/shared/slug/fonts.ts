import {Constants} from '../../constants';
import {Defaults} from '../../defaults';
import {SlugFont} from './font';
import {isSlugFontErrorMode} from './fonts/error';
import {robotoFallbackBytes} from './fonts/fallback/roboto';
import {slugFontRunPreload, type SlugFontPreloadOptions} from './fonts/preload';
import {SlugFontsRegistry} from './fonts/registry';
import {type SlugFontsRegistryOptions} from './fonts/registry/options';
import {type SlugFontsRegistryStat} from './fonts/registry/stat';
import {SlugFontsRegistryEntry} from './fonts/registry/entry';
import {type SlugFontsRemoveResult} from './fonts/remove';
import {type SlugFontErrorMode} from './font/error/mode';

export type {SlugFontPreload, SlugFontPreloadOptions} from './fonts/preload';

/**
 * Options accepted by {@link SlugFonts.fromUrl}, {@link SlugFonts.from},
 * and {@link SlugFonts.fromArrayBuffer}. Combines the legacy
 * `textureWidth` setting with the preload selectors and lifecycle
 * callbacks defined in {@link SlugFontPreloadOptions}.
 *
 * Existing callers that passed `textureWidth` positionally still work
 * — each helper accepts either a `number` (legacy) or this options
 * object for the second argument.
 */
export interface SlugFontLoadOptions extends SlugFontPreloadOptions {
	textureWidth?: number;
}

/**
 * Resolve a positional-or-options second argument into a fully-typed
 * options object. Accepts `undefined`, a number (legacy
 * `textureWidth`), or a partial options object. Returned shape always
 * has `textureWidth` set so callers can read it directly.
 */
function normalizeLoadOptions(opts: number | SlugFontLoadOptions | undefined): SlugFontLoadOptions {
	if (opts === undefined) {
		return {textureWidth: Defaults.TEXTURE_SIZE};
	}

	if (typeof opts === 'number') {
		return {textureWidth: opts};
	}

	return {textureWidth: opts.textureWidth ?? Defaults.TEXTURE_SIZE, ...opts};
}
/**
 * Options accepted by `SlugFonts.attachTicker`. `force` bypasses the
 * re-attach policy entirely when truthy — useful for apps that
 * deliberately rebind the ticker (e.g. hot-reload, test teardown).
 */
export interface SlugFontsAttachTickerOptions {
	force?: boolean | null;
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
	 *
	 * `options` is consulted **only on first construction**. Subsequent
	 * calls return the already-constructed registry with its locked-in
	 * options, regardless of what's passed here — registry options are
	 * immutable for the registry's lifetime.
	 *
	 * Call sites that need to influence the construction-time options
	 * (e.g. the prewarm API entry points passing
	 * `{parallelShaderCompile: true}`) must run **before** any other
	 * `SlugFonts.*` operation in the application — otherwise the
	 * registry is already constructed and the options are silently
	 * discarded. The prewarm APIs detect that case and surface a
	 * `console.warn` so the misordering is observable.
	 */
	private static _reg(options?: Partial<SlugFontsRegistryOptions>): SlugFontsRegistry {
		const g = globalThis as Record<string, unknown>;
		let reg = g[Defaults.GLOBAL_KEY] as SlugFontsRegistry | undefined;
		if (!reg) {
			reg = new SlugFontsRegistry(options);
			g[Defaults.GLOBAL_KEY] = reg;
			// Apply any hooks installed before the registry existed. The
			// version-specific entry point modules (`prewarm-install.ts`)
			// run at JS module load — BEFORE any consumer code — and
			// install hooks via `_installPrewarmHook` /
			// `_installContextPrewarmHook`. Those installs must not
			// auto-construct the registry, because doing so would lock the
			// registry into non-prewarm mode and defeat the prewarm-API
			// opt-in. So the install methods buffer the hooks here, and
			// we transfer them onto the registry the moment it's actually
			// constructed.
			if (SlugFonts._pendingPrewarmHook !== undefined) {
				reg.prewarmHook = SlugFonts._pendingPrewarmHook;
			}
			if (SlugFonts._pendingContextPrewarmHook !== undefined) {
				reg.contextPrewarmHook = SlugFonts._pendingContextPrewarmHook;
			}
		}
		return reg;
	}

	/**
	 * Buffer slot for the renderer-prewarm hook installed before the
	 * registry exists. `undefined` means "no install has happened yet";
	 * `null` means "install was called with null (clear)". The marker
	 * distinguishes "leave the registry's default null alone" from
	 * "actively reset to null" — both end up null on the registry but
	 * the install-tracking matters for diagnostics.
	 */
	private static _pendingPrewarmHook: ((renderer: unknown) => Promise<boolean>) | null | undefined =
		undefined;

	/** Same shape as {@link _pendingPrewarmHook} for the context-prewarm hook. */
	private static _pendingContextPrewarmHook:
		| ((gl: WebGL2RenderingContext) => Promise<boolean>)
		| null
		| undefined = undefined;

	/**
	 * Resolve any supported font input to a loaded `SlugFont`.
	 * Accepts:
	 *  - an existing `SlugFont` (returned as-is)
	 *  - a URL string (fetched, parsed, and cached)
	 *  - a registered name (looked up in the name map)
	 *  - an `ArrayBuffer` or `Uint8Array` (parsed, not cached)
	 *
	 * `options` accepts either a number (legacy `textureWidth`) or a
	 * {@link SlugFontLoadOptions} object that includes preload settings
	 * + lifecycle callbacks. Preload runs after the font finishes
	 * loading; the returned promise resolves only after preload
	 * completes (or rejects on preload error).
	 *
	 * Returns `null` if the input cannot be resolved. Preload is
	 * skipped when the input cannot resolve.
	 */
	public static async from(
		input: SlugFont | string | ArrayBuffer | Uint8Array,
		options?: number | SlugFontLoadOptions
	): Promise<SlugFont | null> {
		if (input instanceof SlugFont) {
			// Caller-supplied font is already loaded — preload is the
			// only work we still owe them. Prewarm runs in parallel so a
			// renderer attached after a manual `from(font)` still
			// absorbs the compile into the await.
			await Promise.all([
				SlugFonts._maybeRunPreload(input, options),
				SlugFonts._maybePrewarmShader()
			]);
			return input;
		}
		if (typeof input === 'string') {
			const named = SlugFonts._reg().byName.get(input);
			if (named) {
				await Promise.all([
					SlugFonts._maybeRunPreload(named.font, options),
					SlugFonts._maybePrewarmShader()
				]);
				return named.font;
			}
			return SlugFonts.fromUrl(input, options);
		}
		if (input instanceof ArrayBuffer) {
			return SlugFonts.fromArrayBuffer(input, options);
		}
		if (input instanceof Uint8Array) {
			const buf = input.buffer.slice(
				input.byteOffset,
				input.byteOffset + input.byteLength
			) as ArrayBuffer;
			return SlugFonts.fromArrayBuffer(buf, options);
		}
		return null;
	}

	/**
	 * Parse raw font bytes into a `SlugFont`. The result is not cached
	 * because there is no natural key for raw bytes — pass a `name`
	 * via {@link register} afterwards if caching is desired.
	 *
	 * `options` accepts either a number (legacy `textureWidth`) or a
	 * {@link SlugFontLoadOptions} object. See {@link from} for preload
	 * semantics — same flow, same callback timing.
	 */
	public static async fromArrayBuffer(
		data: ArrayBuffer,
		options?: number | SlugFontLoadOptions
	): Promise<SlugFont | null> {
		const opts = normalizeLoadOptions(options);
		try {
			const font = new SlugFont(opts.textureWidth);
			await font.load(data);
			// Run preload + shader prewarm concurrently so the user's
			// `await fromArrayBuffer(...)` absorbs both costs into the
			// time they're already waiting (spec §6.3 trigger #2). Prewarm
			// is a no-op when no renderer is attached.
			await Promise.all([
				SlugFonts._maybeRunPreload(font, opts),
				SlugFonts._maybePrewarmShader()
			]);
			return font;
		} catch {
			return null;
		}
	}

	/**
	 * Fetch a font from a URL, parse it, and cache the result keyed by
	 * the URL. Concurrent calls for the same URL share a single fetch.
	 *
	 * `options` accepts either a number (legacy `textureWidth`) or a
	 * {@link SlugFontLoadOptions} object including preload settings
	 * and lifecycle callbacks. Preload runs after the font is parsed,
	 * before the returned promise resolves — callers awaiting this
	 * call get a fully-warmed font.
	 *
	 * Concurrent callers for the same URL share the fetch + parse but
	 * receive their own preload runs (a later caller passing a
	 * different `preload` set still gets that set processed when the
	 * promise resolves). Callbacks on later concurrent calls fire only
	 * for that caller's preload, not for any earlier caller's set.
	 */
	public static async fromUrl(
		url: string,
		options?: number | SlugFontLoadOptions
	): Promise<SlugFont | null> {
		const opts = normalizeLoadOptions(options);
		const reg = SlugFonts._reg();
		const cached = reg.byUrl.get(url);
		if (cached) {
			await SlugFonts._maybeRunPreload(cached.font, opts);
			return cached.font;
		}

		// Inflight de-dupe: share the fetch + parse with an in-progress
		// caller. The `pending` task delivers a font (or null); each
		// caller then runs its own preload against the resulting font
		// so per-call `preload` selectors and callbacks are honored.
		let task = reg.inflight.get(url);
		if (!task) {
			task = (async () => {
				try {
					const response = await fetch(url);
					if (!response.ok) return null;
					const data = await response.arrayBuffer();
					const font = new SlugFont(opts.textureWidth);
					await font.load(data);
					const entry = new SlugFontsRegistryEntry(font, data.byteLength);
					reg.byUrl.set(url, entry);
					reg.addToAll(entry);
					return font;
				} catch (e) {
					console.error(`[SlugFonts.fromUrl] Failed to load "${url}":`, e);
					return null;
				} finally {
					reg.inflight.delete(url);
				}
			})();

			reg.inflight.set(url, task);
		}

		const font = await task;
		if (font) {
			await Promise.all([
				SlugFonts._maybeRunPreload(font, opts),
				SlugFonts._maybePrewarmShader()
			]);
		}
		return font;
	}

	/**
	 * Run the preload selector against `font` if one was provided.
	 * Centralizes the "options may be a number, undefined, or a real
	 * options object" normalization so call sites stay tidy.
	 */
	private static async _maybeRunPreload(
		font: SlugFont,
		options: number | SlugFontLoadOptions | undefined
	): Promise<void> {
		if (options === undefined || typeof options === 'number') {
			return;
		}

		await slugFontRunPreload(font, options);
	}

	/**
	 * Kick off shader prewarm if a renderer is attached and a
	 * version-specific prewarm hook is installed. Awaited by font-load
	 * paths so the user's `await SlugFonts.fromUrl(...)` naturally
	 * absorbs the compile time — see spec §6.3 trigger #2. Idempotent
	 * because the hook dedupes per renderer in its own WeakMap; called
	 * after every successful load without measurable cost beyond that
	 * lookup.
	 */
	private static async _maybePrewarmShader(): Promise<void> {
		const reg = SlugFonts._reg();
		if (!reg.renderer || !reg.prewarmHook) return;
		// Errors here are not user-visible: the worst case is PIXI's sync
		// compile on first draw, which is exactly the pre-feature behavior.
		await reg.prewarmHook(reg.renderer).catch(() => false);
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
	 * Remove an alias binding. Only the `byName` entry is dropped — any
	 * underlying URL cache entry and refcount are left alone. No-op when
	 * the alias is not currently registered.
	 */
	public static unregister(name: string): void {
		SlugFonts._reg().byName.delete(name);
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
	 * the callback and return a detach function.
	 *
	 * When called a second time while a ticker is already attached:
	 *  - If the same `subscribe` function is passed, returns silently
	 *    (idempotent — safe for hot-reload or benign double-init).
	 *  - If `options.force` is true, the old attachment is detached and
	 *    the new one takes its place silently.
	 *  - Otherwise the `reattachPolicy` fires (`throw` by default).
	 */
	public static attachTicker(
		subscribe: (cb: (deltaMs: number) => void) => () => void,
		options?: SlugFontsAttachTickerOptions
	): void {
		const reg = SlugFonts._reg();
		const forceFlag = options?.force === true ? true : false;

		if (reg.tickerDetach) {
			// Same subscribe reference → no-op, policy does not fire.
			if (reg.tickerSubscribe === subscribe) {
				return;
			}

			if (forceFlag) {
				reg.tickerDetach();
				reg.tickerDetach = null;
				reg.tickerSubscribe = null;
			} else {
				SlugFonts._raiseReattachConflict(reg.reattachPolicy);
				return;
			}
		}

		reg.tickerSubscribe = subscribe;
		reg.tickerDetach = subscribe((deltaMs) => SlugFonts.onUpdate(deltaMs));
	}

	/** Detach the current ticker binding, if any. */
	public static detachTicker(): void {
		const reg = SlugFonts._reg();
		if (reg.tickerDetach) {
			reg.tickerDetach();
			reg.tickerDetach = null;
		}
		reg.tickerSubscribe = null;
	}

	/** True when a ticker is currently attached. */
	public static get tickerAttached(): boolean {
		return SlugFonts._reg().tickerDetach !== null;
	}

	/**
	 * Read the current re-attach policy. Mutate via
	 * {@link setReattachPolicy} — the setter form validates the input,
	 * direct property writes would bypass that check.
	 */
	public static get reattachPolicy(): SlugFontErrorMode {
		return SlugFonts._reg().reattachPolicy;
	}

	/**
	 * Whether the registry is in "prewarm mode" — i.e. whether the
	 * `KHR_parallel_shader_compile` path is active library-wide. True
	 * when the consumer's first `SlugFonts.*` operation was a prewarm
	 * API call ({@link prewarmContext} or {@link attachRenderer}); false
	 * otherwise.
	 *
	 * **Read-only and immutable for the registry's lifetime.** Locked in
	 * at construction. To opt into prewarm mode, call a prewarm API
	 * before any other `SlugFonts.*` operation — see {@link prewarmContext}
	 * for the contract.
	 *
	 * Mostly useful for diagnostics and assertions in tests. Production
	 * code rarely reads this directly.
	 */
	public static get parallelShaderCompile(): boolean {
		return SlugFonts._reg().parallelShaderCompile;
	}

	/**
	 * Renderer the registry currently holds, or `null` when none is
	 * attached. Typed `unknown` so this shared module stays
	 * version-agnostic; v8 callers can cast to their `Renderer` type.
	 */
	public static get renderer(): unknown {
		return SlugFonts._reg().renderer;
	}

	/**
	 * Register the renderer the registry should target for shader
	 * prewarming, and **opt the registry into prewarm mode**. Idempotent
	 * for the same renderer reference. Re-attach with a different
	 * renderer detaches the old (programs are not portable across GL
	 * contexts) before storing the new one.
	 *
	 * **Call order matters.** This is a prewarm-API entry point: calling
	 * it constructs the global registry with `parallelShaderCompile:
	 * true` if no registry exists yet. If the registry was already
	 * constructed by an earlier `SlugFonts.*` call (font load, alias
	 * registration, etc.), its options are locked in and this call
	 * cannot retroactively flip it into prewarm mode — a
	 * `console.warn` surfaces the misordering and the renderer is still
	 * registered (so `detachRenderer` / lifecycle hooks still work),
	 * but the prewarm hook does not fire and `parallelShaderCompile`
	 * remains false. To use prewarm mode, call this (or
	 * {@link prewarmContext}) before any other `SlugFonts.*` operation.
	 *
	 * When the registry is in prewarm mode and a version-specific
	 * prewarm hook is installed (v8 sets it from its entry point), this
	 * immediately kicks off a compile for the new renderer. The hook
	 * dedupes per renderer so calling this with the same renderer twice
	 * does not double-compile.
	 *
	 * No-op when `renderer` is null/undefined — that case is reserved
	 * for {@link detachRenderer}.
	 */
	public static attachRenderer(renderer: unknown): void {
		if (!renderer) return;
		const reg = SlugFonts._reg({parallelShaderCompile: true});
		if (reg.renderer === renderer) return;

		// Different renderer — clear the previous slot first so callers
		// observing `renderer` mid-swap never see stale state.
		if (reg.renderer && reg.renderer !== renderer) {
			reg.renderer = null;
		}
		reg.renderer = renderer;

		if (!reg.parallelShaderCompile) {
			SlugFonts._warnPrewarmTooLate('attachRenderer');
			return;
		}

		if (reg.prewarmHook) {
			// Fire-and-forget: the hook owns the in-flight cache so
			// concurrent attaches/warmups still share one promise.
			// Discard the resolution — `warmup()` is the caller's path
			// to await readiness explicitly.
			reg.prewarmHook(renderer).catch(() => {
				/* swallowed; falls back to PIXI sync compile on first draw */
			});
		}
	}

	/**
	 * Surface a one-time `console.warn` when a prewarm API is called
	 * after the registry was already constructed in non-prewarm mode.
	 * Deduped per registry+api-name so consumers don't get spammed if
	 * the misordered call sits inside a frequently-invoked path. The
	 * library cannot rescue the consumer at this point — the registry's
	 * options are locked — so the warning is the only useful signal.
	 */
	private static _warnPrewarmTooLate(apiName: string): void {
		const reg = SlugFonts._reg();
		const regWithWarned = reg as unknown as {_warnedPrewarmTooLate?: Set<string>};
		const warned = regWithWarned._warnedPrewarmTooLate ?? new Set<string>();
		if (warned.has(apiName)) return;
		warned.add(apiName);
		regWithWarned._warnedPrewarmTooLate = warned;
		console.warn(
			`[SlugFonts] ${apiName}() was called after the registry was already constructed in non-prewarm mode. ` +
				`Prewarm-mode opt-in must happen before any other SlugFonts operation; this call cannot retroactively ` +
				`enable parallel-compile. Behavior falls back to the synchronous PIXI compile path.`
		);
	}

	/**
	 * Clear the registered renderer. The prewarm hook's per-renderer
	 * cache entry stays in its own `WeakMap` until the renderer is
	 * GC'd — that lets a subsequent re-attach of the same renderer skip
	 * recompilation while still freeing memory automatically when the
	 * renderer is destroyed.
	 */
	public static detachRenderer(): void {
		SlugFonts._reg().renderer = null;
	}

	/**
	 * Resolve when the Slug shader is compiled and cached for the
	 * currently-attached renderer. Behavior matrix:
	 *
	 *  - No renderer attached → resolves immediately (no-op). The
	 *    compile will trigger on the next {@link attachRenderer} call.
	 *  - Renderer attached, prewarm hook absent (v6/v7) → resolves
	 *    immediately. Part B is v8-only per spec §8.
	 *  - Renderer attached, compile in flight → returns the in-flight
	 *    promise so multiple awaiters share one outcome.
	 *  - Renderer attached, compile complete → resolves immediately.
	 *  - Renderer attached, compile not yet started → kicks it off and
	 *    returns the new promise.
	 *
	 * Useful for callers gating loading-screen dismissal on shader
	 * readiness independently of font load.
	 */
	public static warmup(): Promise<void> {
		const reg = SlugFonts._reg();
		const renderer = reg.renderer;
		if (!renderer || !reg.prewarmHook) return Promise.resolve();
		return reg.prewarmHook(renderer).then(() => {
			/* normalize to void — boolean outcome is a hook implementation detail */
		});
	}

	/**
	 * Compile + link the Slug shader against a user-supplied WebGL2
	 * context **before** any PIXI renderer wraps it, then have the
	 * later `attachRenderer` step adopt the prewarmed program into PIXI's
	 * renderer cache without recompiling. This is the **context-first
	 * prewarm path** — the primary way to maximize parallel-compile
	 * benefit, since the 500ms link runs concurrently with everything
	 * the host does between context creation and first render.
	 *
	 * **Call order matters.** Like {@link attachRenderer}, this is a
	 * prewarm-API entry point: calling it constructs the global registry
	 * with `parallelShaderCompile: true` if no registry exists yet. If
	 * the registry was already constructed by an earlier `SlugFonts.*`
	 * call, this call surfaces a `console.warn` and returns
	 * `Promise.resolve(false)` — it cannot retroactively flip the
	 * registry into prewarm mode. To use prewarm mode, call this (or
	 * `attachRenderer`) before any other `SlugFonts.*` operation.
	 *
	 * Typical v8 flow:
	 *
	 * ```js
	 * const canvas = document.createElement('canvas');
	 * const gl = canvas.getContext('webgl2', {...});
	 * SlugFonts.prewarmContext(gl);   // fire-and-forget; compile starts now
	 *
	 * const app = new PIXI.Application();
	 * await app.init({context: gl, ...});  // PIXI adopts our context
	 *
	 * PIXI.extensions.add(SlugApplicationPluginV8);
	 * // Plugin's init runs attachRenderer(app.renderer) → finds our
	 * // prewarmed gl on the renderer → adopts the linked program.
	 * ```
	 *
	 * Returns `true` on a successful compile + link + program-data build.
	 * `false` on any short-circuit (registry already in non-prewarm mode,
	 * missing `KHR_parallel_shader_compile`, link error, prewarm hook
	 * not installed — i.e. caller is on v6/v7).
	 *
	 * `null`/`undefined` `gl` resolves to `false` immediately.
	 */
	public static prewarmContext(gl: WebGL2RenderingContext | null | undefined): Promise<boolean> {
		if (!gl) return Promise.resolve(false);
		const reg = SlugFonts._reg({parallelShaderCompile: true});
		if (!reg.parallelShaderCompile) {
			SlugFonts._warnPrewarmTooLate('prewarmContext');
			return Promise.resolve(false);
		}
		if (!reg.contextPrewarmHook) return Promise.resolve(false);
		return reg.contextPrewarmHook(gl);
	}

	/**
	 * Install the version-specific shader prewarm hook on the registry.
	 * Public-but-underscore-prefixed to signal "version entry point use
	 * only" — typical user code never calls this. v8's entry point
	 * (`src/v8/index.ts`) wires {@link slugPrewarmShader} here at module
	 * load; v6/v7 leave the hook null and Part B operations no-op.
	 *
	 * Calling with `null` clears the hook (used by tests; production
	 * code never needs to clear).
	 *
	 * Does **not** trigger registry construction. When called before the
	 * registry exists (the v8 module-load path), the hook is buffered
	 * and applied at the moment of first construction. This is essential
	 * for the prewarm-mode opt-in contract: installing a hook is a
	 * library-internal setup step, not a consumer signal to opt into
	 * prewarm mode.
	 */
	public static _installPrewarmHook(
		hook: ((renderer: unknown) => Promise<boolean>) | null
	): void {
		const g = globalThis as Record<string, unknown>;
		const reg = g[Defaults.GLOBAL_KEY] as SlugFontsRegistry | undefined;
		if (reg) {
			reg.prewarmHook = hook;
		} else {
			SlugFonts._pendingPrewarmHook = hook;
		}
	}

	/**
	 * Install the version-specific context-prewarm hook on the registry.
	 * Companion to {@link _installPrewarmHook} for the context-first
	 * path. v8's entry point wires `slugPrewarmContext` here; v6/v7
	 * leave it null and {@link prewarmContext} resolves to `false`.
	 *
	 * Calling with `null` clears the hook (used by tests).
	 *
	 * Does **not** trigger registry construction; buffers the hook for
	 * application at first construction if no registry exists yet. See
	 * {@link _installPrewarmHook} for the rationale.
	 */
	public static _installContextPrewarmHook(
		hook: ((gl: WebGL2RenderingContext) => Promise<boolean>) | null
	): void {
		const g = globalThis as Record<string, unknown>;
		const reg = g[Defaults.GLOBAL_KEY] as SlugFontsRegistry | undefined;
		if (reg) {
			reg.contextPrewarmHook = hook;
		} else {
			SlugFonts._pendingContextPrewarmHook = hook;
		}
	}

	/**
	 * Drop the global registry singleton so the next operation
	 * constructs a fresh one. Test-only — registry options are immutable
	 * for the registry's lifetime, so production code never needs to
	 * reset; consumers either get the mode they construct with or live
	 * with the misordering warning.
	 *
	 * Tests that need to exercise different `parallelShaderCompile`
	 * states across test cases call this in `beforeEach` to ensure the
	 * next `_reg(options)` call honors the options passed.
	 */
	public static _resetRegistry(): void {
		const g = globalThis as Record<string, unknown>;
		delete g[Defaults.GLOBAL_KEY];
		SlugFonts._pendingPrewarmHook = undefined;
		SlugFonts._pendingContextPrewarmHook = undefined;
	}

	/**
	 * Update how `attachTicker` reacts on a re-attach attempt when the
	 * caller did not pass `force: true`. Only accepts exact matches to
	 * the {@link SlugFontErrorMode} literals (`'throw'`, `'error'`,
	 * `'warn'`, `'silent'`). Returns `true` when the value was accepted
	 * and applied, `false` when the input failed strict validation (in
	 * which case the current policy stays unchanged and a
	 * `console.error` surfaces).
	 */
	public static setReattachPolicy(mode: SlugFontErrorMode): boolean {
		if (!isSlugFontErrorMode(mode)) {
			console.error(
				`[SlugFonts:reattachPolicy] Invalid mode "${String(mode)}". Expected one of 'throw' | 'error' | 'warn' | 'silent'. Current policy unchanged.`
			);
			return false;
		}

		SlugFonts._reg().reattachPolicy = mode;
		return true;
	}

	/**
	 * Force-destroy every currently marked-unused font, ignoring the
	 * grace-period timer. Fonts still in use are left alone. Convention
	 * matches game-engine `destroyImmediate`-style APIs — call at
	 * end-of-lifecycle when waiting out the auto-destroy delay is
	 * pointless.
	 */
	public static sweepImmediate(): void {
		SlugFonts._reg().sweepImmediate();
	}

	/**
	 * Internal: raise the configured re-attach conflict per policy.
	 * Messages stay inline so the stack trace points at the caller.
	 */
	private static _raiseReattachConflict(mode: SlugFontErrorMode): void {
		const message =
			'[SlugFonts:reattach] Ticker already attached. Pass {force: true} to replace, call detachTicker() first, or set SlugFonts.reattachPolicy to a non-throw mode.';
		if (mode === 'throw') {
			throw new Error(message);
		}

		if (mode === 'error') {
			console.error(message);
			return;
		}

		if (mode === 'warn') {
			console.warn(message);
			return;
		}

		// 'silent' → no output.
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
	 * Anchor a caller-supplied `SlugFont` so the registry holds a strong
	 * reference to it without managing its lifecycle. Manual fonts:
	 *
	 *  - skip the URL/name cache (no other `SlugText` can find them by
	 *    name and the registry will never return them from `from()`),
	 *  - skip refcount and auto-destroy (`retain` / `release` / sweep
	 *    all no-op for manual fonts),
	 *  - live until the caller explicitly calls {@link removeManual}.
	 *
	 * Calling `addManual` is intended for fonts loaded outside the
	 * registry (e.g. via the platform `FontFace` API or a custom loader)
	 * and then handed to `SlugText`. `SlugText.font = ...` calls this
	 * automatically when it receives a font the registry doesn't own,
	 * so most callers never invoke it directly.
	 *
	 * Manually loading a font that duplicates one already in the
	 * registry is allowed — the duplicate is anchored independently and
	 * does not affect the registered copy. The duplicate uses extra
	 * memory; that is the caller's tradeoff to make.
	 *
	 * No-op when `font` is null, when it equals the registry fallback,
	 * or when it is already tracked (manual or registered).
	 */
	public static addManual(font: SlugFont | null): SlugFont | null {
		if (!font) {
			return null;
		}

		const reg = SlugFonts._reg();
		if (font === reg.fallback) {
			return font;
		}

		// Already registry-managed — caller should rely on retain/release
		// for that font, not anchor it as manual.
		if (reg.entryForFont(font) !== null) {
			return font;
		}

		reg.manualFonts.add(font);
		return font;
	}

	/**
	 * Counterpart to {@link addManual}. Drops the registry's strong
	 * reference to a caller-supplied font and destroys its GPU
	 * resources. After this call any `SlugText` instance still pointing
	 * at the font will render nothing on its next rebuild (its `WeakRef`
	 * may deref to undefined as soon as the GC collects).
	 *
	 * Returns true when the font was anchored and has been removed,
	 * false otherwise (unknown font, null, or registry fallback).
	 */
	public static removeManual(font: SlugFont | null): boolean {
		if (!font) {
			return false;
		}

		const reg = SlugFonts._reg();
		if (!reg.manualFonts.has(font)) {
			return false;
		}

		font.destroyGpu();
		reg.manualFonts.delete(font);
		return true;
	}

	/** True when {@link addManual} has anchored this font and {@link removeManual} has not yet been called. */
	public static isManual(font: SlugFont | null): boolean {
		if (!font) {
			return false;
		}

		return SlugFonts._reg().manualFonts.has(font);
	}

	/**
	 * Remove a registry-owned font and destroy its GPU resources.
	 * Accepts either a `SlugFont` instance or a string lookup key
	 * (alias or URL); the input type selects between
	 * {@link removeRegisteredFont} and {@link removeRegisteredKey} so
	 * callers can pass whichever handle they have.
	 *
	 * @remarks
	 * When the font's refcount is greater than 0, removal is refused
	 * unless `force` is true. The refcount reflects live `SlugText`
	 * instances retaining the font; forcing a remove leaves those
	 * instances with a `WeakRef` whose next `rebuild()` may render
	 * nothing. That mirrors the manual-font lifecycle and is the
	 * caller's tradeoff to make.
	 *
	 * Removal drops every `byUrl` / `byName` binding pointing at the
	 * font, removes it from `all` / `marked`, and calls
	 * `font.destroyGpu()`.
	 *
	 * Returns a {@link SlugFontsRemoveResult}. On failure, `reason`
	 * tells the caller why: `invalid-input` for null / wrong-shape
	 * input, `not-found` for an unknown key or font, `refs-active`
	 * when refcount > 0 and force was not set, `forbidden-fallback`
	 * for the registry fallback (use {@link setFallback} with `null`),
	 * and `forbidden-manual` for a manually anchored font (use
	 * {@link removeManual} instead).
	 */
	public static removeRegistered(fontOrKey: SlugFont | string | null, force: boolean = false): SlugFontsRemoveResult {
		if (!fontOrKey) {
			return {ok: false, reason: 'invalid-input'};
		}

		if (typeof fontOrKey === 'string') {
			return SlugFonts.removeRegisteredKey(fontOrKey, force);
		}

		return SlugFonts.removeRegisteredFont(fontOrKey, force);
	}

	/**
	 * Remove a registered font by lookup key. Detects whether `key` is
	 * a URL or an alias using {@link Constants.FONT_URL_REGEX} and
	 * dispatches to {@link removeRegisteredUrl} or
	 * {@link removeRegisteredAlias}.
	 *
	 * @remarks
	 * The two stores are checked strictly: a URL-shaped string never
	 * matches an alias entry, even if the same string was registered
	 * under {@link register}. Callers who want loose either-store
	 * lookup should pick the specific helper themselves.
	 *
	 * See {@link removeRegistered} for the full force semantics,
	 * refcount rules, and side effects.
	 */
	public static removeRegisteredKey(key: string, force: boolean = false): SlugFontsRemoveResult {
		if (typeof key !== 'string' || key.length === 0) {
			return {ok: false, reason: 'invalid-input'};
		}

		if (Constants.FONT_URL_REGEX.test(key)) {
			return SlugFonts.removeRegisteredUrl(key, force);
		}

		return SlugFonts.removeRegisteredAlias(key, force);
	}

	/**
	 * Remove a registered font by alias. Looks up only the `byName`
	 * map; URL-keyed entries are ignored even when their URL string
	 * happens to match `key`.
	 *
	 * @remarks
	 * Strict input: `key` must be a non-empty string. No
	 * normalization is applied — whitespace, case, and trailing
	 * punctuation are part of the alias and must match exactly. URL
	 * shape is not rejected here (an alias is allowed to look like a
	 * URL if a caller insists), but a URL-shaped alias is unreachable
	 * via {@link removeRegisteredKey} since that dispatcher routes
	 * URL-shaped strings to {@link removeRegisteredUrl}.
	 *
	 * See {@link removeRegistered} for the full force semantics,
	 * refcount rules, and side effects.
	 */
	public static removeRegisteredAlias(key: string, force: boolean = false): SlugFontsRemoveResult {
		if (typeof key !== 'string' || key.length === 0) {
			return {ok: false, reason: 'invalid-input'};
		}

		const reg = SlugFonts._reg();
		const entry = reg.byName.get(key);
		if (!entry) {
			return {ok: false, reason: 'not-found'};
		}

		if (entry.refs > 0 && !force) {
			return {ok: false, reason: 'refs-active'};
		}

		reg._destroyEntry(entry);
		return {ok: true};
	}

	/**
	 * Remove a registered font by URL. Looks up only the `byUrl` map;
	 * alias-keyed entries are ignored even when an alias happens to
	 * match `url`.
	 *
	 * @remarks
	 * Strict input: `url` must be a non-empty string that matches
	 * {@link Constants.FONT_URL_REGEX}. Strings that do not look like
	 * a font URL are rejected with `invalid-input` rather than
	 * silently producing a `not-found` miss — the distinction matters
	 * to callers that want to surface a "you handed me garbage" error
	 * separately from a legitimate cache miss.
	 *
	 * See {@link removeRegistered} for the full force semantics,
	 * refcount rules, and side effects.
	 */
	public static removeRegisteredUrl(url: string, force: boolean = false): SlugFontsRemoveResult {
		if (typeof url !== 'string' || url.length === 0) {
			return {ok: false, reason: 'invalid-input'};
		}

		if (!Constants.FONT_URL_REGEX.test(url)) {
			return {ok: false, reason: 'invalid-input'};
		}

		const reg = SlugFonts._reg();
		const entry = reg.byUrl.get(url);
		if (!entry) {
			return {ok: false, reason: 'not-found'};
		}

		if (entry.refs > 0 && !force) {
			return {ok: false, reason: 'refs-active'};
		}

		reg._destroyEntry(entry);
		return {ok: true};
	}

	/**
	 * Remove a registered font by `SlugFont` instance. See
	 * {@link removeRegistered} for the full force semantics, refcount
	 * rules, and side effects.
	 */
	public static removeRegisteredFont(font: SlugFont | null, force: boolean = false): SlugFontsRemoveResult {
		if (!font) {
			return {ok: false, reason: 'invalid-input'};
		}

		const reg = SlugFonts._reg();
		if (font === reg.fallback) {
			return {ok: false, reason: 'forbidden-fallback'};
		}

		if (reg.manualFonts.has(font)) {
			return {ok: false, reason: 'forbidden-manual'};
		}

		const entry = reg.entryForFont(font);
		if (!entry) {
			return {ok: false, reason: 'not-found'};
		}

		if (entry.refs > 0 && !force) {
			return {ok: false, reason: 'refs-active'};
		}

		reg._destroyEntry(entry);
		return {ok: true};
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
		for (const font of reg.manualFonts) {
			font.destroyGpu();
		}
		if (reg.fallback) reg.fallback.destroyGpu();
		reg.byUrl.clear();
		reg.byName.clear();
		reg.inflight.clear();
		reg.all.length = 0;
		reg.marked.length = 0;
		reg.manualFonts.clear();
		reg.fallback = null;
		reg.fallbackOverridden = false;
		if (reg.tickerDetach) {
			reg.tickerDetach();
			reg.tickerDetach = null;
		}
		reg.tickerSubscribe = null;
		reg.renderer = null;
		// `prewarmHook` is intentionally NOT cleared — it is installed
		// once at module load by the version-specific entry point and
		// would not be re-installed by a `clear()`. Tests that need a
		// pristine hook state can call `_installPrewarmHook(null)`
		// explicitly.
	}
}
