import {FillGradient, FillPattern, Texture, Matrix} from 'pixi.js';
import type {SlugFillResolved} from '../../../shared/slug/text/style/fill/resolved';

/**
 * Build a PIXI v8 fill argument from a resolved Slug fill, sized to a
 * specific decoration rectangle in local pixel space.
 *
 * The decoration is rendered through PIXI's `Graphics` API (not the
 * Slug fragment shader), so we construct a parallel PIXI fill object —
 * `FillGradient` for gradients, `FillPattern` for textures — that
 * approximates what the glyph fill draws.
 *
 * Visual divergence from the glyph fill:
 *  - PIXI's gradient interpolation is sRGB-naive linear, the same
 *    model our LUT uses, so colors should match to within rounding.
 *  - Coordinate space: glyph fill uses the **text bbox**; decorations
 *    use the **decoration rectangle**. This means a horizontal linear
 *    gradient that runs across the whole text won't carry through to
 *    a decoration line — the line will instead show the full gradient
 *    sweep across its own width. Acceptable for v1; flagged in the
 *    spec for the follow-up Slug-shader-quad rewrite if visual parity
 *    becomes important.
 *
 * @param fill          Resolved fill state.
 * @param x             Decoration rect top-left X (local pixels).
 * @param y             Decoration rect top-left Y (local pixels).
 * @param width         Decoration rect width (local pixels).
 * @param height        Decoration rect height (local pixels).
 * @returns A PIXI fill object accepted by `Graphics.fill({fill: ...})`,
 *  or `null` for solid fills (caller should use its own flat-color path).
 */
export function slugBuildDecorationFill(
	fill: SlugFillResolved,
	x: number,
	y: number,
	width: number,
	height: number
): FillGradient | FillPattern | null {
	if (fill.kind === 'solid') {
		return null;
	}

	if (fill.kind === 'linear-gradient') {
		const grad = new FillGradient({
			type: 'linear',
			start: {x: x + fill.start[0] * width, y: y + fill.start[1] * height},
			end: {x: x + fill.end[0] * width, y: y + fill.end[1] * height},
			textureSpace: 'global',
			colorStops: fill.stops.map((s) => ({
				offset: s.offset,
				color: rgbaToHex(s.color)
			}))
		});
		return grad;
	}

	if (fill.kind === 'radial-gradient') {
		const cx = x + fill.center[0] * width;
		const cy = y + fill.center[1] * height;
		const radiusScale = Math.max(width, height);
		const grad = new FillGradient({
			type: 'radial',
			center: {x: cx, y: cy},
			innerRadius: fill.innerRadius * radiusScale,
			outerRadius: fill.outerRadius * radiusScale,
			textureSpace: 'global',
			colorStops: fill.stops.map((s) => ({
				offset: s.offset,
				color: rgbaToHex(s.color)
			}))
		});
		return grad;
	}

	// Texture mode.
	const tex = resolveTextureSource(fill.source);
	if (!tex) return null;

	const matrix = new Matrix();
	matrix.translate(x, y);
	matrix.scale(width, height);
	// Apply the user-supplied transform (scale, rotation, translation
	// in normalized bbox space) on top of the rect mapping.
	const inner = new Matrix();
	inner.translate(fill.translation[0], fill.translation[1]);
	inner.rotate(fill.rotation);
	inner.scale(fill.scale[0], fill.scale[1]);
	matrix.append(inner);

	const repetition = fill.wrap === 'repeat' ? 'repeat' : 'no-repeat';
	const pattern = new FillPattern(tex, repetition);
	pattern.setTransform(matrix);
	return pattern;
}

function rgbaToHex(rgba: readonly [number, number, number, number]): string {
	const r = Math.max(0, Math.min(255, Math.round(rgba[0] * 255)))
		.toString(16)
		.padStart(2, '0');
	const g = Math.max(0, Math.min(255, Math.round(rgba[1] * 255)))
		.toString(16)
		.padStart(2, '0');
	const b = Math.max(0, Math.min(255, Math.round(rgba[2] * 255)))
		.toString(16)
		.padStart(2, '0');
	const a = Math.max(0, Math.min(255, Math.round(rgba[3] * 255)))
		.toString(16)
		.padStart(2, '0');
	return `#${r}${g}${b}${a}`;
}

function resolveTextureSource(source: unknown): Texture | null {
	if (source && typeof source === 'object') {
		const maybe = source as {source?: unknown; width?: unknown; height?: unknown};
		if (
			'source' in maybe &&
			typeof maybe.width === 'number' &&
			typeof maybe.height === 'number'
		) {
			return source as Texture;
		}
	}
	return null;
}
