import { lineToQuadratic, slugGlyphCurves } from '../../../../src/shared/slug/glyph/curves';
import type { PathCommand } from 'opentype.js';

// ============================================================
// lineToQuadratic
// ============================================================

describe('lineToQuadratic', () => {
	it('should place control point at midpoint of a horizontal line', () => {
		const c = lineToQuadratic(0, 0, 10, 0);
		expect(c.p1x).toBe(0);
		expect(c.p1y).toBe(0);
		expect(c.p2x).toBe(5);
		expect(c.p2y).toBe(0);
		expect(c.p3x).toBe(10);
		expect(c.p3y).toBe(0);
	});

	it('should place control point at midpoint of a vertical line', () => {
		const c = lineToQuadratic(0, 0, 0, 20);
		expect(c.p1x).toBe(0);
		expect(c.p1y).toBe(0);
		expect(c.p2x).toBe(0);
		expect(c.p2y).toBe(10);
		expect(c.p3x).toBe(0);
		expect(c.p3y).toBe(20);
	});

	it('should place control point at midpoint of a diagonal line', () => {
		const c = lineToQuadratic(2, 3, 8, 15);
		expect(c.p1x).toBe(2);
		expect(c.p1y).toBe(3);
		expect(c.p2x).toBe(5);
		expect(c.p2y).toBe(9);
		expect(c.p3x).toBe(8);
		expect(c.p3y).toBe(15);
	});

	it('should handle negative coordinates', () => {
		const c = lineToQuadratic(-10, -20, -4, -8);
		expect(c.p1x).toBe(-10);
		expect(c.p1y).toBe(-20);
		expect(c.p2x).toBe(-7);
		expect(c.p2y).toBe(-14);
		expect(c.p3x).toBe(-4);
		expect(c.p3y).toBe(-8);
	});

	it('should handle zero-length line (point)', () => {
		const c = lineToQuadratic(5, 5, 5, 5);
		expect(c.p1x).toBe(5);
		expect(c.p1y).toBe(5);
		expect(c.p2x).toBe(5);
		expect(c.p2y).toBe(5);
		expect(c.p3x).toBe(5);
		expect(c.p3y).toBe(5);
	});

	it('should handle very large coordinates', () => {
		const c = lineToQuadratic(0, 0, 1e6, 1e6);
		expect(c.p2x).toBe(5e5);
		expect(c.p2y).toBe(5e5);
	});

	it('should handle fractional coordinates', () => {
		const c = lineToQuadratic(0.1, 0.2, 0.3, 0.4);
		expect(c.p2x).toBeCloseTo(0.2);
		expect(c.p2y).toBeCloseTo(0.3);
	});

	it('should produce a collinear result (control point on the line)', () => {
		const c = lineToQuadratic(0, 0, 6, 12);
		// For a degenerate quadratic, the control point must lie on
		// the line from p1 to p3. Check via cross product ≈ 0.
		const cross = (c.p2x - c.p1x) * (c.p3y - c.p1y) - (c.p2y - c.p1y) * (c.p3x - c.p1x);
		expect(cross).toBeCloseTo(0);
	});
});

// ============================================================
// slugGlyphCurves
// ============================================================

