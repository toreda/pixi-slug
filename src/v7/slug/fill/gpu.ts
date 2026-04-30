import {FORMATS, TYPES, WRAP_MODES} from '@pixi/constants';
import {BaseTexture, Texture} from '@pixi/core';
import {SLUG_FILL_LUT_WIDTH, slugBakeFillLut} from '../../../shared/slug/text/style/fill/lut';
import type {SlugFillResolved} from '../../../shared/slug/text/style/fill/resolved';

/**
 * Per-text GPU resources derived from a resolved fill. Holds a baked
 * gradient LUT (when the fill is a gradient) or a wrapped user texture
 * (when the fill is a texture). Disposed by `dispose()` whenever the
 * text rebuilds — the previous resources don't survive a rebuild.
 *
 * Solid fills produce `null` resources — the caller binds the font's
 * fallbackWhite placeholder for both fill samplers in that case.
 *
 * Shared by v6 and v7 SlugText (the @pixi/core 6.x and 7.x APIs are
 * identical for the surface used here: `BaseTexture.fromBuffer`,
 * `Texture`, and `WRAP_MODES`).
 */
export interface SlugFillGpuV7 {
	/** Gradient LUT texture, or null when the fill is solid / texture. */
	gradient: Texture | null;
	/** User-supplied fill texture, or null when the fill is solid / gradient. */
	texture: Texture | null;
	/**
	 * Mode index for `uFillMode`: 0=solid, 1=linear, 2=radial, 3=texture.
	 */
	mode: 0 | 1 | 2 | 3;
	/**
	 * Linear: [start.x, start.y, end.x, end.y] in normalized bbox UV.
	 * Radial: [center.x, center.y, innerR, outerR] in normalized bbox UV.
	 * Solid / texture: zeros.
	 */
	params0: [number, number, number, number];
	/** Texture pixel size for `uFillTextureSizePx`. [1, 1] for non-texture fills. */
	textureSizePx: [number, number];
	/** `uFillTextureFit`: 0=stretch, 1=repeat, 2=clamp. 0 for non-texture fills. */
	textureFit: 0 | 1 | 2;
	/** Per-axis texture scale uniform value. [1, 1] for non-texture fills. */
	textureScale: [number, number];
	/** Pixel-space texture offset uniform value. [0, 0] for non-texture fills. */
	textureOffset: [number, number];
	/** Owns dispose responsibility for any per-text textures created here. */
	dispose(): void;
}

function bakeGradientTexture(
	fill: SlugFillResolved & {kind: 'linear-gradient' | 'radial-gradient'}
): Texture {
	const data = slugBakeFillLut(fill.stops);
	const base = BaseTexture.fromBuffer(data, SLUG_FILL_LUT_WIDTH, 1, {
		format: FORMATS.RGBA,
		type: TYPES.UNSIGNED_BYTE
	});
	// CLAMP avoids wrap-around bleeding at the LUT edges. The shader maps
	// t to [0,1] but rounding can land just outside, and a wrap there
	// would sample the opposite end of the gradient.
	base.wrapMode = WRAP_MODES.CLAMP;
	return new Texture(base);
}

/**
 * Best-effort conversion of an arbitrary fill texture source into a
 * PIXI v6/v7 Texture. Accepts:
 *  - PIXI Texture instance — passed through unchanged
 *  - Anything else returns null (caller falls back to solid white)
 *
 * URL / base64 / ImageBitmap loading is async and not supported by this
 * synchronous code path. The texture must already be a PIXI Texture.
 */
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

const SOLID_DEFAULTS = {
	textureSizePx: [1, 1] as [number, number],
	textureFit: 0 as 0,
	textureScale: [1, 1] as [number, number],
	textureOffset: [0, 0] as [number, number]
};

/**
 * Translate a resolved fill into the GPU resources needed by the v6/v7
 * Slug shader. Solid fills produce a no-op record (mode 0, no
 * textures). Gradient fills bake a LUT texture; texture fills wrap the
 * user source and configure fit / scale / offset uniforms.
 *
 * The caller (v6/v7 SlugText.rebuild) owns the returned record and MUST
 * call `dispose()` on the previous record before installing a new one.
 */
export function slugBuildFillGpuV7(fill: SlugFillResolved): SlugFillGpuV7 {
	if (fill.kind === 'solid') {
		return {
			gradient: null,
			texture: null,
			mode: 0,
			params0: [0, 0, 0, 0],
			...SOLID_DEFAULTS,
			dispose: () => {}
		};
	}

	if (fill.kind === 'linear-gradient') {
		const gradient = bakeGradientTexture(fill);
		return {
			gradient,
			texture: null,
			mode: 1,
			params0: [fill.start[0], fill.start[1], fill.end[0], fill.end[1]],
			...SOLID_DEFAULTS,
			dispose: () => {
				gradient.destroy(true);
			}
		};
	}

	if (fill.kind === 'radial-gradient') {
		const gradient = bakeGradientTexture(fill);
		return {
			gradient,
			texture: null,
			mode: 2,
			params0: [fill.center[0], fill.center[1], fill.innerRadius, fill.outerRadius],
			...SOLID_DEFAULTS,
			dispose: () => {
				gradient.destroy(true);
			}
		};
	}

	// Texture mode.
	const tex = resolveTextureSource(fill.source);
	if (!tex) {
		// Texture source could not be resolved — fall back to solid
		// (caller binds fallbackWhite).
		return {
			gradient: null,
			texture: null,
			mode: 0,
			params0: [0, 0, 0, 0],
			...SOLID_DEFAULTS,
			dispose: () => {}
		};
	}

	// Apply sampler wrap mode based on fit. Repeat needs WRAP_MODES.REPEAT
	// on both U and V; stretch and clamp use CLAMP (the GLSL discard
	// handles the "transparent outside" behavior for clamp). Mutating
	// the baseTexture's wrapMode is safe — the @pixi/core texture system
	// rebinds based on the current value at draw time.
	tex.baseTexture.wrapMode = fill.fit === 'repeat' ? WRAP_MODES.REPEAT : WRAP_MODES.CLAMP;

	const fitIndex: 0 | 1 | 2 =
		fill.fit === 'repeat' ? 1 : fill.fit === 'clamp' ? 2 : 0;

	return {
		gradient: null,
		texture: tex,
		mode: 3,
		params0: [0, 0, 0, 0],
		textureSizePx: [tex.width, tex.height],
		textureFit: fitIndex,
		textureScale: [fill.scale[0], fill.scale[1]],
		textureOffset: [fill.offset[0], fill.offset[1]],
		// We do not own the user-supplied texture — caller passed it in,
		// caller disposes it. Only LUTs we created get destroyed here.
		dispose: () => {}
	};
}
