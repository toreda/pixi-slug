import type {RgbaReadonly} from './rgba';

/**
 * Any default value or fallback value used in the package code must live here
 * for consistency. By keeping all default values in one place, changing a
 * value here will update all usages.
 */
export class Defaults {
	/**
	 * Global key used to share the `SlugFonts` registry instance across
	 * module duplicates (e.g. when multiple bundles load `pixi-slug` on
	 * the same page). Callers never see this — it is an internal detail.
	 */
	public static GLOBAL_KEY = '__pixiSlugFontsRegistry__' as const;
	/** Default texture size applied to both width & length. */
	public static readonly TEXTURE_SIZE = 4096 as const;
	/** Default number of horizontal/vertical bands per glyph for spatial indexing. */
	public static readonly BAND_COUNT = 32 as const;

	public static readonly FONT_SIZE = 24 as const;

	/** Maximum allowed supersample count. The shader has patterns
	 * up to 16 samples. */
	public static readonly MAX_SUPERSAMPLE_COUNT = 16 as const;

	public static readonly Registry = {
		/** Mark unreferenced fonts for destroy when their ref count hits 0. */
		AutoDestroyUnused: true as const,
		/** Grace period in seconds before a marked font is actually destroyed. */
		AutoDestroyDelay: 60 as const,
		/** Version entry points auto-attach `Ticker.shared` when true. */
		AutoAttachTicker: true as const,
		/** Minimum milliseconds between sweep runs driven by `onUpdate`. */
		UpdateRate: 1000 as const,
		/**
		 * How `SlugFonts.attachTicker()` reacts when a ticker is already
		 * attached and the caller did not pass `force: true`. See
		 * `SlugFontErrorMode` for mode semantics.
		 *
		 * Use `force: true` on the second attach to replace silently
		 * without triggering this policy.
		 */
		ReattachPolicy: 'throw' as 'throw' | 'error' | 'warn' | 'silent',
		/**
		 * Internal "prewarm mode active" flag. **Default false.** The
		 * library flips this to true automatically when the consumer
		 * invokes one of the prewarm APIs:
		 *
		 *  - `SlugFonts.prewarmContext(gl)` — context-first prewarm
		 *  - `SlugFonts.attachRenderer(renderer)` — renderer-driven prewarm
		 *    (also fired by `SlugApplicationPluginV8` during `app.init`)
		 *
		 * While false, every compile path is synchronous: the cache-miss
		 * compile inside `slugFontGpuV{6,7,8}` runs PIXI's blocking
		 * `generateProgram` exactly as before this feature shipped. While
		 * true, both the explicit prewarm APIs and the cache-miss path
		 * use `KHR_parallel_shader_compile` for off-thread compile.
		 *
		 * Not a user-facing kill switch — consumers opt in by calling a
		 * prewarm API, opt out by not calling one. Exposed in Defaults
		 * for tests and for advanced consumers building a library variant
		 * with prewarm-on by default.
		 */
		ParallelShaderCompile: false as const
	} as const;

