import {slugGlyphQuads} from '../../../src/shared/slug/glyph/quad';
import type {SlugGlyphData} from '../../../src/shared/slug/glyph/data';
import {slugComputeLineLayout} from '../../../src/shared/slug/text/layout/align';
import {slugMeasureText} from '../../../src/shared/slug/text/measure';
import {slugTextWrap} from '../../../src/shared/slug/text/wrap';

/**
 * Astral-plane (non-BMP) code point handling across the shared text
 * pipeline. Glyph and advance maps are keyed by full Unicode code
 * point, so every text walk must iterate by code point — a surrogate
 * pair is ONE character, never two failed lookups and never a place a
 * line may break.
 *
 * Fixtures use U+1D465 (𝑥, MATHEMATICAL ITALIC SMALL X) and U+1F600
 * (😀) — both encode as surrogate pairs in UTF-16.
 */
const MATH_X = 0x1d465;
const EMOJI = 0x1f600;
const MATH_X_STR = String.fromCodePoint(MATH_X); // '𝑥'
const EMOJI_STR = String.fromCodePoint(EMOJI);

function makeGlyph(charCode: number): SlugGlyphData {
	return {
		charCode,
		curves: [{p1x: 0, p1y: 0, p2x: 5, p2y: 10, p3x: 10, p3y: 0}],
		contourStarts: [0],
		bounds: {minX: 0, minY: 0, maxX: 10, maxY: 10},
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

describe('astral code point handling', () => {
	describe('slugMeasureText', () => {
		const advances = new Map<number, number>([
			[65, 10], // 'A'
			[MATH_X, 20]
		]);

		it('measures an astral character as one advance', () => {
			expect(slugMeasureText(MATH_X_STR, advances, 1)).toBe(20);
		});

		it('measures mixed BMP + astral text correctly', () => {
			expect(slugMeasureText(`A${MATH_X_STR}A`, advances, 1)).toBe(40);
		});

		it('never resolves an advance from a surrogate half', () => {
			// If iteration fell back to per-code-unit lookups, these keys
			// (the pair's own surrogate halves) would be found and the
			// width would be wrong.
			const poisoned = new Map<number, number>([
				[MATH_X, 20],
				[0xd835, 999],
				[0xdc65, 999]
			]);
			expect(slugMeasureText(MATH_X_STR, poisoned, 1)).toBe(20);
		});
	});

	describe('slugTextWrap', () => {
		const advances = new Map<number, number>([
			[32, 5], // space
			[MATH_X, 10],
			[EMOJI, 10]
		]);

		it('accounts an astral character once toward line width', () => {
			// 3 × 10px fits maxWidth 30 exactly — must stay on one line.
			const {lines} = slugTextWrap(MATH_X_STR.repeat(3), advances, 1, 30, false);
			expect(lines).toEqual([MATH_X_STR.repeat(3)]);
		});

		it('never breaks a line inside a surrogate pair (breakWords)', () => {
			const {lines} = slugTextWrap(MATH_X_STR.repeat(5), advances, 1, 30, true);
			expect(lines).toEqual([MATH_X_STR.repeat(3), MATH_X_STR.repeat(2)]);
			// Belt and braces: every produced line must round-trip through
			// code point iteration without exposing a lone surrogate.
			for (const line of lines) {
				for (const ch of line) {
					const c = ch.codePointAt(0) as number;
					expect(c >= 0xd800 && c <= 0xdfff).toBe(false);
				}
			}
		});

		it('wraps astral words at spaces', () => {
			const text = `${EMOJI_STR}${EMOJI_STR} ${EMOJI_STR}`;
			const {lines} = slugTextWrap(text, advances, 1, 25, false);
			expect(lines).toEqual([`${EMOJI_STR}${EMOJI_STR}`, EMOJI_STR]);
		});
	});

	describe('slugGlyphQuads', () => {
		const glyphs = new Map<number, SlugGlyphData>([
			[65, makeGlyph(65)],
			[MATH_X, makeGlyph(MATH_X)]
		]);
		const advances = new Map<number, number>([
			[65, 12],
			[MATH_X, 12]
		]);

		it('emits one quad for one astral glyph', () => {
			const quads = slugGlyphQuads(MATH_X_STR, glyphs, advances, 100, 100, 4096);
			expect(quads.quadCount).toBe(1);
		});

		it('emits the right quad count for mixed BMP + astral text', () => {
			const quads = slugGlyphQuads(`A${MATH_X_STR}A`, glyphs, advances, 100, 100, 4096);
			expect(quads.quadCount).toBe(3);
		});

		it('advances the cursor once (not twice) past an astral glyph', () => {
			// 'A𝑥A': with scale 1 (fontSize === unitsPerEm) each glyph
			// advances 12. The third glyph's quad must start at x = 24; a
			// per-code-unit walk would misplace it. Vertex layout: x is
			// float 0 of each vertex, quad origin = glyph bounds.minX (0)
			// + cursor.
			const quads = slugGlyphQuads(`A${MATH_X_STR}A`, glyphs, advances, 100, 100, 4096);
			const floatsPerVertex = quads.vertices.length / (quads.quadCount * 4);
			const thirdQuadX = quads.vertices[2 * 4 * floatsPerVertex];
			expect(thirdQuadX).toBe(24);
		});
	});

	describe('slugComputeLineLayout (justify)', () => {
		const glyphsPresent = (c: number): boolean => c === MATH_X || c === EMOJI;

		it('inter-character justify counts astral glyphs once', () => {
			const lines = [MATH_X_STR.repeat(2), MATH_X_STR];
			const layout = slugComputeLineLayout(
				lines,
				[20, 10],
				40,
				'justify',
				'inter-character',
				glyphsPresent
			);
			// 3 renderable glyphs total — NOT 0 (surrogate halves missing
			// from the glyph map) and NOT 6 (per-code-unit counting).
			expect(layout.perGlyphShiftX).not.toBeNull();
			expect(layout.perGlyphShiftX!.length).toBe(3);
			// Line 0 stretches to the box: second glyph shifts by the full
			// 20px gap. Last line never justifies.
			expect(Array.from(layout.perGlyphShiftX!)).toEqual([0, 20, 0]);
			expect(Array.from(layout.effectiveLineWidth)).toEqual([40, 10]);
		});

		it('inter-word justify shifts the astral glyph after the gap', () => {
			const lines = [`${MATH_X_STR} ${MATH_X_STR}`, MATH_X_STR];
			const layout = slugComputeLineLayout(
				lines,
				[25, 10],
				40,
				'justify',
				'inter-word',
				glyphsPresent
			);
			expect(layout.perGlyphShiftX).not.toBeNull();
			expect(Array.from(layout.perGlyphShiftX!)).toEqual([0, 15, 0]);
		});
	});
});
