import { Program, Shader, Texture } from '@pixi/core';

import vertSource from '../shader/slug/vert.glsl';
import fragSource from '../../shared/shader/slug/frag.glsl';

/**
 * Creates a PixiJS v7 Shader configured for the Slug rendering algorithm.
 * Uses v7-specific vertex shader (different uniform names from v8).
 * Fragment shader is shared across versions.
 *
 * The uResolution uniform must be set manually before each render since
 * PixiJS v7 does not provide a built-in viewport size uniform.
 */
export function slugShader(curveTexture: Texture, bandTexture: Texture, resolution: [number, number]): Shader {
	const program = Program.from(vertSource, fragSource);

	const uniforms = {
		uCurveTexture: curveTexture,
		uBandTexture: bandTexture,
		uResolution: new Float32Array(resolution),
	};

	return new Shader(program, uniforms);
}
