import {Ticker} from 'pixi.js';
import {Defaults} from '../../../defaults';
import {SlugFonts} from '../../../shared/slug/fonts';

/**
 * Auto-attach the shared PixiJS v8 Ticker to the `SlugFonts` registry
 * so its auto-destroy grace-period sweep runs without host-app setup.
 * Skipped when `Defaults.Registry.AutoAttachTicker` is false.
 */
export function slugFontsAttachTickerV8(): void {
	if (!Defaults.Registry.AutoAttachTicker) return;
	SlugFonts.attachTicker((cb) => {
		const listener = () => cb(Ticker.shared.deltaMS);
		Ticker.shared.add(listener);
		return () => Ticker.shared.remove(listener);
	});
}

slugFontsAttachTickerV8();
