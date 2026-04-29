import {BufferImageSource, Texture} from 'pixi.js';
import {SLUG_FILL_LUT_WIDTH, slugBakeFillLut} from '../../../shared/slug/text/style/fill/lut';
import type {SlugFillResolved} from '../../../shared/slug/text/style/fill/resolved';

/**
 * Per-text GPU resources derived from a resolved fill. Holds a baked
 * gradient LUT (when the fill is a gradient) or a wrapped user texture
 * (when the fill is a texture). Disposed by `dispose()` whenever the
 * text rebuilds — the previous resources don't survive a rebuild.
 *
 * Solid fills produce `null` resources — the shader binds the font's
 * fallbackWhite placeholder for both fill samplers in that case.
 */
export interface SlugFillGpuV8 {
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

function bakeGradientTexture(fill: SlugFillResolved & {kind: 'linear-gradient' | 'radial-gradient'}): Texture {
	const data = slugBakeFillLut(fill.stops);
	return new Texture({
		source: new BufferImageSource({
			resource: data,
			width: SLUG_FILL_LUT_WIDTH,
			height: 1,
			format: 'rgba8unorm',
			autoGenerateMipmaps: false,
			scaleMode: 'linear',
			alphaMode: 'no-premultiply-alpha'
		})
	});
}

/**
 * Best-effort conversion of an arbitrary fill texture source into a
 * PIXI v8 Texture. Accepts:
 *  - PIXI v8 Texture instance — passed through unchanged
 *  - Anything else returns null (caller should fall back to solid white)
 *
 * URL / base64 / ImageBitmap loading is async and not supported by this
 * synchronous code path. For now, the texture must already be a PIXI
 * Texture. Async loading lands as a follow-up — see the spec.
 */
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

const SOLID_DEFAULTS = {
	textureSizePx: [1, 1] as [number, number],
	textureFit: 0 as 0,
	textureScale: [1, 1] as [number, number],
	textureOffset: [0, 0] as [number, number]
};

/**
 * Translate a resolved fill into the GPU resources needed by the v8
 * Slug shader. Solid fills produce a no-op record (mode 0, no
 * textures). Gradient fills bake a LUT texture; texture fills wrap the
 * user source and configure fit / scale / offset uniforms.
 *
 * The caller (v8 SlugText.rebuild) owns the returned record and MUST
 * call `dispose()` on the previous record before installing a new one.
 */
export function slugBuildFillGpuV8(fill: SlugFillResolved): SlugFillGpuV8 {
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

	// Apply sampler wrap mode based on fit. Repeat needs the texture
	// source style set to repeat addressing on both U and V; stretch
	// and clamp use clamp-to-edge (the GLSL discard handles the
	// "transparent outside" behavior for clamp). Mutating the source's
	// style at draw time is safe — PIXI v8 picks up the change on next
	// bind, same way `FillPattern` does it internally.
	const src = (tex as unknown as {source?: {style?: {addressModeU?: string; addressModeV?: string}}}).source;
	if (src && src.style) {
		const mode = fill.fit === 'repeat' ? 'repeat' : 'clamp-to-edge';
		src.style.addressModeU = mode;
		src.style.addressModeV = mode;
	}

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
		// caller disposes it. Only LUTs/wrapped sources we created get
		// destroyed here.
		dispose: () => {}
	};
}
