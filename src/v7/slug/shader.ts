import {Program, Shader, Texture} from '@pixi/core';

/**
 * Creates a per-instance PixiJS v7 Shader for the Slug rendering algorithm.
 * The Program and textures are shared across instances (from SlugFont's GPU cache).
 *
 * The uResolution uniform must be set manually before each render since
 * PixiJS v7 does not provide a built-in viewport size uniform.
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
		uResolution: new Float32Array(resolution)
	};

	return new Shader(program, uniforms);
}
