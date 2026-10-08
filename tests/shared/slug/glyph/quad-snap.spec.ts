import {slugGlyphQuads, slugGlyphQuadsMultiline} from '../../../../src/shared/slug/glyph/quad';
import type {SlugGlyphData} from '../../../../src/shared/slug/glyph/data';
import {Constants} from '../../../../src/constants';

function makeGlyph(charCode: number, maxY: number): SlugGlyphData {
	return {
		charCode,
		curves: [{p1x: 0, p1y: 0, p2x: 5, p2y: 5, p3x: 10, p3y: 0}],
		contourStarts: [0],
		bounds: {minX: 0, minY: 0, maxX: 10, maxY},
		advanceWidth: 12,
		lsb: 0,
		hBandCount: 1,
		vBandCount: 1,
		hBands: [[0]],
		vBands: [[0]],
		curveOffset: 0,
		bandOffset: 0
	};
}

/** Screen-space top y of the first quad (vertex 0, posY). */
function topY(vertices: Float32Array): number {
	return vertices[1];
}

/** Screen-space bottom y of the first quad (vertex 3 is screen bottom-left). */
function bottomY(vertices: Float32Array): number {
	return vertices[3 * Constants.FLOATS_PER_VERTEX + 1];
}

describe('slugGlyphQuads snapBaseline', () => {
	// unitsPerEm 1000, glyph top at 713 units, fontSize 24 → top = 17.112 px.
	const glyphs = new Map<number, SlugGlyphData>([[65, makeGlyph(65, 713)]]);
	const advances = new Map<number, number>();

	it('leaves the baseline fractional by default', () => {
		const q = slugGlyphQuads('A', glyphs, advances, 1000, 24, 4096);
		// The glyph bottom (minY = 0) sits on the baseline.
		expect(bottomY(q.vertices)).toBeCloseTo(17.112, 6);
		expect(Number.isInteger(bottomY(q.vertices))).toBe(false);
	});

	it('rounds the baseline to a whole pixel when snapBaseline is on', () => {
		const q = slugGlyphQuads('A', glyphs, advances, 1000, 24, 4096, [1, 1, 1, 1], 0, true);
		expect(bottomY(q.vertices)).toBe(17);
		// Glyph top moves with the baseline (height stays 17.112 px).
		expect(topY(q.vertices)).toBeCloseTo(17 - 17.112, 6);
	});

	it('does not change horizontal layout', () => {
		const a = slugGlyphQuads('A', glyphs, advances, 1000, 24, 4096);
		const b = slugGlyphQuads('A', glyphs, advances, 1000, 24, 4096, [1, 1, 1, 1], 0, true);
		expect(b.vertices[0]).toBe(a.vertices[0]);
	});

	it('rounds the multiline pitch so every line keeps a whole-pixel baseline', () => {
		const lineHeight = 29.6;
		const q = slugGlyphQuadsMultiline(['A', 'A', 'A'], glyphs, advances, 1000, 24, 4096, lineHeight, [1, 1, 1, 1], 0, true);
		const perQuad = Constants.VERTICES_PER_QUAD * Constants.FLOATS_PER_VERTEX;
		for (let l = 0; l < 3; l++) {
			const bottom = q.vertices[l * perQuad + 3 * Constants.FLOATS_PER_VERTEX + 1];
			expect(bottom).toBe(17 + l * 30);
		}
	});

	it('keeps the fractional multiline pitch when snapBaseline is off', () => {
		const lineHeight = 29.6;
		const q = slugGlyphQuadsMultiline(['A', 'A'], glyphs, advances, 1000, 24, 4096, lineHeight);
		const perQuad = Constants.VERTICES_PER_QUAD * Constants.FLOATS_PER_VERTEX;
		const bottom1 = q.vertices[perQuad + 3 * Constants.FLOATS_PER_VERTEX + 1];
		expect(bottom1).toBeCloseTo(17.112 + 29.6, 5);
	});
});
