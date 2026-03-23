export class Defaults {
	/** Default texture size applied to both width & length. */
	public static readonly TEXTURE_SIZE = 4096 as const;
	/** Default number of horizontal/vertical bands per glyph for spatial indexing. */
	public static readonly BAND_COUNT = 32 as const;

	public static readonly FONT_SIZE = 24 as const;

	/** Maximum allowed supersample count. The shader has patterns up to 16 samples. */
	public static readonly MAX_SUPERSAMPLE_COUNT = 16 as const;

	public static readonly SlugText = {
		/** Default font size in pixels. */
		FontSize: 24 as const,
		Text: '' as const,
		WordWrap: false as const,
		WordWrapwidth: 0 as const,
		Supersampling: false as const,
		/** Default number of supersamples when supersampling is enabled. */
		SupersampleCount: 4 as const,

		/** Stroke defaults (matches PIXI.Text). Width 0 = disabled. */
		StrokeWidth: 0,
		StrokeColor: [0, 0, 0, 1] as readonly [number, number, number, number],

		/** Drop shadow defaults (matches PIXI.Text). */
		DropShadowAlpha: 1,
		DropShadowAngle: Math.PI / 6,
		DropShadowBlur: 0,
		DropShadowColor: [0, 0, 0, 1] as readonly [number, number, number, number],
		DropShadowDistance: 5
	} as const;
}
