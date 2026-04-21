import {SlugFonts} from '../../shared/slug/fonts';

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
	}

	public static destroy(this: ApplicationV6Like): void {
		SlugFonts.detachTicker();
		SlugFonts.sweepImmediate();
	}
}
