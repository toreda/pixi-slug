/**
 * Tests for the v8 `slugPrewarmContext` primitive and the renderer
 * adoption path of `slugPrewarmShader`. These exercise the
 * context-first prewarm path added by the dual-flow design:
 *
 *  - `slugPrewarmContext(gl)` compiles + links + builds program data
 *    against a raw WebGL2 context, storing the result for later
 *    adoption.
 *  - `slugPrewarmShader(renderer)` detects when `renderer.gl` matches
 *    a previously prewarmed context and adopts the stored program data
 *    without recompiling.
 *
 * Mocks: `pixi.js` for `GlProgram.from`/`RendererType`; GLSL imports
 * for the source string; `slugBuildGlProgramAsync` to control the
 * async link resolution; `slugBuildGlProgramData` to return a sentinel
 * `GlProgramData`; `slugInjectGlProgramData` to record adoption calls;
 * `slugCompileAndInject` to record fallback compile calls.
 */

jest.mock('pixi.js', () => {
	let nextKey = 1;
	class FakeGlProgram {
		public _key: number;
		constructor(public opts: {vertex: string; fragment: string}) {
			this._key = nextKey++;
		}
		static from(opts: {vertex: string; fragment: string}): FakeGlProgram {
			return new FakeGlProgram(opts);
		}
	}
	return {
		__esModule: true,
		GlProgram: FakeGlProgram,
		RendererType: {WEBGL: 1, WEBGPU: 2, CANVAS: 4}
	};
});

const RENDERER_TYPE_WEBGL = 1;

jest.mock('../../../../src/shared/shader/slug/vert.glsl', () => 'STUB_VERT', {virtual: true});
jest.mock('../../../../src/shared/shader/slug/frag.glsl', () => 'STUB_FRAG', {virtual: true});

const mockBuildGlProgramAsync = jest.fn();
jest.mock('../../../../src/shared/slug/font/glprogram-async', () => ({
	__esModule: true,
	slugBuildGlProgramAsync: (...args: unknown[]) => mockBuildGlProgramAsync(...args)
}));

const mockBuildGlProgramData = jest.fn();
jest.mock('../../../../src/v8/slug/font/glprogramdata', () => ({
	__esModule: true,
	slugBuildGlProgramData: (...args: unknown[]) => mockBuildGlProgramData(...args)
}));

const mockInjectGlProgramData = jest.fn();
jest.mock('../../../../src/v8/slug/font/inject', () => ({
	__esModule: true,
	slugInjectGlProgramData: (...args: unknown[]) => mockInjectGlProgramData(...args)
}));

const mockCompileAndInject = jest.fn();
jest.mock('../../../../src/v8/slug/font/compile', () => ({
	__esModule: true,
	slugCompileAndInject: (...args: unknown[]) => mockCompileAndInject(...args)
}));

import {SlugFonts} from '../../../../src/shared/slug/fonts';
import {
	slugPrewarmContext,
	slugPrewarmContextHas,
	slugPrewarmShader
} from '../../../../src/v8/slug/font/prewarm';

/**
 * Construct a fake `WebGL2RenderingContext` with controllable
 * extension behavior. `extPresent` toggles whether the KHR
 * parallel-shader-compile extension is exposed.
 */
function makeGlContext(extPresent: boolean = true): WebGL2RenderingContext {
	return {
		getExtension: jest.fn().mockImplementation((name: string) =>
			name === 'KHR_parallel_shader_compile' && extPresent ? {} : null
		)
	} as unknown as WebGL2RenderingContext;
}

/**
 * Construct a fake WebGL renderer with the minimum shape `slugPrewarmShader`
 * inspects. `gl` may be shared across calls to simulate a renderer
 * wrapping a previously-prewarmed context.
 */
function makeRenderer(gl: WebGL2RenderingContext) {
	return {
		type: RENDERER_TYPE_WEBGL,
		gl,
		shader: {_programDataHash: {}}
	};
}

