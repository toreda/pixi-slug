import { Program, Shader, Texture } from '@pixi/core';
import { SlugFont } from '../../shared/slug/font';

import vertSource from '../../shared/shader/slug/vert.glsl';
import fragSource from '../../shared/shader/slug/frag.glsl';

/**
 * Creates a PixiJS v6 Shader configured for the Slug rendering algorithm.
 * Requires WebGL2 context for integer textures, texelFetch, and flat varyings.
 *
 * Note: v6 defaults to WebGL1. The application must be configured with
 * `preferWebGLVersion: 2` to enable WebGL2 features required by Slug.
 */
export function slugShader(font: SlugFont, curveTexture: Texture, bandTexture: Texture): Shader {
	const program = Program.from(vertSource, fragSource);

	const uniforms = {
		uSlugMatrix: new Float32Array(16),
		uSlugViewport: new Float32Array(2),
		uLogTextureWidth: Math.log2(font.textureWidth),
		uCurveTexture: curveTexture,
		uBandTexture: bandTexture
	};

	return new Shader(program, uniforms);
}
