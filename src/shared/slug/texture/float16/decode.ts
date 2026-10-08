/** Shared scratch buffer for float32 bit assembly (avoids per-call allocation). */
const _buf = new ArrayBuffer(4);
const _f32 = new Float32Array(_buf);
const _u32 = new Uint32Array(_buf);

/**
 * Decode the 16-bit pattern of an IEEE 754 half-precision float into a
 * JavaScript number. Inverse of {@link slugTextureFloat16Encode}.
 *
 * Half subnormals decode to their exact value even though the encoder
 * never produces them, so the decoder is a faithful reader of any buffer.
 */
export function slugTextureFloat16Decode(bits: number): number {
	const sign = (bits & 0x8000) << 16;
	const exp = (bits >>> 10) & 0x1f;
	const frac = bits & 0x3ff;

	if (exp === 0) {
		if (frac === 0) {
			_u32[0] = sign;
			return _f32[0];
		}
		// Subnormal: value = frac * 2^-24
		_u32[0] = sign;
		return _f32[0] + (sign ? -frac : frac) * 5.960464477539063e-8;
	}

	if (exp === 0x1f) {
		_u32[0] = sign | 0x7f800000 | (frac !== 0 ? frac << 13 : 0);
		return _f32[0];
	}

	_u32[0] = sign | ((exp - 15 + 127) << 23) | (frac << 13);
	return _f32[0];
}