/** Stub `slugBuildGlProgramAsync` to resolve `ready` immediately with success. */
function stubAsyncSuccess() {
	mockBuildGlProgramAsync.mockImplementation(() => ({
		program: {marker: 'webgl-program'},
		ready: Promise.resolve()
	}));
}

/** Stub `slugBuildGlProgramAsync` to reject `ready` with the supplied error. */
function stubAsyncFailure(err: Error) {
	mockBuildGlProgramAsync.mockImplementation(() => ({
		program: {marker: 'webgl-program'},
		ready: Promise.reject(err)
	}));
}

describe('slugPrewarmContext', () => {
	beforeEach(() => {
		mockBuildGlProgramAsync.mockReset();
		mockBuildGlProgramData.mockReset().mockReturnValue({marker: 'program-data'});
		mockInjectGlProgramData.mockReset().mockReturnValue(true);
		mockCompileAndInject.mockReset().mockResolvedValue(true);
		jest.restoreAllMocks();
	});

	it('resolves to false for null/undefined gl', async () => {
		await expect(slugPrewarmContext(null)).resolves.toBe(false);
		await expect(slugPrewarmContext(undefined)).resolves.toBe(false);
		expect(mockBuildGlProgramAsync).not.toHaveBeenCalled();
	});

	it('resolves to false when the registry is not in prewarm mode', async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(false);
		const gl = makeGlContext(true);
		await expect(slugPrewarmContext(gl)).resolves.toBe(false);
		// Short-circuit before extension probe — toggle gates the path.
		expect(gl.getExtension).not.toHaveBeenCalled();
		expect(mockBuildGlProgramAsync).not.toHaveBeenCalled();
	});

	it('resolves to false when KHR_parallel_shader_compile is unavailable', async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(true);
		const gl = makeGlContext(false);
		await expect(slugPrewarmContext(gl)).resolves.toBe(false);
		expect(gl.getExtension).toHaveBeenCalledWith('KHR_parallel_shader_compile');
		expect(mockBuildGlProgramAsync).not.toHaveBeenCalled();
	});

	it('resolves to true on successful compile + link + program-data build', async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(true);
		stubAsyncSuccess();
		const gl = makeGlContext(true);

		await expect(slugPrewarmContext(gl)).resolves.toBe(true);
		expect(mockBuildGlProgramAsync).toHaveBeenCalledTimes(1);
		expect(mockBuildGlProgramData).toHaveBeenCalledTimes(1);
	});

	it('resolves to false when the async link rejects', async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(true);
		stubAsyncFailure(new Error('link failed: ...'));
		// Silence the expected console.error so test output stays clean.
		jest.spyOn(console, 'error').mockImplementation(() => undefined);
		const gl = makeGlContext(true);

		await expect(slugPrewarmContext(gl)).resolves.toBe(false);
		expect(mockBuildGlProgramData).not.toHaveBeenCalled();
	});

	it('resolves to false when post-link program-data build throws', async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(true);
		stubAsyncSuccess();
		mockBuildGlProgramData.mockImplementation(() => {
			throw new Error('PIXI internal drift: extractAttributesFromGlProgram missing');
		});
		jest.spyOn(console, 'error').mockImplementation(() => undefined);
		const gl = makeGlContext(true);

		await expect(slugPrewarmContext(gl)).resolves.toBe(false);
	});

	it('dedupes per-gl: a second call with the same gl returns the same promise', async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(true);
		stubAsyncSuccess();
		const gl = makeGlContext(true);

		const p1 = slugPrewarmContext(gl);
		const p2 = slugPrewarmContext(gl);
		const p3 = slugPrewarmContext(gl);

		expect(p1).toBe(p2);
		expect(p2).toBe(p3);
		// One compile started total, even with three calls.
		expect(mockBuildGlProgramAsync).toHaveBeenCalledTimes(1);

		await expect(p1).resolves.toBe(true);
	});

	it('does NOT dedupe across different gl contexts', async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(true);
		stubAsyncSuccess();
		const gl1 = makeGlContext(true);
		const gl2 = makeGlContext(true);

		await slugPrewarmContext(gl1);
		await slugPrewarmContext(gl2);
		expect(mockBuildGlProgramAsync).toHaveBeenCalledTimes(2);
	});
});

