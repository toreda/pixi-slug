import {SlugFont} from '../font';

/**
 * User-facing preload selector.
 *
 *  - `false` / omitted: no preload — glyphs are processed lazily on the
 *    first {@link SlugText} render that needs them.
 *  - `true`: preload every renderable codepoint in the font's cmap.
 *    Time-sliced (see {@link SlugFontPreloadOptions.preloadSliceMs}) so
 *    the main thread stays responsive on a loading screen. The
 *    returned promise resolves only after every glyph is processed.
 *  - `string`: preload exactly the codepoints in the string. Runs
 *    synchronously inline — no yielding. Intended for known small
 *    UI-text sets (`'Loading…0123456789%'`).
 *  - `string[]` / `Iterable<number>`: same as the string form but
 *    expressed as a list of strings or raw codepoints. Synchronous.
 */
export type SlugFontPreload = boolean | string | string[] | Iterable<number>;

/**
 * Optional callbacks + tuning for {@link SlugFontPreload}. All fields
 * are optional and default to no callback / built-in slice budget.
 */
export interface SlugFontPreloadOptions {
	preload?: SlugFontPreload;
	/**
	 * Maximum milliseconds spent processing glyphs in one synchronous
	 * slice before yielding to the event loop. Only consulted on the
	 * `preload: true` time-sliced path; the fixed-set forms run
	 * synchronously regardless. Default 4ms — fits inside one frame at
	 * 144Hz with margin for paint, layout, and the user's own ticker
	 * code.
	 *
	 * One glyph is the smallest unit of work: a slice always processes
	 * at least one glyph even when its budget is already exceeded by
	 * the time it starts. There is no path that yields mid-glyph.
	 */
	preloadSliceMs?: number;
	/**
	 * Fires after each slice completes (time-sliced path only) and on
	 * the synchronous fast path's single 100% tick. `done` is the
	 * cumulative number of glyphs processed; `total` is the number
	 * planned for this preload. The two are equal at completion.
	 */
	onPreloadProgress?: (done: number, total: number) => void;
	/**
	 * Fires once after all preload work has completed successfully.
	 * Equivalent in timing to the `await SlugFonts.fromUrl(...)`
	 * promise resolving, but exposed as a callback for callers that
	 * don't await the promise (e.g. fire-and-forget initialization).
	 */
	onPreloadComplete?: () => void;
	/**
	 * Fires when the preload throws. The same error is also propagated
	 * via the `await SlugFonts.fromUrl(...)` promise rejection — the
	 * callback is provided so callers using the fire-and-forget pattern
	 * still see errors. "Missing glyph" (the codepoint isn't in the
	 * font's cmap) is NOT an error — it's silently skipped.
	 */
	onPreloadError?: (err: unknown) => void;
}

/**
 * Default ms per slice on the time-sliced path. Chosen to fit inside
 * one frame at 144Hz (≈6.9 ms budget) with headroom; smaller is
 * safer-to-yield, larger lets the loop amortize overhead better.
 */
const DEFAULT_SLICE_MS = 4;

/**
 * Sentinel that yields to the event loop without sleeping. Uses
 * MessageChannel where available so progress continues even when the
 * tab is hidden (tabs that hosted a preload often go to a background
 * loading state and the user explicitly wants a ready app on return).
 * Falls back to `setTimeout(0)` in environments without MessageChannel
 * (older Node, jest jsdom).
 */
function macrotaskYield(): Promise<void> {
	return new Promise<void>((resolve) => {
		if (typeof MessageChannel !== 'undefined') {
			const ch = new MessageChannel();
			ch.port1.onmessage = () => {
				ch.port1.close();
				resolve();
			};
			ch.port2.postMessage(0);
		} else {
			setTimeout(resolve, 0);
		}
	});
}

/**
 * Wall-clock helper. `performance.now()` is universally available in
 * supported runtimes (browsers, modern Node, jsdom), but guard with a
 * `Date.now()` fallback in case of an unusual environment — the
 * preload still works; the budget just becomes ms-resolution instead
 * of sub-ms.
 */
function nowMs(): number {
	return typeof performance !== 'undefined' && typeof performance.now === 'function'
		? performance.now()
		: Date.now();
}

/**
 * Decide whether the given preload selector resolves to a fixed set of
 * codepoints (synchronous fast path) or to "all renderable codepoints
 * in the font" (time-sliced path). Returns null when no preload was
 * requested at all.
 */
function classifyPreload(preload: SlugFontPreload | undefined): 'all' | 'fixed' | 'none' {
	if (preload === undefined || preload === false) {
		return 'none';
	}

	if (preload === true) {
		return 'all';
	}

	return 'fixed';
}

