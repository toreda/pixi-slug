import type {GlProgram, GlProgramData, WebGLRenderer} from 'pixi.js';

/**
 * Shape we expect on `renderer.shader` — a private hash keyed by
 * `GlProgram._key` whose values are `GlProgramData` instances. Both
 * fields are flagged `private` / `@internal` in PIXI's typings; we
 * access them through this shape so the unchecked cast is contained
 * to one place. Any drift in PIXI's internal naming is caught by the
 * `try`/`catch` in {@link slugInjectGlProgramData} and falls back to
 * PIXI's synchronous compile path.
 */
interface PixiShaderSystemInternal {
	_programDataHash?: Record<number, GlProgramData> | null;
}

/**
 * Pre-populate PIXI's per-renderer program-data cache so the next draw
 * skips PIXI's internal (synchronous) `generateProgram` call. Returns
 * `true` on a successful injection, `false` when PIXI's internal shape
 * has drifted or the renderer/shader is in an unexpected state — the
 * caller should treat `false` as "fall back to the sync path".
 *
 * Idempotent: re-injecting the same key overwrites the entry, which is
 * harmless because `generateProgram` would have produced an equivalent
 * record anyway.
 */
export function slugInjectGlProgramData(
	renderer: WebGLRenderer,
	pixiGlProgram: GlProgram,
	programData: GlProgramData
): boolean {
	try {
		const shader = renderer.shader as unknown as PixiShaderSystemInternal;
		const hash = shader._programDataHash;
		if (!hash) return false;
		const key = pixiGlProgram._key;
		if (typeof key !== 'number') return false;
		hash[key] = programData;
		return true;
	} catch {
		return false;
	}
}
