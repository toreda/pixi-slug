import type {SlugFillResolvedGradientStop} from './resolved';

/** LUT pixel count. Tied to the shader contract — the fragment shader
 * samples this LUT with `texture(uFillGradient, vec2(t, 0.5))` so any
 * width works, but 256 gives a clean ramp at near-zero memory cost
 * (1 KB per gradient). */
export const SLUG_FILL_LUT_WIDTH = 256;

/**
 * Bake a sorted-stops gradient into a 256×1 RGBA8 LUT (Uint8Array of
 * length 1024). Each pixel corresponds to a normalized parameter t in
 * `[0, 1]`; colors between adjacent stops are linearly interpolated in
 * straight (non-premultiplied) RGBA.
 *
 * Stops must already be sorted by `offset` ascending (the resolver
 * does this). Offsets outside `0..1` are treated as 0/1 respectively
 * — pixels before the first stop snap to its color, pixels after the
 * last stop snap to its color.
 *
 * Returns a fresh Uint8Array; the caller owns its lifetime. The
 * version-specific layer is responsible for wrapping into a PIXI
 * Texture and disposing it on rebuild.
 */
export function slugBakeFillLut(stops: readonly SlugFillResolvedGradientStop[]): Uint8Array {
	const out = new Uint8Array(SLUG_FILL_LUT_WIDTH * 4);
	if (stops.length === 0) {
		return out;
	}

	const n = stops.length;

	for (let px = 0; px < SLUG_FILL_LUT_WIDTH; px++) {
		const t = px / (SLUG_FILL_LUT_WIDTH - 1);

		// Snap to ends.
		if (t <= stops[0].offset) {
			const c = stops[0].color;
			const o = px * 4;
			out[o] = Math.round(c[0] * 255);
			out[o + 1] = Math.round(c[1] * 255);
			out[o + 2] = Math.round(c[2] * 255);
			out[o + 3] = Math.round(c[3] * 255);
			continue;
		}
		if (t >= stops[n - 1].offset) {
			const c = stops[n - 1].color;
			const o = px * 4;
			out[o] = Math.round(c[0] * 255);
			out[o + 1] = Math.round(c[1] * 255);
			out[o + 2] = Math.round(c[2] * 255);
			out[o + 3] = Math.round(c[3] * 255);
			continue;
		}

		// Find the stop pair (lo, hi) such that lo.offset <= t <= hi.offset.
		let hi = 1;
		while (hi < n && stops[hi].offset < t) hi++;
		const lo = hi - 1;
		const span = stops[hi].offset - stops[lo].offset;
		const u = span > 0 ? (t - stops[lo].offset) / span : 0;

		const a = stops[lo].color;
		const b = stops[hi].color;
		const o = px * 4;
		out[o] = Math.round((a[0] + (b[0] - a[0]) * u) * 255);
		out[o + 1] = Math.round((a[1] + (b[1] - a[1]) * u) * 255);
		out[o + 2] = Math.round((a[2] + (b[2] - a[2]) * u) * 255);
		out[o + 3] = Math.round((a[3] + (b[3] - a[3]) * u) * 255);
	}

	return out;
}
