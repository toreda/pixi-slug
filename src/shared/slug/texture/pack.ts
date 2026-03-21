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
 * Compute the number of curve texels needed per contour using the
 * shared-endpoint layout. Within a contour of N curves, each curve
 * gets 1 texel [p1x,p1y,p2x,p2y], plus 1 sentinel texel at the end
 * holding the last curve's p3 as [p3x,p3y,0,0]. The shader reads p3
 * via curveLoc.x+1, which naturally hits the next curve's p1 (== current
 * curve's p3) or the sentinel for the last curve.
 *
 * Row alignment: each curve's texel and the texel at +1 must share
 * a row. If a texel would land on the last column, skip to the next row.
 */
function countContourTexels(contourSize: number, startIdx: number, textureWidth: number): number {
	let idx = startIdx;
	// N curve texels + 1 sentinel, each needing its +1 neighbor on the same row
	const totalTexels = contourSize + 1;
	for (let i = 0; i < totalTexels; i++) {
		if (idx % textureWidth === textureWidth - 1) {
			idx++; // skip last column to keep pair on same row
		}
		idx++;
	}
	return idx - startIdx;
}

/**
 * Pack preprocessed glyph data into curve and band textures.
 *
 * **Curve texture layout** (float RGBA, `textureWidth` wide):
 * Uses the shared-endpoint optimization: within each contour of N curves,
 * consecutive curves share endpoints (curve K's p3 == curve K+1's p1).
 * Each curve occupies 1 texel [p1.x, p1.y, p2.x, p2.y], and a sentinel
 * texel [p3.x, p3.y, 0, 0] follows the last curve in each contour.
 * The shader reads p3 as texelFetch(curveLoc.x + 1, curveLoc.y).xy,
 * which naturally reads the next curve's p1 or the sentinel — no shader
 * change required.
 *
 * For a contour of N curves this uses N+1 texels instead of 2N (~45% savings).
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

	const widthMask = textureWidth - 1; // 0xFFF for bitwise mod

	// First pass: compute total sizes, simulating row alignment.
	let totalCurveTexels = 0;
	let totalBandTexels = 0;

	for (const glyph of glyphs) {
		// Shared-endpoint curve texels per contour
		const starts = glyph.contourStarts;
		for (let c = 0; c < starts.length; c++) {
			const contourBegin = starts[c];
			const contourEnd = c + 1 < starts.length ? starts[c + 1] : glyph.curves.length;
			const contourSize = contourEnd - contourBegin;
			if (contourSize === 0) continue;
			totalCurveTexels += countContourTexels(contourSize, totalCurveTexels, textureWidth);
		}

		// Band headers must all fit on one row.
		const hcount = glyph.hBandCount + glyph.vBandCount;
		const hcol = totalBandTexels & widthMask;
		if (hcol + hcount > textureWidth) {
			totalBandTexels += textureWidth - hcol;
		}
		totalBandTexels += hcount;

		// Curve reference lists — simulate row alignment.
		for (const band of glyph.hBands) {
			if (band.length > 0) {
				const col = totalBandTexels & widthMask;
				if (col + band.length > textureWidth) {
					totalBandTexels += textureWidth - col;
				}
			}
			totalBandTexels += band.length;
		}
		for (const band of glyph.vBands) {
			if (band.length > 0) {
				const col = totalBandTexels & widthMask;
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

		// Pack curves using shared-endpoint layout.
		// Track each curve's p12 texel index for band references below.
		const curveTexels: number[] = new Array(glyph.curves.length);
		const starts = glyph.contourStarts;

		for (let c = 0; c < starts.length; c++) {
			const contourBegin = starts[c];
			const contourEnd = c + 1 < starts.length ? starts[c + 1] : glyph.curves.length;
			const contourSize = contourEnd - contourBegin;
			if (contourSize === 0) continue;

			// Pack each curve's p12 texel. The shader reads p3 from curveLoc.x+1,
			// which is the next curve's p12 texel (whose .xy == current curve's p3).
			for (let i = contourBegin; i < contourEnd; i++) {
				// Ensure this texel and the +1 texel are on the same row.
				if ((curveTexelIdx & widthMask) === widthMask) {
					curveTexelIdx++; // skip last column
				}

				curveTexels[i] = curveTexelIdx;
				const curve = glyph.curves[i];

				const base = curveTexelIdx * 4;
				curveData[base]     = curve.p1x;
				curveData[base + 1] = curve.p1y;
				curveData[base + 2] = curve.p2x;
				curveData[base + 3] = curve.p2y;
				curveTexelIdx++;
			}

			// Sentinel texel: holds the last curve's p3 so the shader's
			// curveLoc.x+1 read works for the final curve in the contour.
			// Row-alignment: the last curve's texel was placed such that +1
			// is on the same row (handled by the skip above). The sentinel
			// itself also needs its +1 neighbor check skipped since nothing
			// reads sentinel+1, but we still must not leave curveTexelIdx
			// on the last column for the next contour's first curve.
			const lastCurve = glyph.curves[contourEnd - 1];
			const sentBase = curveTexelIdx * 4;
			curveData[sentBase]     = lastCurve.p3x;
			curveData[sentBase + 1] = lastCurve.p3y;
			curveData[sentBase + 2] = 0;
			curveData[sentBase + 3] = 0;
			curveTexelIdx++;
		}

		// --- Band texture packing (unchanged logic) ---

		// Pad to next row if band headers would straddle a row boundary.
		const headerCount = glyph.hBandCount + glyph.vBandCount;
		const headerCol = bandTexelIdx & widthMask;
		if (headerCol + headerCount > textureWidth) {
			bandTexelIdx += textureWidth - headerCol;
		}

		glyph.bandOffset = bandTexelIdx;

		const headerStart = bandTexelIdx;
		bandTexelIdx += headerCount;

		// Pack horizontal band headers + curve lists
		for (let b = 0; b < glyph.hBandCount; b++) {
			const band = glyph.hBands[b];
			const headerBase = (headerStart + b) * 4;

			if (band.length > 0) {
				const col = bandTexelIdx & widthMask;
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
				bandData[refBase]     = absCurveTexel & widthMask;
				bandData[refBase + 1] = (absCurveTexel >>> 12);
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
				const col = bandTexelIdx & widthMask;
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
				bandData[refBase]     = absCurveTexel & widthMask;
				bandData[refBase + 1] = (absCurveTexel >>> 12);
				bandData[refBase + 2] = 0;
				bandData[refBase + 3] = 0;
				bandTexelIdx++;
			}
		}
	}

	return { curveData, bandData };
}
