import { slugGlyphCurves } from '../../../../src/shared/slug/glyph/curves';
import type { PathCommand } from 'opentype.js';

describe('slugGlyphCurves', () => {
	it('should return empty array for empty commands', () => {
		expect(slugGlyphCurves([])).toEqual([]);
	});

	it('should return empty array for move-only path', () => {
		const commands: PathCommand[] = [{ type: 'M', x: 0, y: 0 }];
		expect(slugGlyphCurves(commands)).toEqual([]);
	});

	it('should convert a line to a degenerate quadratic', () => {
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

	it('should pass through quadratic commands', () => {
		const commands: PathCommand[] = [
			{ type: 'M', x: 0, y: 0 },
			{ type: 'Q', x1: 5, y1: 10, x: 10, y: 0 }
		];
		const curves = slugGlyphCurves(commands);
		expect(curves).toHaveLength(1);
		expect(curves[0].p1x).toBe(0);
		expect(curves[0].p1y).toBe(0);
		expect(curves[0].p2x).toBe(5);
		expect(curves[0].p2y).toBe(10);
		expect(curves[0].p3x).toBe(10);
		expect(curves[0].p3y).toBe(0);
	});

	it('should split cubic commands into two quadratics', () => {
		const commands: PathCommand[] = [
			{ type: 'M', x: 0, y: 0 },
			{ type: 'C', x1: 3, y1: 10, x2: 7, y2: 10, x: 10, y: 0 }
		];
		const curves = slugGlyphCurves(commands);
		expect(curves).toHaveLength(2);
		expect(curves[0].p1x).toBe(0);
		expect(curves[0].p1y).toBe(0);
		expect(curves[1].p3x).toBe(10);
		expect(curves[1].p3y).toBe(0);
	});

	it('should handle close path command without error', () => {
		const commands: PathCommand[] = [
			{ type: 'M', x: 0, y: 0 },
			{ type: 'L', x: 10, y: 0 },
			{ type: 'L', x: 10, y: 10 },
			{ type: 'Z' }
		];
		const curves = slugGlyphCurves(commands);
		expect(curves).toHaveLength(2);
	});
});
