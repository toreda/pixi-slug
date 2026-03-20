import {BaseTexture, FORMATS, Program, TYPES, Texture} from '@pixi/core';
import type {SlugFont} from '../../../shared/slug/font';

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
	program: Program;
}

/**
 * Create or retrieve cached V6 GPU resources for a SlugFont.
 * On first call, creates curve/band textures and a compiled Program.
 * On subsequent calls, returns the same cached object.
 */
export function slugFontGpuV6(font: SlugFont): SlugFontGpuV6 {
	if (font.gpuCache) {
		return font.gpuCache as SlugFontGpuV6;
	}

	const textureWidth = font.textureWidth;

	// Curve texture: RGBA float32
	const curveRows = Math.ceil(font.curveData.length / 4 / textureWidth) || 1;
	const curveBase = BaseTexture.fromBuffer(font.curveData, textureWidth, curveRows, {
		format: FORMATS.RGBA,
		type: TYPES.FLOAT
	});
	const curveTexture = new Texture(curveBase);

	// Band texture: pre-converted float32 from SlugFont.load()
	const bandRows = Math.ceil(font.bandDataFloat32.length / 4 / textureWidth) || 1;
	const bandBase = BaseTexture.fromBuffer(font.bandDataFloat32, textureWidth, bandRows, {
		format: FORMATS.RGBA,
		type: TYPES.FLOAT
	});
	const bandTexture = new Texture(bandBase);

	const program = Program.from(vertSource, fragSource);

	const cache: SlugFontGpuV6 = {curveTexture, bandTexture, program};

	font.gpuCache = cache;
	font.setGpuDestroy(() => {
		curveTexture.destroy(true);
		bandTexture.destroy(true);
	});

	return cache;
}
