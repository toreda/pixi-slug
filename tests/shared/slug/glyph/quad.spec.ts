import {
	packBandMax,
	packUint16Pair,
	slugGlyphQuads
} from '../../../../src/shared/slug/glyph/quad';
import type { SlugGlyphData } from '../../../../src/shared/slug/glyph/data';

/**
 * `packUint16Pair` returns a float whose underlying bit pattern is the
 * (high << 16) | low uint32. To verify that contract we round-trip the
 * returned float back through an aliased buffer and inspect the uint32.
 * Comparing float values directly fails for NaN bit patterns, since
 * NaN !== NaN.
 */
const _readBuf = new ArrayBuffer(4);
const _readU32 = new Uint32Array(_readBuf);
const _readF32 = new Float32Array(_readBuf);
function bitsOf(packed: number): number {
	_readF32[0] = packed;
	return _readU32[0];
}

function makeGlyph(charCode: number): SlugGlyphData {
	return {
		charCode,
		curves: [{ p1x: 0, p1y: 0, p2x: 5, p2y: 10, p3x: 10, p3y: 0 }],
		contourStarts: [0],
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

describe('packUint16Pair', () => {
	it('should place low in the lower 16 bits of the bit pattern', () => {
		const packed = packUint16Pair(0x1234, 0x0000);
		expect(bitsOf(packed) & 0xffff).toBe(0x1234);
	});

	it('should place high in the upper 16 bits of the bit pattern', () => {
		const packed = packUint16Pair(0x0000, 0x5678);
		expect((bitsOf(packed) >>> 16) & 0xffff).toBe(0x5678);
	});

	it('should combine both halves into a single uint32', () => {
		const packed = packUint16Pair(0x1234, 0x5678);
		expect(bitsOf(packed) >>> 0).toBe(0x56781234);
	});

	it('should return 0 (the float zero) when both inputs are zero', () => {
		expect(packUint16Pair(0, 0)).toBe(0);
		expect(bitsOf(packUint16Pair(0, 0))).toBe(0);
	});

	it('should produce the all-ones bit pattern when both halves are 0xffff', () => {
		const packed = packUint16Pair(0xffff, 0xffff);
		expect(bitsOf(packed) >>> 0).toBe(0xffffffff);
	});

	it('should mask each input to its low 16 bits', () => {
		// Inputs above 16 bits must be silently truncated to match the
		// shader's expectation of a 16-bit pair packed into a uint32.
		const packed = packUint16Pair(0x10001, 0x20002);
		expect(bitsOf(packed) >>> 0).toBe(0x00020001);
	});

	it("should treat negative values as their two's complement low 16 bits", () => {
		// (-1 & 0xffff) === 0xffff. Both inputs collapse to 0xffff.
		const packed = packUint16Pair(-1, -1);
		expect(bitsOf(packed) >>> 0).toBe(0xffffffff);
	});

	it('should be deterministic for the same inputs', () => {
		const a = packUint16Pair(0x0a0b, 0x0c0d);
		const b = packUint16Pair(0x0a0b, 0x0c0d);
		expect(bitsOf(a)).toBe(bitsOf(b));
	});

	it('should not let an intervening call leak state into the next return value', () => {
		// The function uses a shared buffer; the returned scalar must be
		// captured before any second call can overwrite the buffer.
		const first = packUint16Pair(0x1111, 0x2222);
		const firstBits = bitsOf(first);
		packUint16Pair(0xaaaa, 0xbbbb); // mutates the shared buffer
		expect(bitsOf(first)).toBe(firstBits);
	});

	it('should pack maximum low value with zero high value', () => {
		const packed = packUint16Pair(0xffff, 0x0000);
		expect(bitsOf(packed) >>> 0).toBe(0x0000ffff);
	});

	it('should pack zero low value with maximum high value', () => {
		const packed = packUint16Pair(0x0000, 0xffff);
		expect(bitsOf(packed) >>> 0).toBe(0xffff0000);
	});
});

describe('packBandMax', () => {
	it('should match packUint16Pair for the same inputs', () => {
		const a = packBandMax(0x1234, 0x5678);
		const b = packUint16Pair(0x1234, 0x5678);
		expect(bitsOf(a)).toBe(bitsOf(b));
	});

	it('should place vBandMax in the low 16 bits (shader reads as bandMax.x)', () => {
		const packed = packBandMax(7, 0);
		expect(bitsOf(packed) & 0xffff).toBe(7);
	});

	it('should place hBandMax in the high 16 bits (shader reads as bandMax.y)', () => {
		const packed = packBandMax(0, 11);
		expect((bitsOf(packed) >>> 16) & 0xffff).toBe(11);
	});

	it('should produce zero when both band maxes are zero', () => {
		expect(bitsOf(packBandMax(0, 0))).toBe(0);
	});

	it('should encode realistic band max values (32 bands → max index 31)', () => {
		const packed = packBandMax(31, 31);
		expect(bitsOf(packed) >>> 0).toBe((31 << 16) | 31);
	});

	it('should be deterministic for repeated calls', () => {
		const a = packBandMax(5, 9);
		const b = packBandMax(5, 9);
		expect(bitsOf(a)).toBe(bitsOf(b));
	});
});

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
