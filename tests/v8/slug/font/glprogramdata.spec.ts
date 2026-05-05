/**
 * `pixi.js` (v8) ships ESM-only deps (e.g. `earcut`) that Jest's
 * default transform doesn't process, so we cannot import the real
 * module here. Other v8 tests sidestep this with `it.todo` stubs;
 * for this wrapper we factor-mock `pixi.js` so the tests can drive
 * the helpers directly without needing a live WebGL context.
 *
 * The mock matches the surface `slugBuildGlProgramData` actually
 * touches: the four helpers, the `IGLUniformData` shape, and a
 * `GlProgramData` constructor that records its arguments.
 */
jest.mock('pixi.js', () => {
	const calls = {
		extractAttributes: jest.fn(),
		getUniformData: jest.fn(),
		getUboData: jest.fn(),
		defaultValue: jest.fn()
	};

	class MockGlProgramData {
		public program: WebGLProgram;
		public uniformData: Record<string, unknown>;
		constructor(program: WebGLProgram, uniformData: Record<string, unknown>) {
			this.program = program;
			this.uniformData = uniformData;
		}
	}

	class MockGlProgram {
		public _attributeData: Record<string, unknown> = {};
		public _uniformData: Record<string, unknown> = {};
		public _uniformBlockData: Record<string, unknown> = {};
		constructor(_opts: unknown) {}
	}

	return {
		__esModule: true,
		__mockCalls: calls,
		__MockGlProgramData: MockGlProgramData,
		GlProgramData: MockGlProgramData,
		IGLUniformData: class {},
		GlProgram: MockGlProgram,
		defaultValue: calls.defaultValue,
		extractAttributesFromGlProgram: calls.extractAttributes,
		getUboData: calls.getUboData,
		getUniformData: calls.getUniformData
	};
});

import {GlProgram} from 'pixi.js';
import {slugBuildGlProgramData} from '../../../../src/v8/slug/font/glprogramdata';

interface MockedPixi {
	__mockCalls: {
		extractAttributes: jest.Mock;
		getUniformData: jest.Mock;
		getUboData: jest.Mock;
		defaultValue: jest.Mock;
	};
	__MockGlProgramData: new (program: WebGLProgram, uniformData: Record<string, unknown>) => {
		program: WebGLProgram;
		uniformData: Record<string, unknown>;
	};
}

const mocked = jest.requireMock<MockedPixi>('pixi.js');
const MockGlProgramData = mocked.__MockGlProgramData;
const calls = mocked.__mockCalls;

interface MockGl {
	gl: WebGL2RenderingContext;
	locationCalls: string[];
}

function makeMockGl(): MockGl {
	const locationCalls: string[] = [];
	const gl = {
		getUniformLocation: (_p: WebGLProgram, name: string) => {
			locationCalls.push(name);
			return {name} as unknown as WebGLUniformLocation;
		}
	} as unknown as WebGL2RenderingContext;
	return {gl, locationCalls};
}

function setUniforms(uniforms: Array<{name: string; type: string; size?: number}>): void {
	const record: Record<string, {name: string; index: number; type: string; size: number; isArray: boolean; value: unknown}> = {};
	uniforms.forEach((u, i) => {
		record[u.name] = {
			name: u.name,
			index: i,
			type: u.type,
			size: u.size ?? 1,
			isArray: false,
			value: 0
		};
	});
	calls.getUniformData.mockReturnValue(record);
}

describe('slugBuildGlProgramData', () => {
	beforeEach(() => {
		calls.extractAttributes.mockReset().mockReturnValue({});
		calls.getUniformData.mockReset().mockReturnValue({});
		calls.getUboData.mockReset().mockReturnValue({});
		// PIXI's real `defaultValue` returns scalars/typed arrays; the
		// wrapper just stores whatever it returns, so a sentinel is fine.
		calls.defaultValue.mockReset().mockImplementation((type: string) => `default:${type}`);
	});

	it('returns a GlProgramData carrying the supplied program', () => {
		setUniforms([]);
		const {gl} = makeMockGl();
		const program = {} as WebGLProgram;
		const pixiGl = new GlProgram({vertex: '', fragment: ''});

		const result = slugBuildGlProgramData(gl, program, pixiGl, false);

		expect(result).toBeInstanceOf(MockGlProgramData);
		expect(result.program).toBe(program);
	});

	it('writes _attributeData / _uniformData / _uniformBlockData onto the GlProgram', () => {
		calls.extractAttributes.mockReturnValue({aPos: {location: 0}});
		setUniforms([{name: 'uColor', type: 'float'}]);
		calls.getUboData.mockReturnValue({uBlock: {index: 0, name: 'uBlock', size: 16}});

		const {gl} = makeMockGl();
		const program = {} as WebGLProgram;
		const pixiGl = new GlProgram({vertex: '', fragment: ''});

		slugBuildGlProgramData(gl, program, pixiGl, false);

		expect(pixiGl._attributeData).toEqual({aPos: {location: 0}});
		expect(pixiGl._uniformData).toHaveProperty('uColor');
		expect(pixiGl._uniformBlockData).toHaveProperty('uBlock');
	});

	it('builds a uniform location lookup for every uniform reported by PIXI', () => {
		setUniforms([
			{name: 'uColor', type: 'float'},
			{name: 'uTex', type: 'sampler2D'}
		]);

		const {gl, locationCalls} = makeMockGl();
		const program = {} as WebGLProgram;
		const pixiGl = new GlProgram({vertex: '', fragment: ''});

		const result = slugBuildGlProgramData(gl, program, pixiGl, false);

		expect(locationCalls.sort()).toEqual(['uColor', 'uTex']);
		expect(result.uniformData.uColor).toEqual({location: {name: 'uColor'}, value: 'default:float'});
		expect(result.uniformData.uTex).toEqual({location: {name: 'uTex'}, value: 'default:sampler2D'});
	});

	it('forwards sortAttributes verbatim to extractAttributesFromGlProgram', () => {
		setUniforms([]);
		const {gl} = makeMockGl();
		const program = {} as WebGLProgram;
		const pixiGl = new GlProgram({vertex: '', fragment: ''});

		slugBuildGlProgramData(gl, program, pixiGl, true);
		expect(calls.extractAttributes).toHaveBeenLastCalledWith(program, gl, true);

		slugBuildGlProgramData(gl, program, pixiGl, false);
		expect(calls.extractAttributes).toHaveBeenLastCalledWith(program, gl, false);
	});

	it('passes type and size from PIXI uniform data through to defaultValue', () => {
		setUniforms([{name: 'uVec', type: 'vec3', size: 4}]);

		const {gl} = makeMockGl();
		const program = {} as WebGLProgram;
		const pixiGl = new GlProgram({vertex: '', fragment: ''});

		slugBuildGlProgramData(gl, program, pixiGl, false);

		expect(calls.defaultValue).toHaveBeenCalledWith('vec3', 4);
	});
});
