/**
 * `pixi.js` (v8) ships ESM-only deps Jest can't transform out of the
 * box, and the production `gpu.ts` imports `.glsl` files via webpack's
 * raw-loader. We mock both surfaces here so the test exercises only the
 * parallel-compile *decision* logic in `slugFontGpuV8`: which path is
 * taken given the toggle / extension presence / injection success.
 *
 * The pixi mock provides minimal stand-ins for `BufferImageSource`,
 * `Texture`, and `GlProgram.from()` — enough to let the cache-miss
 * path complete without throwing.
 */
jest.mock('pixi.js', () => {
	class FakeBufferImageSource {
		constructor(_opts: unknown) {}
		update(): void {}
	}
	class FakeTexture {
		public source: {update: () => void};
		constructor(opts: {source: {update: () => void}}) {
			this.source = opts.source;
		}
		destroy(): void {}
	}
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
		BufferImageSource: FakeBufferImageSource,
		Texture: FakeTexture,
		GlProgram: FakeGlProgram
	};
});

jest.mock('../../../../src/shared/shader/slug/vert.glsl', () => 'STUB_VERT', {virtual: true});
jest.mock('../../../../src/shared/shader/slug/frag.glsl', () => 'STUB_FRAG', {virtual: true});

const mockBuildAsync = jest.fn();
const mockBuildData = jest.fn();
const mockInject = jest.fn();

jest.mock('../../../../src/v8/slug/font/glprogram-async', () => ({
	__esModule: true,
	slugBuildGlProgramAsync: (...args: unknown[]) => mockBuildAsync(...args)
}));
jest.mock('../../../../src/v8/slug/font/glprogramdata', () => ({
	__esModule: true,
	slugBuildGlProgramData: (...args: unknown[]) => mockBuildData(...args)
}));
jest.mock('../../../../src/v8/slug/font/inject', () => ({
	__esModule: true,
	slugInjectGlProgramData: (...args: unknown[]) => mockInject(...args)
}));

import {SlugFont} from '../../../../src/shared/slug/font';
import {SlugFonts} from '../../../../src/shared/slug/fonts';
import {slugFontGpuV8} from '../../../../src/v8/slug/font/gpu';
import type {WebGLRenderer} from 'pixi.js';

function setToggle(value: boolean): void {
	jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(value);
}

interface RendererMock {
	renderer: WebGLRenderer;
	gl: {
		getExtension: jest.Mock;
	};
}

function makeRenderer(extPresent: boolean): RendererMock {
	const gl = {
		getExtension: jest.fn().mockImplementation((name: string) => {
			return name === 'KHR_parallel_shader_compile' && extPresent ? {} : null;
		})
	};
	const renderer = {gl, shader: {_programDataHash: {}}} as unknown as WebGLRenderer;
	return {renderer, gl};
}

/**
 * Build a SlugFont that has just enough state for `slugFontGpuV8` to
 * complete the cache-miss path without throwing. `unitsPerEm` is left at
 * 0 because gpu.ts doesn't read it; only the byte buffers and
 * `textureWidth` matter for texture creation.
 */
function makeFont(): SlugFont {
	const font = new SlugFont();
	return font;
}

describe('slugFontGpuV8 parallel-compile path', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
		mockBuildAsync.mockReset();
		mockBuildData.mockReset();
		mockInject.mockReset();
		// Default to a "happy path" async build; individual tests override.
		mockBuildAsync.mockReturnValue({program: {}, ready: Promise.resolve()});
		mockBuildData.mockReturnValue({mocked: 'GlProgramData'});
		mockInject.mockReturnValue(true);
	});

	describe('renderer omitted (legacy path)', () => {
		it('does not invoke the parallel build helpers', () => {
			const font = makeFont();
			const cache = slugFontGpuV8(font);

			expect(mockBuildAsync).not.toHaveBeenCalled();
			expect(cache.programReady).toBeUndefined();
		});

		it('does not query getExtension when no renderer is supplied', () => {
			// No renderer ⇒ no GL access at all ⇒ nothing to query.
			expect(() => slugFontGpuV8(makeFont(), null, null)).not.toThrow();
			expect(mockBuildAsync).not.toHaveBeenCalled();
		});
	});

	describe('renderer supplied + toggle off', () => {
		it('skips the parallel path entirely; no extension probe', () => {
			setToggle(false);
			const font = makeFont();
			const {renderer, gl} = makeRenderer(true);
			const cache = slugFontGpuV8(font, null, renderer);

			expect(gl.getExtension).not.toHaveBeenCalled();
			expect(mockBuildAsync).not.toHaveBeenCalled();
			expect(cache.programReady).toBeUndefined();
		});
	});

	describe('renderer supplied + toggle on + extension absent', () => {
		it('queries the extension once, then falls through to the legacy path', () => {
			setToggle(true);
			const font = makeFont();
			const {renderer, gl} = makeRenderer(false);

			const cache = slugFontGpuV8(font, null, renderer);

			expect(gl.getExtension).toHaveBeenCalledWith('KHR_parallel_shader_compile');
			expect(mockBuildAsync).not.toHaveBeenCalled();
			expect(cache.programReady).toBeUndefined();
		});
	});

	describe('renderer supplied + toggle on + extension present', () => {
		it('runs the async build, builds program data, and injects it (programReady → true)', async () => {
			setToggle(true);
			const font = makeFont();
			const {renderer} = makeRenderer(true);

			const cache = slugFontGpuV8(font, null, renderer);

			expect(mockBuildAsync).toHaveBeenCalledTimes(1);
			expect(cache.programReady).toBeInstanceOf(Promise);

			await expect(cache.programReady).resolves.toBe(true);
			expect(mockBuildData).toHaveBeenCalledTimes(1);
			expect(mockInject).toHaveBeenCalledTimes(1);
		});

		it('resolves programReady to false when injection reports a miss', async () => {
			setToggle(true);
			mockInject.mockReturnValue(false);

			const font = makeFont();
			const {renderer} = makeRenderer(true);
			const cache = slugFontGpuV8(font, null, renderer);

			await expect(cache.programReady).resolves.toBe(false);
		});

		it('resolves programReady to false when the async link rejects', async () => {
			setToggle(true);
			mockBuildAsync.mockReturnValue({
				program: {},
				ready: Promise.reject(new Error('link failure'))
			});

			const font = makeFont();
			const {renderer} = makeRenderer(true);
			const cache = slugFontGpuV8(font, null, renderer);

			await expect(cache.programReady).resolves.toBe(false);
			expect(mockBuildData).not.toHaveBeenCalled();
			expect(mockInject).not.toHaveBeenCalled();
		});

		it('resolves programReady to false when slugBuildGlProgramData throws', async () => {
			setToggle(true);
			mockBuildData.mockImplementation(() => {
				throw new Error('PIXI internal drift');
			});

			const font = makeFont();
			const {renderer} = makeRenderer(true);
			const cache = slugFontGpuV8(font, null, renderer);

			await expect(cache.programReady).resolves.toBe(false);
			expect(mockInject).not.toHaveBeenCalled();
		});
	});
});
