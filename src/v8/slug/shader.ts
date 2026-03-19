import { GlProgram, Shader, Texture } from 'pixi.js';

import vertSource from '../../shared/shader/slug/vert.glsl';
import fragSource from '../../shared/shader/slug/frag.glsl';

/**
 * Creates a PixiJS v8 Shader configured for the Slug rendering algorithm.
 * Matrix and viewport uniforms (uProjectionMatrix, uWorldTransformMatrix, uResolution)
 * are auto-populated each frame by PixiJS v8's global uniform system.
 */
export function slugShader(curveTexture: Texture, bandTexture: Texture): Shader {
	const glProgram = GlProgram.from({
		vertex: vertSource,
		fragment: fragSource
	});

	return new Shader({
		glProgram,
		resources: {
			uCurveTexture: curveTexture.source,
			uBandTexture: bandTexture.source
		}
	});
}
