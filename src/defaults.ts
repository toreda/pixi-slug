/**
 * Any default value or fallback value used in the package code must live here
 * for consistency. By keeping all default values in one place, changing a
 * value here will update all usages.
 */
export class Defaults {
	/** Default texture size applied to both width & length. */
	public static readonly TEXTURE_SIZE = 4096 as const;
	/** Default number of horizontal/vertical bands per glyph for spatial indexing. */
	public static readonly BAND_COUNT = 32 as const;

	public static readonly FONT_SIZE = 24 as const;

	/** Maximum allowed supersample count. The shader has patterns
	 * up to 16 samples. */
	public static readonly MAX_SUPERSAMPLE_COUNT = 16 as const;

	public static readonly SlugText = {
		/** Default font size in pixels. */
		FontSize: 24 as const,
		Text: '' as const,
		WordWrap: false as const,
		WordWrapwidth: 0 as const,
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
		DropShadowDistance: 5 as const
	} as const;
}
