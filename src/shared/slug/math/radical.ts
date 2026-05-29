import type {SlugGlyphCurve} from '../glyph/data';
import {lineToQuadratic} from '../glyph/curves';

/**
 * Geometry inputs for a synthesized square-root radical outline.
 *
 * All values are in em-space (the same Y-up coordinate space as font
 * glyph outlines), so the resulting curves can be packed into the
 * shared Slug curve/band textures and rendered by the glyph coverage
 * shader exactly like a font glyph. The caller chooses an em scale
 * (typically the font's `unitsPerEm`) and expresses every dimension in
 * those units.
 *
 * The radical is the familiar check-mark-plus-bar silhouette:
 *
 *     ___________________________________  <- top of vinculum
 *      \                                 |
 *       \           apex                 |
 *        \         /                     |
 *         \       /                       (vinculum, filled rect)
 *          \     /
 *      nib  \   /
 *       \    \ /
 *        \____V                              (deep valley floor)
 *
 * The whole figure is a SINGLE closed contour traced around its
 * perimeter — fill-based, not a centerline stroke — because the Slug
 * coverage model is winding-number fill. The check mark is a stroked
 * polyline whose join at the valley and at the bar is mitred so there
 * are no gaps, and the vinculum is part of the same perimeter so the
 * upstroke→bar corner is one continuous filled region with no seam.
 */
export interface SlugRadicalGeometry {
	/** Total height the radical must span (valley floor to top of bar). */
	height: number;
	/**
	 * Width from the nib's left edge to where the upstroke reaches bar
	 * height. The horizontal vinculum extends further right than this to
	 * cover the radicand — see {@link barRight}.
	 */
	hookWidth: number;
	/** Right end of the vinculum (x of the bar's right edge). */
	barRight: number;
	/** Stroke thickness of every limb (nib, valley walls, upstroke, bar). */
	thickness: number;
}

/**
 * Result of {@link slugRadicalOutline}: the closed-contour curve list
 * plus the em-space bounding box, ready to hand to
 * `SlugFont.registerSynthetic`.
 */
export interface SlugRadicalOutline {
	curves: SlugGlyphCurve[];
	/** One contour, so a single `[0]` start index. */
	contourStarts: number[];
	bounds: {minX: number; minY: number; maxX: number; maxY: number};
}

type Pt = [number, number];

/**
 * Offset a vertex of a polyline by `half` to one side, using the miter
 * (angle-bisector) of its two adjacent edges so the offset edges meet
 * cleanly at corners with no gap or overlap. `prev`→`cur`→`next` are the
 * centerline points; `side` is +1 for the left of travel, -1 for the
 * right. Endpoints (no prev or no next) offset by the single edge normal.
 */
function offsetVertex(prev: Pt | null, cur: Pt, next: Pt | null, half: number, side: number): Pt {
	// Direction into and out of `cur`.
	const inDir = prev ? norm([cur[0] - prev[0], cur[1] - prev[1]]) : null;
	const outDir = next ? norm([next[0] - cur[0], next[1] - cur[1]]) : null;

	// Left normal of a direction (rotate +90°): (dx,dy) → (-dy,dx).
	const nIn = inDir ? ([-inDir[1], inDir[0]] as Pt) : null;
	const nOut = outDir ? ([-outDir[1], outDir[0]] as Pt) : null;

	if (nIn && nOut) {
		// Miter = normalized sum of the two edge normals, scaled by
		// 1/cos(theta/2) so the offset edges actually meet.
		const mx = nIn[0] + nOut[0];
		const my = nIn[1] + nOut[1];
		const mLen = Math.hypot(mx, my);
		if (mLen < 1e-9) {
			// 180° reversal — fall back to the incoming normal.
			return [cur[0] + side * half * nIn[0], cur[1] + side * half * nIn[1]];
		}
		const ux = mx / mLen;
		const uy = my / mLen;
		// cos(half-angle) = dot(miterUnit, edgeNormal).
		const cosHalf = ux * nIn[0] + uy * nIn[1];
		const scale = half / Math.max(Math.abs(cosHalf), 0.2); // clamp miter length
		return [cur[0] + side * scale * ux, cur[1] + side * scale * uy];
	}

	const n = nIn ?? nOut!;
	return [cur[0] + side * half * n[0], cur[1] + side * half * n[1]];
}

function norm(v: Pt): Pt {
	const len = Math.hypot(v[0], v[1]) || 1;
	return [v[0] / len, v[1] / len];
}

