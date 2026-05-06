import type {GlProgram, WebGLRenderer} from 'pixi.js';
import {slugBuildGlProgramAsync} from '../../../shared/slug/font/glprogram-async';
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
			} catch (err) {
				// PIXI internal drift (renamed/removed `extractAttributesFromGlProgram`,
				// `getUniformData`, etc). Surface to the console so the cause is
				// visible, then fall back: PIXI's sync compile will run on first draw.
				console.error('[slug] post-link program-data build failed; falling back to PIXI sync compile.', err);
				return false;
			}
		},
		(err: unknown) => {
			// Link failure or extension-level error from `slugBuildGlProgramAsync`.
			// The Error message contains the program/vertex/fragment info logs —
			// surface them so a real shader error isn't invisible. We still resolve
			// `false` so the caller can fall through to the sync compile path
			// (which will most likely re-report the same error).
			console.error('[slug] parallel shader compile failed; falling back to PIXI sync compile.', err);
			return false;
		}
	);
}
