import {slugBuildGlProgramData} from '../../../../src/v7/slug/font/glprogramdata';
import {GLProgram, type Program} from '@pixi/core';

/**
 * v7 jest can load `@pixi/core` directly (it ships a CJS entry), but
 * we still need a controllable `gl` and `WebGLProgram`. The helper is
 * pure function-of-its-arguments aside from one stateful detail: it
 * mutates `program.attributeData` and `program.uniformData`, which
 * PIXI v7's ShaderSystem reads on every `bind()`.
 */

const ACTIVE_ATTRIBUTES = 0x8b89;
const ACTIVE_UNIFORMS = 0x8b86;

interface MockGl {
	gl: WebGL2RenderingContext;
	calls: {
		uniformLocations: string[];
	};
}

function makeMockGl(opts: {
	attribs?: Array<{name: string; type: number}>;
	uniforms?: Array<{name: string; type: number; size?: number}>;
}): MockGl {
	const attribs = opts.attribs ?? [];
	const uniforms = opts.uniforms ?? [];
	const calls = {uniformLocations: [] as string[]};

	const gl = {
		// GL constants the helper reads via reflection in `mapType`.
		FLOAT: 0x1406,
		FLOAT_VEC2: 0x8b50,
		FLOAT_VEC3: 0x8b51,
		FLOAT_VEC4: 0x8b52,
		ACTIVE_ATTRIBUTES,
		ACTIVE_UNIFORMS,

		getProgramParameter: (_p: WebGLProgram, pname: number): number => {
			if (pname === ACTIVE_ATTRIBUTES) return attribs.length;
			if (pname === ACTIVE_UNIFORMS) return uniforms.length;
			return 0;
		},
		getActiveAttrib: (_p: WebGLProgram, i: number) => {
			const a = attribs[i];
			return a ? {name: a.name, type: a.type, size: 1} : null;
		},
		getActiveUniform: (_p: WebGLProgram, i: number) => {
			const u = uniforms[i];
			return u ? {name: u.name, type: u.type, size: u.size ?? 1} : null;
		},
		getAttribLocation: (_p: WebGLProgram, name: string) => {
			return attribs.findIndex((a) => a.name === name);
		},
		getUniformLocation: (_p: WebGLProgram, name: string) => {
			calls.uniformLocations.push(name);
			return {name} as unknown as WebGLUniformLocation;
		}
	} as unknown as WebGL2RenderingContext;

	return {gl, calls};
}

function makeProgram(): Program {
	// `Program` constructor injects `#define SHADER_NAME` and runs
	// precision setup for non-`#version` sources, but we pass the
	// minimal shape needed for the helper — `attributeData` /
	// `uniformData` start as undefined and the helper writes them.
	return {} as unknown as Program;
}

describe('slugBuildGlProgramData (v7)', () => {
	it('returns a GLProgram instance carrying the supplied program', () => {
		const {gl} = makeMockGl({});
		const program = {} as WebGLProgram;
		const pixiProgram = makeProgram();

		const result = slugBuildGlProgramData(gl, program, pixiProgram);

		expect(result).toBeInstanceOf(GLProgram);
		expect(result.program).toBe(program);
	});

	it('writes attributeData and uniformData onto the Program', () => {
		const {gl} = makeMockGl({
			attribs: [{name: 'aPos', type: 0x8b52 /* FLOAT_VEC4 */}],
			uniforms: [{name: 'uColor', type: 0x1406 /* FLOAT */}]
		});
		const pixiProgram = makeProgram();

		slugBuildGlProgramData(gl, {} as WebGLProgram, pixiProgram);

		expect(pixiProgram.attributeData).toHaveProperty('aPos');
		expect(pixiProgram.attributeData.aPos.location).toBe(0);
		expect(pixiProgram.uniformData).toHaveProperty('uColor');
		expect(pixiProgram.uniformData.uColor.type).toBe('float');
	});

	it('builds a uniform location lookup for every uniform reported by GL', () => {
		const {gl, calls} = makeMockGl({
			uniforms: [
				{name: 'uColor', type: 0x1406},
				{name: 'uSize', type: 0x8b50}
			]
		});
		const pixiProgram = makeProgram();

		const result = slugBuildGlProgramData(gl, {} as WebGLProgram, pixiProgram);

		expect(calls.uniformLocations.sort()).toEqual(['uColor', 'uSize']);
		expect((result.uniformData.uColor as {location: {name: string}}).location).toEqual({name: 'uColor'});
	});

	it('skips attributes whose name starts with "gl_"', () => {
		const {gl} = makeMockGl({
			attribs: [
				{name: 'aPos', type: 0x8b52},
				{name: 'gl_VertexID', type: 0x1404}
			]
		});
		const pixiProgram = makeProgram();

		slugBuildGlProgramData(gl, {} as WebGLProgram, pixiProgram);

		expect(pixiProgram.attributeData).toHaveProperty('aPos');
		expect(pixiProgram.attributeData).not.toHaveProperty('gl_VertexID');
	});
});
