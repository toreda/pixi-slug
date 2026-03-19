import { GlProgram, Shader, Texture, UniformGroup } from 'pixi.js';
import { SlugFont } from '../../shared/slug/font';

import vertSource from '../../shared/shader/slug/vert.glsl';
import fragSource from '../../shared/shader/slug/frag.glsl';

/**
 * Creates a PixiJS v8 Shader configured for the Slug rendering algorithm.
 */
export function slugShader(font: SlugFont, combinedTexture: Texture, bandRowOffset: number): Shader {
	const glProgram = GlProgram.from({
		vertex: vertSource,
		fragment: fragSource
	});

	return new Shader({
		glProgram,
		resources: {
			slugUniforms: new UniformGroup({
				uSlugViewport: { value: new Float32Array([800, 400]), type: 'vec2<f32>' },
				uLogTextureWidth: { value: Math.log2(font.textureWidth), type: 'i32' },
				uBandRowOffset: { value: bandRowOffset, type: 'f32' }
			}),
			uSlugData: combinedTexture.source
		}
	});
}
