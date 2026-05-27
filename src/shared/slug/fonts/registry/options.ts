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
	/**
	 * Initial value of the internal "prewarm mode active" flag. Default
	 * false. The library flips this to true automatically when the
	 * consumer invokes one of the prewarm APIs:
	 *
	 *  - `SlugFonts.prewarmContext(gl)` — context-first prewarm
	 *  - `SlugFonts.attachRenderer(renderer)` — renderer-driven prewarm
	 *
	 * Once true, cache-miss compiles inside `slugFontGpu*` also use
	 * `KHR_parallel_shader_compile`. While false, every compile path is
	 * synchronous (today's pre-prewarm behavior).
	 *
	 * Construct with `true` to start the registry in prewarm mode
	 * without first calling a prewarm API — useful for tests and for
	 * advanced consumers building a library variant where prewarm is
	 * the default. Construct with `false` (the default) for normal
	 * consumer usage; the flag flips itself when needed.
	 */
	parallelShaderCompile: boolean;
}
