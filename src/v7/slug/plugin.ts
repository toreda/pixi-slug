import {ExtensionType} from '@pixi/core';
import {SlugFonts} from '../../shared/slug/fonts';

/**
 * Minimal shape of PIXI v7 `Application` the plugin relies on.
 * Inlined to avoid adding `@pixi/app` as a dev dependency purely for
 * type-checking — host apps provide the real `Application` at runtime.
 */
interface ApplicationV7Like {
	ticker: {
		deltaMS: number;
		add(fn: () => void): void;
		remove(fn: () => void): void;
	};
}

/**
 * PIXI v7 Application plugin that integrates pixi-slug with an
 * `Application`'s lifecycle:
 *
 *  - On `init`, hooks `SlugFonts` to the app's own `ticker` so the
 *    registry's auto-destroy grace-period sweep advances each frame.
 *  - On `destroy`, detaches the ticker binding and force-sweeps any
 *    currently unused fonts so their GPU resources are freed
 *    immediately instead of waiting out the grace period.
 *
 * Registration matches v8 via the `@pixi/core` extensions system:
 *
 * ```typescript
 * import {extensions} from '@pixi/core';
 * import {SlugApplicationPluginV7} from 'pixi-slug/v7';
 *
 * extensions.add(SlugApplicationPluginV7);
 * const app = new Application({...}); // plugin.init runs
 * // ... later
 * app.destroy(); // plugin.destroy runs
 * ```
 *
 * If `slugFontsAttachTickerV7()` (which hooks `Ticker.shared`) is also
 * active, the second attach fails per `SlugFonts.reattachPolicy`.
 * See `SlugFonts.attachTicker` for conflict handling.
 */
export const SlugApplicationPluginV7 = {
	extension: {
		type: ExtensionType.Application,
		name: 'slug'
	},
	init(this: ApplicationV7Like, _options: unknown): void {
		const app = this;
		SlugFonts.attachTicker((cb) => {
			const handler = () => cb(app.ticker.deltaMS);
			app.ticker.add(handler);
			return () => app.ticker.remove(handler);
		});
	},
	destroy(this: ApplicationV7Like): void {
		SlugFonts.detachTicker();
		SlugFonts.sweepImmediate();
	}
};
