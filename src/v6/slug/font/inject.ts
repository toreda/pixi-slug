import type {GLProgram, Program, Renderer} from '@pixi/core';

/**
 * Shape we expect on PIXI v6's `Program` and `Renderer`: the program
 * exposes a public `glPrograms` map keyed by `Renderer.CONTEXT_UID`
 * (same shape as v7). We access them through this shape so the
 * unchecked cast is contained to one place. Any drift in PIXI's
 * internal naming is caught by the `try`/`catch` in
 * {@link slugInjectGlProgramData} and falls back to PIXI's synchronous
 * compile path.
 */
interface PixiProgramInternal {
	glPrograms?: Record<number, GLProgram> | null;
}

interface PixiRendererInternal {
	CONTEXT_UID?: number;
}

/**
 * Pre-populate PIXI v6's per-program/per-context program-data cache so
 * the next draw skips PIXI's internal (synchronous) `generateProgram`
 * call inside `ShaderSystem.bind`. Returns `true` on a successful
 * injection, `false` when PIXI's internal shape has drifted or the
 * renderer/program is in an unexpected state — the caller should
 * treat `false` as "fall back to the sync path".
 *
 * Idempotent: re-injecting the same key overwrites the entry, which
 * is harmless because `generateProgram` would have produced an
 * equivalent record anyway.
 */
export function slugInjectGlProgramData(
	renderer: Renderer,
	pixiProgram: Program,
	programData: GLProgram
): boolean {
	try {
		const r = renderer as unknown as PixiRendererInternal;
		const p = pixiProgram as unknown as PixiProgramInternal;
		const ctx = r.CONTEXT_UID;
		if (typeof ctx !== 'number') return false;
		if (!p.glPrograms) return false;
		p.glPrograms[ctx] = programData;
		return true;
	} catch {
		return false;
	}
}
