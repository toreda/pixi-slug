import type {SlugGlyphCurve} from '../glyph/data';
import {lineToQuadratic} from '../glyph/curves';

/**
 * Synthesized stretchy fence (delimiter) outlines: the `[ ]`, `( )`,
 * `{ }` and `| |` pairs that wrap a matrix / large expression.
 *
 * Like the square-root radical (see {@link slugRadicalOutline}) these are
 * SYNTHESIZED Slug outlines rendered through the glyph coverage shader —
 * NOT scaled-up font glyphs. A scaled font `[` stretches its stroke weight
 * along with its height (a 4× tall bracket has a 4× thick stem) and is
 * capped by whatever height the single font glyph was designed for; it can
 * never produce the thin, tall delimiter an n×n matrix needs. A
 * synthesized outline keeps a constant stroke thickness while its height
 * grows arbitrarily, and — being one filled contour rendered by the same
 * coverage model as font glyphs — stays resolution-independent and scales
 * in lockstep with the surrounding text.
 *
 * Coordinate space matches {@link slugRadicalOutline}: em-space, Y-up,
 * positive X left→right. Every outline is traced as one (or, for `=`-style
 * shapes, a small fixed number of) closed contour(s) of degenerate-
 * quadratic line segments and real quadratic curves, then normalized so
 * its bounding box starts at the origin. The result is handed straight to
 * `SlugFont.registerSynthetic`.
 *
 * Each builder returns the LEFT member of the pair drawn so its open side
 * faces RIGHT (toward the bracketed content). The matrix container mirrors
 * the same outline horizontally for the right member, so a single
 * registered glyph + an X-flip in the destination rect covers both sides
 * and the pair is guaranteed symmetric.
 */

export type FenceShape = 'paren' | 'bracket' | 'brace' | 'abs';

export interface SlugFenceGeometry {
	/** Total height the fence must span (Y from 0 to `height`). */
	height: number;
	/** Overall fence width (X from 0 to `width`). */
	width: number;
	/** Stroke thickness of the limbs. */
	thickness: number;
}

export interface SlugFenceOutline {
	curves: SlugGlyphCurve[];
	/** One start index per closed contour. */
	contourStarts: number[];
	bounds: {minX: number; minY: number; maxX: number; maxY: number};
}

type Pt = [number, number];

/**
 * Build the filled outline of one stretchy LEFT fence (`[`, `(`, `{` or
 * `|`) opening toward +X. See the module doc for the coordinate
 * conventions and why these are synthesized rather than scaled glyphs.
 *
 * The returned outline is normalized so its bounding box starts at the
 * origin (`minX === 0`, `minY === 0`), so the caller can map
 * `[0..maxX] × [0..maxY]` directly onto a destination rect.
 */
