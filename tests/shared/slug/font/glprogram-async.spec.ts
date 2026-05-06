import {slugBuildGlProgramAsync} from '../../../../src/shared/slug/font/glprogram-async';

const COMPLETION_STATUS_KHR = 0x91b1;
const LINK_STATUS = 0x8b82;
const VERTEX_SHADER = 0x8b31;
const FRAGMENT_SHADER = 0x8b30;

interface GlMockOptions {
	/** When true, `getExtension('KHR_parallel_shader_compile')` returns a non-null object. */
	hasExt?: boolean;
	/**
	 * Sequence of values returned by `getProgramParameter(_, COMPLETION_STATUS_KHR)`.
	 * The last value is repeated indefinitely so the test can model "always false"
	 * by passing `[false]`.
	 */
	completionSeq?: boolean[];
	/** Value returned by `getProgramParameter(_, LINK_STATUS)`. */
	linkStatus?: boolean;
	/** Info-log strings used when the link is reported as failed. */
	programLog?: string;
	vertexLog?: string;
	fragmentLog?: string;
}

interface GlMock {
	gl: WebGL2RenderingContext;
	calls: {
		getExtension: number;
		completionPolls: number;
		linkStatusQueries: number;
		linkProgram: number;
		bindAttribLocation: Array<{index: number; name: string}>;
		deleteShader: number;
	};
}

function makeGlMock(opts: GlMockOptions = {}): GlMock {
	const completionSeq = opts.completionSeq ?? [true];
	const linkStatus = opts.linkStatus ?? true;
	const calls = {
		getExtension: 0,
		completionPolls: 0,
		linkStatusQueries: 0,
		linkProgram: 0,
		bindAttribLocation: [] as Array<{index: number; name: string}>,
		deleteShader: 0
	};

	let pollIdx = 0;
	const program = {} as WebGLProgram;
	const vertex = {} as WebGLShader;
	const fragment = {} as WebGLShader;

	const gl = {
		VERTEX_SHADER,
		FRAGMENT_SHADER,
		LINK_STATUS,
		getExtension: (name: string): unknown => {
			calls.getExtension++;
			return name === 'KHR_parallel_shader_compile' && opts.hasExt ? {} : null;
		},
		createShader: (type: number) => (type === VERTEX_SHADER ? vertex : fragment),
		createProgram: () => program,
		shaderSource: () => undefined,
		compileShader: () => undefined,
		attachShader: () => undefined,
		detachShader: () => undefined,
		deleteShader: () => {
			calls.deleteShader++;
		},
		bindAttribLocation: (_p: WebGLProgram, index: number, name: string) => {
			calls.bindAttribLocation.push({index, name});
		},
		linkProgram: () => {
			calls.linkProgram++;
		},
		getProgramParameter: (_p: WebGLProgram, pname: number): boolean => {
			if (pname === COMPLETION_STATUS_KHR) {
				calls.completionPolls++;
				const v = completionSeq[Math.min(pollIdx, completionSeq.length - 1)];
				pollIdx++;
				return v;
			}
			if (pname === LINK_STATUS) {
				calls.linkStatusQueries++;
				return linkStatus;
			}
			return false;
		},
		getProgramInfoLog: (): string => opts.programLog ?? '',
		getShaderInfoLog: (s: WebGLShader): string =>
			s === vertex ? (opts.vertexLog ?? '') : (opts.fragmentLog ?? '')
	} as unknown as WebGL2RenderingContext;

	return {gl, calls};
}

const VERT_GLSL_300 = `#version 300 es
in vec4 aPositionNormal;
in vec4 aTexcoord;
in vec4 aBanding;
void main() { gl_Position = aPositionNormal; }`;

const FRAG_GLSL_300 = `#version 300 es
precision highp float;
out vec4 fragColor;
void main() { fragColor = vec4(1.0); }`;

