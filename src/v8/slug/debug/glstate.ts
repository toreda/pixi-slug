import type {WebGLRenderer} from 'pixi.js';

/**
 * Per-draw WebGL-state assertion for diagnosing "valid SlugText that draws
 * nothing" caused by **leaked GL state** — the app's own raw-GL rendering
 * (custom filters, a manual render pass, a co-resident WebGL library) left
 * shared context state in a configuration that silently discards
 * pixi-slug's draw.
 *
 * Unlike {@link slugDebugDump}, which inspects JS objects, this reads the
 * **live GL context** and flags state that makes an otherwise-correct draw
 * produce no visible pixels:
 *
 *  - `COLOR_WRITEMASK` with any channel off (esp. all-off) → draw writes nothing
 *  - `BLEND` enabled with a func that resolves to zero output
 *  - `DEPTH_TEST` / `STENCIL_TEST` enabled (pixi 2D normally has them off) → fragments rejected
 *  - `SCISSOR_TEST` enabled with a box that excludes the canvas → clipped away
 *  - `CULL_FACE` enabled → slug quads are single-winding; a stale cull mode can drop them
 *  - viewport collapsed to zero area or mismatched to the drawing buffer
 *  - a non-pixi `framebuffer` still bound (drawing into the wrong target)
 *
 * Call it from a per-frame hook positioned where pixi-slug is about to
 * draw — e.g. a `ticker` callback that runs after your app's custom GL but
 * before `app.render()`, or temporarily from inside the renderer's render
 * loop. It does not change any state; it reads, compares, and reports.
 *
 * Returns the list of detected problems (empty = GL state looks clean).
 * Logs to the console unless `{silent: true}`.
 */

export interface SlugGlStateOptions {
	/** Suppress console output; just return the problems array. @default false */
	silent?: boolean;
	/**
	 * Throw an Error if any problem is detected. Useful for catching the
	 * exact frame a leak appears under a breakpoint. @default false
	 */
	throwOnProblem?: boolean;
	/**
	 * Log even when no problems are found (one healthy snapshot of all
	 * read state). @default false
	 */
	verbose?: boolean;
}

export interface SlugGlStateReport {
	ok: boolean;
	problems: string[];
	/** Raw state snapshot, for manual inspection. */
	state: Record<string, unknown>;
}

function blendFactorName(gl: WebGL2RenderingContext, v: number): string {
	const names: Record<number, string> = {
		[gl.ZERO]: 'ZERO',
		[gl.ONE]: 'ONE',
		[gl.SRC_COLOR]: 'SRC_COLOR',
		[gl.ONE_MINUS_SRC_COLOR]: 'ONE_MINUS_SRC_COLOR',
		[gl.SRC_ALPHA]: 'SRC_ALPHA',
		[gl.ONE_MINUS_SRC_ALPHA]: 'ONE_MINUS_SRC_ALPHA',
		[gl.DST_ALPHA]: 'DST_ALPHA',
		[gl.ONE_MINUS_DST_ALPHA]: 'ONE_MINUS_DST_ALPHA',
		[gl.DST_COLOR]: 'DST_COLOR',
		[gl.ONE_MINUS_DST_COLOR]: 'ONE_MINUS_DST_COLOR'
	};
	return names[v] ?? `0x${v.toString(16)}`;
}

/**
 * Read and validate the current WebGL context state for conditions that
 * silently suppress pixi-slug draws.
 *
 * @param renderer  The pixi v8 `WebGLRenderer` whose `gl` context to read.
 * @param options   See {@link SlugGlStateOptions}.
 */
