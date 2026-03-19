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
 * Band texture width required by the fragment shader.
 * Must match kLogBandTextureWidth = 12 in frag.glsl, which hardcodes
 * the wrap-and-shift arithmetic in CalcBandLoc to a 4096-wide texture.
 */
const BAND_TEXTURE_WIDTH = 1 << 12; // 4096

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
 *      curveListOffset is relative to glyph.bandOffset (used by CalcBandLoc in frag.glsl).
 *   2. Curve reference lists (one entry per curve in the band):
 *      [curveTexelX, curveTexelY, 0, 0]
 *      curveTexelX/Y are the 2D coordinates of the curve's p12 texel in uCurveTexture.
 *      Each list is row-aligned so it never straddles a row boundary.
 */
export function slugTexturePack(glyphs: SlugGlyphData[], textureWidth: number): SlugTexturePack {
	if (textureWidth !== BAND_TEXTURE_WIDTH) {
		throw new Error(
			`textureWidth must be ${BAND_TEXTURE_WIDTH} to match kLogBandTextureWidth=12 in frag.glsl, got ${textureWidth}`
		);
	}

	// First pass: compute total sizes, simulating row alignment for curve lists.
	let totalCurveTexels = 0;
	let totalBandTexels = 0;

	for (const glyph of glyphs) {
		// 2 texels per curve; each pair must be on the same row so the shader can
		// read p3 as curveLoc.x + 1 without crossing a row boundary.
		for (let i = 0; i < glyph.curves.length; i++) {
			if (totalCurveTexels % textureWidth === textureWidth - 1) {
				totalCurveTexels++; // skip last column, keep pairs row-aligned
			}
			totalCurveTexels += 2;
		}

		// Band headers must all fit on one row (shader accesses them with a fixed row).
		// Simulate the same padding the second pass applies.
		const hcount = glyph.hBandCount + glyph.vBandCount;
		const hcol = totalBandTexels % textureWidth;
		if (hcol + hcount > textureWidth) {
			totalBandTexels += textureWidth - hcol;
		}
		totalBandTexels += hcount;

		// Curve reference lists — simulate row alignment so the size estimate matches
		// the actual layout produced in the second pass.
		for (const band of glyph.hBands) {
			if (band.length > 0) {
				const col = totalBandTexels % textureWidth;
				if (col + band.length > textureWidth) {
					totalBandTexels += textureWidth - col;
				}
			}
			totalBandTexels += band.length;
		}
		for (const band of glyph.vBands) {
			if (band.length > 0) {
				const col = totalBandTexels % textureWidth;
				if (col + band.length > textureWidth) {
					totalBandTexels += textureWidth - col;
				}
			}
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
		glyph.curveOffset = curveTexelIdx;

		// Pack curves into curve texture.
		// Each curve occupies 2 consecutive texels; skip the last column of a row
		// if needed so p12 and p3 are always on the same row (shader reads p3 as
		// curveLoc.x + 1 with no row-wrapping).
		// Track each curve's actual p12 texel index for band references below.
		const curveTexels: number[] = new Array(glyph.curves.length);
		for (let i = 0; i < glyph.curves.length; i++) {
			if (curveTexelIdx % textureWidth === textureWidth - 1) {
				curveTexelIdx++; // pad past last column of row
			}

			curveTexels[i] = curveTexelIdx;
			const curve = glyph.curves[i];

			const base0 = curveTexelIdx * 4;
			curveData[base0]     = curve.p1x;
			curveData[base0 + 1] = curve.p1y;
			curveData[base0 + 2] = curve.p2x;
			curveData[base0 + 3] = curve.p2y;
			curveTexelIdx++;

			const base1 = curveTexelIdx * 4;
			curveData[base1]     = curve.p3x;
			curveData[base1 + 1] = curve.p3y;
			curveData[base1 + 2] = 0;
			curveData[base1 + 3] = 0;
			curveTexelIdx++;
		}

		// The shader fetches all band headers using a fixed row (glyphLoc.y) with
		// glyphLoc.x + bandIndex as the column — no row-wrapping. So all headers
		// must fit within one texture row. Pad to next row if they would overflow.
		const headerCount = glyph.hBandCount + glyph.vBandCount;
		const headerCol = bandTexelIdx % textureWidth;
		if (headerCol + headerCount > textureWidth) {
			bandTexelIdx += textureWidth - headerCol;
		}

		// Record band offset for this glyph
		glyph.bandOffset = bandTexelIdx;

		// Reserve header space
		const headerStart = bandTexelIdx;
		bandTexelIdx += headerCount;

		// Pack horizontal band headers + curve lists
		for (let b = 0; b < glyph.hBandCount; b++) {
			const band = glyph.hBands[b];
			const headerBase = (headerStart + b) * 4;

			// Align curve list to avoid straddling a row boundary.
			// frag.glsl accesses the list as fetchBand(ivec2(hbandLoc.x + curveIndex, hbandLoc.y))
			// with a fixed row, so the entire list must fit within one row.
			if (band.length > 0) {
				const col = bandTexelIdx % textureWidth;
				if (col + band.length > textureWidth) {
					bandTexelIdx += textureWidth - col;
				}
			}

			bandData[headerBase]     = band.length;
			// Offset is relative to glyph.bandOffset — CalcBandLoc in frag.glsl
			// adds it to glyphLoc and handles row wrapping.
			bandData[headerBase + 1] = bandTexelIdx - glyph.bandOffset;
			bandData[headerBase + 2] = 0;
			bandData[headerBase + 3] = 0;

			for (const curveIdx of band) {
				const refBase = bandTexelIdx * 4;
				// 2D texel coordinates of p12 in uCurveTexture.
				const absCurveTexel = curveTexels[curveIdx];
				bandData[refBase]     = absCurveTexel % textureWidth;
				bandData[refBase + 1] = Math.floor(absCurveTexel / textureWidth);
				bandData[refBase + 2] = 0;
				bandData[refBase + 3] = 0;
				bandTexelIdx++;
			}
		}

		// Pack vertical band headers + curve lists
		for (let b = 0; b < glyph.vBandCount; b++) {
			const band = glyph.vBands[b];
			const headerBase = (headerStart + glyph.hBandCount + b) * 4;

			if (band.length > 0) {
				const col = bandTexelIdx % textureWidth;
				if (col + band.length > textureWidth) {
					bandTexelIdx += textureWidth - col;
				}
			}

			bandData[headerBase]     = band.length;
			bandData[headerBase + 1] = bandTexelIdx - glyph.bandOffset;
			bandData[headerBase + 2] = 0;
			bandData[headerBase + 3] = 0;

			for (const curveIdx of band) {
				const refBase = bandTexelIdx * 4;
				const absCurveTexel = curveTexels[curveIdx];
				bandData[refBase]     = absCurveTexel % textureWidth;
				bandData[refBase + 1] = Math.floor(absCurveTexel / textureWidth);
				bandData[refBase + 2] = 0;
				bandData[refBase + 3] = 0;
				bandTexelIdx++;
			}
		}
	}

	return { curveData, bandData };
}
