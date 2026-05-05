import type {Program, Renderer} from '@pixi/core';
import {slugBuildGlProgramAsync} from '../../../shared/slug/font/glprogram-async';
import {slugBuildGlProgramData} from './glprogramdata';
import {slugInjectGlProgramData} from './inject';

/**
 * Drive {@link slugBuildGlProgramAsync} → {@link slugBuildGlProgramData}
 * → {@link slugInjectGlProgramData} as a single chained promise on
 * PIXI v7. Returns `true` when the cache was populated and the next
 * PIXI draw will skip its own compile; `false` when any step short of
 * a thrown exception failed (link error, PIXI internal drift).
 * Exceptions surface as rejections — callers may treat them as
 * `false` for diagnostic purposes but should not crash the render
 * loop on them.
 *
 * `pixiProgram` must be the same `Program.from(...)` instance the
 * caller will later associate with their meshes — v7's
 * `ShaderSystem.bind()` looks up `program.glPrograms[CONTEXT_UID]` to
 * decide whether to compile.
 */
export function slugCompileAndInject(
	gl: WebGL2RenderingContext,
	renderer: Renderer,
	pixiProgram: Program,
	vertexSource: string,
	fragmentSource: string,
	sortAttributes: boolean
): Promise<boolean> {
	const {program, ready} = slugBuildGlProgramAsync(gl, vertexSource, fragmentSource, sortAttributes);

	return ready.then(
		() => {
			try {
				const programData = slugBuildGlProgramData(gl, program, pixiProgram);
				return slugInjectGlProgramData(renderer, pixiProgram, programData);
			} catch {
				return false;
			}
		},
		() => false
	);
}
