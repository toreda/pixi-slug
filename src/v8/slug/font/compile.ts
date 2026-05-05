import type {GlProgram, WebGLRenderer} from 'pixi.js';
import {slugBuildGlProgramAsync} from './glprogram-async';
import {slugBuildGlProgramData} from './glprogramdata';
import {slugInjectGlProgramData} from './inject';

/**
 * Drive {@link slugBuildGlProgramAsync} → {@link slugBuildGlProgramData}
 * → {@link slugInjectGlProgramData} as a single chained promise.
 * Returns `true` when the cache was populated and the next PIXI draw
 * will skip its own compile; `false` when any step short of a thrown
 * exception failed (link error, PIXI internal drift). Exceptions
 * surface as rejections — callers may treat them as `false` for
 * diagnostic purposes but should not crash the render loop on them.
 *
 * `pixiGlProgram` must be the same `GlProgram.from(...)` instance the
 * caller will later associate with their meshes — that's what carries
 * the `_key` PIXI looks up in `_programDataHash`.
 */
export function slugCompileAndInject(
	gl: WebGL2RenderingContext,
	renderer: WebGLRenderer,
	pixiGlProgram: GlProgram,
	vertexSource: string,
	fragmentSource: string,
	sortAttributes: boolean
): Promise<boolean> {
	const {program, ready} = slugBuildGlProgramAsync(gl, vertexSource, fragmentSource, sortAttributes);

	return ready.then(
		() => {
			try {
				const programData = slugBuildGlProgramData(gl, program, pixiGlProgram, sortAttributes);
				return slugInjectGlProgramData(renderer, pixiGlProgram, programData);
			} catch {
				return false;
			}
		},
		() => false
	);
}
