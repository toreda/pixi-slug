import {Ticker} from '@pixi/ticker';
import {Defaults} from '../../../defaults';
import {SlugFonts} from '../../../shared/slug/fonts';

/**
 * Auto-attach the shared PixiJS v7 Ticker to the `SlugFonts` registry
 * so its auto-destroy grace-period sweep runs without host-app setup.
 * Skipped when `Defaults.Registry.AutoAttachTicker` is false.
 */
export function slugFontsAttachTickerV7(): void {
	if (!Defaults.Registry.AutoAttachTicker) return;
	SlugFonts.attachTicker((cb) => {
		const listener = () => cb(Ticker.shared.deltaMS);
		Ticker.shared.add(listener);
		return () => Ticker.shared.remove(listener);
	});
}

slugFontsAttachTickerV7();