export function slugFenceOutline(shape: FenceShape, geom: SlugFenceGeometry): SlugFenceOutline {
	const contours = buildContours(shape, geom);

	const curves: SlugGlyphCurve[] = [];
	const contourStarts: number[] = [];
	for (const poly of contours) {
		contourStarts.push(curves.length);
		pushPolyline(curves, poly);
	}

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

/**
 * Trace each shape's filled silhouette as a list of closed polylines
 * (`Pt[]`). The bracket/abs are straight-line outlines; the paren/brace
 * approximate their bowls with quadratic samples flattened into the same
 * polyline (so a single {@link pushPolyline} closes them). Wound so the
 * fill is solid (non-zero winding); the Slug coverage model handles either
 * orientation, so we don't fuss over CW vs CCW.
 */
function buildContours(shape: FenceShape, geom: SlugFenceGeometry): Pt[][] {
	switch (shape) {
		case 'abs':
			return [buildAbs(geom)];
		case 'bracket':
			return [buildBracket(geom)];
		case 'paren':
			return [buildParen(geom)];
		case 'brace':
			return [buildBrace(geom)];
	}
}

/** Vertical bar `|`: a simple filled rectangle the full height. */
function buildAbs(geom: SlugFenceGeometry): Pt[] {
	const {height, thickness} = geom;
	const t = thickness;
	return [
		[0, 0],
		[t, 0],
		[t, height],
		[0, height]
	];
}

/**
 * Square bracket `[`: a vertical stem with top and bottom serifs jutting
 * right. Traced as the outer perimeter of the `[` silhouette. `arm` is the
 * serif's horizontal reach; `t` the stroke thickness shared by stem and
 * serifs.
 */
function buildBracket(geom: SlugFenceGeometry): Pt[] {
	const {height, width, thickness} = geom;
	const t = thickness;
	const arm = width; // serif reaches the full requested width
	const top = height;
	// Perimeter clockwise from bottom-left:
	//   up the left edge, right across the top serif, down its inner edge,
	//   left to the stem's inner edge, down the stem inner edge, right
	//   across the bottom serif inner edge, down, left back to start.
	return [
		[0, 0], // bottom-left outer
		[arm, 0], // bottom serif outer right
		[arm, t], // bottom serif inner right
		[t, t], // stem inner, bottom
		[t, top - t], // stem inner, top
		[arm, top - t], // top serif inner right
		[arm, top], // top serif outer right
		[0, top] // top-left outer
	];
}

/**
 * Round parenthesis `(`: a crescent between an outer and an inner arc,
 * both bulging LEFT (away from +X). Sampled into a polyline: down the
 * outer arc, then back up the inner arc. The two arcs share top/bottom
 * endpoints so the crescent is a single closed contour.
 */
function buildParen(geom: SlugFenceGeometry): Pt[] {
	const {height, width, thickness} = geom;
	const t = thickness;
	// Outer arc: top opening → belly (apex at x≈0) → bottom opening. The
	// openings sit at x = width (right edge). A quadratic's apex is the
	// midpoint of its endpoints and control point, so to land the apex at a
	// target x with both endpoints at `width` the control must OVERSHOOT to
	// `2·targetX − width` — otherwise the belly only reaches width/2 and the
	// paren looks like a shallow dent (apexCtrl below).
	const outerTop: Pt = [width, height];
	const outerCtrl: Pt = [apexCtrl(0, width), height / 2]; // belly apex at x=0
	const outerBot: Pt = [width, 0];
	// Inner arc: thinner crescent, belly apex at x = t.
	const innerCtrl: Pt = [apexCtrl(t, width), height / 2];

	const SAMPLES = 12;
	const poly: Pt[] = [];
	// Outer arc top→bottom.
	for (let i = 0; i <= SAMPLES; i++) {
		poly.push(quadAt(outerTop, outerCtrl, outerBot, i / SAMPLES));
	}
	// Inner arc bottom→top (closes the crescent).
	for (let i = 0; i <= SAMPLES; i++) {
		poly.push(quadAt(outerBot, innerCtrl, outerTop, i / SAMPLES));
	}
	return poly;
}

/**
 * Control-point x that makes a quadratic Bezier with both endpoints at
 * `endX` reach its apex (at u=0.5) exactly at `targetX`. The apex of a
 * quadratic is `0.25·p0 + 0.5·ctrl + 0.25·p2`; with `p0 = p2 = endX` that
 * is `0.5·endX + 0.5·ctrl`, so `ctrl = 2·targetX − endX`.
 */
function apexCtrl(targetX: number, endX: number): number {
	return 2 * targetX - endX;
}

/**
 * Curly brace `{`: a constant-thickness CENTERLINE stroked into a filled
 * outline (the same technique the sqrt radical uses), rather than an
 * outer/inner arc pair. The centerline traces the classic `{` spine:
 *
 *     top tip (right) → upper arm bows LEFT → mid beak (leftmost) →
 *     lower arm bows LEFT → bottom tip (right)
 *
 * The two arms are concave toward the content (they curl back to the
 * right at top/bottom) and the beak juts furthest left at the middle —
 * the feature that distinguishes a brace from a parenthesis. Stroking a
 * single centerline keeps a uniform limb thickness as the brace stretches
 * (a paren-style outer/inner pair would taper to points at the tips and
 * read as a `(`).
 */
function buildBrace(geom: SlugFenceGeometry): Pt[] {
	const {height, width, thickness} = geom;
	const half = thickness * 0.5;
	const w = width;
	const cy = height / 2;
	// Beak sits a touch right of the far-left edge so the stroke's outer
	// side still reaches x≈0.
	const beakX = half;
	const topTip: Pt = [w, height];
	const beak: Pt = [beakX, cy];
	const botTip: Pt = [w, 0];

	// Each arm is built from TWO quadratic segments around a quarter-height
	// shoulder so the arm is S-shaped (convex shoulder near the tip, concave
	// throat near the beak) — the brace profile. A single quadratic per arm
	// would be a near-straight diagonal and read as an angle bracket ⟨ ⟩.
	// The shoulder bulges right (toward the content) at x≈w; the throat
	// pulls left toward the beak.
	const upShoulder: Pt = [w * 0.5, height * 0.78];
	const upThroat: Pt = [w * 0.18, height * 0.6];
	const upShoulderCtrl: Pt = [w, height * 0.92];
	const upThroatCtrl: Pt = [beakX, height * 0.66];
	const loThroat: Pt = [w * 0.18, height * 0.4];
	const loShoulder: Pt = [w * 0.5, height * 0.22];
	const loThroatCtrl: Pt = [beakX, height * 0.34];
	const loShoulderCtrl: Pt = [w, height * 0.08];

	const SAMPLES = 8;
	const centerline: Pt[] = [];
	// Upper arm: tip → shoulder → throat → beak.
	for (let i = 0; i <= SAMPLES; i++) centerline.push(quadAt(topTip, upShoulderCtrl, upShoulder, i / SAMPLES));
	for (let i = 1; i <= SAMPLES; i++) centerline.push(quadAt(upShoulder, upThroatCtrl, upThroat, i / SAMPLES));
	for (let i = 1; i <= SAMPLES; i++) centerline.push(quadAt(upThroat, [beakX, height * 0.55], beak, i / SAMPLES));
	// Lower arm: beak → throat → shoulder → tip (mirror of the upper arm).
	for (let i = 1; i <= SAMPLES; i++) centerline.push(quadAt(beak, [beakX, height * 0.45], loThroat, i / SAMPLES));
	for (let i = 1; i <= SAMPLES; i++) centerline.push(quadAt(loThroat, loThroatCtrl, loShoulder, i / SAMPLES));
	for (let i = 1; i <= SAMPLES; i++) centerline.push(quadAt(loShoulder, loShoulderCtrl, botTip, i / SAMPLES));

	return strokeCenterline(centerline, half);
}

/**
 * Stroke an open polyline centerline into a closed filled perimeter of
 * uniform half-width `half`, using mitred joins so corners meet cleanly.
 * Walks the left offsets forward then the right offsets back — the same
 * approach as the sqrt radical's outline builder.
 */
function strokeCenterline(centerline: Pt[], half: number): Pt[] {
	const left: Pt[] = [];
	const right: Pt[] = [];
	for (let i = 0; i < centerline.length; i++) {
		const prev = i > 0 ? centerline[i - 1] : null;
		const next = i < centerline.length - 1 ? centerline[i + 1] : null;
		left.push(offsetVertex(prev, centerline[i], next, half, +1));
		right.push(offsetVertex(prev, centerline[i], next, half, -1));
	}
	return [...left, ...right.slice().reverse()];
}

/**
 * Offset a polyline vertex by `half` along the miter (angle-bisector) of
 * its two adjacent edges so offset edges meet cleanly at corners. `side`
 * is +1 for the left of travel, -1 for the right; endpoints offset by the
 * single edge normal. Mirrors the radical builder's offset routine.
 */
function offsetVertex(prev: Pt | null, cur: Pt, next: Pt | null, half: number, side: number): Pt {
	const inDir = prev ? norm([cur[0] - prev[0], cur[1] - prev[1]]) : null;
	const outDir = next ? norm([next[0] - cur[0], next[1] - cur[1]]) : null;
	const nIn = inDir ? ([-inDir[1], inDir[0]] as Pt) : null;
	const nOut = outDir ? ([-outDir[1], outDir[0]] as Pt) : null;

	if (nIn && nOut) {
		const mx = nIn[0] + nOut[0];
		const my = nIn[1] + nOut[1];
		const mLen = Math.hypot(mx, my);
		if (mLen < 1e-9) {
			return [cur[0] + side * half * nIn[0], cur[1] + side * half * nIn[1]];
		}
		const ux = mx / mLen;
		const uy = my / mLen;
		const cosHalf = ux * nIn[0] + uy * nIn[1];
		const scale = half / Math.max(Math.abs(cosHalf), 0.2);
		return [cur[0] + side * scale * ux, cur[1] + side * scale * uy];
	}
	const n = nIn ?? nOut!;
	return [cur[0] + side * half * n[0], cur[1] + side * half * n[1]];
}

function norm(v: Pt): Pt {
	const len = Math.hypot(v[0], v[1]) || 1;
	return [v[0] / len, v[1] / len];
}

/** Evaluate a quadratic Bezier at parameter `u` ∈ [0,1]. */
function quadAt(p0: Pt, p1: Pt, p2: Pt, u: number): Pt {
	const v = 1 - u;
	const x = v * v * p0[0] + 2 * v * u * p1[0] + u * u * p2[0];
	const y = v * v * p0[1] + 2 * v * u * p1[1] + u * u * p2[1];
	return [x, y];
}

/** Append the closed edges of a polygon as degenerate-quadratic curves. */
function pushPolyline(curves: SlugGlyphCurve[], poly: Pt[]): void {
	for (let i = 0; i < poly.length; i++) {
		const [x0, y0] = poly[i];
		const [x1, y1] = poly[(i + 1) % poly.length];
		curves.push(lineToQuadratic(x0, y0, x1, y1));
	}
}
