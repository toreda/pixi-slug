export interface SlugFontsRegistryOptions {
	/**
	 * When true, fonts with ref count 0 are marked for destroy and then
	 * destroyed after `autoDestroyDelay` seconds elapse. When false, fonts
	 * are never destroyed automatically.
	 */
	autoDestroyUnused: boolean;
	/**
	 * Grace period in seconds between a font reaching ref count 0 and it
	 * being destroyed. Allows a brief overlap where a re-acquired font
	 * is rescued instead of churned.
	 */
	autoDestroyDelay: number;
	/**
	 * When true, version entry points (v6/v7/v8) auto-subscribe the
	 * registry sweep to `Ticker.shared`. Set false when the host app
	 * manages ticking manually.
	 */
	autoAttachTicker: boolean;
	/**
	 * Minimum milliseconds between `onUpdate` sweep runs. The ticker
	 * calls `onUpdate` every frame; this throttles the actual sweep so
	 * map iteration stays off the hot path.
	 */
	updateRate: number;
	/**
	 * How `SlugFonts.attachTicker()` reacts when a ticker is already
	 * attached and the caller did not pass `force: true`. Pass `force`
	 * to replace silently without firing this policy.
	 */
	reattachPolicy: 'throw' | 'error' | 'warn' | 'silent';
}
