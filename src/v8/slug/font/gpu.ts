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

	// Band texture: uint32 data uploaded as rgba32float via bit-pattern reinterpretation.
	// PixiJS v8 has a bug in mapFormatToGlFormat that maps rgba32uint → gl.RGBA instead
	// of gl.RGBA_INTEGER, causing GL_INVALID_OPERATION on upload. Workaround: share the
	// ArrayBuffer between Uint32Array and Float32Array so the exact bit patterns are
	// preserved without value conversion. The shader uses floatBitsToUint() to recover
	// the original uint32 values losslessly.
	const bandRows = Math.ceil(font.bandData.length / 4 / textureWidth) || 1;
	const bandDataAsFloat = new Float32Array(font.bandData.buffer, font.bandData.byteOffset, font.bandData.length);
	const bandTexture = new Texture({
		source: new BufferImageSource({
			resource: bandDataAsFloat,
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
