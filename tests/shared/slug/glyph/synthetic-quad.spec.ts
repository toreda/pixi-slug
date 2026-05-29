import {slugSyntheticGlyphQuad} from '../../../../src/shared/slug/glyph/quad';
import type {SlugGlyphData} from '../../../../src/shared/slug/glyph/data';
import {Constants} from '../../../../src/constants';

/** Minimal packed glyph with a unit em box for predictable mapping math. */
function fakeGlyph(bandOffset: number): SlugGlyphData {
	return {
		charCode: 0xf0000,
		curves: [{p1x: 0, p1y: 0, p2x: 50, p2y: 0, p3x: 100, p3y: 0}],
		contourStarts: [0],
		bounds: {minX: 0, minY: 0, maxX: 100, maxY: 100},
		advanceWidth: 0,
		lsb: 0,
		hBandCount: 2,
		vBandCount: 2,
		hBands: [[0], [0]],
		vBands: [[0], [0]],
		curveOffset: 0,
		bandOffset
	};
}

const FPV = Constants.FLOATS_PER_VERTEX;

describe('slugSyntheticGlyphQuad', () => {
	it('emits one quad: 4 vertices, 6 indices', () => {
		const q = slugSyntheticGlyphQuad(fakeGlyph(0), 10, 20, 200, 100, 4096);
		expect(q.quadCount).toBe(1);
		expect(q.vertices.length).toBe(Constants.VERTICES_PER_QUAD * FPV);
		expect(q.indices.length).toBe(Constants.INDICES_PER_QUAD);
		expect(Array.from(q.indices)).toEqual([0, 1, 2, 0, 2, 3]);
	});

	it('maps the em box onto the destination pixel rectangle', () => {
		const dstX = 10;
		const dstY = 20;
		const dstW = 200;
		const dstH = 100;
		const q = slugSyntheticGlyphQuad(fakeGlyph(0), dstX, dstY, dstW, dstH, 4096);
		// Corner 0 = top-left, corner 2 = bottom-right (position floats 0,1).
		const c0x = q.vertices[0];
		const c0y = q.vertices[1];
		const c2x = q.vertices[2 * FPV];
		const c2y = q.vertices[2 * FPV + 1];
		expect(c0x).toBeCloseTo(dstX, 5);
		expect(c0y).toBeCloseTo(dstY, 5);
		expect(c2x).toBeCloseTo(dstX + dstW, 5);
		expect(c2y).toBeCloseTo(dstY + dstH, 5);
	});

	it('flips em-Y onto screen-Y (top corner samples em maxY)', () => {
		const q = slugSyntheticGlyphQuad(fakeGlyph(0), 0, 0, 100, 100, 4096);
		// texcoord v is float index 5. Top-left corner (vertex 0) should
		// sample the em-space TOP (maxY = 100), bottom corners the bottom.
		const v0 = q.vertices[5];
		const v2 = q.vertices[2 * FPV + 5];
		expect(v0).toBeCloseTo(100, 4); // top corner → em maxY
		expect(v2).toBeCloseTo(0, 4); // bottom corner → em minY
	});

	it('writes a non-uniform inverse Jacobian under non-square stretch', () => {
		// Stretch X by 4 (200/100=2... use 400 for clarity) and Y by 1.
		const q = slugSyntheticGlyphQuad(fakeGlyph(0), 0, 0, 400, 100, 4096);
		// jac.x at float index 8 = 1/scaleX = 100/400 = 0.25.
		// jac.w at float index 11 = -1/scaleY = -(100/100) = -1.
		expect(q.vertices[8]).toBeCloseTo(0.25, 5);
		expect(q.vertices[11]).toBeCloseTo(-1, 5);
	});

	it('returns an empty quad for a zero-area destination', () => {
		const q = slugSyntheticGlyphQuad(fakeGlyph(0), 0, 0, 0, 100, 4096);
		expect(q.quadCount).toBe(0);
	});
});
