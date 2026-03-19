import { slugGlyphQuads } from '../../../../src/shared/slug/glyph/quad';
import type { SlugGlyphData } from '../../../../src/shared/slug/glyph/data';

function makeGlyph(charCode: number): SlugGlyphData {
	return {
		charCode,
		curves: [{ p1x: 0, p1y: 0, p2x: 5, p2y: 10, p3x: 10, p3y: 0 }],
		bounds: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
		advanceWidth: 12,
		lsb: 0,
		hBandCount: 2,
		vBandCount: 2,
		hBands: [[0], [0]],
		vBands: [[0], [0]],
		curveOffset: 0,
		bandOffset: 0
	};
}

describe('slugGlyphQuads', () => {
	it('should return zero quads for empty text', () => {
		const glyphs = new Map<number, SlugGlyphData>();
		const result = slugGlyphQuads('', glyphs, new Map(), 1000, 24, 4096);
		expect(result.quadCount).toBe(0);
	});

	it('should return zero quads when no glyphs match', () => {
		const glyphs = new Map<number, SlugGlyphData>();
		const result = slugGlyphQuads('A', glyphs, new Map(), 1000, 24, 4096);
		expect(result.quadCount).toBe(0);
	});

	it('should produce one quad per matching glyph', () => {
		const glyphs = new Map<number, SlugGlyphData>();
		glyphs.set(65, makeGlyph(65)); // 'A'
		const result = slugGlyphQuads('A', glyphs, new Map(), 1000, 24, 4096);
		expect(result.quadCount).toBe(1);
		expect(result.vertices.length).toBe(1 * 4 * 20);
		expect(result.indices.length).toBe(1 * 6);
	});

	it('should produce correct index pattern for a single quad', () => {
		const glyphs = new Map<number, SlugGlyphData>();
		glyphs.set(65, makeGlyph(65));
		const result = slugGlyphQuads('A', glyphs, new Map(), 1000, 24, 4096);
		expect(Array.from(result.indices)).toEqual([0, 1, 2, 0, 2, 3]);
	});

	it('should produce multiple quads for multi-char text', () => {
		const glyphs = new Map<number, SlugGlyphData>();
		glyphs.set(65, makeGlyph(65)); // 'A'
		glyphs.set(66, makeGlyph(66)); // 'B'
		const result = slugGlyphQuads('AB', glyphs, new Map(), 1000, 24, 4096);
		expect(result.quadCount).toBe(2);
		expect(result.indices.length).toBe(12);
	});

	it('should skip characters not in glyph map', () => {
		const glyphs = new Map<number, SlugGlyphData>();
		glyphs.set(65, makeGlyph(65)); // 'A'
		const result = slugGlyphQuads('AXA', glyphs, new Map(), 1000, 24, 4096);
		expect(result.quadCount).toBe(2);
	});
});
