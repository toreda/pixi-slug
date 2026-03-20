import {BufferImageSource, GlProgram, Texture} from 'pixi.js';
import type {SlugFont} from '../../../shared/slug/font';

import vertSource from '../../../shared/shader/slug/vert.glsl';
import fragSource from '../../../shared/shader/slug/frag.glsl';

/**
 * Cached GPU resources for a SlugFont in PixiJS v8.
 * Created once per font and shared across all SlugText instances.
 */
export interface SlugFontGpuV8 {
	curveTexture: Texture;
	bandTexture: Texture;
	glProgram: GlProgram;
}

/**
 * Create or retrieve cached V8 GPU resources for a SlugFont.
 * On first call, creates curve/band textures and a GlProgram.
 * On subsequent calls, returns the same cached object.
 *
 * @param font	The SlugFont whose data should be uploaded to GPU.
 * @returns		Shared GPU resources (textures + compiled shader program).
 */
export function slugFontGpuV8(font: SlugFont): SlugFontGpuV8 {
	if (font.gpuCache) {
		return font.gpuCache as SlugFontGpuV8;
	}

	const textureWidth = font.textureWidth;

	// Curve texture: RGBA float32, one texel per 2 control points.
	const curveRows = Math.ceil(font.curveData.length / 4 / textureWidth) || 1;
	const curveTexture = new Texture({
		source: new BufferImageSource({
			resource: font.curveData,
			width: textureWidth,
			height: curveRows,
			format: 'rgba32float',
			autoGenerateMipmaps: false,
			scaleMode: 'nearest',
			alphaMode: 'no-premultiply-alpha'
		})
	});

	// Band texture: uint32 values pre-converted to float32 in SlugFont.load().
	// Uploaded as rgba32float; shader recovers uint via float-to-uint cast.
	const bandRows = Math.ceil(font.bandDataFloat32.length / 4 / textureWidth) || 1;
	const bandTexture = new Texture({
		source: new BufferImageSource({
			resource: font.bandDataFloat32,
			width: textureWidth,
			height: bandRows,
			format: 'rgba32float',
			autoGenerateMipmaps: false,
			scaleMode: 'nearest',
			alphaMode: 'no-premultiply-alpha'
		})
	});

	// GlProgram.from() caches internally by source text, but we hold
	// the reference so SlugText instances don't need to import shader sources.
	const glProgram = GlProgram.from({
		vertex: vertSource,
		fragment: fragSource
	});

	const cache: SlugFontGpuV8 = {curveTexture, bandTexture, glProgram};

	font.gpuCache = cache;
	font.setGpuDestroy(() => {
		curveTexture.destroy();
		bandTexture.destroy();
	});

	return cache;
}
