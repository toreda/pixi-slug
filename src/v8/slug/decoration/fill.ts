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
 * The full text bbox is passed in (not just the decoration rect)
 * because gradients and `repeat`/`clamp` texture fills are anchored to
 * the bbox in the glyph shader, not to the decoration rect itself.
 * Anchoring the decoration's PIXI fill to the same bbox produces
 * visual parity (gradient sweeps across both decoration and glyphs in
 * the same direction; textures tile from the same origin so seams
 * align).
 *
 * Visual divergence vs. the glyph fill:
 *  - Gradient interpolation: PIXI's straight-RGBA linear vs. our LUT
 *    sampling — color should match to within rounding.
 *  - Texture clamp mode: PIXI's `no-repeat` produces transparent
 *    outside the texture rect, matching the shader's discard.
 *  - Texture stretch mode: bbox-anchored, so one texture copy spans
 *    the bbox (not the decoration rect). At scale=1 the decoration
 *    samples whatever slice of the texture aligns with its position
 *    in the bbox — same as the shader.
 *
 * @param fill         Resolved fill state.
 * @param bboxX        Text bbox top-left X (local pixels).
 * @param bboxY        Text bbox top-left Y (local pixels).
 * @param bboxWidth    Text bbox width.
 * @param bboxHeight   Text bbox height.
 * @returns A PIXI fill object accepted by `Graphics.fill({fill: ...})`,
 *  or `null` for solid fills.
 */
export function slugBuildDecorationFill(
	fill: SlugFillResolved,
	bboxX: number,
	bboxY: number,
	bboxWidth: number,
	bboxHeight: number
): FillGradient | FillPattern | null {
	if (fill.kind === 'solid') {
		return null;
	}

	if (fill.kind === 'linear-gradient') {
		const grad = new FillGradient({
			type: 'linear',
			start: {x: bboxX + fill.start[0] * bboxWidth, y: bboxY + fill.start[1] * bboxHeight},
			end: {x: bboxX + fill.end[0] * bboxWidth, y: bboxY + fill.end[1] * bboxHeight},
			textureSpace: 'global',
			colorStops: fill.stops.map((s) => ({
				offset: s.offset,
				color: rgbaToHex(s.color)
			}))
		});
		return grad;
	}

	if (fill.kind === 'radial-gradient') {
		const cx = bboxX + fill.center[0] * bboxWidth;
		const cy = bboxY + fill.center[1] * bboxHeight;
		const radiusScale = Math.max(bboxWidth, bboxHeight);
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
	//
	// PIXI's UV pipeline for FillPattern: setTransform stores
	//     T_stored = S(1/fw, 1/fh) ∘ inv(M_user)
	// Later, generateTextureFillMatrix produces
	//     M_final = S(1/sw, 1/sh) ∘ inv(T_stored)
	//             = S(1/sw, 1/sh) ∘ M_user ∘ S(fw, fh)
	// and bakes that into per-vertex normalized UVs (sampled directly).
	//
	// For non-atlas textures (frame == source so sw==fw, sh==fh) and a
	// purely diagonal M_user (scale + translate, no rotation), the two
	// outer scales commute with M_user's linear part — so M_user.a / .d
	// pass through unchanged, while M_user.tx / .ty get divided by
	// fw / fh. The net mapping is:
	//     final_uv.x = M_user.a × vx + M_user.tx / fw
	//     final_uv.y = M_user.d × vy + M_user.ty / fh
	//
	// To match the shader, we pick a target M_correct (which IS the
	// final mapping we want), then pre-bake M_user so the sandwich
	// reproduces it: M_user has the same .a/.d as M_correct, with
	// .tx scaled by fw and .ty scaled by fh.
	//
	// Shader UV (repeat/clamp): (world - bbox - offset) / (texPx · scale)
	// Shader UV (stretch):      (world - bbox) / (bboxSize · scale)
	//                            - offset / (texPx · scale)
	const tex = resolveTextureSource(fill.source);
	if (!tex) return null;

	const sx = fill.scale[0] || 1;
	const sy = fill.scale[1] || 1;
	const ox = fill.offset[0];
	const oy = fill.offset[1];
	const fw = tex.width;
	const fh = tex.height;

	const matrix = new Matrix();
	if (fill.fit === 'stretch') {
		// M_correct: a = 1/(bboxW·sx),  tx = -bboxX/(bboxW·sx) - ox/(fw·sx)
		// M_user.tx = fw · M_correct.tx
		const a = 1 / (bboxWidth * sx);
		const d = 1 / (bboxHeight * sy);
		matrix.scale(a, d);
		matrix.translate(
			-(fw * bboxX) / (bboxWidth * sx) - ox / sx,
			-(fh * bboxY) / (bboxHeight * sy) - oy / sy
		);
	} else {
		// M_correct: a = 1/(fw·sx),  tx = -(bboxX+ox)/(fw·sx)
		// M_user.tx = fw · M_correct.tx = -(bboxX+ox)/sx
		const a = 1 / (fw * sx);
		const d = 1 / (fh * sy);
		matrix.scale(a, d);
		matrix.translate(-(bboxX + ox) / sx, -(bboxY + oy) / sy);
	}

	const repetition: 'repeat' | 'no-repeat' = fill.fit === 'repeat' ? 'repeat' : 'no-repeat';
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
