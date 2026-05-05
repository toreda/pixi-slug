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

// `gpu.ts` calls `slugCompileAndInject` from `compile.ts`, which in
// turn drives the async build / data extraction / injection helpers.
// Mock the single entry point — the inner helpers are exercised by
// their own specs (glprogram-async.spec.ts, glprogramdata.spec.ts,
// inject.spec.ts).
const mockCompileAndInject = jest.fn();
jest.mock('../../../../src/v8/slug/font/compile', () => ({
	__esModule: true,
	slugCompileAndInject: (...args: unknown[]) => mockCompileAndInject(...args)
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
		mockCompileAndInject.mockReset();
		// Happy-path default; individual tests override to exercise
		// failure modes (rejected ready promise, injection miss, etc.).
		mockCompileAndInject.mockResolvedValue(true);
	});

	describe('renderer omitted (legacy path)', () => {
		it('does not invoke slugCompileAndInject', () => {
			const cache = slugFontGpuV8(makeFont());

			expect(mockCompileAndInject).not.toHaveBeenCalled();
			expect(cache.programReady).toBeUndefined();
		});

		it('does not query getExtension when no renderer is supplied', () => {
			// No renderer ⇒ no GL access at all ⇒ nothing to query.
			expect(() => slugFontGpuV8(makeFont(), null, null)).not.toThrow();
			expect(mockCompileAndInject).not.toHaveBeenCalled();
		});
	});

	describe('renderer supplied + toggle off', () => {
		it('skips the parallel path entirely; no extension probe', () => {
			setToggle(false);
			const {renderer, gl} = makeRenderer(true);
			const cache = slugFontGpuV8(makeFont(), null, renderer);

			expect(gl.getExtension).not.toHaveBeenCalled();
			expect(mockCompileAndInject).not.toHaveBeenCalled();
			expect(cache.programReady).toBeUndefined();
		});
	});

	describe('renderer supplied + toggle on + extension absent', () => {
		it('queries the extension once, then falls through to the legacy path', () => {
			setToggle(true);
			const {renderer, gl} = makeRenderer(false);

			const cache = slugFontGpuV8(makeFont(), null, renderer);

			expect(gl.getExtension).toHaveBeenCalledWith('KHR_parallel_shader_compile');
			expect(mockCompileAndInject).not.toHaveBeenCalled();
			expect(cache.programReady).toBeUndefined();
		});
	});

	describe('renderer supplied + toggle on + extension present', () => {
		it('drives slugCompileAndInject and exposes its resolved boolean as programReady', async () => {
			setToggle(true);
			const {renderer} = makeRenderer(true);

			const cache = slugFontGpuV8(makeFont(), null, renderer);

			expect(mockCompileAndInject).toHaveBeenCalledTimes(1);
			expect(cache.programReady).toBeInstanceOf(Promise);
			await expect(cache.programReady).resolves.toBe(true);
		});

		it('resolves programReady to false when slugCompileAndInject reports a miss', async () => {
			setToggle(true);
			mockCompileAndInject.mockResolvedValue(false);
			const {renderer} = makeRenderer(true);
			const cache = slugFontGpuV8(makeFont(), null, renderer);
			await expect(cache.programReady).resolves.toBe(false);
		});

		it('surfaces a slugCompileAndInject rejection through programReady', async () => {
			setToggle(true);
			mockCompileAndInject.mockRejectedValue(new Error('link failure'));
			const {renderer} = makeRenderer(true);

			const cache = slugFontGpuV8(makeFont(), null, renderer);
			// Construction must not throw; rejection lives on programReady.
			expect(cache.programReady).toBeInstanceOf(Promise);
			await expect(cache.programReady).rejects.toThrow(/link failure/);
		});
	});
});
