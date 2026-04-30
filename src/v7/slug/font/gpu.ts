import {FORMATS, TYPES} from '@pixi/constants';
import {BaseTexture, Program, Texture} from '@pixi/core';
import type {SlugFont} from '../../../shared/slug/font';

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
}

/**
 * Create or retrieve cached V7 GPU resources for a SlugFont.
 * On first call, creates curve/band textures and a compiled Program.
 * On subsequent calls, returns the same cached object.
 */
export function slugFontGpuV7(font: SlugFont): SlugFontGpuV7 {
	if (font.gpuCache) {
		return font.gpuCache as SlugFontGpuV7;
	}

	const textureWidth = font.textureWidth;

	// Curve texture: RGBA float32
	const curveRows = Math.ceil(font.curveData.length / 4 / textureWidth) || 1;
	const curveBase = BaseTexture.fromBuffer(font.curveData, textureWidth, curveRows, {
		format: FORMATS.RGBA,
		type: TYPES.FLOAT
	});
	const curveTexture = new Texture(curveBase);

	// Band texture: uint32 data uploaded as float32 via bit-pattern reinterpretation.
	// The shader uses floatBitsToUint() to recover exact uint32 values losslessly.
	const bandRows = Math.ceil(font.bandData.length / 4 / textureWidth) || 1;
	const bandDataAsFloat = new Float32Array(font.bandData.buffer, font.bandData.byteOffset, font.bandData.length);
	const bandBase = BaseTexture.fromBuffer(bandDataAsFloat, textureWidth, bandRows, {
		format: FORMATS.RGBA,
		type: TYPES.FLOAT
	});
	const bandTexture = new Texture(bandBase);

	const program = Program.from(vertSource, fragSource);

	const cache: SlugFontGpuV7 = {curveTexture, bandTexture, fallbackWhite: Texture.WHITE, program};

	font.gpuCache = cache;
	font.setGpuDestroy(() => {
		curveTexture.destroy(true);
		bandTexture.destroy(true);
	});

	return cache;
}
