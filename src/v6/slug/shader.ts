import {Program, Shader, Texture} from '@pixi/core';

/**
 * Creates a per-instance PixiJS v6 Shader for the Slug rendering algorithm.
 * The Program and font textures are shared across instances (from SlugFont's
 * GPU cache); the per-instance uniform values (supersampling, stroke fade,
 * fill mode, fill bbox, fill gradient/texture) live on this Shader.
 *
 * Requires WebGL2 context for integer textures, texelFetch, and flat varyings.
 * v6 defaults to WebGL1 — the application must set `preferWebGLVersion: 2`.
 *
 * Uses the v7 vertex shader since v6 and v7 share the same uniform names
 * (projectionMatrix, translationMatrix) auto-populated by the Mesh renderer.
 *
 * `fallbackWhite` is bound to `uFillGradient` and `uFillTexture` whenever
 * the text has no gradient or fill texture. The shader still samples
 * those bindings (the `uFillMode` ladder branches at runtime), so they
 * must point at a valid texture even for solid fills.
 */
export function slugShader(
	program: Program,
	curveTexture: Texture,
	bandTexture: Texture,
	fallbackWhite: Texture,
	resolution: [number, number]
): Shader {
	const uniforms = {
		uCurveTexture: curveTexture,
		uBandTexture: bandTexture,
		uResolution: new Float32Array(resolution),
		uSupersampleCount: 0,
		uStrokeExpand: 0,
		uStrokeAlphaStart: 1,
		uStrokeAlphaRate: 0,
		// Fill mode: 0=solid, 1=linear, 2=radial, 3=texture.
		uFillMode: 0,
		// Fill bbox in object/model-local pixel space — same coordinate
		// space as aPositionNormal.xy. xy=min, zw=size.
		uFillBoundsPx: new Float32Array([0, 0, 1, 1]),
		// Linear: xy=start, zw=end. Radial: xy=center, z=innerR, w=outerR.
		uFillParams0: new Float32Array([0, 0, 1, 0]),
		// Texture pixel dimensions (1 when no texture is bound).
		uFillTextureSizePx: new Float32Array([1, 1]),
		// Texture fit mode: 0=stretch, 1=repeat, 2=clamp.
		uFillTextureFit: 0,
		// Per-axis texture scale. 1 = native size.
		uFillTextureScale: new Float32Array([1, 1]),
		// Pixel-space offset applied to texture coords.
		uFillTextureOffset: new Float32Array([0, 0]),
		// Sampler bindings — gradient LUT and user fill texture. Default
		// to the cache's fallbackWhite; v6 SlugText.rebuild swaps in the
		// real textures when the resolved fill is gradient or texture.
		uFillGradient: fallbackWhite,
		uFillTexture: fallbackWhite
	};

	return new Shader(program, uniforms);
}
