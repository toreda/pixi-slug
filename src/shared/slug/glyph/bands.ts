import { Defaults } from '../../../defaults';
import type { SlugGlyphCurve } from './data';

/**
 * Result of band computation for a single glyph.
 */
export interface SlugGlyphBands {
	hBandCount: number;
	vBandCount: number;
	/** Each entry is an array of curve indices intersecting that horizontal band. */
	hBands: number[][];
	/** Each entry is an array of curve indices intersecting that vertical band. */
	vBands: number[][];
}

/**
 * Compute the axis-aligned bounding box of a quadratic Bezier curve.
 * Returns [minX, minY, maxX, maxY].
 *
 * Uses float32-truncated coordinates to match what the GPU sees in the curve
 * texture (see port_risks.md JS-1). Without this, a curve whose float64 bounds
 * barely reach into band N might not reach it in float32, causing the shader
 * to miss the curve at that band boundary → horizontal/vertical line artifacts.
 */
const _boundsF32 = new Float32Array(6);
function curveBounds(curve: SlugGlyphCurve): [number, number, number, number] {
	// Truncate to float32 to match the precision stored in the curve texture.
	_boundsF32[0] = curve.p1x;
	_boundsF32[1] = curve.p1y;
	_boundsF32[2] = curve.p2x;
	_boundsF32[3] = curve.p2y;
	_boundsF32[4] = curve.p3x;
	_boundsF32[5] = curve.p3y;
	const p1x = _boundsF32[0], p1y = _boundsF32[1];
	const p2x = _boundsF32[2], p2y = _boundsF32[3];
	const p3x = _boundsF32[4], p3y = _boundsF32[5];

	// For a quadratic Bezier B(t) = (1-t)^2*p1 + 2(1-t)t*p2 + t^2*p3,
	// the extrema occur at t = (p1 - p2) / (p1 - 2*p2 + p3) for each axis.
	let minX = Math.min(p1x, p3x);
	let maxX = Math.max(p1x, p3x);
	let minY = Math.min(p1y, p3y);
	let maxY = Math.max(p1y, p3y);

	// Check x-axis extremum
	const denomX = p1x - 2 * p2x + p3x;
	if (Math.abs(denomX) > 1e-10) {
		const tx = (p1x - p2x) / denomX;
		if (tx > 0 && tx < 1) {
			const oneMinusT = 1 - tx;
			const ex = oneMinusT * oneMinusT * p1x + 2 * oneMinusT * tx * p2x + tx * tx * p3x;
			minX = Math.min(minX, ex);
			maxX = Math.max(maxX, ex);
		}
	}

	// Check y-axis extremum
	const denomY = p1y - 2 * p2y + p3y;
	if (Math.abs(denomY) > 1e-10) {
		const ty = (p1y - p2y) / denomY;
		if (ty > 0 && ty < 1) {
			const oneMinusT = 1 - ty;
			const ey = oneMinusT * oneMinusT * p1y + 2 * oneMinusT * ty * p2y + ty * ty * p3y;
			minY = Math.min(minY, ey);
			maxY = Math.max(maxY, ey);
		}
	}

	return [minX, minY, maxX, maxY];
}

/**
 * Assign curves to horizontal and vertical bands for spatial indexing.
 * The glyph's bounding box is divided into a grid of bands.
 * Each band records which curves overlap it, so the fragment shader
 * only tests the relevant subset of curves per pixel.
 */
export function slugGlyphBands(
	curves: SlugGlyphCurve[],
	boundsMinX: number,
	boundsMinY: number,
	boundsMaxX: number,
	boundsMaxY: number,
	bandCount: number = Defaults.BAND_COUNT
): SlugGlyphBands {
	const width = boundsMaxX - boundsMinX;
	const height = boundsMaxY - boundsMinY;

	// Avoid division by zero for zero-area glyphs (e.g. space)
	if (width < 1e-10 || height < 1e-10 || curves.length === 0) {
		return {
			hBandCount: 0,
			vBandCount: 0,
			hBands: [],
			vBands: []
		};
	}

	const hBandCount = Math.min(bandCount, curves.length);
	const vBandCount = Math.min(bandCount, curves.length);

	const hBands: number[][] = [];
	const vBands: number[][] = [];

	for (let i = 0; i < hBandCount; i++) {
		hBands.push([]);
	}
	for (let i = 0; i < vBandCount; i++) {
		vBands.push([]);
	}

	// Compute bandScale and bandOffset using float32 round-trip to match GPU precision.
	// The shader receives these as float32 vertex attributes and computes:
	//   bandIndex = int(renderCoord * bandScale + bandOffset)
	// where renderCoord is also float32. Using float64 here would assign curves to
	// bands that the shader never selects, causing missing-curve artifacts.
	//
	// Use a SINGLE shared scale for both axes (square band grid), matching the
	// reference implementation. The scale is based on the larger dimension so both
	// axes fit within the band count. The narrower axis won't span all bands.
	const maxDim = Math.max(width, height);
	const clampedBandCount = Math.max(hBandCount, vBandCount); // always equal, but be explicit
	const _f32 = new Float32Array(4);
	_f32[0] = clampedBandCount / maxDim;  // shared bandScale (float32)
	const bandScale = _f32[0];
	_f32[1] = -boundsMinY * bandScale;   // hBandOffset
	_f32[2] = -boundsMinX * bandScale;   // vBandOffset
	const hBandScale  = bandScale;
	const hBandOffset = _f32[1];
	const vBandScale  = bandScale;
	const vBandOffset = _f32[2];

	for (let i = 0; i < curves.length; i++) {
		const [cMinX, cMinY, cMaxX, cMaxY] = curveBounds(curves[i]);

		// Compute band range using the same float32 arithmetic the shader uses.
		// Extend by 1 band on each side as a safety margin: the shader's float32
		// band-index calculation may round differently than the CPU's, placing a
		// pixel in an adjacent band. Without this margin, curves at band boundaries
		// are missing from one side, producing horizontal/vertical line artifacts
		// that shift with the text's screen position.
		const hStart = Math.max(0, Math.floor(cMinY * hBandScale + hBandOffset) - 1);
		const hEnd = Math.min(hBandCount - 1, Math.floor(cMaxY * hBandScale + hBandOffset) + 1);
		for (let b = hStart; b <= hEnd; b++) {
			hBands[b].push(i);
		}

		const vStart = Math.max(0, Math.floor(cMinX * vBandScale + vBandOffset) - 1);
		const vEnd = Math.min(vBandCount - 1, Math.floor(cMaxX * vBandScale + vBandOffset) + 1);
		for (let b = vStart; b <= vEnd; b++) {
			vBands[b].push(i);
		}
	}

	// Sort each band's curve list in descending order of max coordinate.
	// frag.glsl breaks early once max coord drops below the pixel threshold,
	// so the sort order must be descending for the early-exit to be correct.
	for (let b = 0; b < hBandCount; b++) {
		hBands[b].sort((a, b) => {
			const maxXa = Math.max(curves[a].p1x, curves[a].p2x, curves[a].p3x);
			const maxXb = Math.max(curves[b].p1x, curves[b].p2x, curves[b].p3x);
			return maxXb - maxXa;
		});
	}

	for (let b = 0; b < vBandCount; b++) {
		vBands[b].sort((a, b) => {
			const maxYa = Math.max(curves[a].p1y, curves[a].p2y, curves[a].p3y);
			const maxYb = Math.max(curves[b].p1y, curves[b].p2y, curves[b].p3y);
			return maxYb - maxYa;
		});
	}

	return { hBandCount, vBandCount, hBands, vBands };
}
