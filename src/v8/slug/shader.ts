import {GlProgram, Shader, Texture, UniformGroup} from 'pixi.js';

export interface SlugShader {
	shader: Shader;
	uniforms: UniformGroup;
}

/**
 * Creates a per-instance PixiJS v8 Shader for the Slug rendering algorithm.
 * The GlProgram and the curve/band textures are shared across instances
 * (owned by SlugFont's GPU cache); the UniformGroup and the fill samplers
 * are per-instance — they hold per-text state (supersampling, stroke
 * gradient alpha, fill mode, fill bbox, fill gradient LUT, fill texture).
 *
 * Matrix and viewport uniforms (uProjectionMatrix, uWorldTransformMatrix,
 * uResolution) are auto-populated each frame by PixiJS v8's global uniform
 * system.
 *
 * @param glProgram      Compiled program from `slugFontGpuV8`.
 * @param curveTexture   Curve texture from the font (shared).
 * @param bandTexture    Band texture from the font (shared).
 * @param fallbackWhite  1x1 white texture used as a placeholder when the
 *                       text has no gradient or fill texture. Sampler
 *                       bindings always need a valid texture even when the
 *                       sampler isn't read at runtime.
 */
export function slugShader(
	glProgram: GlProgram,
	curveTexture: Texture,
	bandTexture: Texture,
	fallbackWhite: Texture
): SlugShader {
	// PixiJS v8 UniformGroup has no 'bool' type — use i32 (0/1).
	// WebGL maps glUniform1i to GLSL bool uniforms correctly.
	const uniforms = new UniformGroup({
		uSupersampleCount: {value: 0, type: 'i32'},
		uStrokeExpand: {value: 0, type: 'f32'},
		uStrokeAlphaStart: {value: 1, type: 'f32'},
		uStrokeAlphaRate: {value: 0, type: 'f32'},
		// Fill mode: 0=solid, 1=linear, 2=radial, 3=texture.
		uFillMode: {value: 0, type: 'i32'},
		// Fill bbox in object/model-local pixel space — used by the
		// vertex shader to compute vFillUV. xy=min, zw=size.
		uFillBoundsPx: {value: new Float32Array([0, 0, 1, 1]), type: 'vec4<f32>'},
		// Linear: xy=start, zw=end. Radial: xy=center, z=innerR, w=outerR.
		uFillParams0: {value: new Float32Array([0, 0, 1, 0]), type: 'vec4<f32>'},
		// Texture coord transform applied before sampling uFillTexture.
		// Stored row-major; mat3 in WGSL/GLSL matches column-major upload,
		// PixiJS handles the transpose.
		uFillTextureXform: {
			value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]),
			type: 'mat3x3<f32>'
		}
	});

	const shader = new Shader({
		glProgram,
		resources: {
			uCurveTexture: curveTexture.source,
			uBandTexture: bandTexture.source,
			uFillGradient: fallbackWhite.source,
			uFillTexture: fallbackWhite.source,
			uSupersamplingGroup: uniforms
		}
	});

	return {shader, uniforms};
}