describe('slugBuildGlProgramAsync', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});
	afterEach(() => {
		jest.useRealTimers();
	});

	describe('extension absent', () => {
		it('returns the program synchronously with a resolving promise', async () => {
			const {gl, calls} = makeGlMock({hasExt: false, linkStatus: true});

			const result = slugBuildGlProgramAsync(gl, VERT_GLSL_300, FRAG_GLSL_300, false);

			expect(result.program).toBeDefined();
			expect(calls.linkProgram).toBe(1);
			// Sync path → `LINK_STATUS` is queried directly, no `COMPLETION_STATUS_KHR` polling.
			expect(calls.completionPolls).toBe(0);

			await jest.runAllTimersAsync();
			await expect(result.ready).resolves.toBeUndefined();
			expect(calls.linkStatusQueries).toBe(1);
		});

		it('rejects with the info log when the synchronous link fails', async () => {
			const {gl} = makeGlMock({
				hasExt: false,
				linkStatus: false,
				programLog: 'p-log',
				vertexLog: 'v-log',
				fragmentLog: 'f-log'
			});

			const result = slugBuildGlProgramAsync(gl, VERT_GLSL_300, FRAG_GLSL_300, false);
			// Subscribe to the rejection BEFORE draining timers so the
			// rejection isn't seen as unhandled by Node.
			const assertion = expect(result.ready).rejects.toThrow(/p-log[\s\S]*v-log[\s\S]*f-log/);
			await jest.runAllTimersAsync();
			await assertion;
		});
	});

	describe('extension present', () => {
		it('resolves only after COMPLETION_STATUS_KHR flips true', async () => {
			const {gl, calls} = makeGlMock({
				hasExt: true,
				linkStatus: true,
				completionSeq: [false, false, true]
			});

			const result = slugBuildGlProgramAsync(gl, VERT_GLSL_300, FRAG_GLSL_300, false);

			// LINK_STATUS must not be queried until completion reports true —
			// querying it earlier is the very stall this feature avoids.
			await jest.advanceTimersByTimeAsync(4);
			expect(calls.linkStatusQueries).toBe(0);

			await jest.runAllTimersAsync();
			await expect(result.ready).resolves.toBeUndefined();
			expect(calls.completionPolls).toBe(3);
			expect(calls.linkStatusQueries).toBe(1);
		});

		it('rejects with the info log when LINK_STATUS reports failure after completion', async () => {
			const {gl} = makeGlMock({
				hasExt: true,
				completionSeq: [true],
				linkStatus: false,
				programLog: 'link-broken'
			});

			const result = slugBuildGlProgramAsync(gl, VERT_GLSL_300, FRAG_GLSL_300, false);
			const assertion = expect(result.ready).rejects.toThrow(/link-broken/);
			await jest.runAllTimersAsync();
			await assertion;
		});

		it('falls through to a synchronous LINK_STATUS query when COMPLETION_STATUS_KHR never flips', async () => {
			const {gl, calls} = makeGlMock({
				hasExt: true,
				completionSeq: [false],
				linkStatus: true
			});

			const result = slugBuildGlProgramAsync(gl, VERT_GLSL_300, FRAG_GLSL_300, false);
			await jest.runAllTimersAsync();

			// Hard-timeout fallback resolves rather than hangs.
			await expect(result.ready).resolves.toBeUndefined();
			expect(calls.linkStatusQueries).toBe(1);
		});
	});

	describe('attribute binding', () => {
		it('binds GLSL 3.00 in-attributes alphabetically when sortAttributes is true', () => {
			const {gl, calls} = makeGlMock({hasExt: false, linkStatus: true});

			slugBuildGlProgramAsync(gl, VERT_GLSL_300, FRAG_GLSL_300, true);

			const names = calls.bindAttribLocation.map((c) => c.name);
			expect(names).toEqual(['aBanding', 'aPositionNormal', 'aTexcoord']);
			calls.bindAttribLocation.forEach((c, i) => expect(c.index).toBe(i));
		});

		it('skips attribute binding when sortAttributes is false', () => {
			const {gl, calls} = makeGlMock({hasExt: false, linkStatus: true});

			slugBuildGlProgramAsync(gl, VERT_GLSL_300, FRAG_GLSL_300, false);

			expect(calls.bindAttribLocation).toEqual([]);
		});

		it('handles precision qualifiers (highp/mediump/lowp) on attribute types', () => {
			const {gl, calls} = makeGlMock({hasExt: false, linkStatus: true});
			const vert = `#version 300 es
in highp vec4 aHigh;
in mediump vec2 aMed;
in lowp float aLow;
void main() { gl_Position = aHigh; }`;

			slugBuildGlProgramAsync(gl, vert, FRAG_GLSL_300, true);

			const names = calls.bindAttribLocation.map((c) => c.name);
			expect(names).toEqual(['aHigh', 'aLow', 'aMed']);
		});

		it('handles storage qualifiers (flat) on attribute declarations', () => {
			const {gl, calls} = makeGlMock({hasExt: false, linkStatus: true});
			const vert = `#version 300 es
flat in uvec4 aPacked;
in vec4 aPos;
void main() { gl_Position = aPos; }`;

			slugBuildGlProgramAsync(gl, vert, FRAG_GLSL_300, true);

			const names = calls.bindAttribLocation.map((c) => c.name);
			expect(names).toEqual(['aPacked', 'aPos']);
		});

		it('ignores attribute declarations inside line and block comments', () => {
			const {gl, calls} = makeGlMock({hasExt: false, linkStatus: true});
			const vert = `#version 300 es
in vec4 aReal;
// in vec4 aLineCommented;
/* in vec4 aBlockCommented;
   in vec4 aAlsoCommented; */
void main() { gl_Position = aReal; }`;

			slugBuildGlProgramAsync(gl, vert, FRAG_GLSL_300, true);

			const names = calls.bindAttribLocation.map((c) => c.name);
			expect(names).toEqual(['aReal']);
		});
	});
});
