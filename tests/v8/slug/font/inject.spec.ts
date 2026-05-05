/**
 * `pixi.js` (v8) ships ESM-only deps (e.g. `earcut`) that Jest's
 * default transform doesn't process; mock the surface this module
 * actually touches.
 */
jest.mock('pixi.js', () => ({
	__esModule: true,
	GlProgram: class {},
	GlProgramData: class {},
	WebGLRenderer: class {}
}));

import {slugInjectGlProgramData} from '../../../../src/v8/slug/font/inject';
import type {GlProgram, GlProgramData, WebGLRenderer} from 'pixi.js';

function makeRenderer(hash: Record<number, GlProgramData> | null | undefined): WebGLRenderer {
	return {
		shader: {_programDataHash: hash}
	} as unknown as WebGLRenderer;
}

function makeProgram(key: unknown): GlProgram {
	return {_key: key} as unknown as GlProgram;
}

describe('slugInjectGlProgramData', () => {
	it('writes the program data into _programDataHash[program._key]', () => {
		const hash: Record<number, GlProgramData> = {};
		const renderer = makeRenderer(hash);
		const program = makeProgram(42);
		const data = {marker: true} as unknown as GlProgramData;

		const ok = slugInjectGlProgramData(renderer, program, data);

		expect(ok).toBe(true);
		expect(hash[42]).toBe(data);
	});

	it('returns false when _programDataHash is null', () => {
		const renderer = makeRenderer(null);
		const program = makeProgram(7);
		const ok = slugInjectGlProgramData(renderer, program, {} as GlProgramData);
		expect(ok).toBe(false);
	});

	it('returns false when _programDataHash is missing entirely', () => {
		const renderer = makeRenderer(undefined);
		const program = makeProgram(7);
		const ok = slugInjectGlProgramData(renderer, program, {} as GlProgramData);
		expect(ok).toBe(false);
	});

	it('returns false when program._key is not a number (PIXI internal drift)', () => {
		const hash: Record<number, GlProgramData> = {};
		const renderer = makeRenderer(hash);
		const program = makeProgram(undefined);

		const ok = slugInjectGlProgramData(renderer, program, {} as GlProgramData);

		expect(ok).toBe(false);
		expect(Object.keys(hash)).toHaveLength(0);
	});

	it('overwrites an existing entry idempotently', () => {
		const hash: Record<number, GlProgramData> = {};
		const renderer = makeRenderer(hash);
		const program = makeProgram(13);
		const first = {first: true} as unknown as GlProgramData;
		const second = {second: true} as unknown as GlProgramData;

		expect(slugInjectGlProgramData(renderer, program, first)).toBe(true);
		expect(slugInjectGlProgramData(renderer, program, second)).toBe(true);
		expect(hash[13]).toBe(second);
	});

	it('returns false when accessing renderer.shader throws', () => {
		const renderer = {
			get shader(): never {
				throw new Error('boom');
			}
		} as unknown as WebGLRenderer;

		const ok = slugInjectGlProgramData(renderer, makeProgram(1), {} as GlProgramData);
		expect(ok).toBe(false);
	});
});