/**
 * Build the filled outline of a square-root radical sign as a closed
 * contour of degenerate-quadratic curves (straight segments with the
 * control point at the midpoint, matching how font line segments are
 * stored — see {@link lineToQuadratic}).
 *
 * Coordinate space is em-space, Y-up. The valley floor sits at `y = 0`;
 * the top of the vinculum sits at `y = height`. Positive X runs
 * left→right. The returned outline is translated so its bounding box
 * starts at the origin.
 *
 * The proportions (nib width/height, valley depth, upstroke slope) are
 * expressed as fractions of the inputs so the radical keeps its shape
 * at any height — the resolution-independence comes from rendering
 * through the Slug shader, but the *shape* staying constant across
 * sizes is this function's job.
 */
export function slugRadicalOutline(geom: SlugRadicalGeometry): SlugRadicalOutline {
	const {height, hookWidth, barRight, thickness} = geom;
	const half = thickness * 0.5;

	// ONE centerline for the whole radical, traced left→right (Y-up):
	//   S  nib's upper-left shoulder
	//   V  deep valley floor
	//   A  upstroke apex (meets the bar)
	//   B  right end of the vinculum
	// The bar is the final, horizontal limb of this same polyline — NOT a
	// separate rectangle. Stroking one polyline yields one closed contour
	// with no self-overlap, so the winding-number fill can never cancel at
	// a junction (the earlier two-contour version left a notch exactly
	// because the overlapping bar's winding subtracted from the check's).
	const nibW = hookWidth * 0.26;
	const valleyX = nibW;
	const apexX = hookWidth;

	const valleyY = 0; // figure bottom
	const shoulderY = height * 0.5; // nib begins halfway up
	// The bar sits at the top; its centerline runs at `height - half` so
	// the stroked top edge lands exactly at `y = height`.
	const barCenterY = height - half;

	const S: Pt = [0, shoulderY];
	const V: Pt = [valleyX, valleyY];
	const A: Pt = [apexX, barCenterY];
	const B: Pt = [barRight, barCenterY];
	const centerline: Pt[] = [S, V, A, B];

	// Stroke the centerline into a single closed outline: walk the LEFT
	// offsets forward (S→V→A→B), then the RIGHT offsets backward
	// (B→A→V→S). Mitred joins close the valley tip and the upstroke→bar
	// corner with no gaps and no overlap.
	const left: Pt[] = [];
	const right: Pt[] = [];
	for (let i = 0; i < centerline.length; i++) {
		const prev = i > 0 ? centerline[i - 1] : null;
		const next = i < centerline.length - 1 ? centerline[i + 1] : null;
		left.push(offsetVertex(prev, centerline[i], next, half, +1));
		right.push(offsetVertex(prev, centerline[i], next, half, -1));
	}

	const perimeter: Pt[] = [...left, ...right.slice().reverse()];

	// Emit as ONE contour.
	const curves: SlugGlyphCurve[] = [];
	const contourStarts: number[] = [0];
	pushContour(curves, perimeter);

	// Bounds over every control point.
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const c of curves) {
		minX = Math.min(minX, c.p1x, c.p2x, c.p3x);
		minY = Math.min(minY, c.p1y, c.p2y, c.p3y);
		maxX = Math.max(maxX, c.p1x, c.p2x, c.p3x);
		maxY = Math.max(maxY, c.p1y, c.p2y, c.p3y);
	}

	// Normalize the bounding box to the origin so the caller can map
	// `[0..width] × [0..height]` directly onto a destination rect.
	const shiftX = -minX;
	const shiftY = -minY;
	if (shiftX !== 0 || shiftY !== 0) {
		for (const c of curves) {
			c.p1x += shiftX;
			c.p1y += shiftY;
			c.p2x += shiftX;
			c.p2y += shiftY;
			c.p3x += shiftX;
			c.p3y += shiftY;
		}
	}

	return {
		curves,
		contourStarts,
		bounds: {minX: 0, minY: 0, maxX: maxX - minX, maxY: maxY - minY}
	};
}

/** Append the closed edges of a polygon as degenerate-quadratic curves. */
function pushContour(curves: SlugGlyphCurve[], poly: Pt[]): void {
	for (let i = 0; i < poly.length; i++) {
		const [x0, y0] = poly[i];
		const [x1, y1] = poly[(i + 1) % poly.length];
		curves.push(lineToQuadratic(x0, y0, x1, y1));
	}
}