describe('slugGlyphCurves', () => {
	// ---- Empty / trivial inputs ----

	describe('empty and trivial inputs', () => {
		it('should return empty array for empty commands', () => {
			expect(slugGlyphCurves([])).toEqual([]);
		});

		it('should return empty array for move-only path', () => {
			const commands: PathCommand[] = [{ type: 'M', x: 0, y: 0 }];
			expect(slugGlyphCurves(commands)).toEqual([]);
		});

		it('should return empty array for multiple consecutive moves', () => {
			const commands: PathCommand[] = [
				{ type: 'M', x: 0, y: 0 },
				{ type: 'M', x: 10, y: 10 },
				{ type: 'M', x: 20, y: 20 }
			];
			expect(slugGlyphCurves(commands)).toEqual([]);
		});
	});

	// ---- Line commands ----

	describe('line commands', () => {
		it('should convert a single line to a degenerate quadratic', () => {
			const commands: PathCommand[] = [
				{ type: 'M', x: 0, y: 0 },
				{ type: 'L', x: 10, y: 0 }
			];
			const curves = slugGlyphCurves(commands);
			expect(curves).toHaveLength(1);
			expect(curves[0].p1x).toBe(0);
			expect(curves[0].p1y).toBe(0);
			expect(curves[0].p2x).toBe(5);
			expect(curves[0].p2y).toBe(0);
			expect(curves[0].p3x).toBe(10);
			expect(curves[0].p3y).toBe(0);
		});

		it('should chain multiple lines preserving continuity', () => {
			const commands: PathCommand[] = [
				{ type: 'M', x: 0, y: 0 },
				{ type: 'L', x: 10, y: 0 },
				{ type: 'L', x: 10, y: 10 }
			];
			const curves = slugGlyphCurves(commands);
			expect(curves).toHaveLength(2);
			// First line
			expect(curves[0].p1x).toBe(0);
			expect(curves[0].p3x).toBe(10);
			expect(curves[0].p3y).toBe(0);
			// Second line starts where first ended
			expect(curves[1].p1x).toBe(10);
			expect(curves[1].p1y).toBe(0);
			expect(curves[1].p3x).toBe(10);
			expect(curves[1].p3y).toBe(10);
		});
	});

	// ---- Quadratic commands ----

	describe('quadratic commands', () => {
		it('should pass through a quadratic command unchanged', () => {
			const commands: PathCommand[] = [
				{ type: 'M', x: 0, y: 0 },
				{ type: 'Q', x1: 5, y1: 10, x: 10, y: 0 }
			];
			const curves = slugGlyphCurves(commands);
			expect(curves).toHaveLength(1);
			expect(curves[0]).toEqual({
				p1x: 0, p1y: 0,
				p2x: 5, p2y: 10,
				p3x: 10, p3y: 0
			});
		});

		it('should chain multiple quadratics preserving continuity', () => {
			const commands: PathCommand[] = [
				{ type: 'M', x: 0, y: 0 },
				{ type: 'Q', x1: 5, y1: 10, x: 10, y: 0 },
				{ type: 'Q', x1: 15, y1: -10, x: 20, y: 0 }
			];
			const curves = slugGlyphCurves(commands);
			expect(curves).toHaveLength(2);
			expect(curves[0].p3x).toBe(10);
			expect(curves[1].p1x).toBe(10);
			expect(curves[1].p1y).toBe(0);
			expect(curves[1].p2x).toBe(15);
			expect(curves[1].p2y).toBe(-10);
			expect(curves[1].p3x).toBe(20);
		});
	});

	// ---- Cubic commands ----

	describe('cubic commands', () => {
		it('should split a cubic into two quadratics', () => {
			const commands: PathCommand[] = [
				{ type: 'M', x: 0, y: 0 },
				{ type: 'C', x1: 3, y1: 10, x2: 7, y2: 10, x: 10, y: 0 }
			];
			const curves = slugGlyphCurves(commands);
			expect(curves).toHaveLength(2);
		});

		it('should preserve start and end points of a cubic', () => {
			const commands: PathCommand[] = [
				{ type: 'M', x: 100, y: 200 },
				{ type: 'C', x1: 130, y1: 260, x2: 170, y2: 260, x: 200, y: 200 }
			];
			const curves = slugGlyphCurves(commands);
			expect(curves[0].p1x).toBe(100);
			expect(curves[0].p1y).toBe(200);
			expect(curves[1].p3x).toBe(200);
			expect(curves[1].p3y).toBe(200);
		});

		it('should produce continuous curves from a cubic (first end = second start)', () => {
			const commands: PathCommand[] = [
				{ type: 'M', x: 0, y: 0 },
				{ type: 'C', x1: 10, y1: 30, x2: 20, y2: 30, x: 30, y: 0 }
			];
			const curves = slugGlyphCurves(commands);
			expect(curves[0].p3x).toBe(curves[1].p1x);
			expect(curves[0].p3y).toBe(curves[1].p1y);
		});

		it('should produce midpoint at t=0.5 of original cubic', () => {
			// For a cubic [0,0] [0,40] [40,40] [40,0], the midpoint at t=0.5
			// is computed via de Casteljau: (20, 30)
			const commands: PathCommand[] = [
				{ type: 'M', x: 0, y: 0 },
				{ type: 'C', x1: 0, y1: 40, x2: 40, y2: 40, x: 40, y: 0 }
			];
			const curves = slugGlyphCurves(commands);
			// The split point is the endpoint of first / start of second
			expect(curves[0].p3x).toBeCloseTo(20);
			expect(curves[0].p3y).toBeCloseTo(30);
		});

		it('should handle a straight-line cubic (all points collinear)', () => {
			const commands: PathCommand[] = [
				{ type: 'M', x: 0, y: 0 },
				{ type: 'C', x1: 3, y1: 0, x2: 7, y2: 0, x: 10, y: 0 }
			];
			const curves = slugGlyphCurves(commands);
			expect(curves).toHaveLength(2);
			// Both quadratic halves should remain collinear (y=0 for all points)
			expect(curves[0].p1y).toBe(0);
			expect(curves[0].p2y).toBeCloseTo(0);
			expect(curves[0].p3y).toBeCloseTo(0);
			expect(curves[1].p1y).toBeCloseTo(0);
			expect(curves[1].p2y).toBeCloseTo(0);
			expect(curves[1].p3y).toBe(0);
		});

		it('should handle a cubic with coincident control points', () => {
			const commands: PathCommand[] = [
				{ type: 'M', x: 0, y: 0 },
				{ type: 'C', x1: 5, y1: 5, x2: 5, y2: 5, x: 10, y: 0 }
			];
			const curves = slugGlyphCurves(commands);
			expect(curves).toHaveLength(2);
			expect(curves[0].p1x).toBe(0);
			expect(curves[1].p3x).toBe(10);
		});
	});

	// ---- Close path (Z) ----

	describe('close path', () => {
		it('should add a closing line when position differs from subpath start', () => {
			const commands: PathCommand[] = [
				{ type: 'M', x: 0, y: 0 },
				{ type: 'L', x: 10, y: 0 },
				{ type: 'L', x: 10, y: 10 },
				{ type: 'Z' }
			];
			const curves = slugGlyphCurves(commands);
			// Two explicit lines + one closing line back to origin
			expect(curves).toHaveLength(3);
			expect(curves[2].p1x).toBe(10);
			expect(curves[2].p1y).toBe(10);
			expect(curves[2].p3x).toBe(0);
			expect(curves[2].p3y).toBe(0);
		});

		it('should not add a closing line when already at subpath start', () => {
			const commands: PathCommand[] = [
				{ type: 'M', x: 0, y: 0 },
				{ type: 'L', x: 10, y: 0 },
				{ type: 'L', x: 0, y: 0 },
				{ type: 'Z' }
			];
			const curves = slugGlyphCurves(commands);
			// Two explicit lines, no closing line needed
			expect(curves).toHaveLength(2);
		});

		it('should reset current position to subpath start after close', () => {
			const commands: PathCommand[] = [
				{ type: 'M', x: 0, y: 0 },
				{ type: 'L', x: 10, y: 0 },
				{ type: 'Z' },
				{ type: 'L', x: 5, y: 5 }
			];
			const curves = slugGlyphCurves(commands);
			// First line + close line (10,0 -> 0,0) + line from origin to 5,5
			expect(curves).toHaveLength(3);
			// The line after Z should start at (0,0)
			expect(curves[2].p1x).toBe(0);
			expect(curves[2].p1y).toBe(0);
			expect(curves[2].p3x).toBe(5);
			expect(curves[2].p3y).toBe(5);
		});

		it('should handle Z immediately after M (no curves added)', () => {
			const commands: PathCommand[] = [
				{ type: 'M', x: 5, y: 5 },
				{ type: 'Z' }
			];
			const curves = slugGlyphCurves(commands);
			expect(curves).toHaveLength(0);
		});
	});

	// ---- Multiple subpaths ----

	describe('multiple subpaths', () => {
		it('should handle two separate subpaths', () => {
			const commands: PathCommand[] = [
				{ type: 'M', x: 0, y: 0 },
				{ type: 'L', x: 10, y: 0 },
				{ type: 'L', x: 10, y: 10 },
				{ type: 'Z' },
				{ type: 'M', x: 20, y: 20 },
				{ type: 'L', x: 30, y: 20 },
				{ type: 'Z' }
			];
			const curves = slugGlyphCurves(commands);
			// First subpath: 2 lines + 1 close = 3
			// Second subpath: 1 line + 1 close = 2
			expect(curves).toHaveLength(5);
			// Second subpath starts at (20,20)
			expect(curves[3].p1x).toBe(20);
			expect(curves[3].p1y).toBe(20);
		});

		it('should track subpath start independently per M command', () => {
			const commands: PathCommand[] = [
				{ type: 'M', x: 100, y: 100 },
				{ type: 'L', x: 200, y: 100 },
				{ type: 'M', x: 300, y: 300 },
				{ type: 'L', x: 400, y: 300 },
				{ type: 'Z' }
			];
			const curves = slugGlyphCurves(commands);
			// First line: (100,100)->(200,100), no close
			// Second line: (300,300)->(400,300), close back to (300,300)
			expect(curves).toHaveLength(3);
			// Close line goes back to second M, not first
			expect(curves[2].p3x).toBe(300);
			expect(curves[2].p3y).toBe(300);
		});
	});

	// ---- Mixed command types ----

	describe('mixed command types', () => {
		it('should handle L, Q, C in sequence', () => {
			const commands: PathCommand[] = [
				{ type: 'M', x: 0, y: 0 },
				{ type: 'L', x: 10, y: 0 },
				{ type: 'Q', x1: 15, y1: 5, x: 20, y: 0 },
				{ type: 'C', x1: 23, y1: 10, x2: 27, y2: 10, x: 30, y: 0 }
			];
			const curves = slugGlyphCurves(commands);
			// 1 line + 1 quadratic + 2 from cubic = 4
			expect(curves).toHaveLength(4);
			// Verify chain continuity
			expect(curves[0].p3x).toBe(curves[1].p1x);
			expect(curves[1].p3x).toBe(curves[2].p1x);
			expect(curves[2].p3x).toBe(curves[3].p1x);
		});

		it('should maintain continuity across all command types', () => {
			const commands: PathCommand[] = [
				{ type: 'M', x: 5, y: 10 },
				{ type: 'L', x: 20, y: 10 },
				{ type: 'Q', x1: 25, y1: 20, x: 30, y: 10 },
				{ type: 'C', x1: 33, y1: 20, x2: 37, y2: 20, x: 40, y: 10 },
				{ type: 'L', x: 50, y: 10 },
				{ type: 'Z' }
			];
			const curves = slugGlyphCurves(commands);
			// Verify every consecutive pair is connected
			for (let i = 1; i < curves.length; i++) {
				expect(curves[i].p1x).toBeCloseTo(curves[i - 1].p3x);
				expect(curves[i].p1y).toBeCloseTo(curves[i - 1].p3y);
			}
		});
	});

	// ---- Edge cases ----

	describe('edge cases', () => {
		it('should handle zero-length line at origin', () => {
			const commands: PathCommand[] = [
				{ type: 'M', x: 0, y: 0 },
				{ type: 'L', x: 0, y: 0 }
			];
			const curves = slugGlyphCurves(commands);
			expect(curves).toHaveLength(1);
			expect(curves[0].p1x).toBe(0);
			expect(curves[0].p2x).toBe(0);
			expect(curves[0].p3x).toBe(0);
		});

		it('should handle commands with negative coordinates', () => {
			const commands: PathCommand[] = [
				{ type: 'M', x: -10, y: -20 },
				{ type: 'L', x: -5, y: -10 },
				{ type: 'Q', x1: 0, y1: 0, x: 5, y: -10 }
			];
			const curves = slugGlyphCurves(commands);
			expect(curves).toHaveLength(2);
			expect(curves[0].p1x).toBe(-10);
			expect(curves[0].p1y).toBe(-20);
		});

		it('should handle very small coordinates near zero without false close', () => {
			// Position within epsilon of subpath start should not generate a close line
			const commands: PathCommand[] = [
				{ type: 'M', x: 0, y: 0 },
				{ type: 'L', x: 1e-7, y: 1e-7 },
				{ type: 'Z' }
			];
			const curves = slugGlyphCurves(commands);
			// The line brings us within epsilon of start, so Z should not add another curve
			expect(curves).toHaveLength(1);
		});

		it('should generate a close line when just outside epsilon', () => {
			const commands: PathCommand[] = [
				{ type: 'M', x: 0, y: 0 },
				{ type: 'L', x: 1, y: 0 },
				{ type: 'Z' }
			];
			const curves = slugGlyphCurves(commands);
			// Line (0,0)->(1,0) + close (1,0)->(0,0) = 2
			expect(curves).toHaveLength(2);
		});
	});
});