/**
 * Materialize a fixed-set preload selector into a deduped array of
 * codepoints. Called only on the synchronous path (`'fixed'` shape).
 */
function fixedPreloadCodepoints(preload: string | string[] | Iterable<number>): number[] {
	const seen = new Set<number>();
	const out: number[] = [];

	const consumeString = (s: string): void => {
		for (let i = 0; i < s.length; i++) {
			const code = s.charCodeAt(i);
			if (!seen.has(code)) {
				seen.add(code);
				out.push(code);
			}
		}
	};

	if (typeof preload === 'string') {
		consumeString(preload);
		return out;
	}

	if (Array.isArray(preload)) {
		for (const item of preload) {
			if (typeof item === 'string') {
				consumeString(item);
			} else if (typeof item === 'number') {
				if (!seen.has(item)) {
					seen.add(item);
					out.push(item);
				}
			}
		}
		return out;
	}

	// Generic Iterable<number> — typed at the call site.
	for (const code of preload as Iterable<number>) {
		if (typeof code === 'number' && !seen.has(code)) {
			seen.add(code);
			out.push(code);
		}
	}

	return out;
}

/**
 * Run the requested preload against `font`. Resolves once every
 * scheduled glyph has been processed (or the preload was empty).
 * Callbacks fire on the appropriate path:
 *
 *  - synchronous fixed-set path: only `onPreloadComplete` /
 *    `onPreloadError` fire (a single progress tick would be noise).
 *  - time-sliced full-font path: `onPreloadProgress` fires after each
 *    slice, `onPreloadComplete` once at the end, `onPreloadError` on
 *    any thrown exception during a slice.
 *
 * Errors thrown during preload are forwarded to `onPreloadError`
 * (when provided) and re-thrown so the awaited promise rejects.
 */
export async function slugFontRunPreload(
	font: SlugFont,
	options: SlugFontPreloadOptions
): Promise<void> {
	const kind = classifyPreload(options.preload);
	if (kind === 'none') {
		return;
	}

	try {
		if (kind === 'fixed') {
			runFixedPreload(font, options.preload as string | string[] | Iterable<number>, options);
			return;
		}

		await runFullPreload(font, options);
	} catch (err) {
		try {
			options.onPreloadError?.(err);
		} catch {
			// User callback threw — swallow so the original error
			// surfaces below rather than getting masked. The user
			// callback's own throw is theirs to handle.
		}

		throw err;
	}
}

/**
 * Synchronous codepoint-list preload. Resolves the codepoint set
 * up-front and feeds it to {@link SlugFont.ensureGlyphsForCodepoints}
 * in one batch. Tiny by design — does not yield.
 */
function runFixedPreload(
	font: SlugFont,
	preload: string | string[] | Iterable<number>,
	options: SlugFontPreloadOptions
): void {
	const codepoints = fixedPreloadCodepoints(preload);
	if (codepoints.length === 0) {
		options.onPreloadComplete?.();
		return;
	}

	font.ensureGlyphsForCodepoints(codepoints);
	options.onPreloadComplete?.();
}

/**
 * Time-sliced full-font preload. Walks the font's cmap, processes
 * glyphs in slices bounded by `preloadSliceMs`, and yields between
 * slices via {@link macrotaskYield}. The slice loop is "process at
 * least one glyph, then check the clock" — guarantees forward
 * progress even when one glyph happens to exceed the slice budget.
 */
async function runFullPreload(font: SlugFont, options: SlugFontPreloadOptions): Promise<void> {
	const sliceMs = options.preloadSliceMs ?? DEFAULT_SLICE_MS;

	// Materialize the cmap codepoints up-front so `total` is meaningful
	// for progress reporting. Cap is the cmap size (~10³ for Roboto,
	// ~10⁵ for full CJK) — fine to hold in memory for the duration of
	// the preload.
	const all: number[] = [];
	const seen = new Set<number>();
	for (const code of font.cmapCodepoints()) {
		if (!seen.has(code)) {
			seen.add(code);
			all.push(code);
		}
	}

	const total = all.length;
	if (total === 0) {
		options.onPreloadComplete?.();
		return;
	}

	let done = 0;
	while (done < total) {
		const sliceStart = nowMs();
		// Process at least one glyph per slice so a single slow glyph
		// can't stall the loop forever.
		do {
			const code = all[done];
			done++;
			// One-codepoint append: the GPU layer will see these on the
			// next render tick anyway; preload is purely about
			// front-loading the CPU work.
			font.ensureGlyphsForCodepoints([code]);
		} while (done < total && nowMs() - sliceStart < sliceMs);

		options.onPreloadProgress?.(done, total);

		if (done < total) {
			await macrotaskYield();
		}
	}

	options.onPreloadComplete?.();
}
