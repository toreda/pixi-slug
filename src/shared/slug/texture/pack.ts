import type { SlugGlyphData } from '../glyph/data';

/**
 * Result of packing all glyph data into GPU-ready textures.
 */
export interface SlugTexturePack {
	/** Float32 RGBA curve texture data (4 components per texel). */
	curveData: Float32Array;
	/** Uint32 RGBA band texture data (4 components per texel). */
	bandData: Uint32Array;
}

/**
 * Pack preprocessed glyph data into curve and band textures.
 *
 * **Curve texture layout** (float RGBA, `textureWidth` wide):
 * Each curve occupies 2 consecutive texels:
 *   texel 0: [p1.x, p1.y, p2.x, p2.y]
 *   texel 1: [p3.x, p3.y, 0, 0]
 *
 * **Band texture layout** (uint RGBA, `textureWidth` wide):
 * Per glyph, a contiguous block containing:
 *   1. Band headers (one per horizontal band, then one per vertical band):
 *      [curveCount, curveListOffset, 0, 0]
 *   2. Curve reference lists (one per header, variable length):
 *      [curveIndex, 0, 0, 0] for each curve in the band
 */
export function slugTexturePack(glyphs: SlugGlyphData[], textureWidth: number): SlugTexturePack {
	// First pass: compute total sizes
	let totalCurveTexels = 0;
	let totalBandTexels = 0;

	for (const glyph of glyphs) {
		// 2 texels per curve
		totalCurveTexels += glyph.curves.length * 2;

		// Band headers: hBandCount + vBandCount texels
		const headerCount = glyph.hBandCount + glyph.vBandCount;
		totalBandTexels += headerCount;

		// Curve reference lists: sum of all band entries
		for (const band of glyph.hBands) {
			totalBandTexels += band.length;
		}
		for (const band of glyph.vBands) {
			totalBandTexels += band.length;
		}
	}

	// Compute texture height from texel count (round up to full rows)
	const curveRows = Math.ceil(totalCurveTexels / textureWidth) || 1;
	const bandRows = Math.ceil(totalBandTexels / textureWidth) || 1;

	// Allocate RGBA textures (4 components per texel)
	const curveData = new Float32Array(curveRows * textureWidth * 4);
	const bandData = new Uint32Array(bandRows * textureWidth * 4);

	// Second pass: pack data
	let curveTexelIdx = 0;
	let bandTexelIdx = 0;

	for (const glyph of glyphs) {
		// Record curve offset for this glyph
		glyph.curveOffset = curveTexelIdx;

		// Pack curves into curve texture
		for (const curve of glyph.curves) {
			const base0 = curveTexelIdx * 4;
			curveData[base0] = curve.p1x;
			curveData[base0 + 1] = curve.p1y;
			curveData[base0 + 2] = curve.p2x;
			curveData[base0 + 3] = curve.p2y;
			curveTexelIdx++;

			const base1 = curveTexelIdx * 4;
			curveData[base1] = curve.p3x;
			curveData[base1 + 1] = curve.p3y;
			curveData[base1 + 2] = 0;
			curveData[base1 + 3] = 0;
			curveTexelIdx++;
		}

		// Record band offset for this glyph
		glyph.bandOffset = bandTexelIdx;

		// Reserve header space
		const headerStart = bandTexelIdx;
		const headerCount = glyph.hBandCount + glyph.vBandCount;
		bandTexelIdx += headerCount;

		// Pack horizontal band headers + curve lists
		for (let b = 0; b < glyph.hBandCount; b++) {
			const band = glyph.hBands[b];
			const headerBase = (headerStart + b) * 4;
			bandData[headerBase] = band.length;
			bandData[headerBase + 1] = bandTexelIdx;
			bandData[headerBase + 2] = 0;
			bandData[headerBase + 3] = 0;

			for (const curveIdx of band) {
				const refBase = bandTexelIdx * 4;
				bandData[refBase] = curveIdx;
				bandData[refBase + 1] = 0;
				bandData[refBase + 2] = 0;
				bandData[refBase + 3] = 0;
				bandTexelIdx++;
			}
		}

		// Pack vertical band headers + curve lists
		for (let b = 0; b < glyph.vBandCount; b++) {
			const band = glyph.vBands[b];
			const headerBase = (headerStart + glyph.hBandCount + b) * 4;
			bandData[headerBase] = band.length;
			bandData[headerBase + 1] = bandTexelIdx;
			bandData[headerBase + 2] = 0;
			bandData[headerBase + 3] = 0;

			for (const curveIdx of band) {
				const refBase = bandTexelIdx * 4;
				bandData[refBase] = curveIdx;
				bandData[refBase + 1] = 0;
				bandData[refBase + 2] = 0;
				bandData[refBase + 3] = 0;
				bandTexelIdx++;
			}
		}
	}

	return { curveData, bandData };
}
