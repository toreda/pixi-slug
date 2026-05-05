/**
 * Tests for the v7 `slugPrewarmShader` helper. Same shape as the v8
 * version but v7 has no `RendererType` enum (only one renderer type
 * exists) so the structural check is on `gl + CONTEXT_UID`.
 *
 * `@pixi/core` is fully mocked because v7's `Program.from(...)` spins
 * up a fragment-precision probe that touches `document.createElement` —
 * unavailable under jest's `node` environment. The mock provides just
 * the slice of API the prewarm helper actually touches.
 */

jest.mock('@pixi/core', () => {
	let next = 1;
	class FakeProgram {
		public id: number;
		public vertexSrc: string;
		public fragmentSrc: string;
		constructor(vert: string, frag: string) {
			this.id = next++;
			this.vertexSrc = vert;
			this.fragmentSrc = frag;
		}
		static from(vert: string, frag: string): FakeProgram {
			return new FakeProgram(vert, frag);
		}
	}
	return {__esModule: true, Program: FakeProgram};
});

jest.mock('../../../../src/v7/slug/font/compile', () => {
	const fn = jest.fn();
	return {
		__esModule: true,
		slugCompileAndInject: fn,
		__mockFn: fn
	};
});

jest.mock('../../../../src/v7/shader/slug/vert.glsl', () => 'STUB_VERT', {virtual: true});
jest.mock('../../../../src/shared/shader/slug/frag.glsl', () => 'STUB_FRAG', {virtual: true});

import {SlugFonts} from '../../../../src/shared/slug/fonts';
import {slugPrewarmShader, slugPrewarmHas} from '../../../../src/v7/slug/font/prewarm';

const mocked = jest.requireMock<{__mockFn: jest.Mock}>('../../../../src/v7/slug/font/compile');
const mockCompileAndInject = mocked.__mockFn;

interface RendererMock {
	renderer: {gl: {getExtension: jest.Mock} | null; CONTEXT_UID: number};
	gl: {getExtension: jest.Mock};
}

function makeV7Renderer(extPresent: boolean = true, contextUid: number = 1): RendererMock {
	const gl = {
		getExtension: jest.fn().mockImplementation((name: string) =>
			name === 'KHR_parallel_shader_compile' && extPresent ? {} : null
		)
	};
	return {renderer: {gl, CONTEXT_UID: contextUid}, gl};
}

describe('slugPrewarmShader (v7)', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
		mockCompileAndInject.mockReset().mockResolvedValue(true);
	});

	it('resolves to false for null/undefined renderer', async () => {
		await expect(slugPrewarmShader(null)).resolves.toBe(false);
		await expect(slugPrewarmShader(undefined)).resolves.toBe(false);
		expect(mockCompileAndInject).not.toHaveBeenCalled();
	});

	it('resolves to false for a renderer missing gl/CONTEXT_UID (structural check)', async () => {
		await expect(slugPrewarmShader({})).resolves.toBe(false);
		await expect(slugPrewarmShader({gl: {}})).resolves.toBe(false);
		await expect(slugPrewarmShader({CONTEXT_UID: 1})).resolves.toBe(false);
		expect(mockCompileAndInject).not.toHaveBeenCalled();
	});

	it('resolves to false when the global toggle is off', async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(false);
		const {renderer, gl} = makeV7Renderer(true);
		await expect(slugPrewarmShader(renderer)).resolves.toBe(false);
		expect(gl.getExtension).not.toHaveBeenCalled();
		expect(mockCompileAndInject).not.toHaveBeenCalled();
	});

	it('resolves to false when KHR_parallel_shader_compile is unavailable', async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(true);
		const {renderer, gl} = makeV7Renderer(false);
		await expect(slugPrewarmShader(renderer)).resolves.toBe(false);
		expect(gl.getExtension).toHaveBeenCalledWith('KHR_parallel_shader_compile');
		expect(mockCompileAndInject).not.toHaveBeenCalled();
	});

	it('compiles and resolves to whatever slugCompileAndInject returns', async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(true);
		mockCompileAndInject.mockResolvedValue(true);
		const {renderer} = makeV7Renderer(true);

		await expect(slugPrewarmShader(renderer)).resolves.toBe(true);
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
		const {renderer} = makeV7Renderer(true);

		const p1 = slugPrewarmShader(renderer);
		const p2 = slugPrewarmShader(renderer);
		const p3 = slugPrewarmShader(renderer);

		expect(p1).toBe(p2);
		expect(p2).toBe(p3);
		expect(mockCompileAndInject).toHaveBeenCalledTimes(1);

		resolveCompile(true);
		await expect(p1).resolves.toBe(true);
	});

	it('does not dedupe across different renderer instances', async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(true);
		const {renderer: r1} = makeV7Renderer(true, 1);
		const {renderer: r2} = makeV7Renderer(true, 2);

		await slugPrewarmShader(r1);
		await slugPrewarmShader(r2);
		expect(mockCompileAndInject).toHaveBeenCalledTimes(2);
	});

	it('slugPrewarmHas reports presence after a prewarm has started', async () => {
		jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(true);
		const {renderer} = makeV7Renderer(true);

		expect(slugPrewarmHas(renderer)).toBe(false);
		void slugPrewarmShader(renderer);
		expect(slugPrewarmHas(renderer)).toBe(true);
	});

	it('slugPrewarmHas returns false for non-renderer inputs', () => {
		expect(slugPrewarmHas(null)).toBe(false);
		expect(slugPrewarmHas({})).toBe(false);
	});
});
