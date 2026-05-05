import {GlProgram, RendererType} from 'pixi.js';
import type {Renderer, WebGLRenderer} from 'pixi.js';

import vertSource from '../../../shared/shader/slug/vert.glsl';
import fragSource from '../../../shared/shader/slug/frag.glsl';
import {SlugFonts} from '../../../shared/slug/fonts';
import {slugCompileAndInject} from './compile';

const SORT_ATTRIBUTES = false;
const KHR_EXT = 'KHR_parallel_shader_compile';

/**
 * In-flight (or completed) prewarm promise per renderer. WeakMap keyed
 * on the renderer instance so destroying a renderer drops its entry
 * automatically. Resolved entries stay in place so subsequent calls
 * return the same `true`/`false` outcome without re-compiling.
 */
const inflight = new WeakMap<WebGLRenderer, Promise<boolean>>();

/**
 * Prewarm the Slug shader for `renderer` so the first SlugText draw
 * on this renderer skips PIXI's blocking `generateProgram`. Called by
 * {@link SlugFonts.attachRenderer}, {@link SlugFonts.fromUrl}, and
 * {@link SlugFonts.warmup} — each fires freely, this dedupes per
 * renderer so only one compile actually runs.
 *
 * Returns a promise resolving to `true` when the shader was compiled,
 * linked, and successfully injected into PIXI's per-renderer cache, or
 * `false` when any prerequisite was missing (non-WebGL renderer,
 * toggle off, `KHR_parallel_shader_compile` unavailable, PIXI internal
 * drift). A `false` resolution is harmless: PIXI's synchronous compile
 * will run on first draw exactly as before — no regression vs. the
 * pre-feature behavior.
 *
 * `null`/`undefined` renderer resolves to `false` immediately so
 * callers can pass `reg.renderer` (typed `unknown`) without a
 * pre-check.
 */
export function slugPrewarmShader(renderer: unknown): Promise<boolean> {
	if (!renderer) return Promise.resolve(false);
	if (!isWebGLRenderer(renderer)) return Promise.resolve(false);
	if (!SlugFonts.parallelShaderCompile) return Promise.resolve(false);

	const existing = inflight.get(renderer);
	if (existing) return existing;

	const gl = renderer.gl as WebGL2RenderingContext;
	if (!gl || !gl.getExtension(KHR_EXT)) return Promise.resolve(false);

	// `GlProgram.from(...)` is process-wide deduped on source bytes —
	// the SlugText's later cache-miss path will receive the very same
	// instance with the same `_key`, so the cache entry we inject is
	// the cache entry PIXI looks up on first draw.
	const glProgram = GlProgram.from({vertex: vertSource, fragment: fragSource});

	const promise = slugCompileAndInject(gl, renderer, glProgram, vertSource, fragSource, SORT_ATTRIBUTES);
	inflight.set(renderer, promise);
	return promise;
}

/**
 * True when an entry exists in the in-flight cache for `renderer`,
 * regardless of its resolution state. Used by {@link SlugFonts.warmup}
 * to distinguish "compile already started or done" from "no work yet".
 */
export function slugPrewarmHas(renderer: unknown): boolean {
	if (!renderer || !isWebGLRenderer(renderer)) return false;
	return inflight.has(renderer);
}

function isWebGLRenderer(r: unknown): r is WebGLRenderer {
	return typeof r === 'object' && r !== null && (r as Renderer).type === RendererType.WEBGL;
}
