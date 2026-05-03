import {
	slugTextureAppendGlyphs,
	slugTexturePack,
	slugTexturePackStateCreate
} from '../../../../src/shared/slug/texture/pack';
import type {SlugGlyphCurve, SlugGlyphData} from '../../../../src/shared/slug/glyph/data';

const TEX_WIDTH = 4096;

function makeCurve(p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number): SlugGlyphCurve {
	return {p1x, p1y, p2x, p2y, p3x, p3y};
}

function makeGlyph(
	charCode: number,
	curves: SlugGlyphCurve[],
	hBands: number[][] = [[...Array(curves.length).keys()]],
	vBands: number[][] = [[...Array(curves.length).keys()]],
	contourStarts: number[] = [0]
): SlugGlyphData {
	return {
		charCode,
		curves,
		contourStarts: curves.length > 0 ? contourStarts : [],
		bounds: {minX: 0, minY: 0, maxX: 20, maxY: 10},
		advanceWidth: 22,
		lsb: 0,
		hBandCount: hBands.length,
		vBandCount: vBands.length,
		hBands,
		vBands,
		curveOffset: 0,
		bandOffset: 0
	};
}

describe('slugTextureAppendGlyphs', () => {
	describe('byte-equivalence with eager pack', () => {
		it('produces identical curve/band data when glyphs are appended in one call vs. eager pack', () => {
			const curves1 = [makeCurve(1, 2, 3, 4, 5, 6), makeCurve(5, 6, 7, 8, 9, 10)];
			const curves2 = [makeCurve(11, 12, 13, 14, 15, 16)];
			const eagerA = makeGlyph(65, curves1, [[0, 1]], [[0, 1]]);
			const eagerB = makeGlyph(66, curves2, [[0]], [[0]]);
			const eager = slugTexturePack([eagerA, eagerB], TEX_WIDTH);

			const incA = makeGlyph(65, curves1.map((c) => ({...c})), [[0, 1]], [[0, 1]]);
			const incB = makeGlyph(66, curves2.map((c) => ({...c})), [[0]], [[0]]);
			const state = slugTexturePackStateCreate(TEX_WIDTH);
			slugTextureAppendGlyphs(state, [incA, incB]);

			expect(incA.curveOffset).toBe(eagerA.curveOffset);
			expect(incA.bandOffset).toBe(eagerA.bandOffset);
			expect(incB.curveOffset).toBe(eagerB.curveOffset);
			expect(incB.bandOffset).toBe(eagerB.bandOffset);

			// Compare the populated prefix (incremental state may have trailing slack).
			const curveCmpLen = eager.curveData.length;
			expect(state.curveData.length).toBeGreaterThanOrEqual(curveCmpLen);
			for (let i = 0; i < curveCmpLen; i++) {
				expect(state.curveData[i]).toBe(eager.curveData[i]);
			}
			const bandCmpLen = eager.bandData.length;
			expect(state.bandData.length).toBeGreaterThanOrEqual(bandCmpLen);
			for (let i = 0; i < bandCmpLen; i++) {
				expect(state.bandData[i]).toBe(eager.bandData[i]);
			}
		});

		it('produces identical layout when glyphs are appended one at a time', () => {
			const curves1 = [makeCurve(1, 2, 3, 4, 5, 6), makeCurve(5, 6, 7, 8, 9, 10)];
			const curves2 = [makeCurve(11, 12, 13, 14, 15, 16)];
			const curves3 = [makeCurve(20, 30, 40, 50, 60, 70), makeCurve(60, 70, 80, 90, 100, 110)];
			const eagerA = makeGlyph(65, curves1, [[0, 1]], [[0, 1]]);
			const eagerB = makeGlyph(66, curves2, [[0]], [[0]]);
			const eagerC = makeGlyph(67, curves3, [[0, 1]], [[0, 1]]);
			const eager = slugTexturePack([eagerA, eagerB, eagerC], TEX_WIDTH);

			const state = slugTexturePackStateCreate(TEX_WIDTH);
			const incA = makeGlyph(65, curves1.map((c) => ({...c})), [[0, 1]], [[0, 1]]);
			slugTextureAppendGlyphs(state, [incA]);
			const incB = makeGlyph(66, curves2.map((c) => ({...c})), [[0]], [[0]]);
			slugTextureAppendGlyphs(state, [incB]);
			const incC = makeGlyph(67, curves3.map((c) => ({...c})), [[0, 1]], [[0, 1]]);
			slugTextureAppendGlyphs(state, [incC]);

			expect(incA.curveOffset).toBe(eagerA.curveOffset);
			expect(incB.curveOffset).toBe(eagerB.curveOffset);
			expect(incC.curveOffset).toBe(eagerC.curveOffset);
			expect(incA.bandOffset).toBe(eagerA.bandOffset);
			expect(incB.bandOffset).toBe(eagerB.bandOffset);
			expect(incC.bandOffset).toBe(eagerC.bandOffset);

			for (let i = 0; i < eager.curveData.length; i++) {
				expect(state.curveData[i]).toBe(eager.curveData[i]);
			}
			for (let i = 0; i < eager.bandData.length; i++) {
				expect(state.bandData[i]).toBe(eager.bandData[i]);
			}
		});
	});

	describe('append result metadata', () => {
		it('reports the texel range that was written', () => {
			const state = slugTexturePackStateCreate(TEX_WIDTH);
			const glyph = makeGlyph(65, [makeCurve(0, 0, 5, 10, 10, 0)]);
			const result = slugTextureAppendGlyphs(state, [glyph]);

			expect(result.curveTexelStart).toBe(0);
			expect(result.curveTexelEnd).toBe(state.curveTexelIdx);
			expect(result.bandTexelStart).toBe(0);
			expect(result.bandTexelEnd).toBe(state.bandTexelIdx);
		});

		it('does not flag a buffer grow when the initial allocation has enough room', () => {
			const state = slugTexturePackStateCreate(TEX_WIDTH);
			const glyph = makeGlyph(65, [makeCurve(0, 0, 5, 10, 10, 0)]);
			const result = slugTextureAppendGlyphs(state, [glyph]);

			expect(result.curveBufferGrew).toBe(false);
			expect(result.bandBufferGrew).toBe(false);
		});

		it('flags a buffer grow when the appended glyphs exceed the initial allocation', () => {
			const state = slugTexturePackStateCreate(TEX_WIDTH);
			// Pre-allocation is one row (4096 texels). Pack ~5000 curves to overflow.
			const curves: SlugGlyphCurve[] = [];
			for (let i = 0; i < 5000; i++) {
				curves.push(makeCurve(i, 0, 0, 0, 0, 0));
			}
			const bands = [Array.from({length: 5000}, (_, i) => i)];
			const glyph = makeGlyph(65, curves, bands, [[]]);
			const result = slugTextureAppendGlyphs(state, [glyph]);

			expect(result.curveBufferGrew).toBe(true);
		});

		it('reports start/end ranges that exclude the prior tail when appending after a previous batch', () => {
			const state = slugTexturePackStateCreate(TEX_WIDTH);
			const g1 = makeGlyph(65, [makeCurve(0, 0, 5, 10, 10, 0)]);
			slugTextureAppendGlyphs(state, [g1]);
			const curveAfterFirst = state.curveTexelIdx;
			const bandAfterFirst = state.bandTexelIdx;

			const g2 = makeGlyph(66, [makeCurve(0, 0, 5, 10, 10, 0)]);
			const result = slugTextureAppendGlyphs(state, [g2]);

			expect(result.curveTexelStart).toBe(curveAfterFirst);
			expect(result.curveTexelEnd).toBe(state.curveTexelIdx);
			expect(result.bandTexelStart).toBe(bandAfterFirst);
			expect(result.bandTexelEnd).toBe(state.bandTexelIdx);
		});
	});

	describe('buffer growth invariants', () => {
		it('preserves prior curve data when the buffer grows', () => {
			const state = slugTexturePackStateCreate(TEX_WIDTH);
			const g1 = makeGlyph(65, [makeCurve(11, 22, 33, 44, 55, 66)]);
			slugTextureAppendGlyphs(state, [g1]);

			// Force a grow by appending many curves.
			const bigCurves: SlugGlyphCurve[] = [];
			for (let i = 0; i < 6000; i++) {
				bigCurves.push(makeCurve(i, 0, 0, 0, 0, 0));
			}
			const bigBands = [Array.from({length: 6000}, (_, i) => i)];
			const g2 = makeGlyph(66, bigCurves, bigBands, [[]]);
			slugTextureAppendGlyphs(state, [g2]);

			// g1's data must still be at its original location.
			expect(state.curveData[0]).toBe(11);
			expect(state.curveData[1]).toBe(22);
			expect(state.curveData[2]).toBe(33);
			expect(state.curveData[3]).toBe(44);
			expect(state.curveData[4]).toBe(55);
			expect(state.curveData[5]).toBe(66);
		});

		it('keeps the buffer length aligned to whole rows after a grow', () => {
			const state = slugTexturePackStateCreate(TEX_WIDTH);
			const curves: SlugGlyphCurve[] = [];
			for (let i = 0; i < 6000; i++) {
				curves.push(makeCurve(i, 0, 0, 0, 0, 0));
			}
			const bands = [Array.from({length: 6000}, (_, i) => i)];
			const glyph = makeGlyph(65, curves, bands, [[]]);
			slugTextureAppendGlyphs(state, [glyph]);

			expect(state.curveData.length % (TEX_WIDTH * 4)).toBe(0);
			expect(state.bandData.length % (TEX_WIDTH * 4)).toBe(0);
		});
	});

	describe('input validation', () => {
		it('throws when textureWidth is not 4096', () => {
			expect(() => slugTexturePackStateCreate(2048)).toThrow(/4096/);
		});
	});
});
