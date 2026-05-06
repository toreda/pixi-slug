/**
 * `pixi.js` (v8) ships ESM-only deps that Jest's default transform doesn't
 * process; mock the surface this module touches.
 */
jest.mock('pixi.js', () => ({
	__esModule: true,
	GlProgram: class {},
	GlProgramData: class {},
	WebGLRenderer: class {}
}));

const buildAsyncMock = jest.fn();
const buildProgramDataMock = jest.fn();
const injectMock = jest.fn();

jest.mock('../../../../src/shared/slug/font/glprogram-async', () => ({
	slugBuildGlProgramAsync: (...args: unknown[]) => buildAsyncMock(...args)
}));
jest.mock('../../../../src/v8/slug/font/glprogramdata', () => ({
	slugBuildGlProgramData: (...args: unknown[]) => buildProgramDataMock(...args)
}));
jest.mock('../../../../src/v8/slug/font/inject', () => ({
	slugInjectGlProgramData: (...args: unknown[]) => injectMock(...args)
}));

import {slugCompileAndInject} from '../../../../src/v8/slug/font/compile';
import type {GlProgram, WebGLRenderer} from 'pixi.js';

const gl = {} as WebGL2RenderingContext;
const renderer = {} as WebGLRenderer;
const pixiGlProgram = {} as GlProgram;
const vert = 'vert';
const frag = 'frag';

describe('slugCompileAndInject', () => {
	let errSpy: jest.SpyInstance;

	beforeEach(() => {
		buildAsyncMock.mockReset();
		buildProgramDataMock.mockReset();
		injectMock.mockReset();
		errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
	});
	afterEach(() => {
		errSpy.mockRestore();
	});

	it('resolves true when ready resolves and injection succeeds', async () => {
		buildAsyncMock.mockReturnValue({program: {}, ready: Promise.resolve()});
		buildProgramDataMock.mockReturnValue({});
		injectMock.mockReturnValue(true);

		await expect(slugCompileAndInject(gl, renderer, pixiGlProgram, vert, frag, false)).resolves.toBe(true);
		expect(errSpy).not.toHaveBeenCalled();
	});

	it('resolves false and logs to console.error when ready rejects (link failure)', async () => {
		const linkErr = new Error('slugBuildGlProgramAsync: link failed.\nprogram: bad\nvertex: \nfragment: ');
		buildAsyncMock.mockReturnValue({program: {}, ready: Promise.reject(linkErr)});

		await expect(slugCompileAndInject(gl, renderer, pixiGlProgram, vert, frag, false)).resolves.toBe(false);

		expect(errSpy).toHaveBeenCalledTimes(1);
		const [msg, err] = errSpy.mock.calls[0];
		expect(msg).toMatch(/parallel shader compile failed/);
		expect(err).toBe(linkErr);
	});

	it('resolves false and logs to console.error when slugBuildGlProgramData throws (PIXI drift)', async () => {
		const driftErr = new Error('extractAttributesFromGlProgram is not a function');
		buildAsyncMock.mockReturnValue({program: {}, ready: Promise.resolve()});
		buildProgramDataMock.mockImplementation(() => {
			throw driftErr;
		});

		await expect(slugCompileAndInject(gl, renderer, pixiGlProgram, vert, frag, false)).resolves.toBe(false);

		expect(errSpy).toHaveBeenCalledTimes(1);
		const [msg, err] = errSpy.mock.calls[0];
		expect(msg).toMatch(/post-link program-data build failed/);
		expect(err).toBe(driftErr);
	});

	it('does not log when injection returns false (already-handled fallback)', async () => {
		// `slugInjectGlProgramData` returns `false` rather than throwing
		// when PIXI's hash shape has drifted — that path already handles
		// its own logging upstream and shouldn't double-log here.
		buildAsyncMock.mockReturnValue({program: {}, ready: Promise.resolve()});
		buildProgramDataMock.mockReturnValue({});
		injectMock.mockReturnValue(false);

		await expect(slugCompileAndInject(gl, renderer, pixiGlProgram, vert, frag, false)).resolves.toBe(false);
		expect(errSpy).not.toHaveBeenCalled();
	});
});
