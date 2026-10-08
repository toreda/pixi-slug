import {slugTextureFloat16Decode} from './decode';
import {slugTextureFloat16Encode} from './encode';

/**
 * Round a number to the nearest value representable as an IEEE 754
 * half-precision float — the precision of the curve texture. CPU code
 * that must agree with the fragment shader (band assignment, bounds)
 * quantizes control points through this function so both sides see
 * identical coordinates.
 */
export function slugTextureFloat16Round(value: number): number {
	return slugTextureFloat16Decode(slugTextureFloat16Encode(value));
}
