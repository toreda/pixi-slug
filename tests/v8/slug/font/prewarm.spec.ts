/**
 * Tests for the v8 `slugPrewarmShader` helper. The function is the
 * standalone entry point used by Part B (§6.3) — `attachRenderer` and
 * `fromUrl` call it to compile the Slug shader off the main thread
 * before any SlugText is constructed.
 *
 * `pixi.js` is mocked because (a) Jest can't transform its ESM-only
 * deps and (b) we need deterministic control over `GlProgram.from()`
 * and `RendererType.WEBGL`. The GLSL imports are stubbed for the same
 * reason as in `gpu.spec.ts`.
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
		// Inline literal — mock factory is hoisted above any module-scope
		// constants, so referencing one would crash with `Cannot access
		// before initialization`.
		RendererType: {WEBGL: 1, WEBGPU: 2, CANVAS: 4}
	};
});

// Same value as the inline literal above — duplicated rather than
// shared because jest hoisting prevents the factory from referencing
// module-scope identifiers.
const RENDERER_TYPE_WEBGL = 1;

jest.mock('../../../../src/shared/shader/slug/vert.glsl', () => 'STUB_VERT', {virtual: true});
jest.mock('../../../../src/shared/shader/slug/frag.glsl', () => 'STUB_FRAG', {virtual: true});

const mockCompileAndInject = jest.fn();
jest.mock('../../../../src/v8/slug/font/compile', () => ({
	__esModule: true,
	slugCompileAndInject: (...args: unknown[]) => mockCompileAndInject(...args)
}));

import {SlugFonts} from '../../../../src/shared/slug/fonts';
import {slugPrewarmShader, slugPrewarmHas} from '../../../../src/v8/slug/font/prewarm';

function makeWebGLRenderer(extPresent: boolean = true) {
	return {
		type: RENDERER_TYPE_WEBGL,
		gl: {
			getExtension: jest.fn().mockImplementation((name: string) =>
				name === 'KHR_parallel_shader_compile' && extPresent ? {} : null
			)
		},
		shader: {_programDataHash: {}}
	};
}

function makeWebGPURenderer() {
	return {type: 2, gl: null};
}

describe('slugPrewarmShader', () => {
	beforeEach(() => {
		mockCompileAndInject.mockReset().mockResolvedValue(true);
		jest.restoreAllMocks();
	});

	it('resolves to false for null/undefined renderer', async () => {
		await expect(slugPrewarmShader(null)).resolves.toBe(false);
		await expect(slugPrewarmShader(undefined)).resolves.toBe(false);
		expect(mockCompileAndInject).not.toHaveBeenCalled();
	});

	it('resolves to false for non-WebGL renderer (WebGPU/Canvas)', async () => {
		await expect(slugPrewarmShader(makeWebGPURenderer())).resolves.toBe(false);
		expect(mockCompileAndInject).not.toHaveBeenCalled();
	});

	it('resolves to false when the global toggle is off', async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(false);
		const r = makeWebGLRenderer(true);
		await expect(slugPrewarmShader(r)).resolves.toBe(false);
		expect(r.gl.getExtension).not.toHaveBeenCalled();
		expect(mockCompileAndInject).not.toHaveBeenCalled();
	});

	it('resolves to false when KHR_parallel_shader_compile is unavailable', async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(true);
		const r = makeWebGLRenderer(false);
		await expect(slugPrewarmShader(r)).resolves.toBe(false);
		expect(r.gl.getExtension).toHaveBeenCalledWith('KHR_parallel_shader_compile');
		expect(mockCompileAndInject).not.toHaveBeenCalled();
	});

	it('compiles and resolves to whatever slugCompileAndInject returns', async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(true);
		mockCompileAndInject.mockResolvedValue(true);
		const r = makeWebGLRenderer(true);

		await expect(slugPrewarmShader(r)).resolves.toBe(true);
		expect(mockCompileAndInject).toHaveBeenCalledTimes(1);
	});

	it('dedupes per renderer via WeakMap — second call returns the same in-flight promise', async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(true);
		let resolveCompile: (v: boolean) => void = () => undefined;
		mockCompileAndInject.mockImplementation(
			() =>
				new Promise<boolean>((resolve) => {
					resolveCompile = resolve;
				})
		);
		const r = makeWebGLRenderer(true);

		const p1 = slugPrewarmShader(r);
		const p2 = slugPrewarmShader(r);
		const p3 = slugPrewarmShader(r);

		expect(p1).toBe(p2);
		expect(p2).toBe(p3);
		// Only one compile started even though we called three times.
		expect(mockCompileAndInject).toHaveBeenCalledTimes(1);

		resolveCompile(true);
		await expect(p1).resolves.toBe(true);
	});

	it('does not dedupe across different renderer instances', async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(true);
		const r1 = makeWebGLRenderer(true);
		const r2 = makeWebGLRenderer(true);

		await slugPrewarmShader(r1);
		await slugPrewarmShader(r2);
		expect(mockCompileAndInject).toHaveBeenCalledTimes(2);
	});

	it('slugPrewarmHas reports presence after a prewarm has started', async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(true);
		const r = makeWebGLRenderer(true);

		expect(slugPrewarmHas(r)).toBe(false);
		void slugPrewarmShader(r);
		expect(slugPrewarmHas(r)).toBe(true);
	});

	it('slugPrewarmHas returns false for non-WebGL renderers regardless of state', () => {
		expect(slugPrewarmHas(null)).toBe(false);
		expect(slugPrewarmHas(makeWebGPURenderer())).toBe(false);
	});
});
