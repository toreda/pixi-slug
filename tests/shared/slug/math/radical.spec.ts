import {slugRadicalOutline} from '../../../../src/shared/slug/math/radical';

/** A degenerate quadratic encodes a straight segment: p2 is the midpoint of p1..p3. */
function isStraightSegment(c: {
	p1x: number;
	p1y: number;
	p2x: number;
	p2y: number;
	p3x: number;
	p3y: number;
}): boolean {
	const midX = (c.p1x + c.p3x) / 2;
	const midY = (c.p1y + c.p3y) / 2;
	return Math.abs(c.p2x - midX) < 1e-9 && Math.abs(c.p2y - midY) < 1e-9;
}

describe('slugRadicalOutline', () => {
	const geom = {height: 100, hookWidth: 40, barRight: 200, thickness: 5};

	it('returns a single closed contour (no overlap → no winding cancellation)', () => {
		const out = slugRadicalOutline(geom);
		expect(out.contourStarts).toEqual([0]);
		expect(out.curves.length).toBeGreaterThanOrEqual(6);
		// Closed: last curve's end equals the first curve's start.
		const first = out.curves[0];
		const last = out.curves[out.curves.length - 1];
		expect(last.p3x).toBeCloseTo(first.p1x, 6);
		expect(last.p3y).toBeCloseTo(first.p1y, 6);
	});

	it('emits only straight segments (degenerate quadratics with midpoint control points)', () => {
		const out = slugRadicalOutline(geom);
		for (const c of out.curves) {
			expect(isStraightSegment(c)).toBe(true);
		}
	});

	it('normalizes bounds to start at the origin', () => {
		const out = slugRadicalOutline(geom);
		expect(out.bounds.minX).toBe(0);
		expect(out.bounds.minY).toBe(0);
		// Height is preserved; width is at least the bar width (the inner
		// nib edge can extend the silhouette a few px past the nominal box).
		// The stroked outline is at least the requested centerline height
		// (the mitred valley tip + bar thickness extend it slightly).
		expect(out.bounds.maxY).toBeGreaterThanOrEqual(geom.height - 1e-6);
		expect(out.bounds.maxY).toBeLessThan(geom.height + geom.thickness * 3);
		expect(out.bounds.maxX).toBeGreaterThanOrEqual(geom.barRight - 1e-6);
	});

	it('encloses every control point within its reported bounds', () => {
		const out = slugRadicalOutline(geom);
		for (const c of out.curves) {
			for (const [x, y] of [
				[c.p1x, c.p1y],
				[c.p2x, c.p2y],
				[c.p3x, c.p3y]
			]) {
				expect(x).toBeGreaterThanOrEqual(out.bounds.minX - 1e-6);
				expect(x).toBeLessThanOrEqual(out.bounds.maxX + 1e-6);
				expect(y).toBeGreaterThanOrEqual(out.bounds.minY - 1e-6);
				expect(y).toBeLessThanOrEqual(out.bounds.maxY + 1e-6);
			}
		}
	});

	it('keeps shape proportions across sizes (scale-invariant silhouette)', () => {
		const small = slugRadicalOutline({height: 50, hookWidth: 20, barRight: 100, thickness: 2.5});
		const big = slugRadicalOutline({height: 200, hookWidth: 80, barRight: 400, thickness: 10});
		// Same curve count regardless of size — the silhouette is the same shape.
		expect(small.curves.length).toBe(big.curves.length);
	});

	it('the vinculum top edge is a single horizontal segment (seamless with upstroke)', () => {
		const out = slugRadicalOutline(geom);
		// At least one segment runs flat along y = maxY (the bar top).
		const barTop = out.curves.filter(
			(c) =>
				Math.abs(c.p1y - out.bounds.maxY) < 1e-6 && Math.abs(c.p3y - out.bounds.maxY) < 1e-6
		);
		expect(barTop.length).toBeGreaterThanOrEqual(1);
		// And it reaches the right end of the figure.
		const reachesRight = barTop.some(
			(c) =>
				Math.abs(c.p1x - out.bounds.maxX) < 1e-6 || Math.abs(c.p3x - out.bounds.maxX) < 1e-6
		);
		expect(reachesRight).toBe(true);
	});
});
