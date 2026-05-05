/**
 * Result of {@link slugBuildGlProgramAsync}. The `program` is a freshly
 * created `WebGLProgram` whose link is in flight; `ready` resolves when
 * the link is verifiably complete (or rejects with the info log on link
 * failure).
 *
 * Callers must not query `LINK_STATUS` themselves before `ready`
 * resolves — doing so blocks the main thread, defeating the purpose of
 * the async path.
 */
export interface SlugGlProgramAsyncResult {
	program: WebGLProgram;
	ready: Promise<void>;
}

/** First-tier poll interval (ms). Tight to catch fast driver compiles. */
const POLL_FAST_MS = 4;
/** Tier-2 poll interval (ms) used after FAST_TICKS exhausts. */
const POLL_SLOW_MS = 16;
/** Number of fast-tier polls before backing off to {@link POLL_SLOW_MS}. */
const FAST_TICKS = 12;
/**
 * Hard ceiling on async polling. Past this we fall through to a sync
 * `LINK_STATUS` query so a buggy driver that never flips
 * `COMPLETION_STATUS_KHR` cannot hang the promise indefinitely.
 */
const HARD_TIMEOUT_MS = 5000;
/** Extension name; spelled as a constant so typos surface at module load. */
const KHR_EXT = 'KHR_parallel_shader_compile';
/** Constant from the KHR extension; not exposed by lib.dom WebGL2 typings. */
const COMPLETION_STATUS_KHR = 0x91b1;

/**
 * Compile + link a WebGL2 shader program without blocking the main
 * thread when `KHR_parallel_shader_compile` is supported. The returned
 * `program` is created synchronously so callers can wire it into PIXI's
 * caches immediately; the `ready` promise resolves once link completion
 * has been verified.
 *
 * Falls back to a synchronous compile/link path when the extension is
 * absent — `ready` still resolves so callers can use a uniform API
 * regardless of platform. The synchronous path will block, matching the
 * pre-feature behavior on browsers without the extension.
 *
 * `sortAttributes` matches PIXI's `extractAttributesFromGlProgram`
 * pre-link behavior for GLSL 1.00 shaders: attribute locations are
 * bound in alphabetical order so the post-link extraction lines up with
 * the pre-link bindings. GLSL 3.00 shaders use explicit `layout(location=N)`
 * qualifiers and must pass `false` to skip this step.
 */
export function slugBuildGlProgramAsync(
	gl: WebGL2RenderingContext,
	vertexSource: string,
	fragmentSource: string,
	sortAttributes: boolean
): SlugGlProgramAsyncResult {
	const ext = gl.getExtension(KHR_EXT);

	const vertex = gl.createShader(gl.VERTEX_SHADER);
	const fragment = gl.createShader(gl.FRAGMENT_SHADER);
	const program = gl.createProgram();
	if (!vertex || !fragment || !program) {
		// Context lost or out of resources. Resolve with whatever we have
		// and let the link/use path surface the real error to the caller.
		return {
			program: program as WebGLProgram,
			ready: Promise.reject(new Error('slugBuildGlProgramAsync: gl.createShader/createProgram returned null'))
		};
	}

	gl.shaderSource(vertex, vertexSource);
	gl.compileShader(vertex);
	gl.shaderSource(fragment, fragmentSource);
	gl.compileShader(fragment);

	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);

	if (sortAttributes) {
		bindAttributesAlphabetically(gl, program, vertexSource);
	}

	gl.linkProgram(program);

	// Shaders can be detached + flagged for delete immediately after
	// linkProgram; the driver retains them for the duration of the link.
	// We defer the actual deleteShader until link completion to keep the
	// program object in a fully-defined state during polling, mirroring
	// PIXI's own teardown order.

	const ready = ext
		? pollCompletion(gl, program, vertex, fragment)
		: finishSync(gl, program, vertex, fragment);

	return {program, ready};
}

/**
 * Bind `in`/`attribute` locations in alphabetical order before
 * `linkProgram`. Matches PIXI's `extractAttributesFromGlProgram`
 * post-link sort so that PIXI's later `getAttribLocation` lookups land
 * on the same indices we baked in here.
 */
function bindAttributesAlphabetically(
	gl: WebGL2RenderingContext,
	program: WebGLProgram,
	vertexSource: string
): void {
	const names: string[] = [];
	// Match both GLSL 3.00 `in <type> <name>` and GLSL 1.00 `attribute <type> <name>`.
	const re = /(?:^|\s)(?:in|attribute)\s+(?:highp|mediump|lowp\s+)?\w+\s+(\w+)\s*[;[]/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(vertexSource)) !== null) {
		const name = m[1];
		if (!names.includes(name)) names.push(name);
	}
	names.sort();
	for (let i = 0; i < names.length; i++) {
		gl.bindAttribLocation(program, i, names[i]);
	}
}

function pollCompletion(
	gl: WebGL2RenderingContext,
	program: WebGLProgram,
	vertex: WebGLShader,
	fragment: WebGLShader
): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		const start = nowMs();
		let ticks = 0;

		const tick = (): void => {
			let done: boolean;
			try {
				done = gl.getProgramParameter(program, COMPLETION_STATUS_KHR) as boolean;
			} catch {
				// Extension query rejected by a buggy driver — bail to sync.
				resolveSync(gl, program, vertex, fragment, resolve, reject);
				return;
			}

			if (done) {
				resolveSync(gl, program, vertex, fragment, resolve, reject);
				return;
			}

			if (nowMs() - start >= HARD_TIMEOUT_MS) {
				// Driver never reported completion. Fall back to the
				// synchronous query — it will block briefly but at least
				// won't leave the promise pending forever.
				resolveSync(gl, program, vertex, fragment, resolve, reject);
				return;
			}

			ticks++;
			const next = ticks <= FAST_TICKS ? POLL_FAST_MS : POLL_SLOW_MS;
			setTimeout(tick, next);
		};

		setTimeout(tick, POLL_FAST_MS);
	});
}

function finishSync(
	gl: WebGL2RenderingContext,
	program: WebGLProgram,
	vertex: WebGLShader,
	fragment: WebGLShader
): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		resolveSync(gl, program, vertex, fragment, resolve, reject);
	});
}

function resolveSync(
	gl: WebGL2RenderingContext,
	program: WebGLProgram,
	vertex: WebGLShader,
	fragment: WebGLShader,
	resolve: () => void,
	reject: (e: Error) => void
): void {
	const linked = gl.getProgramParameter(program, gl.LINK_STATUS) as boolean;
	gl.detachShader(program, vertex);
	gl.detachShader(program, fragment);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);

	if (linked) {
		resolve();
		return;
	}

	const log = gl.getProgramInfoLog(program) ?? '';
	const vlog = gl.getShaderInfoLog(vertex) ?? '';
	const flog = gl.getShaderInfoLog(fragment) ?? '';
	reject(new Error(`slugBuildGlProgramAsync: link failed.\nprogram: ${log}\nvertex: ${vlog}\nfragment: ${flog}`));
}

function nowMs(): number {
	return typeof performance !== 'undefined' && typeof performance.now === 'function'
		? performance.now()
		: Date.now();
}
