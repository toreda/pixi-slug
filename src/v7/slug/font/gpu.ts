import {FORMATS, TYPES} from '@pixi/constants';
import {BaseTexture, Program, Texture} from '@pixi/core';
import type {SlugFont, SlugFontEnsureResult} from '../../../shared/slug/font';

import vertSource from '../../shader/slug/vert.glsl';
import fragSource from '../../../shared/shader/slug/frag.glsl';

/**
 * Cached GPU resources for a SlugFont in PixiJS v7.
 * Created once per font and shared across all SlugText instances.
 *
 * `fallbackWhite` is the placeholder bound to the fill samplers
 * (`uFillGradient`, `uFillTexture`) when a text instance has no gradient
 * or fill texture. WebGL requires a valid texture binding for every
 * sampler in the program even when the sampler isn't read at runtime;
 * `Texture.WHITE` is a PIXI built-in shared white texture, so the cache
 * doesn't own its lifetime.
 */
export interface SlugFontGpuV7 {
	curveTexture: Texture;
	bandTexture: Texture;
	fallbackWhite: Texture;
	program: Program;
	/**
	 * Reference to the `Float32Array` currently owned by the curve
	 * texture. When `font.curveData` no longer matches this reference,
	 * the buffer was reallocated by an `ensureGlyphs` grow and the
	 * curve texture must be recreated.
	 */
	_curveBuffer: Float32Array;
	/** Reference to the band buffer view. Compared by `.buffer` identity. */
	_bandBuffer: Float32Array;
}

function bandViewAsFloat(bandData: Uint32Array): Float32Array {
	return new Float32Array(bandData.buffer, bandData.byteOffset, bandData.length);
}

function makeCurveTexture(font: SlugFont): Texture {
	const textureWidth = font.textureWidth;
	const curveRows = Math.ceil(font.curveData.length / 4 / textureWidth) || 1;
	const base = BaseTexture.fromBuffer(font.curveData, textureWidth, curveRows, {
		format: FORMATS.RGBA,
		type: TYPES.FLOAT
	});
	return new Texture(base);
}

function makeBandTexture(font: SlugFont, bandView: Float32Array): Texture {
	const textureWidth = font.textureWidth;
	const bandRows = Math.ceil(font.bandData.length / 4 / textureWidth) || 1;
	const base = BaseTexture.fromBuffer(bandView, textureWidth, bandRows, {
		format: FORMATS.RGBA,
		type: TYPES.FLOAT
	});
	return new Texture(base);
}

/**
 * Create or retrieve cached V7 GPU resources for a SlugFont, syncing
 * the curve and band textures with whatever glyph data the font now
 * holds. See {@link slugFontGpuV8} for the full sync semantics —
 * behavior is identical aside from the v7-specific `BaseTexture` API.
 */
export function slugFontGpuV7(font: SlugFont, ensureResult: SlugFontEnsureResult | null = null): SlugFontGpuV7 {
	const cached = font.gpuCache as SlugFontGpuV7 | null;

	if (cached) {
		const bandView = bandViewAsFloat(font.bandData);
		let curveChanged = false;
		let bandChanged = false;

		if (cached._curveBuffer !== font.curveData) {
			cached.curveTexture.destroy(true);
			cached.curveTexture = makeCurveTexture(font);
			cached._curveBuffer = font.curveData;
			curveChanged = true;
		}
		if (cached._bandBuffer.buffer !== bandView.buffer) {
			cached.bandTexture.destroy(true);
			cached.bandTexture = makeBandTexture(font, bandView);
			cached._bandBuffer = bandView;
			bandChanged = true;
		}

		// Same buffer reference + new data appended → reupload via update().
		// PIXI v7's BaseTexture.update() bumps the dirty counter and the
		// texture system re-uploads the resource on next bind.
		if (!curveChanged && ensureResult?.addedAny) {
			cached.curveTexture.baseTexture.update();
		}
		if (!bandChanged && ensureResult?.addedAny) {
			cached.bandTexture.baseTexture.update();
		}

		return cached;
	}

	const bandView = bandViewAsFloat(font.bandData);
	const curveTexture = makeCurveTexture(font);
	const bandTexture = makeBandTexture(font, bandView);
	const program = Program.from(vertSource, fragSource);

	const cache: SlugFontGpuV7 = {
		curveTexture,
		bandTexture,
		fallbackWhite: Texture.WHITE,
		program,
		_curveBuffer: font.curveData,
		_bandBuffer: bandView
	};

	font.gpuCache = cache;
	font.setGpuDestroy(() => {
		cache.curveTexture.destroy(true);
		cache.bandTexture.destroy(true);
	});

	return cache;
}
