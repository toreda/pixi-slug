import {Program, Shader, Texture} from '@pixi/core';

/**
 * Creates a per-instance PixiJS v6 Shader for the Slug rendering algorithm.
 * The Program and textures are shared across instances (from SlugFont's GPU cache).
 *
 * Requires WebGL2 context for integer textures, texelFetch, and flat varyings.
 * v6 defaults to WebGL1 — the application must set `preferWebGLVersion: 2`.
 *
 * Uses the v7 vertex shader since v6 and v7 share the same uniform names
 * (projectionMatrix, translationMatrix) auto-populated by the Mesh renderer.
 */
export function slugShader(
	program: Program,
	curveTexture: Texture,
	bandTexture: Texture,
	resolution: [number, number]
): Shader {
	const uniforms = {
		uCurveTexture: curveTexture,
		uBandTexture: bandTexture,
		uResolution: new Float32Array(resolution),
		uSupersampleCount: 0,
		uStrokeExpand: 0
	};

	return new Shader(program, uniforms);
}
