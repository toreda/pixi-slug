import {Program, type Renderer} from '@pixi/core';

import vertSource from '../../shader/slug/vert.glsl';
import fragSource from '../../../shared/shader/slug/frag.glsl';
import {SlugFonts} from '../../../shared/slug/fonts';
import {slugCompileAndInject} from './compile';

/**
 * Slug's GLSL is `#version 300 es`. PIXI v7's own `generateProgram`
 * (line 11 of `node_modules/pixi-v7-core/lib/shader/utils/generateProgram.js`)
 * uses the same regex check to skip the alphabetical attribute pre-sort
 * for `#version 300 es` shaders — we mirror that decision so the
 * post-link state matches what PIXI's sync path would have produced.
 */
const SORT_ATTRIBUTES = false;
const KHR_EXT = 'KHR_parallel_shader_compile';

/**
 * In-flight (or completed) prewarm promise per renderer. WeakMap keyed
 * on the renderer instance so destroying a renderer drops its entry
 * automatically. Resolved entries stay in place so subsequent calls
 * return the same `true`/`false` outcome without re-compiling.
 */
const inflight = new WeakMap<Renderer, Promise<boolean>>();

/**
 * Prewarm the Slug shader for a v7 `Renderer` so the first SlugText
 * draw on this renderer skips PIXI's blocking `generateProgram`.
 * Called by {@link SlugFonts.attachRenderer}, {@link SlugFonts.fromUrl},
 * and {@link SlugFonts.warmup} — each fires freely, this dedupes per
 * renderer so only one compile actually runs.
 *
 * Returns a promise resolving to `true` when the shader was compiled,
 * linked, and successfully injected into PIXI's per-program cache, or
 * `false` when any prerequisite was missing (incompatible renderer,
 * toggle off, `KHR_parallel_shader_compile` unavailable, PIXI internal
 * drift). A `false` resolution is harmless: PIXI's synchronous compile
 * will run on first draw exactly as before — no regression vs. the
 * pre-feature behavior.
 *
 * `null`/`undefined` renderer resolves to `false` immediately so
 * callers can pass `SlugFonts.renderer` (typed `unknown`) without a
 * pre-check.
 */
export function slugPrewarmShader(renderer: unknown): Promise<boolean> {
	if (!renderer) return Promise.resolve(false);
	if (!isV7Renderer(renderer)) return Promise.resolve(false);
	if (!SlugFonts.parallelShaderCompile) return Promise.resolve(false);

	const existing = inflight.get(renderer);
	if (existing) return existing;

	const gl = renderer.gl as WebGL2RenderingContext;
	if (!gl || typeof gl.getExtension !== 'function' || !gl.getExtension(KHR_EXT)) {
		return Promise.resolve(false);
	}

	// `Program.from(vert, frag)` is process-wide deduped on (vert+frag)
	// source bytes (PIXI's `ProgramCache`). The SlugText's later
	// cache-miss path receives the very same instance, so the per-
	// context cache entry we inject is the entry PIXI looks up on first
	// draw. We compile against the post-trim/post-precision-injection
	// `program.vertexSrc` / `program.fragmentSrc` rather than the raw
	// imported source so the bytes we link match what PIXI would have
	// linked under its sync path.
	const program = Program.from(vertSource, fragSource);
	const promise = slugCompileAndInject(
		gl,
		renderer,
		program,
		program.vertexSrc,
		program.fragmentSrc,
		SORT_ATTRIBUTES
	);
	inflight.set(renderer, promise);
	return promise;
}

/**
 * True when an entry exists in the in-flight cache for `renderer`,
 * regardless of its resolution state. Used by {@link SlugFonts.warmup}
 * to distinguish "compile already started or done" from "no work yet".
 */
export function slugPrewarmHas(renderer: unknown): boolean {
	if (!renderer || !isV7Renderer(renderer)) return false;
	return inflight.has(renderer);
}

/**
 * Structural check — v7 has only one `Renderer` shape (no WebGPU/Canvas
 * alternative as of v7.4) and exposes `gl` + `CONTEXT_UID` on every
 * renderer. We don't import the concrete class for instanceof because
 * test mocks would fail it.
 */
function isV7Renderer(r: unknown): r is Renderer {
	if (typeof r !== 'object' || r === null) return false;
	const rec = r as {gl?: unknown; CONTEXT_UID?: unknown};
	return rec.gl !== undefined && rec.gl !== null && typeof rec.CONTEXT_UID === 'number';
}
