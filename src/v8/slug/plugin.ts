import {ExtensionType, type Application, type ApplicationOptions} from 'pixi.js';
import {SlugFonts} from '../../shared/slug/fonts';

/**
 * Per-Application storage for the resize observer this plugin attaches.
 * Symbol-keyed so we don't collide with anything PIXI or host code may
 * add to the Application instance.
 */
const SLUG_RESIZE_OBSERVER = Symbol('slug.resizeObserver');

interface AppWithObserver {
	resizeTo?: Window | HTMLElement | null;
	resize?: () => void;
	[SLUG_RESIZE_OBSERVER]?: ResizeObserver;
}

/**
 * PIXI v8 Application plugin that integrates pixi-slug with an
 * `Application`'s lifecycle:
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
 * import {extensions} from 'pixi.js';
 * import {SlugApplicationPluginV8} from 'pixi-slug';
 *
 * extensions.add(SlugApplicationPluginV8);
 * const app = new Application();
 * await app.init({...}); // plugin.init runs — ticker wired to this app
 * // ... later
 * app.destroy(); // plugin.destroy runs — ticker detaches, unused fonts freed
 * ```
 *
 * ## Coexistence with `slugFontsAttachTickerV8`
 *
 * `slugFontsAttachTickerV8()` hooks `Ticker.shared`. This plugin hooks
 * the app's own ticker. Only one ticker source should feed the
 * registry at a time — see `SlugFonts.attachTicker` / the
 * `reattachPolicy` option for conflict handling. If both are wired
 * (e.g. auto-attach left on and plugin registered), the second attach
 * fails per `SlugFonts.reattachPolicy` (default: `'throw'`). Call
 * `SlugFonts.detachTicker()` before the plugin runs, or pass
 * `force: true` from one of the sites, to rebind explicitly.
 */
export const SlugApplicationPluginV8 = {
	extension: {
		type: ExtensionType.Application,
		name: 'slug'
	},
	init(this: Application, _options: Partial<ApplicationOptions>): void {
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
		const target = (app as AppWithObserver).resizeTo;
		if (
			target &&
			target !== globalThis.window &&
			typeof globalThis.ResizeObserver !== 'undefined' &&
			typeof app.resize === 'function'
		) {
			const observer = new ResizeObserver(() => app.resize());
			observer.observe(target as Element);
			(app as AppWithObserver)[SLUG_RESIZE_OBSERVER] = observer;
		}
	},
	destroy(this: Application): void {
		const observer = (this as AppWithObserver)[SLUG_RESIZE_OBSERVER];
		if (observer) {
			observer.disconnect();
			delete (this as AppWithObserver)[SLUG_RESIZE_OBSERVER];
		}
		SlugFonts.detachTicker();
		SlugFonts.sweepImmediate();
	}
};
