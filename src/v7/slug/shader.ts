import { Program, Shader, Texture, UniformGroup } from '@pixi/core';
import { SlugFont } from '../../shared/slug/font';

import vertSource from '../../shared/shader/slug/vert.glsl';
import fragSource from '../../shared/shader/slug/frag.glsl';

/**
 * Creates a PixiJS v7 Shader configured for the Slug rendering algorithm.
 * Requires WebGL2 context for integer textures, texelFetch, and flat varyings.
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