	public static readonly SlugText = {
		/** Default font size in pixels. */
		FontSize: 24 as const,
		Text: '' as const,
		/**
		 * Default text direction. Today only decoration `start`/`end`
		 * alignment honors this — full RTL glyph layout (BiDi reordering,
		 * shaping, line fill direction) lands as a separate feature. The
		 * field is exposed now so app code can be written direction-aware
		 * without API churn later.
		 */
		Direction: 'ltr' as 'ltr' | 'rtl',
		/**
		 * Default block-level text alignment. `start` follows the text
		 * direction (LTR → left, RTL → right), matching CSS.
		 */
		Align: 'start' as 'start' | 'end' | 'left' | 'center' | 'right' | 'justify',
		/**
		 * Default justify strategy. Mirrors CSS `text-justify` and is
		 * consulted only when `align === 'justify'`. `'inter-word'`
		 * matches CSS's default and is the right behavior for Latin /
		 * Cyrillic / similar scripts.
		 */
		TextJustify: 'inter-word' as 'inter-word' | 'inter-character',
		WordWrap: false as const,
		WordWrapWidth: 0 as const,
		BreakWords: false as const,
		/**
		 * When a font is passed to `SlugText` by URL/name and is not yet
		 * loaded, render using the `SlugFonts` fallback font while the
		 * real font resolves. When the real font arrives, `SlugText`
		 * swaps to it and rebuilds automatically.
		 */
		FallbackWhileLoading: true as const,
		/** Whether supersampling is enabled. */
		Supersampling: false as const,
		/** Default number of supersamples when supersampling is enabled. */
		SupersampleCount: 4 as const,

		/** Fill color default (white, fully opaque). */
		FillColor: [1, 1, 1, 1] as RgbaReadonly,

		/** Stroke defaults. Width 0 = disabled. */
		StrokeWidth: 0 as const,
		StrokeColor: [0, 0, 0, 1] as RgbaReadonly,
		StrokeAlphaMode: 'uniform' as const,
		StrokeAlphaStart: 1 as const,
		StrokeAlphaRate: 0 as const,

		/** Drop shadow defaults (matches PIXI.Text). */
		DropShadowAlpha: 1 as const,
		DropShadowAngle: Math.PI / 6,
		DropShadowBlur: 0 as const,
		DropShadowColor: [0, 0, 0, 1] as RgbaReadonly,
		DropShadowDistance: 5 as const,

		/** Default subscript / superscript content. Empty = none. */
		Subscript: '' as const,
		Superscript: '' as const,
		/**
		 * Default size ratio for sub/sup relative to the main `fontSize`,
		 * used when `subFontSize` / `supFontSize` is unset (`null`).
		 * Explicitly setting either to a number overrides this; setting to
		 * `0` disables that script.
		 */
		ScriptSizeRatio: 0.7 as const,
		/**
		 * Vertical baseline offsets for sub/sup expressed as a fraction of
		 * the main `fontSize`. The sub baseline drops `SubBaselineRatio *
		 * fontSize` below the main baseline; the sup baseline rises
		 * `SupBaselineRatio * fontSize` above the main baseline.
		 */
		SubBaselineRatio: 0.2 as const,
		SupBaselineRatio: 0.45 as const,
		/**
		 * Horizontal gap between the trailing main-text cursor and the
		 * start of the sub/sup, as a fraction of the main `fontSize`.
		 */
		ScriptGapRatio: 0.05 as const,

		/**
		 * Per-case error policy for the font resolver. `'throw'` surfaces a
		 * clear message at the point of failure; `'error'` logs via
		 * `console.error` without throwing; `'warn'` logs via
		 * `console.warn`; `'silent'` swallows errors entirely.
		 *
		 * Alias-related issues (`aliasNotFound`, `aliasCollision`) default
		 * to `'error'` — serious enough to surface, not serious enough to
		 * kill the scene. The SlugText falls back to the bundled fallback
		 * font instead.
		 */
		ErrorPolicy: {
			unknownInput: 'throw' as 'throw' | 'error' | 'warn' | 'silent',
			fontFaceNoUrl: 'throw' as 'throw' | 'error' | 'warn' | 'silent',
			emptyFontFaceArray: 'throw' as 'throw' | 'error' | 'warn' | 'silent',
			emptyInput: 'throw' as 'throw' | 'error' | 'warn' | 'silent',
			loadFailed: 'throw' as 'throw' | 'error' | 'warn' | 'silent',
			unsupportedFormat: 'throw' as 'throw' | 'error' | 'warn' | 'silent',
			aliasNotFound: 'error' as 'throw' | 'error' | 'warn' | 'silent',
			aliasCollision: 'error' as 'throw' | 'error' | 'warn' | 'silent'
		}
	} as const;
}
