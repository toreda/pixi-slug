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
		ReattachPolicy: 'throw' as 'throw' | 'error' | 'warn' | 'silent'
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
		FillColor: [1, 1, 1, 1] as readonly [number, number, number, number],

		/** Stroke defaults. Width 0 = disabled. */
		StrokeWidth: 0 as const,
		StrokeColor: [0, 0, 0, 1] as readonly [number, number, number, number],
		StrokeAlphaMode: 'uniform' as const,
		StrokeAlphaStart: 1 as const,
		StrokeAlphaRate: 0 as const,

		/** Drop shadow defaults (matches PIXI.Text). */
		DropShadowAlpha: 1 as const,
		DropShadowAngle: Math.PI / 6,
		DropShadowBlur: 0 as const,
		DropShadowColor: [0, 0, 0, 1] as readonly [number, number, number, number],
		DropShadowDistance: 5 as const,

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
