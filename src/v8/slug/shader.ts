import { Shader, Texture, UniformGroup } from 'pixi.js';
import { SlugFont } from '../../shared/slug/font';

import vertSource from '../../shared/shader/slug/vert.glsl';
import fragSource from '../../shared/shader/slug/frag.glsl';

/**
 * Creates a PixiJS v8 Shader configured for the Slug rendering algorithm.
 */
export function slugShader(font: SlugFont, curveTexture: Texture, bandTexture: Texture): Shader {
	return Shader.from({
		gl: {
			vertex: vertSource,
			fragment: fragSource
		},
		resources: {
			slugUniforms: new UniformGroup({
				uSlugMatrix: { value: new Float32Array(16), type: 'mat4x4<f32>' },
				uSlugViewport: { value: new Float32Array(2), type: 'vec2<f32>' },
				uLogTextureWidth: { value: Math.log2(font.textureWidth), type: 'i32' }
			}),
			uCurveTexture: curveTexture.source,
			uBandTexture: bandTexture.source
		}
	});
}
