import type { PathCommand } from 'opentype.js';
import type { SlugGlyphCurve } from './data';

/**
 * Convert a cubic Bezier curve to two quadratic Bezier approximations.
 * This is an approximation — a single cubic can't be exactly represented
 * by one quadratic, so we split at t=0.5 and fit two quadratics.
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
	// Split cubic at t=0.5 using de Casteljau
	const mx01 = (x0 + x1) * 0.5;
	const my01 = (y0 + y1) * 0.5;
	const mx12 = (x1 + x2) * 0.5;
	const my12 = (y1 + y2) * 0.5;
	const mx23 = (x2 + x3) * 0.5;
	const my23 = (y2 + y3) * 0.5;

	const mx012 = (mx01 + mx12) * 0.5;
	const my012 = (my01 + my12) * 0.5;
	const mx123 = (mx12 + mx23) * 0.5;
	const my123 = (my12 + my23) * 0.5;

	const midX = (mx012 + mx123) * 0.5;
	const midY = (my012 + my123) * 0.5;

	// Approximate each cubic half as a quadratic.
	// For a cubic [p0, p1, p2, p3], the best quadratic control point is
	// roughly at (3*(p1+p2) - p0 - p3) / 4, but after splitting we use
	// the midpoints of the cubic control polygon as the quadratic control points.
	return [
		{
			p1x: x0,
			p1y: y0,
			p2x: mx012,
			p2y: my012,
			p3x: midX,
			p3y: midY
		},
		{
			p1x: midX,
			p1y: midY,
			p2x: mx123,
			p2y: my123,
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
function lineToQuadratic(x0: number, y0: number, x1: number, y1: number): SlugGlyphCurve {
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

	for (const cmd of commands) {
		switch (cmd.type) {
			case 'M':
				curX = cmd.x;
				curY = cmd.y;
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
				// Close path — no curve needed
				break;
		}
	}

	return curves;
}
