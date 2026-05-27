import {GlProgram, RendererType} from 'pixi.js';
import type {GlProgramData, Renderer, WebGLRenderer} from 'pixi.js';

import vertSource from '../../../shared/shader/slug/vert.glsl';
import fragSource from '../../../shared/shader/slug/frag.glsl';
import {slugBuildGlProgramAsync} from '../../../shared/slug/font/glprogram-async';
import {SlugFonts} from '../../../shared/slug/fonts';
import {slugCompileAndInject} from './compile';
import {slugBuildGlProgramData} from './glprogramdata';
import {slugInjectGlProgramData} from './inject';

const SORT_ATTRIBUTES = false;
const KHR_EXT = 'KHR_parallel_shader_compile';

/**
 * Context-keyed prewarm record. Holds the linked WebGLProgram, the
 * PIXI `GlProgram` instance whose `_key` will be looked up at draw
 * time, and the assembled `GlProgramData` ready for injection. The
 * record stays in the WeakMap for the lifetime of the WebGL2 context
 * so a renderer constructed around that same context can adopt the
 * prewarmed program without recompiling.
 */
interface ContextPrewarmRecord {
	pixiGlProgram: GlProgram;
	programData: GlProgramData;
}

/**
 * In-flight (or completed) context-prewarm promise per WebGL2 context.
 * WeakMap keyed on the `gl` instance so a context teardown drops the
 * entry automatically. The promise resolves to `true` after the program
 * is linked AND `programData` is built — at which point it has also
 * been stored in {@link prewarmedContexts} for adoption.
 */
const contextInflight = new WeakMap<WebGL2RenderingContext, Promise<boolean>>();

/**
 * Completed context-prewarm records. A renderer-prewarm whose
 * `renderer.gl` is a key here adopts the stored record into PIXI's
 * per-renderer cache instead of recompiling.
 */
const prewarmedContexts = new WeakMap<WebGL2RenderingContext, ContextPrewarmRecord>();

/**
 * In-flight (or completed) renderer-prewarm promise. WeakMap keyed on
 * the renderer instance so destroying a renderer drops its entry
 * automatically. Resolved entries stay in place so subsequent calls
 * return the same `true`/`false` outcome without re-compiling.
 */
const rendererInflight = new WeakMap<WebGLRenderer, Promise<boolean>>();

/**
 * Compile + link the Slug shader against a raw `WebGL2RenderingContext`
 * and stash the result for later adoption by a renderer wrapping the
 * same context. This is the **context-first prewarm path**: the
 * consumer creates the context themselves (e.g. via
 * `canvas.getContext('webgl2', ...)`), fires this before constructing
 * the PIXI `Application`, and passes the same context into
 * `Application.init({context: gl, ...})`. When the application's
 * renderer is later registered via {@link slugPrewarmShader} (or
 * `SlugFonts.attachRenderer`), the renderer-prewarm finds the
 * prewarmed record by `renderer.gl === gl` and adopts it without
 * recompiling.
 *
 * Returns `true` on a successful link + program-data build; `false`
 * for any short-circuit (missing `KHR_parallel_shader_compile`, link
 * error, post-link extraction failure). A `false` resolution is
 * harmless: the renderer-prewarm path that runs later will fall back
 * to today's renderer-driven compile (which itself falls back to
 * PIXI's sync compile on extension absence).
 *
 * `null`/`undefined` `gl` resolves to `false` immediately. Dedup is
 * per-context: calling with the same `gl` twice returns the same
 * in-flight promise.
 */
export function slugPrewarmContext(gl: WebGL2RenderingContext | null | undefined): Promise<boolean> {
	if (!gl) return Promise.resolve(false);
	if (!SlugFonts.parallelShaderCompile) return Promise.resolve(false);

	const existing = contextInflight.get(gl);
	if (existing) return existing;

	if (!gl.getExtension(KHR_EXT)) return Promise.resolve(false);

	const pixiGlProgram = GlProgram.from({vertex: vertSource, fragment: fragSource});
	const {program, ready} = slugBuildGlProgramAsync(gl, vertSource, fragSource, SORT_ATTRIBUTES);

	const promise = ready.then(
		() => {
			try {
				const programData = slugBuildGlProgramData(gl, program, pixiGlProgram, SORT_ATTRIBUTES);
				prewarmedContexts.set(gl, {pixiGlProgram, programData});
				return true;
			} catch (err) {
				console.error(
					'[slug] context prewarm: post-link program-data build failed; renderer attach will fall back.',
					err
				);
				return false;
			}
		},
		(err: unknown) => {
			console.error(
				'[slug] context prewarm: parallel shader compile failed; renderer attach will fall back.',
				err
			);
			return false;
		}
	);

	contextInflight.set(gl, promise);
	return promise;
}

