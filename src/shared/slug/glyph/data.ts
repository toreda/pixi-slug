/**
 * A single quadratic Bezier curve defined by 3 control points in em-space.
 */
export interface SlugGlyphCurve {
	/** Start point */
	p1x: number;
	p1y: number;
	/** Control point */
	p2x: number;
	p2y: number;
	/** End point */
	p3x: number;
	p3y: number;
}

/**
 * Preprocessed glyph data ready for GPU texture packing.
 * Stores the curves, bounding box, band assignments, and
 * location metadata for the curve/band textures.
 */
export interface SlugGlyphData {
	/** Unicode code point */
	charCode: number;
	/** All quadratic Bezier curves for this glyph */
	curves: SlugGlyphCurve[];
	/** Bounding box in em-space */
	bounds: {
		minX: number;
		minY: number;
		maxX: number;
		maxY: number;
	};
	/** Advance width in em-space */
	advanceWidth: number;
	/** Left side bearing in em-space */
	lsb: number;
	/** Number of horizontal bands */
	hBandCount: number;
	/** Number of vertical bands */
	vBandCount: number;
	/** Horizontal bands: each entry is an array of curve indices */
	hBands: number[][];
	/** Vertical bands: each entry is an array of curve indices */
	vBands: number[][];
	/** Offset into the curve texture (texel index of first curve) */
	curveOffset: number;
	/** Offset into the band texture (texel index of band header) */
	bandOffset: number;
}
