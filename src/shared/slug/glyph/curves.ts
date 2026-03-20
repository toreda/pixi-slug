import type {PathCommand} from 'opentype.js';
import type {SlugGlyphCurve} from './data';

/**
 * Convert a cubic Bezier curve to two quadratic Bezier approximations.
 * This is an approximation — a single cubic can't be exactly represented
 * by one quadratic, so we split at t=0.5 and fit each half with the
 * best-fit quadratic control point: (3*(p1+p2) - p0 - p3) / 4.
 */
function cubicToQuadratics(
	x0: number,
	y0: number,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	x3: number,
	y3: number
): SlugGlyphCurve[] {
	// Split cubic [x0,x1,x2,x3] at t=0.5 using de Casteljau to get
	// two cubic halves: [x0, q0, r0, mid] and [mid, r1, q2, x3].
	const q0x = (x0 + x1) * 0.5;
	const q0y = (y0 + y1) * 0.5;
	const mx = (x1 + x2) * 0.5;
	const my = (y1 + y2) * 0.5;
	const q2x = (x2 + x3) * 0.5;
	const q2y = (y2 + y3) * 0.5;

	const r0x = (q0x + mx) * 0.5;
	const r0y = (q0y + my) * 0.5;
	const r1x = (mx + q2x) * 0.5;
	const r1y = (my + q2y) * 0.5;

	const midX = (r0x + r1x) * 0.5;
	const midY = (r0y + r1y) * 0.5;

	// Approximate each cubic half as a quadratic using the best-fit formula.
	// For a cubic [a, b, c, d], the optimal quadratic control point is:
	//   q = (3*(b + c) - a - d) / 4
	// First half cubic: [x0, q0, r0, mid]
	const cp1x = (3 * (q0x + r0x) - x0 - midX) * 0.25;
	const cp1y = (3 * (q0y + r0y) - y0 - midY) * 0.25;

	// Second half cubic: [mid, r1, q2, x3]
	const cp2x = (3 * (r1x + q2x) - midX - x3) * 0.25;
	const cp2y = (3 * (r1y + q2y) - midY - y3) * 0.25;

	return [
		{
			p1x: x0,
			p1y: y0,
			p2x: cp1x,
			p2y: cp1y,
			p3x: midX,
			p3y: midY
		},
		{
			p1x: midX,
			p1y: midY,
			p2x: cp2x,
			p2y: cp2y,
			p3x: x3,
			p3y: y3
		}
	];
}

/**
 * Convert a line segment to a degenerate quadratic Bezier curve.
 * The control point is placed at the midpoint so the curve evaluates
 * as a straight line.
 */
export function lineToQuadratic(x0: number, y0: number, x1: number, y1: number): SlugGlyphCurve {
	return {
		p1x: x0,
		p1y: y0,
		p2x: (x0 + x1) * 0.5,
		p2y: (y0 + y1) * 0.5,
		p3x: x1,
		p3y: y1
	};
}

/**
 * Extract quadratic Bezier curves from an opentype.js path command list.
 * Converts lines and cubic Beziers to quadratics so the Slug shader
 * only needs to handle one curve type.
 */
export function slugGlyphCurves(commands: PathCommand[]): SlugGlyphCurve[] {
	const curves: SlugGlyphCurve[] = [];
	let curX = 0;
	let curY = 0;
	let subpathStartX = 0;
	let subpathStartY = 0;

	for (const cmd of commands) {
		switch (cmd.type) {
			case 'M':
				curX = cmd.x;
				curY = cmd.y;
				subpathStartX = cmd.x;
				subpathStartY = cmd.y;
				break;

			case 'L':
				curves.push(lineToQuadratic(curX, curY, cmd.x, cmd.y));
				curX = cmd.x;
				curY = cmd.y;
				break;

			case 'Q':
				curves.push({
					p1x: curX,
					p1y: curY,
					p2x: cmd.x1,
					p2y: cmd.y1,
					p3x: cmd.x,
					p3y: cmd.y
				});
				curX = cmd.x;
				curY = cmd.y;
				break;

			case 'C':
				curves.push(...cubicToQuadratics(curX, curY, cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y));
				curX = cmd.x;
				curY = cmd.y;
				break;

			case 'Z':
				// Close path: add closing line if the current position is not already at the subpath start.
				if (Math.abs(curX - subpathStartX) > 1e-6 || Math.abs(curY - subpathStartY) > 1e-6) {
					curves.push(lineToQuadratic(curX, curY, subpathStartX, subpathStartY));
				}
				curX = subpathStartX;
				curY = subpathStartY;
				break;
		}
	}

	return curves;
}
