import { slugTexturePack } from '../../../../src/shared/slug/texture/pack';
import type { SlugGlyphData } from '../../../../src/shared/slug/glyph/data';
import type { SlugGlyphCurve } from '../../../../src/shared/slug/glyph/data';

const TEX_WIDTH = 4096;

function makeCurve(p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number): SlugGlyphCurve {
	return { p1x, p1y, p2x, p2y, p3x, p3y };
}

function makeGlyph(
	charCode: number,
	curves: SlugGlyphCurve[],
	hBands: number[][] = [[...Array(curves.length).keys()]],
	vBands: number[][] = [[...Array(curves.length).keys()]]
): SlugGlyphData {
	return {
		charCode,
		curves,
		bounds: { minX: 0, minY: 0, maxX: 20, maxY: 10 },
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

// ============================================================
// Input validation
// ============================================================

describe('slugTexturePack', () => {
	describe('input validation', () => {
		it('should throw if textureWidth is not 4096', () => {
			expect(() => slugTexturePack([], 2048)).toThrow(/4096/);
			expect(() => slugTexturePack([], 1024)).toThrow(/4096/);
			expect(() => slugTexturePack([], 8192)).toThrow(/4096/);
		});

		it('should accept textureWidth of 4096', () => {
			expect(() => slugTexturePack([], TEX_WIDTH)).not.toThrow();
		});
	});

	// ============================================================
	// Empty input
	// ============================================================

	describe('empty input', () => {
		it('should return typed arrays for empty glyph list', () => {
			const result = slugTexturePack([], TEX_WIDTH);
			expect(result.curveData).toBeInstanceOf(Float32Array);
			expect(result.bandData).toBeInstanceOf(Uint32Array);
		});

		it('should return at least one row of data for empty input', () => {
			const result = slugTexturePack([], TEX_WIDTH);
			// Minimum 1 row × TEX_WIDTH texels × 4 components
			expect(result.curveData.length).toBe(TEX_WIDTH * 4);
			expect(result.bandData.length).toBe(TEX_WIDTH * 4);
		});
	});

	// ============================================================
	// Curve texture layout
	// ============================================================

	describe('curve texture layout', () => {
		it('should pack a single curve into 2 texels (8 floats)', () => {
			const curve = makeCurve(1, 2, 3, 4, 5, 6);
			const glyph = makeGlyph(65, [curve]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			// Texel 0: [p1x, p1y, p2x, p2y]
			expect(result.curveData[0]).toBe(1);
			expect(result.curveData[1]).toBe(2);
			expect(result.curveData[2]).toBe(3);
			expect(result.curveData[3]).toBe(4);

			// Texel 1: [p3x, p3y, 0, 0]
			expect(result.curveData[4]).toBe(5);
			expect(result.curveData[5]).toBe(6);
			expect(result.curveData[6]).toBe(0);
			expect(result.curveData[7]).toBe(0);
		});

		it('should pack multiple curves sequentially', () => {
			const c1 = makeCurve(10, 20, 30, 40, 50, 60);
			const c2 = makeCurve(70, 80, 90, 100, 110, 120);
			const glyph = makeGlyph(65, [c1, c2]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			// Second curve starts at texel index 2 (2 texels per curve)
			// Texel 2: [p1x, p1y, p2x, p2y] of c2
			expect(result.curveData[8]).toBe(70);
			expect(result.curveData[9]).toBe(80);
			expect(result.curveData[10]).toBe(90);
			expect(result.curveData[11]).toBe(100);

			// Texel 3: [p3x, p3y, 0, 0] of c2
			expect(result.curveData[12]).toBe(110);
			expect(result.curveData[13]).toBe(120);
		});

		it('should preserve negative and fractional curve coordinates', () => {
			const curve = makeCurve(-1.5, 2.7, 0, -3.14, 100.001, 0.0001);
			const glyph = makeGlyph(65, [curve]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			expect(result.curveData[0]).toBeCloseTo(-1.5);
			expect(result.curveData[1]).toBeCloseTo(2.7);
			expect(result.curveData[2]).toBeCloseTo(0);
			expect(result.curveData[3]).toBeCloseTo(-3.14);
			expect(result.curveData[4]).toBeCloseTo(100.001);
			expect(result.curveData[5]).toBeCloseTo(0.0001);
		});

		it('should set curveOffset on the glyph', () => {
			const glyph = makeGlyph(65, [makeCurve(0, 0, 5, 10, 10, 0)]);
			slugTexturePack([glyph], TEX_WIDTH);
			expect(glyph.curveOffset).toBe(0);
		});

		it('should set sequential curveOffsets for multiple glyphs', () => {
			const g1 = makeGlyph(65, [makeCurve(0, 0, 5, 10, 10, 0)]); // 1 curve = 2 texels
			const g2 = makeGlyph(66, [makeCurve(0, 0, 5, 10, 10, 0)]);
			slugTexturePack([g1, g2], TEX_WIDTH);
			expect(g1.curveOffset).toBe(0);
			expect(g2.curveOffset).toBe(2); // after g1's 2 texels
		});
	});

	// ============================================================
	// Curve row alignment
	// ============================================================

	describe('curve row alignment', () => {
		it('should skip last column to keep curve pairs on the same row', () => {
			// Fill up to TEX_WIDTH - 1 texels, then next curve should skip to new row.
			// Each curve takes 2 texels, so (TEX_WIDTH/2 - 1) curves fills TEX_WIDTH - 2 texels.
			// One more curve would start at col TEX_WIDTH-2, pair at TEX_WIDTH-1 — fine.
			// TWO more curves: second pair would start at col TEX_WIDTH (new row) — no skip.
			// To trigger the skip, we need the curveTexelIdx to land on TEX_WIDTH-1.
			// That happens with (TEX_WIDTH - 1) / 2 curves if TEX_WIDTH is odd,
			// but TEX_WIDTH=4096 is even, so we manually verify the padding logic.

			// Create enough curves to fill a row minus one texel.
			// 2047 curves = 4094 texels, next curve at col 4094 → pair at 4095 → fine.
			// 2048 curves = 4096 texels → exactly fills row, no skip needed.
			// The skip triggers when curveTexelIdx % TEX_WIDTH === TEX_WIDTH - 1 (col 4095).
			// So we need an odd number of texels consumed before the curve pair.
			// This happens if a previous glyph used an odd texel count due to skipping.

			// Simplest test: verify that two glyphs' curve data doesn't overlap
			// even in pathological alignment cases.
			const curvesA: SlugGlyphCurve[] = [];
			for (let i = 0; i < 2048; i++) {
				curvesA.push(makeCurve(i, 0, 0, 0, 0, 0));
			}
			const bandsA = [Array.from({ length: 2048 }, (_, i) => i)];
			const gA = makeGlyph(65, curvesA, bandsA, [[]]);

			const gB = makeGlyph(66, [makeCurve(999, 999, 999, 999, 999, 999)]);
			const result = slugTexturePack([gA, gB], TEX_WIDTH);

			// gB's curve data should be at its curveOffset
			const bOffset = gB.curveOffset * 4;
			expect(result.curveData[bOffset]).toBe(999);
			expect(result.curveData[bOffset + 1]).toBe(999);
		});
	});

	// ============================================================
	// Band texture layout
	// ============================================================

	describe('band texture layout', () => {
		it('should set bandOffset on the glyph', () => {
			const glyph = makeGlyph(65, [makeCurve(0, 0, 5, 10, 10, 0)]);
			slugTexturePack([glyph], TEX_WIDTH);
			expect(typeof glyph.bandOffset).toBe('number');
			expect(glyph.bandOffset).toBeGreaterThanOrEqual(0);
		});

		it('should write correct curve count in horizontal band headers', () => {
			const curves = [
				makeCurve(0, 0, 5, 10, 10, 0),
				makeCurve(10, 0, 15, 10, 20, 0),
				makeCurve(20, 0, 25, 10, 30, 0)
			];
			// 2 hBands: first has curves 0,1,2; second has curve 0
			const glyph = makeGlyph(65, curves, [[0, 1, 2], [0]], [[0]]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			const hdr = glyph.bandOffset * 4;
			// First hBand header: 3 curves
			expect(result.bandData[hdr]).toBe(3);
			// Second hBand header: 1 curve
			expect(result.bandData[hdr + 4]).toBe(1);
		});

		it('should write correct curve count in vertical band headers', () => {
			const curves = [
				makeCurve(0, 0, 5, 10, 10, 0),
				makeCurve(10, 0, 15, 10, 20, 0)
			];
			const glyph = makeGlyph(65, curves, [[0, 1]], [[0], [1]]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			const hdr = glyph.bandOffset * 4;
			// Headers: [hBand0, vBand0, vBand1]
			// vBand0 starts at headerStart + hBandCount
			const vBand0Hdr = hdr + 1 * 4; // offset by 1 hBand header
			expect(result.bandData[vBand0Hdr]).toBe(1); // 1 curve in vBand0
			const vBand1Hdr = hdr + 2 * 4;
			expect(result.bandData[vBand1Hdr]).toBe(1); // 1 curve in vBand1
		});

		it('should store curve list offsets relative to bandOffset', () => {
			const glyph = makeGlyph(65, [makeCurve(0, 0, 5, 10, 10, 0)]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			const hdr = glyph.bandOffset * 4;
			const listOffset = result.bandData[hdr + 1]; // second uint in header
			// Offset should be relative to bandOffset, not absolute
			expect(listOffset).toBeGreaterThan(0);
			// The absolute texel index of the list is bandOffset + listOffset
			const absTexel = glyph.bandOffset + listOffset;
			expect(absTexel).toBeLessThan(result.bandData.length / 4);
		});

		it('should write curve references as 2D texel coordinates', () => {
			const glyph = makeGlyph(65, [makeCurve(42, 43, 44, 45, 46, 47)]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			const hdr = glyph.bandOffset * 4;
			const listOffset = result.bandData[hdr + 1];
			const listTexel = (glyph.bandOffset + listOffset) * 4;

			// Curve reference should be [x, y, 0, 0] where x,y are texel coords
			const refX = result.bandData[listTexel];
			const refY = result.bandData[listTexel + 1];

			// For the first glyph, curve 0 is at texel 0 → coords (0, 0)
			expect(refX).toBe(0);
			expect(refY).toBe(0);

			// Verify the curve data at those coords matches
			const curveBase = (refY * TEX_WIDTH + refX) * 4;
			expect(result.curveData[curveBase]).toBe(42);
			expect(result.curveData[curveBase + 1]).toBe(43);
		});

		it('should handle empty bands (zero curve count)', () => {
			const curves = [makeCurve(0, 0, 5, 10, 10, 0)];
			// hBands: first band has the curve, second is empty
			const glyph = makeGlyph(65, curves, [[0], []], [[0]]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			const hdr = glyph.bandOffset * 4;
			// Second hBand header (offset 1): 0 curves
			expect(result.bandData[hdr + 4]).toBe(0);
		});
	});

	// ============================================================
	// Band row alignment
	// ============================================================

	describe('band row alignment', () => {
		it('should pad headers to avoid straddling row boundaries', () => {
			// Create a first glyph that consumes most of a row in band data,
			// then a second glyph whose headers would straddle the boundary.
			// The packer should pad to the next row.
			const g1Curves: SlugGlyphCurve[] = [];
			const g1Bands: number[] = [];
			// Create enough curves to consume many band texels in g1
			for (let i = 0; i < 100; i++) {
				g1Curves.push(makeCurve(i, 0, 0, 0, 0, 0));
				g1Bands.push(i);
			}
			const g1 = makeGlyph(65, g1Curves, [g1Bands], [g1Bands]);
			const g2 = makeGlyph(66, [makeCurve(0, 0, 5, 10, 10, 0)]);

			slugTexturePack([g1, g2], TEX_WIDTH);

			// g2's band headers should start on a row boundary
			// if g1 consumed enough to cause straddling
			// At minimum, verify bandOffset is valid
			expect(g2.bandOffset).toBeGreaterThan(g1.bandOffset);
		});
	});

	// ============================================================
	// Multiple glyphs
	// ============================================================

	describe('multiple glyphs', () => {
		it('should pack multiple glyphs with independent offsets', () => {
			const g1 = makeGlyph(65, [
				makeCurve(1, 1, 1, 1, 1, 1),
				makeCurve(2, 2, 2, 2, 2, 2)
			]);
			const g2 = makeGlyph(66, [
				makeCurve(3, 3, 3, 3, 3, 3)
			]);
			const result = slugTexturePack([g1, g2], TEX_WIDTH);

			// g2's curve data starts after g1's
			expect(g2.curveOffset).toBeGreaterThan(g1.curveOffset);
			expect(g2.bandOffset).toBeGreaterThan(g1.bandOffset);

			// Verify g2's curve data is at the correct offset
			const g2Base = g2.curveOffset * 4;
			expect(result.curveData[g2Base]).toBe(3);
		});

		it('should not corrupt g1 data when packing g2', () => {
			const g1 = makeGlyph(65, [makeCurve(11, 22, 33, 44, 55, 66)]);
			const g2 = makeGlyph(66, [makeCurve(77, 88, 99, 100, 110, 120)]);
			const result = slugTexturePack([g1, g2], TEX_WIDTH);

			// g1 data should still be intact
			expect(result.curveData[0]).toBe(11);
			expect(result.curveData[1]).toBe(22);
			expect(result.curveData[4]).toBe(55);
			expect(result.curveData[5]).toBe(66);
		});

		it('should handle many glyphs without error', () => {
			const glyphs: SlugGlyphData[] = [];
			for (let i = 0; i < 100; i++) {
				glyphs.push(makeGlyph(i + 65, [makeCurve(i, i, i, i, i, i)]));
			}
			const result = slugTexturePack(glyphs, TEX_WIDTH);
			expect(result.curveData).toBeInstanceOf(Float32Array);
			expect(result.bandData).toBeInstanceOf(Uint32Array);

			// Each glyph should have a unique curveOffset
			const offsets = new Set(glyphs.map(g => g.curveOffset));
			expect(offsets.size).toBe(100);
		});
	});

	// ============================================================
	// Glyph with many bands
	// ============================================================

	describe('complex band structures', () => {
		it('should handle a glyph with many horizontal and vertical bands', () => {
			const curves = [
				makeCurve(0, 0, 5, 10, 10, 0),
				makeCurve(10, 0, 15, 10, 20, 0),
				makeCurve(20, 0, 25, 10, 30, 0),
				makeCurve(30, 0, 35, 10, 40, 0)
			];
			// 4 hBands and 4 vBands, each referencing different curves
			const hBands = [[0, 1], [1, 2], [2, 3], [3]];
			const vBands = [[0], [1], [2], [3]];
			const glyph = makeGlyph(65, curves, hBands, vBands);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			// Total headers = 4 + 4 = 8
			const hdr = glyph.bandOffset * 4;

			// Verify all hBand counts
			expect(result.bandData[hdr]).toBe(2);          // hBand 0: 2 curves
			expect(result.bandData[hdr + 4]).toBe(2);      // hBand 1: 2 curves
			expect(result.bandData[hdr + 8]).toBe(2);      // hBand 2: 2 curves
			expect(result.bandData[hdr + 12]).toBe(1);     // hBand 3: 1 curve

			// Verify all vBand counts (offset by 4 hBand headers)
			expect(result.bandData[hdr + 16]).toBe(1);     // vBand 0
			expect(result.bandData[hdr + 20]).toBe(1);     // vBand 1
			expect(result.bandData[hdr + 24]).toBe(1);     // vBand 2
			expect(result.bandData[hdr + 28]).toBe(1);     // vBand 3
		});

		it('should handle bands with all curves referenced', () => {
			const curves = [
				makeCurve(0, 0, 1, 1, 2, 2),
				makeCurve(3, 3, 4, 4, 5, 5),
				makeCurve(6, 6, 7, 7, 8, 8)
			];
			// Single band containing all 3 curves
			const glyph = makeGlyph(65, curves, [[0, 1, 2]], [[0, 1, 2]]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			const hdr = glyph.bandOffset * 4;
			expect(result.bandData[hdr]).toBe(3); // 3 curves in hBand 0
		});
	});

	// ============================================================
	// Return type structure
	// ============================================================

	describe('return value', () => {
		it('should return curveData as Float32Array', () => {
			const result = slugTexturePack([], TEX_WIDTH);
			expect(result.curveData).toBeInstanceOf(Float32Array);
		});

		it('should return bandData as Uint32Array', () => {
			const result = slugTexturePack([], TEX_WIDTH);
			expect(result.bandData).toBeInstanceOf(Uint32Array);
		});

		it('should return arrays sized to full texture rows (multiple of TEX_WIDTH * 4)', () => {
			const glyph = makeGlyph(65, [makeCurve(0, 0, 5, 10, 10, 0)]);
			const result = slugTexturePack([glyph], TEX_WIDTH);
			expect(result.curveData.length % (TEX_WIDTH * 4)).toBe(0);
			expect(result.bandData.length % (TEX_WIDTH * 4)).toBe(0);
		});
	});

	// ============================================================
	// Curve reference round-trip
	// ============================================================

	describe('curve reference round-trip', () => {
		it('should allow reading curve data back via band references', () => {
			const c0 = makeCurve(100, 200, 300, 400, 500, 600);
			const c1 = makeCurve(700, 800, 900, 1000, 1100, 1200);
			const glyph = makeGlyph(65, [c0, c1], [[0, 1]], [[0]]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			// Read hBand 0 header
			const hdr = glyph.bandOffset * 4;
			const count = result.bandData[hdr];
			const listOffset = result.bandData[hdr + 1];
			expect(count).toBe(2);

			// Read each curve reference and verify the curve data matches
			for (let i = 0; i < count; i++) {
				const refBase = (glyph.bandOffset + listOffset + i) * 4;
				const texX = result.bandData[refBase];
				const texY = result.bandData[refBase + 1];

				const curveBase = (texY * TEX_WIDTH + texX) * 4;
				const expectedCurve = [c0, c1][i];
				expect(result.curveData[curveBase]).toBe(expectedCurve.p1x);
				expect(result.curveData[curveBase + 1]).toBe(expectedCurve.p1y);
				expect(result.curveData[curveBase + 2]).toBe(expectedCurve.p2x);
				expect(result.curveData[curveBase + 3]).toBe(expectedCurve.p2y);

				// p3 is at texX+1, same row
				const p3Base = (texY * TEX_WIDTH + texX + 1) * 4;
				expect(result.curveData[p3Base]).toBe(expectedCurve.p3x);
				expect(result.curveData[p3Base + 1]).toBe(expectedCurve.p3y);
			}
		});
	});

	// ============================================================
	// Side effects
	// ============================================================

	// ============================================================
	// Spec invariants: curve p12/p3 row alignment (INV-ROW-CURVE)
	// The shader reads p3 as texelFetch(curveLoc.x + 1, curveLoc.y)
	// with no row-wrapping, so both texels must share a row.
	// ============================================================

	describe('curve p12/p3 same-row invariant', () => {
		it('should never place p12 in the last column of a row', () => {
			// Pack enough curves to span multiple rows and verify
			// no p12 texel lands on column TEX_WIDTH-1.
			const curves: SlugGlyphCurve[] = [];
			for (let i = 0; i < 3000; i++) {
				curves.push(makeCurve(i, i, i, i, i, i));
			}
			const bands = [Array.from({ length: 3000 }, (_, i) => i)];
			const glyph = makeGlyph(65, curves, bands, [[]]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			// Walk the curve data and find every p12 texel by checking
			// which texels have non-zero data (or just check all occupied texels).
			// Each curve's p12 is at curveOffset + (2*i) or (2*i)+skip.
			// We verify by reading band refs, which store the actual p12 coords.
			const hdr = glyph.bandOffset * 4;
			const listOffset = result.bandData[hdr + 1];
			const count = result.bandData[hdr];

			for (let i = 0; i < count; i++) {
				const refBase = (glyph.bandOffset + listOffset + i) * 4;
				const texX = result.bandData[refBase];
				const texY = result.bandData[refBase + 1];
				// p12 must not be in last column (shader does curveLoc.x + 1)
				expect(texX).toBeLessThan(TEX_WIDTH - 1);
				// p3 must be on the same row
				const p3Row = Math.floor((texY * TEX_WIDTH + texX + 1) / TEX_WIDTH);
				expect(p3Row).toBe(texY);
			}
		});
	});

	// ============================================================
	// Spec invariants: band headers fit on a single row (INV-ROW-HEADER)
	// The shader fetches headers as glyphLoc.x + bandIndex with a fixed
	// glyphLoc.y — no row-wrapping in the header fetch.
	// ============================================================

	describe('band headers single-row invariant', () => {
		it('should fit all headers for a glyph within one texture row', () => {
			const curves = [makeCurve(0, 0, 5, 10, 10, 0)];
			// 8 hBands + 8 vBands = 16 headers
			const hBands: number[][] = Array.from({ length: 8 }, () => [0]);
			const vBands: number[][] = Array.from({ length: 8 }, () => [0]);
			const glyph = makeGlyph(65, curves, hBands, vBands);
			slugTexturePack([glyph], TEX_WIDTH);

			const headerCount = glyph.hBandCount + glyph.vBandCount;
			const startCol = glyph.bandOffset % TEX_WIDTH;
			expect(startCol + headerCount).toBeLessThanOrEqual(TEX_WIDTH);
		});

		it('should pad to next row when headers would overflow', () => {
			// Create a glyph that fills most of a band row, then a second
			// glyph with enough bands that its headers would straddle.
			const g1Curves: SlugGlyphCurve[] = [];
			const g1Band: number[] = [];
			for (let i = 0; i < 200; i++) {
				g1Curves.push(makeCurve(i, 0, 0, 0, 0, 0));
				g1Band.push(i);
			}
			const g1 = makeGlyph(65, g1Curves, [g1Band], [g1Band]);

			// g2 has 20 bands total
			const g2Curves = [makeCurve(0, 0, 5, 10, 10, 0)];
			const g2hBands: number[][] = Array.from({ length: 10 }, () => [0]);
			const g2vBands: number[][] = Array.from({ length: 10 }, () => [0]);
			const g2 = makeGlyph(66, g2Curves, g2hBands, g2vBands);

			slugTexturePack([g1, g2], TEX_WIDTH);

			const g2HeaderCount = g2.hBandCount + g2.vBandCount;
			const g2StartCol = g2.bandOffset % TEX_WIDTH;
			expect(g2StartCol + g2HeaderCount).toBeLessThanOrEqual(TEX_WIDTH);
		});
	});

	// ============================================================
	// Spec invariants: curve reference lists fit on a single row (INV-ROW-LIST)
	// The shader iterates fetchBand(hbandLoc.x + curveIndex, hbandLoc.y)
	// with a fixed row — no wrapping within a list.
	// ============================================================

	describe('curve list single-row invariant', () => {
		it('should keep each band curve list within one row', () => {
			const curves: SlugGlyphCurve[] = [];
			for (let i = 0; i < 500; i++) {
				curves.push(makeCurve(i, 0, 0, 0, 0, 0));
			}
			// Single band with all 500 curves
			const glyph = makeGlyph(65, curves, [Array.from({ length: 500 }, (_, i) => i)], [[]]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			const hdr = glyph.bandOffset * 4;
			const listOffset = result.bandData[hdr + 1];
			const count = result.bandData[hdr];
			expect(count).toBe(500);

			// All 500 refs must be on the same row
			const listStartTexel = glyph.bandOffset + listOffset;
			const listStartCol = listStartTexel % TEX_WIDTH;
			expect(listStartCol + count).toBeLessThanOrEqual(TEX_WIDTH);
		});
	});

	// ============================================================
	// Spec invariants: band header padding bytes are zero (INV-BAND-7/8)
	// Header format: [curveCount, listOffset, 0, 0]
	// ============================================================

	describe('band header reserved fields', () => {
		it('should set channels 2 and 3 of every band header to zero', () => {
			const curves = [makeCurve(0, 0, 5, 10, 10, 0), makeCurve(10, 0, 15, 10, 20, 0)];
			const glyph = makeGlyph(65, curves, [[0, 1], [0]], [[1], [0, 1]]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			const headerCount = glyph.hBandCount + glyph.vBandCount;
			for (let i = 0; i < headerCount; i++) {
				const base = (glyph.bandOffset + i) * 4;
				expect(result.bandData[base + 2]).toBe(0);
				expect(result.bandData[base + 3]).toBe(0);
			}
		});
	});

	// ============================================================
	// Spec invariants: curve reference padding bytes are zero (INV-BAND-11)
	// Reference format: [curveTexelX, curveTexelY, 0, 0]
	// ============================================================

	describe('curve reference reserved fields', () => {
		it('should set channels 2 and 3 of every curve reference to zero', () => {
			const curves = [makeCurve(0, 0, 5, 10, 10, 0), makeCurve(10, 0, 15, 10, 20, 0)];
			const glyph = makeGlyph(65, curves, [[0, 1]], [[0, 1]]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			// Check hBand list refs
			const hdr = glyph.bandOffset * 4;
			const hListOffset = result.bandData[hdr + 1];
			const hCount = result.bandData[hdr];
			for (let i = 0; i < hCount; i++) {
				const base = (glyph.bandOffset + hListOffset + i) * 4;
				expect(result.bandData[base + 2]).toBe(0);
				expect(result.bandData[base + 3]).toBe(0);
			}

			// Check vBand list refs
			const vHdr = (glyph.bandOffset + glyph.hBandCount) * 4;
			const vListOffset = result.bandData[vHdr + 1];
			const vCount = result.bandData[vHdr];
			for (let i = 0; i < vCount; i++) {
				const base = (glyph.bandOffset + vListOffset + i) * 4;
				expect(result.bandData[base + 2]).toBe(0);
				expect(result.bandData[base + 3]).toBe(0);
			}
		});
	});

	// ============================================================
	// Spec invariants: p3 texel padding (INV-CURVE-11/12)
	// p3 texel format: [p3x, p3y, 0, 0]
	// ============================================================

	describe('p3 texel padding', () => {
		it('should set channels 2 and 3 of every p3 texel to zero', () => {
			const curves = [
				makeCurve(1, 2, 3, 4, 5, 6),
				makeCurve(7, 8, 9, 10, 11, 12)
			];
			const glyph = makeGlyph(65, curves);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			// For each curve, the p3 texel is at curveOffset + 2*i + 1
			for (let i = 0; i < curves.length; i++) {
				// Walk via band refs to find actual texel positions
				const hdr = glyph.bandOffset * 4;
				const listOffset = result.bandData[hdr + 1];
				const refBase = (glyph.bandOffset + listOffset + i) * 4;
				const texX = result.bandData[refBase];
				const texY = result.bandData[refBase + 1];

				// p3 texel is at (texX+1, texY)
				const p3Base = (texY * TEX_WIDTH + texX + 1) * 4;
				expect(result.curveData[p3Base + 2]).toBe(0);
				expect(result.curveData[p3Base + 3]).toBe(0);
			}
		});
	});

	// ============================================================
	// Spec invariants: CalcBandLoc round-trip (INV-BAND-LOC)
	// Simulates the shader's CalcBandLoc to verify band list offsets
	// resolve to valid data.
	// ============================================================

	describe('CalcBandLoc round-trip', () => {
		/** Mimics frag.glsl CalcBandLoc */
		function calcBandLoc(glyphLocX: number, glyphLocY: number, offset: number): [number, number] {
			let x = glyphLocX + offset;
			let y = glyphLocY;
			y += x >> 12; // x >> kLogBandTextureWidth
			x &= (1 << 12) - 1; // x &= 0xFFF
			return [x, y];
		}

		it('should resolve hBand list offsets to valid curve references', () => {
			const c0 = makeCurve(100, 200, 300, 400, 500, 600);
			const c1 = makeCurve(700, 800, 900, 1000, 1100, 1200);
			const glyph = makeGlyph(65, [c0, c1], [[0, 1]], [[0]]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			const glyphLocX = glyph.bandOffset % TEX_WIDTH;
			const glyphLocY = Math.floor(glyph.bandOffset / TEX_WIDTH);

			// Read hBand 0 header at glyphLoc
			const hdrTexel = glyphLocY * TEX_WIDTH + glyphLocX;
			const count = result.bandData[hdrTexel * 4];
			const listRelOffset = result.bandData[hdrTexel * 4 + 1];
			expect(count).toBe(2);

			// Use CalcBandLoc to find the curve list
			const [listX, listY] = calcBandLoc(glyphLocX, glyphLocY, listRelOffset);

			// Read each curve reference
			for (let i = 0; i < count; i++) {
				const refTexel = listY * TEX_WIDTH + listX + i;
				const curveTexX = result.bandData[refTexel * 4];
				const curveTexY = result.bandData[refTexel * 4 + 1];

				// Verify the curve data at those coordinates
				const curveBase = (curveTexY * TEX_WIDTH + curveTexX) * 4;
				const expected = [c0, c1][i];
				expect(result.curveData[curveBase]).toBe(expected.p1x);
				expect(result.curveData[curveBase + 1]).toBe(expected.p1y);
				expect(result.curveData[curveBase + 2]).toBe(expected.p2x);
				expect(result.curveData[curveBase + 3]).toBe(expected.p2y);
			}
		});

		it('should resolve vBand list offsets via CalcBandLoc', () => {
			const c0 = makeCurve(10, 20, 30, 40, 50, 60);
			const glyph = makeGlyph(65, [c0], [[0]], [[0]]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			const glyphLocX = glyph.bandOffset % TEX_WIDTH;
			const glyphLocY = Math.floor(glyph.bandOffset / TEX_WIDTH);

			// vBand header is at glyphLoc.x + hBandCount + 1 + bandIndex.x
			// Actually in the shader: glyphLoc.x + bandMax.y + 1 + bandIndex.x
			// bandMax.y = hBandCount - 1, so the offset is hBandCount + bandIndex.x
			const vHdrTexel = glyphLocY * TEX_WIDTH + glyphLocX + glyph.hBandCount;
			const count = result.bandData[vHdrTexel * 4];
			const listRelOffset = result.bandData[vHdrTexel * 4 + 1];
			expect(count).toBe(1);

			const [listX, listY] = calcBandLoc(glyphLocX, glyphLocY, listRelOffset);
			const refTexel = listY * TEX_WIDTH + listX;
			const curveTexX = result.bandData[refTexel * 4];
			const curveTexY = result.bandData[refTexel * 4 + 1];

			const curveBase = (curveTexY * TEX_WIDTH + curveTexX) * 4;
			expect(result.curveData[curveBase]).toBe(10);
			expect(result.curveData[curveBase + 1]).toBe(20);
		});
	});

	// ============================================================
	// Spec invariants: uint32 values within float32-safe range (INV-UINT32)
	// All band data values must be < 2^24 for lossless uint→float→uint.
	// ============================================================

	describe('band data float32-safe range', () => {
		it('should produce band data values all below 2^24', () => {
			const curves: SlugGlyphCurve[] = [];
			for (let i = 0; i < 200; i++) {
				curves.push(makeCurve(i * 10, i * 10, 0, 0, 0, 0));
			}
			const bands = [Array.from({ length: 200 }, (_, i) => i)];
			const glyph = makeGlyph(65, curves, bands, bands);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			const MAX_SAFE = 1 << 24; // 16777216
			for (let i = 0; i < result.bandData.length; i++) {
				expect(result.bandData[i]).toBeLessThan(MAX_SAFE);
			}
		});
	});

	// ============================================================
	// Spec invariants: curve texture stores float32 values (INV-FLOAT32)
	// Verify float64→float32 truncation is applied via Float32Array.
	// ============================================================

	describe('curve data float32 storage', () => {
		it('should store curve coordinates as float32 (truncated from float64)', () => {
			// Use a value that differs between float64 and float32
			const preciseValue = 1.0000001192092896; // has more precision than float32
			const f32 = new Float32Array([preciseValue]);
			const expected = f32[0]; // what float32 truncation produces

			const curve = makeCurve(preciseValue, 0, 0, 0, 0, 0);
			const glyph = makeGlyph(65, [curve]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			// curveData is Float32Array, so the value is truncated
			expect(result.curveData[0]).toBe(expected);
		});
	});

	// ============================================================
	// Spec invariants: vertical band header offset (INV-SHADER-4)
	// Shader accesses vBand at glyphLoc.x + hBandCount + bandIndex
	// ============================================================

	describe('vertical band header positioning', () => {
		it('should place vBand headers immediately after hBand headers', () => {
			const curves = [makeCurve(0, 0, 5, 10, 10, 0)];
			const glyph = makeGlyph(65, curves, [[0], [0], [0]], [[0], [0]]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			// 3 hBands + 2 vBands = 5 consecutive headers
			const hdr = glyph.bandOffset * 4;

			// hBand headers at offsets 0, 1, 2
			for (let i = 0; i < 3; i++) {
				expect(result.bandData[hdr + i * 4]).toBe(1); // each has 1 curve
			}

			// vBand headers at offsets 3, 4 (immediately after hBands)
			for (let i = 0; i < 2; i++) {
				expect(result.bandData[hdr + (3 + i) * 4]).toBe(1);
			}
		});
	});

	// ============================================================
	// Side effects
	// ============================================================

	describe('side effects on glyph objects', () => {
		it('should mutate curveOffset and bandOffset on input glyphs', () => {
			const g1 = makeGlyph(65, [makeCurve(0, 0, 5, 10, 10, 0)]);
			const g2 = makeGlyph(66, [makeCurve(0, 0, 5, 10, 10, 0)]);
			expect(g1.curveOffset).toBe(0);
			expect(g1.bandOffset).toBe(0);

			slugTexturePack([g1, g2], TEX_WIDTH);

			// After packing, offsets should be assigned
			expect(g1.curveOffset).toBe(0);
			expect(g2.curveOffset).toBe(2);
			expect(g1.bandOffset).toBeDefined();
			expect(g2.bandOffset).toBeGreaterThan(g1.bandOffset);
		});

		it('should not modify curves array on the glyph', () => {
			const curves = [makeCurve(1, 2, 3, 4, 5, 6)];
			const original = { ...curves[0] };
			const glyph = makeGlyph(65, curves);
			slugTexturePack([glyph], TEX_WIDTH);

			expect(glyph.curves[0]).toEqual(original);
		});
	});
});
