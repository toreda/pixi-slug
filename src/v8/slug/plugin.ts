import {ExtensionType, type Application, type ApplicationOptions} from 'pixi.js';
import {SlugFonts} from '../../shared/slug/fonts';

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
	},
	destroy(this: Application): void {
		SlugFonts.detachTicker();
		SlugFonts.sweepImmediate();
	}
};
