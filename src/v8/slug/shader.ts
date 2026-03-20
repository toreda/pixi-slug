import {GlProgram, Shader, Texture, UniformGroup} from 'pixi.js';

export interface SlugShader {
	shader: Shader;
	uniforms: UniformGroup;
}

/**
 * Creates a per-instance PixiJS v8 Shader for the Slug rendering algorithm.
 * The GlProgram and textures are shared across instances (from SlugFont's GPU cache).
 * Only the UniformGroup is per-instance (holds uSupersampleCount).
 *
 * Matrix and viewport uniforms (uProjectionMatrix, uWorldTransformMatrix, uResolution)
 * are auto-populated each frame by PixiJS v8's global uniform system.
 */
export function slugShader(glProgram: GlProgram, curveTexture: Texture, bandTexture: Texture): SlugShader {
	// PixiJS v8 UniformGroup has no 'bool' type — use i32 (0/1).
	// WebGL maps glUniform1i to GLSL bool uniforms correctly.
	const uniforms = new UniformGroup({
		uSupersampleCount: {value: 0, type: 'i32'}
	});

	const shader = new Shader({
		glProgram,
		resources: {
			uCurveTexture: curveTexture.source,
			uBandTexture: bandTexture.source,
			uSupersamplingGroup: uniforms
		}
	});

	return {shader, uniforms};
}
