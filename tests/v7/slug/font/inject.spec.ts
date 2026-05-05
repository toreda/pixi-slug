import {slugInjectGlProgramData} from '../../../../src/v7/slug/font/inject';
import type {GLProgram, Program, Renderer} from '@pixi/core';

function makeRenderer(uid: number | undefined): Renderer {
	return {CONTEXT_UID: uid} as unknown as Renderer;
}

function makeProgram(glPrograms: Record<number, GLProgram> | null | undefined): Program {
	return {glPrograms} as unknown as Program;
}

describe('slugInjectGlProgramData (v7)', () => {
	it('writes the program data into program.glPrograms[CONTEXT_UID]', () => {
		const glPrograms: Record<number, GLProgram> = {};
		const renderer = makeRenderer(42);
		const program = makeProgram(glPrograms);
		const data = {marker: true} as unknown as GLProgram;

		const ok = slugInjectGlProgramData(renderer, program, data);

		expect(ok).toBe(true);
		expect(glPrograms[42]).toBe(data);
	});

	it('returns false when CONTEXT_UID is not a number', () => {
		const glPrograms: Record<number, GLProgram> = {};
		const renderer = makeRenderer(undefined);
		const program = makeProgram(glPrograms);

		const ok = slugInjectGlProgramData(renderer, program, {} as GLProgram);

		expect(ok).toBe(false);
		expect(Object.keys(glPrograms)).toHaveLength(0);
	});

	it('returns false when program.glPrograms is null', () => {
		const renderer = makeRenderer(7);
		const program = makeProgram(null);
		const ok = slugInjectGlProgramData(renderer, program, {} as GLProgram);
		expect(ok).toBe(false);
	});

	it('returns false when program.glPrograms is missing entirely', () => {
		const renderer = makeRenderer(7);
		const program = makeProgram(undefined);
		const ok = slugInjectGlProgramData(renderer, program, {} as GLProgram);
		expect(ok).toBe(false);
	});

	it('overwrites an existing entry idempotently', () => {
		const glPrograms: Record<number, GLProgram> = {};
		const renderer = makeRenderer(13);
		const program = makeProgram(glPrograms);
		const first = {first: true} as unknown as GLProgram;
		const second = {second: true} as unknown as GLProgram;

		expect(slugInjectGlProgramData(renderer, program, first)).toBe(true);
		expect(slugInjectGlProgramData(renderer, program, second)).toBe(true);
		expect(glPrograms[13]).toBe(second);
	});
});
