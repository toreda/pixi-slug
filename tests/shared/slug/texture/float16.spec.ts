import {slugTextureFloat16Encode} from '../../../../src/shared/slug/texture/float16/encode';
import {slugTextureFloat16Decode} from '../../../../src/shared/slug/texture/float16/decode';
import {slugTextureFloat16Round} from '../../../../src/shared/slug/texture/float16/round';

describe('float16 encode / decode', () => {
	it('encodes well-known values to their IEEE 754 binary16 bit patterns', () => {
		expect(slugTextureFloat16Encode(0)).toBe(0x0000);
		expect(slugTextureFloat16Encode(1)).toBe(0x3c00);
		expect(slugTextureFloat16Encode(-2)).toBe(0xc000);
		expect(slugTextureFloat16Encode(0.5)).toBe(0x3800);
		expect(slugTextureFloat16Encode(65504)).toBe(0x7bff);
		expect(slugTextureFloat16Encode(Infinity)).toBe(0x7c00);
		expect(slugTextureFloat16Encode(-Infinity)).toBe(0xfc00);
	});

	it('preserves the sign of negative zero', () => {
		expect(slugTextureFloat16Encode(-0)).toBe(0x8000);
		expect(Object.is(slugTextureFloat16Decode(0x8000), -0)).toBe(true);
	});

	it('represents every integer up to 2048 exactly', () => {
		for (let i = -2048; i <= 2048; i++) {
			expect(slugTextureFloat16Round(i)).toBe(i);
		}
	});

	it('represents half-integers below 1024 exactly', () => {
		for (let i = -1024; i < 1024; i++) {
			expect(slugTextureFloat16Round(i + 0.5)).toBe(i + 0.5);
		}
	});

	it('cannot represent half-integers at or above 1024', () => {
		expect(slugTextureFloat16Round(1024.5)).toBe(1024);
		expect(slugTextureFloat16Round(1025.5)).toBe(1026);
	});

	it('rounds to nearest, ties to even', () => {
		// Between 2048 and 4096 the step is 2. 2049 is a tie → even mantissa (2048).
		expect(slugTextureFloat16Round(2049)).toBe(2048);
		// 2051 is a tie between 2050 and 2052 → 2052 (even mantissa).
		expect(slugTextureFloat16Round(2051)).toBe(2052);
		// Non-ties round to the nearest.
		expect(slugTextureFloat16Round(2050.6)).toBe(2050);
		expect(slugTextureFloat16Round(2051.4)).toBe(2052);
	});

	it('clamps values beyond the half range to infinity', () => {
		expect(slugTextureFloat16Decode(slugTextureFloat16Encode(70000))).toBe(Infinity);
		expect(slugTextureFloat16Decode(slugTextureFloat16Encode(-70000))).toBe(-Infinity);
	});

	it('flushes values below the smallest normal half to zero', () => {
		expect(slugTextureFloat16Round(1e-5)).toBe(0);
		expect(slugTextureFloat16Round(-1e-5)).toBe(-0);
		// Smallest normal (2^-14) survives.
		expect(slugTextureFloat16Round(6.103515625e-5)).toBe(6.103515625e-5);
	});

	it('round-trips every finite bit pattern through decode → encode', () => {
		for (let bits = 0; bits < 0x10000; bits++) {
			const exp = (bits >>> 10) & 0x1f;
			const frac = bits & 0x3ff;
			if (exp === 0x1f) continue; // inf / NaN
			if (exp === 0 && frac !== 0) continue; // subnormal: encoder flushes to zero by design
			expect(slugTextureFloat16Encode(slugTextureFloat16Decode(bits))).toBe(bits);
		}
	});

	it('decodes subnormals to their exact value', () => {
		expect(slugTextureFloat16Decode(0x0001)).toBeCloseTo(5.960464477539063e-8, 12);
		expect(slugTextureFloat16Decode(0x03ff)).toBeCloseTo(6.097555160522461e-5, 10);
	});

	it('keeps NaN as NaN', () => {
		const bits = slugTextureFloat16Encode(NaN);
		expect((bits & 0x7c00) === 0x7c00 && (bits & 0x03ff) !== 0).toBe(true);
		expect(Number.isNaN(slugTextureFloat16Decode(bits))).toBe(true);
	});

	it('is idempotent on already-representable values', () => {
		const samples = [0, 1, -1, 0.75, 1234.5, -2047, 0.001953125, 60000];
		for (const v of samples) {
			const once = slugTextureFloat16Round(v);
			expect(slugTextureFloat16Round(once)).toBe(once);
		}
	});
});