describe('slugPrewarmContextHas', () => {
	beforeEach(() => {
		mockBuildGlProgramAsync.mockReset();
		jest.restoreAllMocks();
	});

	it('returns false before any prewarm', () => {
		const gl = makeGlContext(true);
		expect(slugPrewarmContextHas(gl)).toBe(false);
	});

	it('returns true after a prewarm has started', () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(true);
		stubAsyncSuccess();
		const gl = makeGlContext(true);

		void slugPrewarmContext(gl);
		expect(slugPrewarmContextHas(gl)).toBe(true);
	});

	it('returns false for null/undefined gl', () => {
		expect(slugPrewarmContextHas(null)).toBe(false);
		expect(slugPrewarmContextHas(undefined)).toBe(false);
	});
});

describe('slugPrewarmShader adoption path', () => {
	beforeEach(() => {
		mockBuildGlProgramAsync.mockReset();
		mockBuildGlProgramData.mockReset().mockReturnValue({marker: 'program-data'});
		mockInjectGlProgramData.mockReset().mockReturnValue(true);
		mockCompileAndInject.mockReset().mockResolvedValue(true);
		jest.restoreAllMocks();
	});

	it("adopts a prewarmed context's program data when renderer.gl matches", async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(true);
		stubAsyncSuccess();
		const gl = makeGlContext(true);

		// Step 1: context prewarm completes, stores program data.
		await slugPrewarmContext(gl);
		expect(mockBuildGlProgramData).toHaveBeenCalledTimes(1);

		// Step 2: renderer wrapping the SAME gl arrives. Adoption path
		// should run — slugCompileAndInject is the fallback path and
		// must NOT be invoked.
		const renderer = makeRenderer(gl);
		await expect(slugPrewarmShader(renderer)).resolves.toBe(true);
		expect(mockCompileAndInject).not.toHaveBeenCalled();
		expect(mockInjectGlProgramData).toHaveBeenCalledTimes(1);
	});

	it('falls back to renderer-driven compile when renderer.gl does not match any prewarmed context', async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(true);
		const prewarmedGl = makeGlContext(true);
		const freshGl = makeGlContext(true);
		stubAsyncSuccess();

		// Prewarm a different gl than the renderer will use.
		await slugPrewarmContext(prewarmedGl);
		mockBuildGlProgramAsync.mockClear();

		const renderer = makeRenderer(freshGl);
		await slugPrewarmShader(renderer);

		// The renderer's gl was NOT prewarmed, so the renderer-driven
		// compile path runs.
		expect(mockCompileAndInject).toHaveBeenCalledTimes(1);
		// Adoption inject was NOT used (slugCompileAndInject handles its own injection).
		expect(mockInjectGlProgramData).not.toHaveBeenCalled();
	});

	it("awaits an in-flight context prewarm before adopting", async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(true);
		let resolveReady: () => void = () => undefined;
		mockBuildGlProgramAsync.mockImplementation(() => ({
			program: {marker: 'webgl-program'},
			ready: new Promise<void>((resolve) => {
				resolveReady = resolve;
			})
		}));
		const gl = makeGlContext(true);

		// Start context prewarm but don't let it resolve yet.
		const ctxPromise = slugPrewarmContext(gl);
		expect(mockBuildGlProgramAsync).toHaveBeenCalledTimes(1);

		// Renderer arrives before the context prewarm finishes. The
		// adoption path should await the in-flight context prewarm.
		const renderer = makeRenderer(gl);
		const rendererPromise = slugPrewarmShader(renderer);

		// Inject hasn't been called yet — still waiting for link.
		expect(mockInjectGlProgramData).not.toHaveBeenCalled();

		resolveReady();
		await expect(ctxPromise).resolves.toBe(true);
		await expect(rendererPromise).resolves.toBe(true);
		expect(mockInjectGlProgramData).toHaveBeenCalledTimes(1);
		// Fallback compile path was NOT used — adoption succeeded.
		expect(mockCompileAndInject).not.toHaveBeenCalled();
	});

	it('falls back to renderer-driven compile when context prewarm resolved false', async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(true);
		stubAsyncFailure(new Error('link failed'));
		jest.spyOn(console, 'error').mockImplementation(() => undefined);
		const gl = makeGlContext(true);

		await expect(slugPrewarmContext(gl)).resolves.toBe(false);

		// Now the renderer arrives. Adoption isn't usable because the
		// context prewarm failed; the path should fall back to the
		// renderer-driven compile.
		const renderer = makeRenderer(gl);
		await slugPrewarmShader(renderer);
		expect(mockCompileAndInject).toHaveBeenCalledTimes(1);
	});
});

