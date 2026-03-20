export class Defaults {
	/** Default texture size applied to both width & length. */
	public static readonly TEXTURE_SIZE = 4096 as const;
	/** Default number of horizontal/vertical bands per glyph for spatial indexing. */
	public static readonly BAND_COUNT = 32 as const;
	/** Default font size in pixels. */
	public static readonly FONT_SIZE = 24 as const;
	/** Default number of supersamples when supersampling is enabled. */
	public static readonly SUPERSAMPLE_COUNT = 4 as const;
	/** Maximum allowed supersample count. The shader has patterns up to 16 samples. */
	public static readonly MAX_SUPERSAMPLE_COUNT = 16 as const;
}
