import {Texture} from '@pixi/core';
import {Matrix} from '@pixi/math';
import type {SlugFillResolved} from '../../../shared/slug/text/style/fill/resolved';

function makeMatrix(a: number, d: number, tx: number, ty: number): Matrix {
	return new Matrix(a, 0, 0, d, tx, ty);
}

/**
 * Texture-fill descriptor for a decoration rect, in PixiJS v6/v7's
 * `Graphics.beginTextureFill` form. Returned by
 * `slugBuildDecorationFillV7` when the resolved fill is a texture; null
 * otherwise (the caller falls back to a solid color).
 *
 * GRADIENTS ARE NOT SUPPORTED on v6/v7 decorations. v6/v7 `Graphics`
 * has no native gradient fill (v8 added `FillGradient`). Rendering a
 * gradient would require baking the LUT into a `RenderTexture`, which
 * needs a Renderer reference at rebuild time that `text.ts` does not
 * currently hold. Decorations on a gradient-filled SlugText fall back
 * to the representative solid color from `_color`.
 */
export interface SlugDecorationTextureFillV7 {
	texture: Texture;
	matrix: Matrix;
	alpha: number;
}

/**
 * Build a v6/v7 texture-fill descriptor sized to the text bbox so the
 * decoration's tile origin matches the glyph fill's. Returns null for
 * solid and gradient fills (caller draws solid for both — see file
 * comment for why gradients aren't supported here).
 *
 * The full text bbox is passed in (not just the decoration rect)
 * because `repeat`/`clamp` texture fills are anchored to the bbox in
 * the glyph shader, not to the decoration rect itself. Anchoring the
 * decoration's PIXI fill to the same bbox produces visual parity:
 * textures tile from the same origin so seams align with the glyphs.
 *
 * UV math (v6/v7 `addUvs` does):
 *     uv = M_user · vertex_world / frame_size
 *
 * To match the shader's
 *   repeat/clamp: uv = (world - bbox - offset) / (texPx · scale)
 *   stretch:      uv = (world - bbox) / (bboxSize · scale) - offset / (texPx · scale)
 *
 * we choose M_user so the final mapping is correct after the
 * `frame_size` divide.
 *
 * @param fill         Resolved fill state.
 * @param bboxX        Text bbox top-left X (local pixels).
 * @param bboxY        Text bbox top-left Y (local pixels).
 * @param bboxWidth    Text bbox width.
 * @param bboxHeight   Text bbox height.
 * @param decorationAlpha  Alpha override for `Graphics.beginTextureFill`.
 * @returns A descriptor consumed by `gfx.beginTextureFill(...)`, or null
 *  for solid / gradient fills.
 */
export function slugBuildDecorationFillV7(
	fill: SlugFillResolved,
	bboxX: number,
	bboxY: number,
	bboxWidth: number,
	bboxHeight: number,
	decorationAlpha: number
): SlugDecorationTextureFillV7 | null {
	if (fill.kind !== 'texture') {
		// Solid → caller already draws solid. Gradients are unsupported
		// on v6/v7 decorations; caller falls back to solid color.
		return null;
	}

	const tex = resolveTextureSource(fill.source);
	if (!tex) return null;

	const sx = fill.scale[0] || 1;
	const sy = fill.scale[1] || 1;
	const ox = fill.offset[0];
	const oy = fill.offset[1];
	const fw = tex.width;
	const fh = tex.height;

	let matrix: Matrix;
	if (fill.fit === 'stretch') {
		// uv = (vx-bboxX)/(bboxW·sx) - ox/(fw·sx) after divide by fw.
		// Pick M_user: a = fw/(bboxW·sx), tx = -fw·bboxX/(bboxW·sx) - ox/sx.
		matrix = makeMatrix(
			fw / (bboxWidth * sx),
			fh / (bboxHeight * sy),
			-(fw * bboxX) / (bboxWidth * sx) - ox / sx,
			-(fh * bboxY) / (bboxHeight * sy) - oy / sy
		);
	} else {
		// repeat / clamp: uv = (vx - bboxX - ox)/(fw·sx) after divide by fw.
		// Pick M_user: a = 1/sx, tx = -(bboxX + ox)/sx.
		matrix = makeMatrix(
			1 / sx,
			1 / sy,
			-(bboxX + ox) / sx,
			-(bboxY + oy) / sy
		);
	}

	return {texture: tex, matrix, alpha: decorationAlpha};
}

function resolveTextureSource(source: unknown): Texture | null {
	if (source && typeof source === 'object') {
		const maybe = source as {baseTexture?: unknown; width?: unknown; height?: unknown};
		if (
			'baseTexture' in maybe &&
			typeof maybe.width === 'number' &&
			typeof maybe.height === 'number'
		) {
			return source as Texture;
		}
	}
	return null;
}
