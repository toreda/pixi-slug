import { slugTexturePack } from '../../../../src/shared/slug/texture/pack';
import type { SlugGlyphData } from '../../../../src/shared/slug/glyph/data';
import type { SlugGlyphCurve } from '../../../../src/shared/slug/glyph/data';
import { slugTextureAppendGlyphs, slugTexturePackStateCreate } from '../../../../src/shared/slug/texture/pack';
import { slugTextureFloat16Decode } from '../../../../src/shared/slug/texture/float16/decode';

const TEX_WIDTH = 4096;

/** Decode one half-float curve component. */
const cv = (data: Uint16Array, i: number): number => slugTextureFloat16Decode(data[i]);
/** Band header fields at texel `t`: count in the high half, list offset in the low half. */
const hdrCount = (data: Uint32Array, t: number): number => data[t] >>> 16;
const hdrOffset = (data: Uint32Array, t: number): number => data[t] & 0xffff;
/** Curve reference fields at texel `t`: column in the high half, row in the low half. */
const refX = (data: Uint32Array, t: number): number => data[t] >>> 16;
const refY = (data: Uint32Array, t: number): number => data[t] & 0xffff;

function makeCurve(p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number): SlugGlyphCurve {
	return { p1x, p1y, p2x, p2y, p3x, p3y };
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
			expect(result.curveData).toBeInstanceOf(Uint16Array);
			expect(result.bandData).toBeInstanceOf(Uint32Array);
		});

		it('should return at least one row of data for empty input', () => {
			const result = slugTexturePack([], TEX_WIDTH);
			// Minimum 1 row: TEX_WIDTH texels × 4 half floats for curves, × 1 uint32 for bands
			expect(result.curveData.length).toBe(TEX_WIDTH * 4);
			expect(result.bandData.length).toBe(TEX_WIDTH);
		});
	});

	// ============================================================
	// Curve texture layout
	// ============================================================

	describe('curve texture layout', () => {
		it('should pack a single curve as p12 texel + sentinel (2 texels)', () => {
			const curve = makeCurve(1, 2, 3, 4, 5, 6);
			const glyph = makeGlyph(65, [curve]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			// Texel 0: [p1x, p1y, p2x, p2y]
			expect(cv(result.curveData, 0)).toBe(1);
			expect(cv(result.curveData, 1)).toBe(2);
			expect(cv(result.curveData, 2)).toBe(3);
			expect(cv(result.curveData, 3)).toBe(4);

			// Texel 1 (sentinel): [p3x, p3y, 0, 0]
			expect(cv(result.curveData, 4)).toBe(5);
			expect(cv(result.curveData, 5)).toBe(6);
			expect(cv(result.curveData, 6)).toBe(0);
			expect(cv(result.curveData, 7)).toBe(0);
		});

		it('should pack contiguous curves with shared endpoints', () => {
			// c1.p3 == c2.p1 (shared endpoint within contour)
			const c1 = makeCurve(10, 20, 30, 40, 50, 60);
			const c2 = makeCurve(50, 60, 90, 100, 110, 120);
			const glyph = makeGlyph(65, [c1, c2]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			// Texel 0: c1's p12
			expect(cv(result.curveData, 0)).toBe(10);
			expect(cv(result.curveData, 1)).toBe(20);
			expect(cv(result.curveData, 2)).toBe(30);
			expect(cv(result.curveData, 3)).toBe(40);

			// Texel 1: c2's p12 (c2.p1x == c1.p3x, c2.p1y == c1.p3y — shared endpoint)
			// Shader reads curveLoc.x+1 for c1's p3 and gets this texel's .xy = (50,60) ✓
			expect(cv(result.curveData, 4)).toBe(50);
			expect(cv(result.curveData, 5)).toBe(60);
			expect(cv(result.curveData, 6)).toBe(90);
			expect(cv(result.curveData, 7)).toBe(100);

			// Texel 2 (sentinel): c2's p3
			expect(cv(result.curveData, 8)).toBe(110);
			expect(cv(result.curveData, 9)).toBe(120);
		});

		it('should preserve negative and fractional curve coordinates', () => {
			const curve = makeCurve(-1.5, 2.7, 0, -3.14, 100.001, 0.0001);
			const glyph = makeGlyph(65, [curve]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			expect(cv(result.curveData, 0)).toBeCloseTo(-1.5);
			expect(cv(result.curveData, 1)).toBeCloseTo(2.7);
			expect(cv(result.curveData, 2)).toBeCloseTo(0);
			expect(cv(result.curveData, 3)).toBeCloseTo(-3.14);
			expect(cv(result.curveData, 4)).toBeCloseTo(100.001);
			expect(cv(result.curveData, 5)).toBeCloseTo(0.0001);
		});

		it('should set curveOffset on the glyph', () => {
			const glyph = makeGlyph(65, [makeCurve(0, 0, 5, 10, 10, 0)]);
			slugTexturePack([glyph], TEX_WIDTH);
			expect(glyph.curveOffset).toBe(0);
		});

		it('should set sequential curveOffsets for multiple glyphs', () => {
			const g1 = makeGlyph(65, [makeCurve(0, 0, 5, 10, 10, 0)]); // 1 curve, 1 contour = 2 texels (1 p12 + 1 sentinel)
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
		it('should skip last column to keep curve+neighbor on the same row', () => {
			// With shared endpoints, each curve needs its texel and the +1 texel
			// (next curve or sentinel) on the same row. The skip triggers when
			// curveTexelIdx lands on the last column (TEX_WIDTH - 1).
			// Verify that two glyphs' curve data doesn't overlap
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
			expect(cv(result.curveData, bOffset)).toBe(999);
			expect(cv(result.curveData, bOffset + 1)).toBe(999);
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

			const hdr = glyph.bandOffset;
			// First hBand header: 3 curves
			expect(hdrCount(result.bandData, hdr)).toBe(3);
			// Second hBand header: 1 curve
			expect(hdrCount(result.bandData, hdr + 1)).toBe(1);
		});

		it('should write correct curve count in vertical band headers', () => {
			const curves = [
				makeCurve(0, 0, 5, 10, 10, 0),
				makeCurve(10, 0, 15, 10, 20, 0)
			];
			const glyph = makeGlyph(65, curves, [[0, 1]], [[0], [1]]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			const hdr = glyph.bandOffset;
			// Headers: [hBand0, vBand0, vBand1]
			// vBand0 starts at headerStart + hBandCount
			const vBand0Hdr = hdr + 1; // offset by 1 hBand header
			expect(hdrCount(result.bandData, vBand0Hdr)).toBe(1); // 1 curve in vBand0
			const vBand1Hdr = hdr + 2;
			expect(hdrCount(result.bandData, vBand1Hdr)).toBe(1); // 1 curve in vBand1
		});

		it('should store curve list offsets relative to bandOffset', () => {
			const glyph = makeGlyph(65, [makeCurve(0, 0, 5, 10, 10, 0)]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			const hdr = glyph.bandOffset;
			const listOffset = hdrOffset(result.bandData, hdr); // low half of the header
			// Offset should be relative to bandOffset, not absolute
			expect(listOffset).toBeGreaterThan(0);
			// The absolute texel index of the list is bandOffset + listOffset
			const absTexel = glyph.bandOffset + listOffset;
			expect(absTexel).toBeLessThan(result.bandData.length);
		});

		it('should write curve references as 2D texel coordinates', () => {
			const glyph = makeGlyph(65, [makeCurve(42, 43, 44, 45, 46, 47)]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			const hdr = glyph.bandOffset;
			const listOffset = hdrOffset(result.bandData, hdr);
			const listTexel = glyph.bandOffset + listOffset;

			// Curve reference packs (column << 16) | row
			const col = refX(result.bandData, listTexel);
			const row = refY(result.bandData, listTexel);

			// For the first glyph, curve 0 is at texel 0 → coords (0, 0)
			expect(col).toBe(0);
			expect(row).toBe(0);

			// Verify the curve data at those coords matches
			const curveBase = (row * TEX_WIDTH + col) * 4;
			expect(cv(result.curveData, curveBase)).toBe(42);
			expect(cv(result.curveData, curveBase + 1)).toBe(43);
		});

		it('should handle empty bands (zero curve count)', () => {
			const curves = [makeCurve(0, 0, 5, 10, 10, 0)];
			// hBands: first band has the curve, second is empty
			const glyph = makeGlyph(65, curves, [[0], []], [[0]]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			const hdr = glyph.bandOffset;
			// Second hBand header (offset 1): 0 curves
			expect(hdrCount(result.bandData, hdr + 1)).toBe(0);
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
			expect(cv(result.curveData, g2Base)).toBe(3);
		});

		it('should not corrupt g1 data when packing g2', () => {
			const g1 = makeGlyph(65, [makeCurve(11, 22, 33, 44, 55, 66)]);
			const g2 = makeGlyph(66, [makeCurve(77, 88, 99, 100, 110, 120)]);
			const result = slugTexturePack([g1, g2], TEX_WIDTH);

			// g1 data should still be intact
			expect(cv(result.curveData, 0)).toBe(11);
			expect(cv(result.curveData, 1)).toBe(22);
			expect(cv(result.curveData, 4)).toBe(55);
			expect(cv(result.curveData, 5)).toBe(66);
		});

		it('should handle many glyphs without error', () => {
			const glyphs: SlugGlyphData[] = [];
			for (let i = 0; i < 100; i++) {
				glyphs.push(makeGlyph(i + 65, [makeCurve(i, i, i, i, i, i)]));
			}
			const result = slugTexturePack(glyphs, TEX_WIDTH);
			expect(result.curveData).toBeInstanceOf(Uint16Array);
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
			const hdr = glyph.bandOffset;

			// Verify all hBand counts
			expect(hdrCount(result.bandData, hdr)).toBe(2);          // hBand 0: 2 curves
			expect(hdrCount(result.bandData, hdr + 1)).toBe(2);      // hBand 1: 2 curves
			expect(hdrCount(result.bandData, hdr + 2)).toBe(2);      // hBand 2: 2 curves
			expect(hdrCount(result.bandData, hdr + 3)).toBe(1);     // hBand 3: 1 curve

			// Verify all vBand counts (offset by 4 hBand headers)
			expect(hdrCount(result.bandData, hdr + 4)).toBe(1);     // vBand 0
			expect(hdrCount(result.bandData, hdr + 5)).toBe(1);     // vBand 1
			expect(hdrCount(result.bandData, hdr + 6)).toBe(1);     // vBand 2
			expect(hdrCount(result.bandData, hdr + 7)).toBe(1);     // vBand 3
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

			const hdr = glyph.bandOffset;
			expect(hdrCount(result.bandData, hdr)).toBe(3); // 3 curves in hBand 0
		});
	});

	// ============================================================
	// Return type structure
	// ============================================================

	describe('return value', () => {
		it('should return curveData as Uint16Array (half floats)', () => {
			const result = slugTexturePack([], TEX_WIDTH);
			expect(result.curveData).toBeInstanceOf(Uint16Array);
		});

		it('should return bandData as Uint32Array', () => {
			const result = slugTexturePack([], TEX_WIDTH);
			expect(result.bandData).toBeInstanceOf(Uint32Array);
		});

		it('should return arrays sized to full texture rows (multiple of TEX_WIDTH * 4)', () => {
			const glyph = makeGlyph(65, [makeCurve(0, 0, 5, 10, 10, 0)]);
			const result = slugTexturePack([glyph], TEX_WIDTH);
			expect(result.curveData.length % (TEX_WIDTH * 4)).toBe(0);
			expect(result.bandData.length % TEX_WIDTH).toBe(0);
		});
	});

	// ============================================================
	// Curve reference round-trip
	// ============================================================

	describe('curve reference round-trip', () => {
		it('should allow reading curve data back via band references (shared endpoints)', () => {
			// Contiguous curves: c0.p3 == c1.p1 (shared endpoint)
			const c0 = makeCurve(100, 200, 300, 400, 500, 600);
			const c1 = makeCurve(500, 600, 900, 1000, 1100, 1200);
			const glyph = makeGlyph(65, [c0, c1], [[0, 1]], [[0]]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			// Read hBand 0 header
			const hdr = glyph.bandOffset;
			const count = hdrCount(result.bandData, hdr);
			const listOffset = hdrOffset(result.bandData, hdr);
			expect(count).toBe(2);

			// Read each curve reference and verify the curve data matches
			for (let i = 0; i < count; i++) {
				const refBase = glyph.bandOffset + listOffset + i;
				const texX = refX(result.bandData, refBase);
				const texY = refY(result.bandData, refBase);

				const curveBase = (texY * TEX_WIDTH + texX) * 4;
				const expectedCurve = [c0, c1][i];
				expect(cv(result.curveData, curveBase)).toBe(expectedCurve.p1x);
				expect(cv(result.curveData, curveBase + 1)).toBe(expectedCurve.p1y);
				expect(cv(result.curveData, curveBase + 2)).toBe(expectedCurve.p2x);
				expect(cv(result.curveData, curveBase + 3)).toBe(expectedCurve.p2y);

				// p3 is at texX+1, same row (shared endpoint: next curve's p1, or sentinel)
				const p3Base = (texY * TEX_WIDTH + texX + 1) * 4;
				expect(cv(result.curveData, p3Base)).toBe(expectedCurve.p3x);
				expect(cv(result.curveData, p3Base + 1)).toBe(expectedCurve.p3y);
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
			const hdr = glyph.bandOffset;
			const listOffset = hdrOffset(result.bandData, hdr);
			const count = hdrCount(result.bandData, hdr);

			for (let i = 0; i < count; i++) {
				const refBase = glyph.bandOffset + listOffset + i;
				const texX = refX(result.bandData, refBase);
				const texY = refY(result.bandData, refBase);
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

			const hdr = glyph.bandOffset;
			const listOffset = hdrOffset(result.bandData, hdr);
			const count = hdrCount(result.bandData, hdr);
			expect(count).toBe(500);

			// All 500 refs must be on the same row
			const listStartTexel = glyph.bandOffset + listOffset;
			const listStartCol = listStartTexel % TEX_WIDTH;
			expect(listStartCol + count).toBeLessThanOrEqual(TEX_WIDTH);
		});
	});

	// ============================================================
	// Spec invariants: sentinel texel padding (INV-SENTINEL)
	// Sentinel texel format: [p3x, p3y, 0, 0]
	// With shared endpoints, only the sentinel at the end of each
	// contour has the dedicated [p3x, p3y, 0, 0] layout.
	// ============================================================

	describe('sentinel texel padding', () => {
		it('should set channels 2 and 3 of sentinel texels to zero', () => {
			// Two contours: contour 0 has 2 curves, contour 1 has 1 curve
			const curves = [
				makeCurve(1, 2, 3, 4, 5, 6),
				makeCurve(5, 6, 9, 10, 11, 12),
				makeCurve(20, 21, 22, 23, 24, 25)
			];
			const glyph = makeGlyph(65, curves, [[0, 1, 2]], [[0, 1, 2]], [0, 2]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			// Contour 0: curves 0,1 → sentinel at texel 2 (0-indexed: curve0, curve1, sentinel)
			// Contour 1: curve 2 → sentinel at texel 4 (curve2, sentinel)
			// Find sentinel positions: after last curve in each contour
			const contourEnds = [2, 3]; // curve indices at end of each contour
			const sentinelPositions: number[] = [];

			// Walk band refs to get curve texel positions, then sentinels follow
			const hdr = glyph.bandOffset;
			const listOffset = hdrOffset(result.bandData, hdr);

			// Sentinel for contour 0 is at (last curve of contour 0).texel + 1
			// Last curve of contour 0 is curve index 1
			const ref1Base = glyph.bandOffset + listOffset + 1;
			const tex1X = refX(result.bandData, ref1Base);
			const tex1Y = refY(result.bandData, ref1Base);
			const sent0Base = (tex1Y * TEX_WIDTH + tex1X + 1) * 4;
			expect(cv(result.curveData, sent0Base)).toBe(11); // c1.p3x
			expect(cv(result.curveData, sent0Base + 1)).toBe(12); // c1.p3y
			expect(cv(result.curveData, sent0Base + 2)).toBe(0);
			expect(cv(result.curveData, sent0Base + 3)).toBe(0);

			// Sentinel for contour 1 is at (last curve of contour 1).texel + 1
			// Last curve of contour 1 is curve index 2
			const ref2Base = glyph.bandOffset + listOffset + 2;
			const tex2X = refX(result.bandData, ref2Base);
			const tex2Y = refY(result.bandData, ref2Base);
			const sent1Base = (tex2Y * TEX_WIDTH + tex2X + 1) * 4;
			expect(cv(result.curveData, sent1Base)).toBe(24); // c2.p3x
			expect(cv(result.curveData, sent1Base + 1)).toBe(25); // c2.p3y
			expect(cv(result.curveData, sent1Base + 2)).toBe(0);
			expect(cv(result.curveData, sent1Base + 3)).toBe(0);
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
			const count = hdrCount(result.bandData, hdrTexel);
			const listRelOffset = hdrOffset(result.bandData, hdrTexel);
			expect(count).toBe(2);

			// Use CalcBandLoc to find the curve list
			const [listX, listY] = calcBandLoc(glyphLocX, glyphLocY, listRelOffset);

			// Read each curve reference
			for (let i = 0; i < count; i++) {
				const refTexel = listY * TEX_WIDTH + listX + i;
				const curveTexX = refX(result.bandData, refTexel);
				const curveTexY = refY(result.bandData, refTexel);

				// Verify the curve data at those coordinates
				const curveBase = (curveTexY * TEX_WIDTH + curveTexX) * 4;
				const expected = [c0, c1][i];
				expect(cv(result.curveData, curveBase)).toBe(expected.p1x);
				expect(cv(result.curveData, curveBase + 1)).toBe(expected.p1y);
				expect(cv(result.curveData, curveBase + 2)).toBe(expected.p2x);
				expect(cv(result.curveData, curveBase + 3)).toBe(expected.p2y);
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
			const count = hdrCount(result.bandData, vHdrTexel);
			const listRelOffset = hdrOffset(result.bandData, vHdrTexel);
			expect(count).toBe(1);

			const [listX, listY] = calcBandLoc(glyphLocX, glyphLocY, listRelOffset);
			const refTexel = listY * TEX_WIDTH + listX;
			const curveTexX = refX(result.bandData, refTexel);
			const curveTexY = refY(result.bandData, refTexel);

			const curveBase = (curveTexY * TEX_WIDTH + curveTexX) * 4;
			expect(cv(result.curveData, curveBase)).toBe(10);
			expect(cv(result.curveData, curveBase + 1)).toBe(20);
		});
	});

	// ============================================================
	// Spec invariants: packed band texels are never NaN bit patterns
	// (INV-UINT32). The band texture is uploaded as r32float and read back
	// with floatBitsToUint; a NaN pattern could be canonicalized by the GPU.
	// The high half holds the small-range field (count or column), so the
	// float32 exponent bits (23..30) can never all be set.
	// ============================================================

	describe('band data NaN safety', () => {
		it('should never produce a texel whose float32 exponent bits are all ones', () => {
			const curves: SlugGlyphCurve[] = [];
			for (let i = 0; i < 200; i++) {
				curves.push(makeCurve(i * 10, i * 10, 0, 0, 0, 0));
			}
			const bands = [Array.from({ length: 200 }, (_, i) => i)];
			const glyph = makeGlyph(65, curves, bands, bands);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			for (let i = 0; i < result.bandData.length; i++) {
				expect((result.bandData[i] >>> 23) & 0xff).not.toBe(0xff);
			}
		});

		it('should keep every packed field within 16 bits', () => {
			const glyph = makeGlyph(65, [makeCurve(1, 2, 3, 4, 5, 6)]);
			const result = slugTexturePack([glyph], TEX_WIDTH);
			const hdr = glyph.bandOffset;
			expect(hdrCount(result.bandData, hdr)).toBeLessThanOrEqual(0xffff);
			expect(hdrOffset(result.bandData, hdr)).toBeLessThanOrEqual(0xffff);
			const ref = hdr + hdrOffset(result.bandData, hdr);
			expect(refX(result.bandData, ref)).toBeLessThan(TEX_WIDTH);
			expect(refY(result.bandData, ref)).toBeLessThanOrEqual(0xffff);
		});
	});

	// ============================================================
	// Band list sharing: identical and contiguous-subset bands point at
	// data already written for the glyph instead of repeating it.
	// ============================================================

	describe('band list sharing', () => {
		const fourCurves = () => [
			makeCurve(0, 0, 5, 10, 10, 0),
			makeCurve(10, 0, 15, 10, 20, 0),
			makeCurve(20, 0, 25, 10, 30, 0),
			makeCurve(30, 0, 35, 10, 40, 0)
		];

		it('should point identical bands at the same curve list', () => {
			const glyph = makeGlyph(65, fourCurves(), [[0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3]], [[]]);
			const result = slugTexturePack([glyph], TEX_WIDTH);
			const hdr = glyph.bandOffset;
			const off0 = hdrOffset(result.bandData, hdr);
			expect(hdrCount(result.bandData, hdr + 1)).toBe(4);
			expect(hdrOffset(result.bandData, hdr + 1)).toBe(off0);
			expect(hdrCount(result.bandData, hdr + 2)).toBe(4);
			expect(hdrOffset(result.bandData, hdr + 2)).toBe(off0);
			// 4 headers (3 h + 1 v) + one 4-entry list = 8 texels total.
			const state = slugTexturePackStateCreate(TEX_WIDTH);
			slugTextureAppendGlyphs(state, [makeGlyph(65, fourCurves(), [[0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3]], [[]])]);
			expect(state.bandTexelIdx).toBe(4 + 4);
		});

		it('should point a contiguous-subset band into the larger list', () => {
			// hBand 1 = [1, 2] is a contiguous run of hBand 0 = [0, 1, 2, 3].
			const glyph = makeGlyph(65, fourCurves(), [[0, 1, 2, 3], [1, 2]], [[]]);
			const result = slugTexturePack([glyph], TEX_WIDTH);
			const hdr = glyph.bandOffset;
			const off0 = hdrOffset(result.bandData, hdr);
			expect(hdrCount(result.bandData, hdr + 1)).toBe(2);
			expect(hdrOffset(result.bandData, hdr + 1)).toBe(off0 + 1);
			// The subset resolves to the right curves.
			const sub = hdr + hdrOffset(result.bandData, hdr + 1);
			const full = hdr + off0;
			expect(refX(result.bandData, sub)).toBe(refX(result.bandData, full + 1));
			expect(refX(result.bandData, sub + 1)).toBe(refX(result.bandData, full + 2));
		});

		it('should share lists between horizontal and vertical bands', () => {
			const glyph = makeGlyph(65, fourCurves(), [[0, 1, 2, 3]], [[2, 3]]);
			const result = slugTexturePack([glyph], TEX_WIDTH);
			const hdr = glyph.bandOffset;
			const hOff = hdrOffset(result.bandData, hdr);
			const vOff = hdrOffset(result.bandData, hdr + 1);
			expect(vOff).toBe(hOff + 2);
		});

		it('should write a non-contiguous subset as its own list', () => {
			// [0, 2] is not a contiguous run of [0, 1, 2, 3].
			const glyph = makeGlyph(65, fourCurves(), [[0, 1, 2, 3], [0, 2]], [[]]);
			const result = slugTexturePack([glyph], TEX_WIDTH);
			const hdr = glyph.bandOffset;
			const off0 = hdrOffset(result.bandData, hdr);
			const off1 = hdrOffset(result.bandData, hdr + 1);
			expect(off1).toBeGreaterThanOrEqual(off0 + 4);
			expect(hdrCount(result.bandData, hdr + 1)).toBe(2);
		});

		it('should give empty bands a zero count and a zero offset', () => {
			const glyph = makeGlyph(65, fourCurves(), [[0, 1], []], [[]]);
			const result = slugTexturePack([glyph], TEX_WIDTH);
			const hdr = glyph.bandOffset;
			expect(hdrCount(result.bandData, hdr + 1)).toBe(0);
			expect(hdrOffset(result.bandData, hdr + 1)).toBe(0);
		});

		it('should produce identical layouts from the count pass and the write pass', () => {
			// A larger, repetitive glyph set exercises reuse across many bands.
			const glyphs: SlugGlyphData[] = [];
			for (let g = 0; g < 20; g++) {
				const curves = fourCurves();
				glyphs.push(makeGlyph(65 + g, curves, [[0, 1, 2, 3], [1, 2, 3], [1, 2], [0, 2], [0, 1, 2, 3]], [[3], [2, 3], [0, 1, 2, 3]]));
			}
			const eager = slugTexturePack(glyphs.map((g) => ({...g})), TEX_WIDTH);
			const state = slugTexturePackStateCreate(TEX_WIDTH);
			for (const g of glyphs) {
				slugTextureAppendGlyphs(state, [g]);
			}
			for (let i = 0; i < eager.bandData.length; i++) {
				expect(state.bandData[i]).toBe(eager.bandData[i]);
			}
		});
	});

	// ============================================================
	// Spec invariants: curve texture stores half floats (INV-FLOAT16)
	// Coordinates are rounded to IEEE 754 binary16 at pack time; the GPU
	// reads the identical values from the rgba16float texture.
	// ============================================================

	describe('curve data half-float storage', () => {
		it('should store curve coordinates rounded to half precision', () => {
			// 2049 is not representable in half (step is 2 above 2048) and
			// rounds to even → 2048.
			const curve = makeCurve(2049, 1.1, 0, 0, 0, 0);
			const glyph = makeGlyph(65, [curve]);
			const result = slugTexturePack([glyph], TEX_WIDTH);

			expect(cv(result.curveData, 0)).toBe(2048);
			// 1.1 → nearest half value 1.099609375
			expect(cv(result.curveData, 1)).toBe(1.099609375);
		});

		it('should store every integer coordinate up to 2048 exactly', () => {
			const curve = makeCurve(-2048, 2048, 1234, -1, 17, 0);
			const glyph = makeGlyph(65, [curve]);
			const result = slugTexturePack([glyph], TEX_WIDTH);
			expect(cv(result.curveData, 0)).toBe(-2048);
			expect(cv(result.curveData, 1)).toBe(2048);
			expect(cv(result.curveData, 2)).toBe(1234);
			expect(cv(result.curveData, 3)).toBe(-1);
			expect(cv(result.curveData, 4)).toBe(17);
			expect(cv(result.curveData, 5)).toBe(0);
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
			const hdr = glyph.bandOffset;

			// hBand headers at offsets 0, 1, 2
			for (let i = 0; i < 3; i++) {
				expect(hdrCount(result.bandData, hdr + i)).toBe(1); // each has 1 curve
			}

			// vBand headers at offsets 3, 4 (immediately after hBands)
			for (let i = 0; i < 2; i++) {
				expect(hdrCount(result.bandData, hdr + (3 + i))).toBe(1);
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