export function slugAssertGlState(
	renderer: WebGLRenderer,
	options: SlugGlStateOptions = {}
): SlugGlStateReport {
	const gl = (renderer as unknown as {gl: WebGL2RenderingContext}).gl;
	const problems: string[] = [];

	if (!gl) {
		const report: SlugGlStateReport = {
			ok: false,
			problems: ['renderer.gl is null/undefined — not a WebGL renderer, or context lost'],
			state: {}
		};
		if (!options.silent) console.warn('[slugAssertGlState]', report.problems[0]);
		if (options.throwOnProblem) throw new Error(report.problems[0]);
		return report;
	}

	if (gl.isContextLost && gl.isContextLost()) {
		problems.push('WebGL context is LOST — nothing will draw until it is restored');
	}

	// --- Color write mask ---
	const colorMask = gl.getParameter(gl.COLOR_WRITEMASK) as boolean[];
	if (colorMask && (!colorMask[0] || !colorMask[1] || !colorMask[2] || !colorMask[3])) {
		const off = ['R', 'G', 'B', 'A'].filter((_, i) => !colorMask[i]).join('');
		problems.push(
			`COLOR_WRITEMASK has channel(s) [${off}] disabled — draw writes no color. ` +
				'An app render pass left colorMask off (gl.colorMask(...) not restored).'
		);
	}

	// --- Blend ---
	const blendEnabled = gl.isEnabled(gl.BLEND);
	const srcRGB = gl.getParameter(gl.BLEND_SRC_RGB) as number;
	const dstRGB = gl.getParameter(gl.BLEND_DST_RGB) as number;
	const srcA = gl.getParameter(gl.BLEND_SRC_ALPHA) as number;
	const dstA = gl.getParameter(gl.BLEND_DST_ALPHA) as number;
	if (blendEnabled && srcRGB === gl.ZERO && dstRGB === gl.ONE) {
		problems.push(
			'BLEND is on with srcRGB=ZERO, dstRGB=ONE — the source (your glyphs) contributes ' +
				'nothing; only the existing framebuffer survives. Blend func left in a no-op state.'
		);
	}

	// --- Depth / stencil (pixi 2D draws with both off) ---
	if (gl.isEnabled(gl.DEPTH_TEST)) {
		const depthFunc = gl.getParameter(gl.DEPTH_FUNC) as number;
		problems.push(
			`DEPTH_TEST is ENABLED (func=0x${depthFunc.toString(16)}). pixi 2D normally keeps it ` +
				'off — a stale depth test can reject every slug fragment. App left depth testing on.'
		);
	}
	if (gl.isEnabled(gl.STENCIL_TEST)) {
		const ref = gl.getParameter(gl.STENCIL_REF) as number;
		const func = gl.getParameter(gl.STENCIL_FUNC) as number;
		problems.push(
			`STENCIL_TEST is ENABLED (func=0x${func.toString(16)}, ref=${ref}). A leftover stencil ` +
				'mask from a masking/clip pass can reject every slug fragment.'
		);
	}

	// --- Cull face (slug quads are a single winding) ---
	if (gl.isEnabled(gl.CULL_FACE)) {
		const mode = gl.getParameter(gl.CULL_FACE_MODE) as number;
		const front = gl.getParameter(gl.FRONT_FACE) as number;
		problems.push(
			`CULL_FACE is ENABLED (cullMode=0x${mode.toString(16)}, frontFace=0x${front.toString(16)}). ` +
				'If the cull mode + winding drop slug quads, the mesh disappears. pixi 2D draws with ' +
				'culling off.'
		);
	}

	// --- Scissor ---
	if (gl.isEnabled(gl.SCISSOR_TEST)) {
		const box = gl.getParameter(gl.SCISSOR_BOX) as Int32Array;
		const dbW = gl.drawingBufferWidth;
		const dbH = gl.drawingBufferHeight;
		const [sx, sy, sw, sh] = [box[0], box[1], box[2], box[3]];
		if (sw <= 0 || sh <= 0) {
			problems.push(`SCISSOR_TEST on with zero-area box [${sx},${sy},${sw},${sh}] — clips everything.`);
		} else if (sx > dbW || sy > dbH || sx + sw < 0 || sy + sh < 0) {
			problems.push(
				`SCISSOR_TEST on with box [${sx},${sy},${sw},${sh}] outside the drawing buffer ` +
					`(${dbW}x${dbH}) — slug draws are clipped away.`
			);
		}
	}

	// --- Viewport ---
	const vp = gl.getParameter(gl.VIEWPORT) as Int32Array;
	if (vp && (vp[2] <= 0 || vp[3] <= 0)) {
		problems.push(`VIEWPORT has zero area [${vp[0]},${vp[1]},${vp[2]},${vp[3]}] — nothing rasterizes.`);
	}

	// --- Framebuffer ---
	// pixi will (re)bind its own target when it renders, so a foreign FBO
	// bound *at the time slug draws* is unusual but worth flagging if you
	// call this from inside a custom pass.
	const fbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);
	const drawFbo = gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING);

	const state: Record<string, unknown> = {
		contextLost: gl.isContextLost ? gl.isContextLost() : 'n/a',
		colorMask,
		blendEnabled,
		blendFunc: {
			srcRGB: blendFactorName(gl, srcRGB),
			dstRGB: blendFactorName(gl, dstRGB),
			srcAlpha: blendFactorName(gl, srcA),
			dstAlpha: blendFactorName(gl, dstA)
		},
		depthTest: gl.isEnabled(gl.DEPTH_TEST),
		stencilTest: gl.isEnabled(gl.STENCIL_TEST),
		cullFace: gl.isEnabled(gl.CULL_FACE),
		scissorTest: gl.isEnabled(gl.SCISSOR_TEST),
		scissorBox: Array.from((gl.getParameter(gl.SCISSOR_BOX) as Int32Array) ?? []),
		viewport: Array.from(vp ?? []),
		drawingBuffer: [gl.drawingBufferWidth, gl.drawingBufferHeight],
		boundProgram: gl.getParameter(gl.CURRENT_PROGRAM) ? 'set' : 'null',
		framebufferBinding: fbo ? 'foreign-FBO-bound' : 'default(0)',
		drawFramebufferBinding: drawFbo ? 'foreign-FBO-bound' : 'default(0)',
		// A pending GL error from the app's own calls surfaces here.
		glError: glErrorName(gl, gl.getError())
	};

	if (state.glError !== 'NO_ERROR') {
		problems.push(
			`gl.getError() returned ${state.glError} — a prior GL call (likely the app's) errored. ` +
				'A context in an error state can drop subsequent draws.'
		);
	}

	const report: SlugGlStateReport = {ok: problems.length === 0, problems, state};

	if (!options.silent) {
		/* eslint-disable no-console */
		if (problems.length > 0) {
			console.group('%c[slugAssertGlState] LEAKED GL STATE', 'color:#ff6b6b;font-weight:bold');
			for (const p of problems) console.log('•', p);
			console.log('Full GL state snapshot:', state);
			console.groupEnd();
		} else if (options.verbose) {
			console.log('%c[slugAssertGlState] GL state clean', 'color:#51cf66', state);
		}
		/* eslint-enable no-console */
	}

	if (options.throwOnProblem && problems.length > 0) {
		throw new Error('[slugAssertGlState] leaked GL state:\n  - ' + problems.join('\n  - '));
	}

	return report;
}

function glErrorName(gl: WebGL2RenderingContext, code: number): string {
	switch (code) {
		case gl.NO_ERROR:
			return 'NO_ERROR';
		case gl.INVALID_ENUM:
			return 'INVALID_ENUM';
		case gl.INVALID_VALUE:
			return 'INVALID_VALUE';
		case gl.INVALID_OPERATION:
			return 'INVALID_OPERATION';
		case gl.INVALID_FRAMEBUFFER_OPERATION:
			return 'INVALID_FRAMEBUFFER_OPERATION';
		case gl.OUT_OF_MEMORY:
			return 'OUT_OF_MEMORY';
		case gl.CONTEXT_LOST_WEBGL:
			return 'CONTEXT_LOST_WEBGL';
		default:
			return `0x${code.toString(16)}`;
	}
}
