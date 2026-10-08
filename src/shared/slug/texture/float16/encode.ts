/** Shared scratch buffer for float32 bit extraction (avoids per-call allocation). */
const _buf = new ArrayBuffer(4);
const _f32 = new Float32Array(_buf);
const _u32 = new Uint32Array(_buf);

/**
 * Encode a number as the 16-bit pattern of an IEEE 754 half-precision
 * float, using round-to-nearest-even. This is the exact value the GPU
 * reads back from an `rgba16float` texture, so every CPU-side computation
 * that must agree with the shader (band assignment in particular) rounds
 * through this function first — see {@link slugTextureFloat16Round}.
 *
 * Half subnormals (|x| < 2^-14 ≈ 6.1e-5) are flushed to zero so the CPU
 * never depends on GPU subnormal handling. For font-unit coordinates the
 * flushed range is far below any meaningful value.
 *
 * Values beyond the half range (|x| > 65504) clamp to ±Infinity.
 */
export function slugTextureFloat16Encode(value: number): number {
	_f32[0] = value;
	const bits = _u32[0];

	const sign = (bits >>> 16) & 0x8000;
	const exp = (bits >>> 23) & 0xff;
	const frac = bits & 0x7fffff;

	if (exp === 0xff) {
		// Infinity or NaN. Keep NaN non-zero in the mantissa.
		return sign | 0x7c00 | (frac !== 0 ? 0x200 : 0);
	}

	// Rebias exponent from float32 (127) to float16 (15).
	const halfExp = exp - 127 + 15;

	if (halfExp >= 0x1f) {
		// Overflow → infinity
		return sign | 0x7c00;
	}

	if (halfExp <= 0) {
		// Would be a half subnormal (or smaller) → flush to zero.
		return sign;
	}

	// Round-to-nearest-even on the 13 bits dropped from the mantissa.
	const mantissa = frac >>> 13;
	const remainder = frac & 0x1fff;
	let result = sign | (halfExp << 10) | mantissa;
	if (remainder > 0x1000 || (remainder === 0x1000 && (mantissa & 1) === 1)) {
		// Incrementing the mantissa may carry into the exponent; adding 1 to
		// the packed value handles that (and overflow to infinity) naturally.
		result += 1;
	}
	return result;
}
