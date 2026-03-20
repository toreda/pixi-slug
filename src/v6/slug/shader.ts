import {Program, Shader, Texture} from '@pixi/core';

import vertSource from '../../v7/shader/slug/vert.glsl';
import fragSource from '../../shared/shader/slug/frag.glsl';

/**
 * Creates a PixiJS v6 Shader configured for the Slug rendering algorithm.
 * Requires WebGL2 context for integer textures, texelFetch, and flat varyings.
 *
 * Note: v6 defaults to WebGL1. The application must be configured with
 * `preferWebGLVersion: 2` to enable WebGL2 features required by Slug.
 *
 * Uses the v7 vertex shader since v6 and v7 share the same uniform names
 * (projectionMatrix, translationMatrix) auto-populated by the Mesh renderer.
 */
export function slugShader(
	curveTexture: Texture,
	bandTexture: Texture,
	resolution: [number, number]
): Shader {
	const program = Program.from(vertSource, fragSource);

	const uniforms = {
		uCurveTexture: curveTexture,
		uBandTexture: bandTexture,
		uResolution: new Float32Array(resolution),
		uSupersampleCount: 0
	};

	return new Shader(program, uniforms);
}