/**
 * True when {@link slugPrewarmContext} has been called for this `gl`
 * and a record exists (or is in flight). Used by
 * `SlugFonts.warmupContext`-style diagnostics.
 */
export function slugPrewarmContextHas(gl: WebGL2RenderingContext | null | undefined): boolean {
	if (!gl) return false;
	return contextInflight.has(gl);
}

/**
 * Prewarm the Slug shader for `renderer` so the first SlugText draw
 * on this renderer skips PIXI's blocking `generateProgram`. Called by
 * {@link SlugFonts.attachRenderer}, {@link SlugFonts.fromUrl}, and
 * {@link SlugFonts.warmup} — each fires freely, this dedupes per
 * renderer so only one compile actually runs.
 *
 * Adoption path: if `renderer.gl` matches a context already prewarmed
 * via {@link slugPrewarmContext}, this skips the compile entirely and
 * injects the stored `GlProgramData` straight into PIXI's renderer
 * cache. The compile work is then attributed to the earlier context
 * prewarm — typically run in parallel with `app.init()` so the
 * renderer-prewarm step is near-zero latency.
 *
 * Returns a promise resolving to `true` when the shader is in PIXI's
 * per-renderer cache (whether adopted from a context prewarm or freshly
 * compiled), or `false` when any prerequisite was missing (non-WebGL
 * renderer, prewarm mode inactive, `KHR_parallel_shader_compile`
 * unavailable, PIXI internal drift). A `false` resolution is harmless:
 * PIXI's synchronous compile will run on first draw exactly as before.
 *
 * `null`/`undefined` renderer resolves to `false` immediately so
 * callers can pass `reg.renderer` (typed `unknown`) without a
 * pre-check.
 */
export function slugPrewarmShader(renderer: unknown): Promise<boolean> {
	if (!renderer) return Promise.resolve(false);
	if (!isWebGLRenderer(renderer)) return Promise.resolve(false);
	if (!SlugFonts.parallelShaderCompile) return Promise.resolve(false);

	const existing = rendererInflight.get(renderer);
	if (existing) return existing;

	const gl = renderer.gl as WebGL2RenderingContext;
	if (!gl) return Promise.resolve(false);

	// Adoption path: a context prewarm already linked the program for
	// this gl. If it's still in flight, await it and then adopt; if
	// it's resolved successfully, adopt immediately.
	if (contextInflight.has(gl)) {
		const adopt = contextInflight.get(gl)!.then((ok) => {
			if (!ok) {
				// Context prewarm failed — fall back to the renderer-driven
				// compile path. (Rare: context prewarm has already logged
				// the underlying error.)
				return runRendererCompile(renderer, gl);
			}
			const record = prewarmedContexts.get(gl);
			if (!record) return false;
			try {
				return slugInjectGlProgramData(renderer, record.pixiGlProgram, record.programData);
			} catch (err) {
				console.error('[slug] adoption inject failed; falling back to PIXI sync compile.', err);
				return false;
			}
		});
		rendererInflight.set(renderer, adopt);
		return adopt;
	}

	// No context prewarm for this gl — drive the renderer-driven path.
	if (!gl.getExtension(KHR_EXT)) return Promise.resolve(false);
	const promise = runRendererCompile(renderer, gl);
	rendererInflight.set(renderer, promise);
	return promise;
}

/**
 * Renderer-driven compile + inject. Used by the non-adoption path of
 * {@link slugPrewarmShader} and by adoption-fallback when an earlier
 * context prewarm resolved false.
 */
function runRendererCompile(renderer: WebGLRenderer, gl: WebGL2RenderingContext): Promise<boolean> {
	// `GlProgram.from(...)` is process-wide deduped on source bytes —
	// the SlugText's later cache-miss path will receive the very same
	// instance with the same `_key`, so the cache entry we inject is
	// the cache entry PIXI looks up on first draw.
	const glProgram = GlProgram.from({vertex: vertSource, fragment: fragSource});
	return slugCompileAndInject(gl, renderer, glProgram, vertSource, fragSource, SORT_ATTRIBUTES);
}

/**
 * True when an entry exists in the in-flight cache for `renderer`,
 * regardless of its resolution state. Used by {@link SlugFonts.warmup}
 * to distinguish "compile already started or done" from "no work yet".
 */
export function slugPrewarmHas(renderer: unknown): boolean {
	if (!renderer || !isWebGLRenderer(renderer)) return false;
	return rendererInflight.has(renderer);
}

function isWebGLRenderer(r: unknown): r is WebGLRenderer {
	return typeof r === 'object' && r !== null && (r as Renderer).type === RendererType.WEBGL;
}
