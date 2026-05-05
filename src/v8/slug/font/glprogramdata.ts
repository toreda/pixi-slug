import {
	defaultValue,
	extractAttributesFromGlProgram,
	getUboData,
	getUniformData,
	GlProgramData,
	IGLUniformData
} from 'pixi.js';
import type {GlProgram} from 'pixi.js';

/**
 * Run PIXI v8's post-link extraction steps against an already-linked
 * `WebGLProgram` and return a populated `GlProgramData`. Intended to be
 * called once {@link slugBuildGlProgramAsync}'s `ready` promise resolves —
 * by then the link is complete and these queries are non-blocking.
 *
 * Mirrors the tail half of PIXI's internal `generateProgram` (the half
 * that runs after `gl.linkProgram`) without re-issuing the link itself.
 * The result can be inserted into the renderer's
 * `shader._programDataHash[pixiGlProgram._key]` cache so PIXI's first
 * draw finds a cache hit and skips its own (blocking) compile path.
 *
 * The PIXI helpers used here are public exports but flagged `@private`
 * / `@internal` in their docs. The injection site in the renderer is
 * expected to wrap this call in try/catch and fall back to the sync
 * path if a future PIXI release renames or removes them.
 */
export function slugBuildGlProgramData(
	gl: WebGL2RenderingContext,
	program: WebGLProgram,
	pixiGlProgram: GlProgram,
	sortAttributes: boolean
): GlProgramData {
	pixiGlProgram._attributeData = extractAttributesFromGlProgram(program, gl, sortAttributes);
	pixiGlProgram._uniformData = getUniformData(program, gl);
	pixiGlProgram._uniformBlockData = getUboData(program, gl);

	const uniformData: Record<string, IGLUniformData> = {};
	for (const name in pixiGlProgram._uniformData) {
		const data = pixiGlProgram._uniformData[name];
		uniformData[name] = {
			location: gl.getUniformLocation(program, name) as WebGLUniformLocation,
			value: defaultValue(data.type, data.size)
		};
	}

	return new GlProgramData(program, uniformData);
}
