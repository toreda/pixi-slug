import { GlProgram, Shader, Texture, UniformGroup } from 'pixi.js';

import vertSource from '../../shared/shader/slug/vert.glsl';
import fragSource from '../../shared/shader/slug/frag.glsl';

export interface SlugShader {
	shader: Shader;
	uniforms: UniformGroup;
}

/**
 * Creates a PixiJS v8 Shader configured for the Slug rendering algorithm.
 * Matrix and viewport uniforms (uProjectionMatrix, uWorldTransformMatrix, uResolution)
 * are auto-populated each frame by PixiJS v8's global uniform system.
 */
export function slugShader(curveTexture: Texture, bandTexture: Texture): SlugShader {
	const glProgram = GlProgram.from({
		vertex: vertSource,
		fragment: fragSource
	});

	// PixiJS v8 UniformGroup has no 'bool' type — use i32 (0/1).
	// WebGL maps glUniform1i to GLSL bool uniforms correctly.
	const uniforms = new UniformGroup({
		uSupersampleCount: { value: 0, type: 'i32' }
	});

	const shader = new Shader({
		glProgram,
		resources: {
			uCurveTexture: curveTexture.source,
			uBandTexture: bandTexture.source,
			uSupersamplingGroup: uniforms
		}
	});

	return { shader, uniforms };
}