describe('SlugFonts.prewarmContext public API', () => {
	beforeEach(() => {
		SlugFonts._resetRegistry();
		SlugFonts._installPrewarmHook(null);
		SlugFonts._installContextPrewarmHook(null);
		jest.restoreAllMocks();
	});

	afterAll(() => {
		SlugFonts._resetRegistry();
		SlugFonts._installPrewarmHook(null);
		SlugFonts._installContextPrewarmHook(null);
	});

	it('returns false when no hook is installed', async () => {
		const gl = makeGlContext(true);
		await expect(SlugFonts.prewarmContext(gl)).resolves.toBe(false);
	});

	it('invokes the installed hook when called as the first SlugFonts operation', async () => {
		const hook = jest.fn().mockResolvedValue(true);
		SlugFonts._installContextPrewarmHook(hook);

		const gl = makeGlContext(true);
		await expect(SlugFonts.prewarmContext(gl)).resolves.toBe(true);
		expect(hook).toHaveBeenCalledTimes(1);
		expect(hook).toHaveBeenCalledWith(gl);
		expect(SlugFonts.parallelShaderCompile).toBe(true);
	});

	it('returns false for null/undefined gl', async () => {
		const hook = jest.fn().mockResolvedValue(true);
		SlugFonts._installContextPrewarmHook(hook);

		await expect(SlugFonts.prewarmContext(null)).resolves.toBe(false);
		await expect(SlugFonts.prewarmContext(undefined)).resolves.toBe(false);
		expect(hook).not.toHaveBeenCalled();
	});

	it('warns and returns false when registry was already constructed in non-prewarm mode', async () => {
		// Trigger registry construction in non-prewarm mode by reading
		// renderer (a passive getter that auto-constructs the registry
		// with default options).
		expect(SlugFonts.renderer).toBeNull();
		expect(SlugFonts.parallelShaderCompile).toBe(false);

		const hook = jest.fn().mockResolvedValue(true);
		SlugFonts._installContextPrewarmHook(hook);

		const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
		const gl = makeGlContext(true);
		await expect(SlugFonts.prewarmContext(gl)).resolves.toBe(false);
		expect(hook).not.toHaveBeenCalled();
		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy.mock.calls[0][0]).toContain('prewarmContext');
		expect(warnSpy.mock.calls[0][0]).toContain('non-prewarm mode');
	});

	it('warns at most once per api name even with repeated misordered calls', async () => {
		expect(SlugFonts.renderer).toBeNull();

		const hook = jest.fn().mockResolvedValue(true);
		SlugFonts._installContextPrewarmHook(hook);
		const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
		const gl = makeGlContext(true);

		await SlugFonts.prewarmContext(gl);
		await SlugFonts.prewarmContext(gl);
		await SlugFonts.prewarmContext(gl);

		expect(warnSpy).toHaveBeenCalledTimes(1);
	});
});
