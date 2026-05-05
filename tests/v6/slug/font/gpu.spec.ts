/**
 * Integration tests for `slugFontGpuV6`'s parallel-compile decision
 * logic, mirroring `tests/v7/slug/font/gpu.spec.ts`. `@pixi/core`,
 * `@pixi/constants`, and the GLSL imports are all mocked so the
 * cache-miss path can complete without a real WebGL context.
 */
jest.mock('@pixi/constants', () => ({
	__esModule: true,
	FORMATS: {RGBA: 0x1908},
	TYPES: {FLOAT: 0x1406}
}));

jest.mock('@pixi/core', () => {
	let next = 1;
	class FakeProgram {
		public id: number;
		public vertexSrc: string;
		public fragmentSrc: string;
		public glPrograms: Record<number, unknown> = {};
		constructor(vert: string, frag: string) {
			this.id = next++;
			this.vertexSrc = vert;
			this.fragmentSrc = frag;
		}
		static from(vert: string, frag: string): FakeProgram {
			return new FakeProgram(vert, frag);
		}
	}
	class FakeBaseTexture {
		constructor(_buffer: unknown, _w: number, _h: number, _opts: unknown) {}
		static fromBuffer(buf: unknown, w: number, h: number, opts: unknown): FakeBaseTexture {
			return new FakeBaseTexture(buf, w, h, opts);
		}
		update(): void {}
	}
	class FakeTexture {
		public baseTexture: FakeBaseTexture;
		constructor(base: FakeBaseTexture) {
			this.baseTexture = base;
		}
		destroy(_includeBase?: boolean): void {}
		static WHITE = new FakeTexture(new FakeBaseTexture(null, 1, 1, {}));
	}
	return {
		__esModule: true,
		Program: FakeProgram,
		BaseTexture: FakeBaseTexture,
		Texture: FakeTexture
	};
});

jest.mock('../../../../src/v7/shader/slug/vert.glsl', () => 'STUB_VERT', {virtual: true});
jest.mock('../../../../src/shared/shader/slug/frag.glsl', () => 'STUB_FRAG', {virtual: true});

const mockCompileAndInject = jest.fn();
jest.mock('../../../../src/v6/slug/font/compile', () => ({
	__esModule: true,
	slugCompileAndInject: (...args: unknown[]) => mockCompileAndInject(...args)
}));

import {SlugFont} from '../../../../src/shared/slug/font';
import {SlugFonts} from '../../../../src/shared/slug/fonts';
import {slugFontGpuV6} from '../../../../src/v6/slug/font/gpu';
import type {Renderer} from '@pixi/core';

function setToggle(value: boolean): void {
	jest.spyOn(SlugFonts, 'parallelShaderCompile', 'get').mockReturnValue(value);
}

interface RendererMock {
	renderer: Renderer;
	gl: {getExtension: jest.Mock};
}

function makeRenderer(extPresent: boolean): RendererMock {
	const gl = {
		getExtension: jest.fn().mockImplementation((name: string) =>
			name === 'KHR_parallel_shader_compile' && extPresent ? {} : null
		)
	};
	const renderer = {gl, CONTEXT_UID: 1} as unknown as Renderer;
	return {renderer, gl};
}

function makeFont(): SlugFont {
	return new SlugFont();
}

describe('slugFontGpuV6 parallel-compile path', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
		mockCompileAndInject.mockReset().mockResolvedValue(true);
	});

	describe('renderer omitted (legacy path)', () => {
		it('does not invoke slugCompileAndInject', () => {
			const cache = slugFontGpuV6(makeFont());
			expect(mockCompileAndInject).not.toHaveBeenCalled();
			expect(cache.programReady).toBeUndefined();
		});

		it('does not query getExtension when no renderer is supplied', () => {
			expect(() => slugFontGpuV6(makeFont(), null, null)).not.toThrow();
			expect(mockCompileAndInject).not.toHaveBeenCalled();
		});
	});

	describe('renderer supplied + toggle off', () => {
		it('skips the parallel path entirely; no extension probe', () => {
			setToggle(false);
			const {renderer, gl} = makeRenderer(true);
			const cache = slugFontGpuV6(makeFont(), null, renderer);

			expect(gl.getExtension).not.toHaveBeenCalled();
			expect(mockCompileAndInject).not.toHaveBeenCalled();
			expect(cache.programReady).toBeUndefined();
		});
	});

	describe('renderer supplied + toggle on + extension absent', () => {
		it('queries the extension once, then falls through to the legacy path', () => {
			setToggle(true);
			const {renderer, gl} = makeRenderer(false);

			const cache = slugFontGpuV6(makeFont(), null, renderer);

			expect(gl.getExtension).toHaveBeenCalledWith('KHR_parallel_shader_compile');
			expect(mockCompileAndInject).not.toHaveBeenCalled();
			expect(cache.programReady).toBeUndefined();
		});
	});

	describe('renderer supplied + toggle on + extension present', () => {
		it('drives slugCompileAndInject and exposes its resolved boolean as programReady', async () => {
			setToggle(true);
			const {renderer} = makeRenderer(true);

			const cache = slugFontGpuV6(makeFont(), null, renderer);

			expect(mockCompileAndInject).toHaveBeenCalledTimes(1);
			expect(cache.programReady).toBeInstanceOf(Promise);
			await expect(cache.programReady).resolves.toBe(true);
		});

		it('resolves programReady to false when slugCompileAndInject reports a miss', async () => {
			setToggle(true);
			mockCompileAndInject.mockResolvedValue(false);
			const {renderer} = makeRenderer(true);
			const cache = slugFontGpuV6(makeFont(), null, renderer);
			await expect(cache.programReady).resolves.toBe(false);
		});

		it('surfaces a slugCompileAndInject rejection through programReady', async () => {
			setToggle(true);
			mockCompileAndInject.mockRejectedValue(new Error('link failure'));
			const {renderer} = makeRenderer(true);

			const cache = slugFontGpuV6(makeFont(), null, renderer);
			expect(cache.programReady).toBeInstanceOf(Promise);
			await expect(cache.programReady).rejects.toThrow(/link failure/);
		});
	});
});
