import {SlugFonts} from '../../shared/slug/fonts';

/**
 * Per-Application storage for the resize observer this plugin attaches.
 * Symbol-keyed so we don't collide with anything PIXI or host code may
 * add to the Application instance.
 */
const SLUG_RESIZE_OBSERVER = Symbol('slug.resizeObserver');

/**
 * Minimal shape of PIXI v6 `Application` the plugin relies on.
 * Inlined to avoid adding `@pixi/app` as a dev dependency purely for
 * type-checking — host apps provide the real `Application` at runtime.
 */
interface ApplicationV6Like {
	ticker: {
		deltaMS: number;
		add(fn: () => void): void;
		remove(fn: () => void): void;
	};
	resizeTo?: Window | HTMLElement | null;
	resize?: () => void;
	[SLUG_RESIZE_OBSERVER]?: ResizeObserver;
}

/**
 * PIXI v6 Application plugin that integrates pixi-slug with an
 * `Application`'s lifecycle. v6 uses `Application.registerPlugin(klass)`
 * — a class with static `init` / `destroy` — rather than the unified
 * extensions system introduced in v7+.
 *
 *  - On `init`, hooks `SlugFonts` to the app's own `ticker` so the
 *    registry's auto-destroy grace-period sweep advances each frame.
 *  - On `destroy`, detaches the ticker binding and force-sweeps any
 *    currently unused fonts so their GPU resources are freed
 *    immediately instead of waiting out the grace period.
 *
 * ## Registration
 *
 * ```typescript
 * import {Application} from '@pixi/app';
 * import {SlugApplicationPluginV6} from 'pixi-slug/v6';
 *
 * Application.registerPlugin(SlugApplicationPluginV6);
 * const app = new Application({...}); // plugin.init runs
 * // ... later
 * app.destroy(); // plugin.destroy runs
 * ```
 *
 * If `slugFontsAttachTickerV6()` (which hooks `Ticker.shared`) is also
 * active, the second attach fails per `SlugFonts.reattachPolicy`.
 * See `SlugFonts.attachTicker` for conflict handling.
 */
export class SlugApplicationPluginV6 {
	public static init(this: ApplicationV6Like, _options?: unknown): void {
		const app = this;
		SlugFonts.attachTicker((cb) => {
			const handler = () => cb(app.ticker.deltaMS);
			app.ticker.add(handler);
			return () => app.ticker.remove(handler);
		});

		// PIXI's `ResizePlugin` only listens for `window` resize events.
		// When `resizeTo` is a DOM element, any layout change that affects
		// that element without triggering a window resize (sidebar inject,
		// font-load reflow, flexbox re-measure, programmatic style changes)
		// leaves `canvas.width/height` (the WebGL backbuffer) out of sync
		// with the canvas's CSS display size. With `autoDensity: false`
		// (PIXI's default) the browser then non-uniformly stretches the
		// canvas's pixel buffer to fit its CSS box, which manifests as
		// visible distortion of rendered glyphs.
		//
		// Observe the `resizeTo` element directly so backbuffer dimensions
		// track the displayed element through every layout change. We only
		// call `app.resize()`; we never set host properties — `resize()` is
		// idempotent for unchanged dimensions, so the worst case is a
		// redundant per-frame measurement, never a feedback loop.
		const target = app.resizeTo;
		if (
			target &&
			target !== globalThis.window &&
			typeof globalThis.ResizeObserver !== 'undefined' &&
			typeof app.resize === 'function'
		) {
			const observer = new ResizeObserver(() => app.resize!());
			observer.observe(target as Element);
			app[SLUG_RESIZE_OBSERVER] = observer;
		}
	}

	public static destroy(this: ApplicationV6Like): void {
		const observer = this[SLUG_RESIZE_OBSERVER];
		if (observer) {
			observer.disconnect();
			delete this[SLUG_RESIZE_OBSERVER];
		}
		SlugFonts.detachTicker();
		SlugFonts.sweepImmediate();
	}
}
