/**
 * Convert a Float32Array to a Uint16Array of IEEE 754 half-precision floats.
 * Used for uploading float data to rgba16float textures in WebGL2.
 */
export function float32ToFloat16(input: Float32Array): Uint16Array {
	const output = new Uint16Array(input.length);
	const view = new DataView(new ArrayBuffer(4));

	for (let i = 0; i < input.length; i++) {
		view.setFloat32(0, input[i]);
		const bits = view.getUint32(0);

		const sign = (bits >> 31) & 0x1;
		const exp = (bits >> 23) & 0xFF;
		const frac = bits & 0x7FFFFF;

		let halfSign = sign << 15;
		let halfExp: number;
		let halfFrac: number;

		if (exp === 0xFF) {
			// Infinity or NaN
			halfExp = 0x1F;
			halfFrac = frac ? 0x200 : 0; // NaN preserves non-zero frac
		} else if (exp === 0) {
			// Zero or subnormal — becomes zero in half
			halfExp = 0;
			halfFrac = 0;
		} else {
			const newExp = exp - 127 + 15;
			if (newExp >= 0x1F) {
				// Overflow — clamp to infinity
				halfExp = 0x1F;
				halfFrac = 0;
			} else if (newExp <= 0) {
				// Underflow — clamp to zero
				halfExp = 0;
				halfFrac = 0;
			} else {
				halfExp = newExp;
				halfFrac = frac >> 13;
			}
		}

		output[i] = halfSign | (halfExp << 10) | halfFrac;
	}

	return output;
}
