import {Defaults} from '../../../defaults';
import {slugTextureFloat16Round} from '../texture/float16/round';
import type {SlugGlyphCurve} from './data';

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
 * Control points of one curve after rounding to the precision stored in
 * the curve texture (float16). Reused across calls to avoid allocation.
 */
const _q = {p1x: 0, p1y: 0, p2x: 0, p2y: 0, p3x: 0, p3y: 0};

function quantize(curve: SlugGlyphCurve): void {
	_q.p1x = slugTextureFloat16Round(curve.p1x);
	_q.p1y = slugTextureFloat16Round(curve.p1y);
	_q.p2x = slugTextureFloat16Round(curve.p2x);
	_q.p2y = slugTextureFloat16Round(curve.p2y);
	_q.p3x = slugTextureFloat16Round(curve.p3x);
	_q.p3y = slugTextureFloat16Round(curve.p3y);
}

/**
 * Compute the axis-aligned bounding box of a quadratic Bezier curve.
 * Returns [minX, minY, maxX, maxY].
 *
 * Uses the float16-rounded coordinates in `_q` (populated by `quantize`)
 * so the bounds match what the GPU sees in the curve texture (see
 * port_risks.md JS-1). Without this, a curve whose float64 bounds barely
 * reach into band N might not reach it after quantization, causing the
 * shader to miss the curve at that band boundary.
 */
function curveBounds(): [number, number, number, number] {
	const p1x = _q.p1x,
		p1y = _q.p1y;
	const p2x = _q.p2x,
		p2y = _q.p2y;
	const p3x = _q.p3x,
		p3y = _q.p3y;

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
 *
 * Two rules from the reference Slug implementation keep the per-pixel
 * curve loop short:
 *
 *  - Bands overlap by a small epsilon (`Defaults.BAND_EPSILON_EM`,
 *    expressed in em and scaled by `unitsPerEm`) instead of a whole
 *    neighbouring band on each side. The epsilon is orders of magnitude
 *    larger than the float32 disagreement between the CPU band
 *    assignment and the shader's band-index arithmetic, which is the
 *    only thing the overlap has to absorb.
 *  - A straight horizontal line can never cross a horizontal ray, and a
 *    straight vertical line can never cross a vertical ray, so those
 *    curves are left out of the band for the axis they are parallel to.
 *    They still appear in the other axis's bands.
 *
 * @param curves		Quadratic curves in font units.
 * @param boundsMinX	Glyph bounding box in font units.
 * @param boundsMinY	Glyph bounding box in font units.
 * @param boundsMaxX	Glyph bounding box in font units.
 * @param boundsMaxY	Glyph bounding box in font units.
 * @param bandCount		Maximum bands per axis.
 * @param unitsPerEm	Font units per em; scales the band overlap epsilon.
 */
export function slugGlyphBands(
	curves: SlugGlyphCurve[],
	boundsMinX: number,
	boundsMinY: number,
	boundsMaxX: number,
	boundsMaxY: number,
	bandCount: number = Defaults.BAND_COUNT,
	unitsPerEm: number = Defaults.BAND_EPSILON_UNITS_PER_EM
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
	_f32[0] = clampedBandCount / maxDim; // shared bandScale (float32)
	const bandScale = _f32[0];
	_f32[1] = -boundsMinY * bandScale; // hBandOffset
	_f32[2] = -boundsMinX * bandScale; // vBandOffset
	const hBandScale = bandScale;
	const hBandOffset = _f32[1];
	const vBandScale = bandScale;
	const vBandOffset = _f32[2];

	// Band overlap in font units.
	const epsilon = unitsPerEm * Defaults.BAND_EPSILON_EM;

	// Per-curve max coordinates (quantized) for the descending sort below.
	const maxXs = new Float64Array(curves.length);
	const maxYs = new Float64Array(curves.length);

	for (let i = 0; i < curves.length; i++) {
		quantize(curves[i]);
		const [cMinX, cMinY, cMaxX, cMaxY] = curveBounds();
		maxXs[i] = Math.max(_q.p1x, _q.p2x, _q.p3x);
		maxYs[i] = Math.max(_q.p1y, _q.p2y, _q.p3y);

		const horizontalLine = _q.p1y === _q.p2y && _q.p2y === _q.p3y;
		const verticalLine = _q.p1x === _q.p2x && _q.p2x === _q.p3x;

		if (!horizontalLine) {
			const hStart = Math.max(0, Math.floor((cMinY - epsilon) * hBandScale + hBandOffset));
			const hEnd = Math.min(hBandCount - 1, Math.floor((cMaxY + epsilon) * hBandScale + hBandOffset));
			for (let b = hStart; b <= hEnd; b++) {
				hBands[b].push(i);
			}
		}

		if (!verticalLine) {
			const vStart = Math.max(0, Math.floor((cMinX - epsilon) * vBandScale + vBandOffset));
			const vEnd = Math.min(vBandCount - 1, Math.floor((cMaxX + epsilon) * vBandScale + vBandOffset));
			for (let b = vStart; b <= vEnd; b++) {
				vBands[b].push(i);
			}
		}
	}

	// Sort each band's curve list in descending order of max coordinate.
	// frag.glsl breaks early once max coord drops below the pixel threshold,
	// so the sort order must be descending for the early-exit to be correct.
	for (let b = 0; b < hBandCount; b++) {
		hBands[b].sort((a, c) => maxXs[c] - maxXs[a]);
	}

	for (let b = 0; b < vBandCount; b++) {
		vBands[b].sort((a, c) => maxYs[c] - maxYs[a]);
	}

	return {hBandCount, vBandCount, hBands, vBands};
}
