import {FORMATS, TYPES} from '@pixi/constants';
import {BaseTexture, Program, Texture} from '@pixi/core';
import type {SlugFont, SlugFontEnsureResult} from '../../../shared/slug/font';

// v6 shares the v7 vertex shader (same uniform names: projectionMatrix, translationMatrix).
import vertSource from '../../../v7/shader/slug/vert.glsl';
import fragSource from '../../../shared/shader/slug/frag.glsl';

/**
 * Cached GPU resources for a SlugFont in PixiJS v6.
 * Created once per font and shared across all SlugText instances.
 */
export interface SlugFontGpuV6 {
	curveTexture: Texture;
	bandTexture: Texture;
	fallbackWhite: Texture;
	program: Program;
	/** Reference to the `Float32Array` currently owned by the curve texture. */
	_curveBuffer: Float32Array;
	/** Reference to the band buffer view; compared by `.buffer` identity. */
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
 * Create or retrieve cached V6 GPU resources for a SlugFont, syncing
 * the curve and band textures with whatever glyph data the font now
 * holds. See {@link slugFontGpuV8} for the sync semantics — v6 uses
 * the same `BaseTexture.update()` reupload mechanism as v7.
 */
export function slugFontGpuV6(font: SlugFont, ensureResult: SlugFontEnsureResult | null = null): SlugFontGpuV6 {
	const cached = font.gpuCache as SlugFontGpuV6 | null;

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

	const cache: SlugFontGpuV6 = {
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
