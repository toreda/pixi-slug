import {GLProgram, type IGLUniformData, type Program} from '@pixi/core';

/**
 * Run PIXI v6's post-link extraction steps against an already-linked
 * `WebGLProgram` and return a populated `GLProgram`. Intended to be
 * called once {@link slugBuildGlProgramAsync}'s `ready` promise
 * resolves — by then the link is complete and these queries are
 * non-blocking.
 *
 * Mirrors the tail half of PIXI v6's internal `generateProgram` (the
 * half that runs after `gl.linkProgram`) without re-issuing the link.
 * The result can be inserted into the program's per-context cache
 * (`program.glPrograms[renderer.CONTEXT_UID]`) so PIXI's first
 * `bind()` finds the cache hit and skips its own (blocking) compile
 * path.
 *
 * Two helpers (`getAttributeData`, `getUniformData`) are reimplemented
 * inline because PIXI v6's `@pixi/core` package's `exports` map only
 * surfaces the top-level entry — deep imports into the dist tree
 * would resolve in this project but break for end users whose bundler
 * honors the `exports` map. The implementations mirror PIXI's own
 * line-for-line so post-link state matches what a sync compile would
 * have produced.
 *
 * Mutates `pixiProgram.attributeData` and `pixiProgram.uniformData`,
 * which v6's `ShaderSystem` reads on every `bind()` call (uniform sync,
 * UBO setup, signature generation). These fields are write-once on the
 * `Program` instance — PIXI's own `generateProgram` would have set
 * them on the same instance.
 */
export function slugBuildGlProgramData(
	gl: WebGL2RenderingContext,
	program: WebGLProgram,
	pixiProgram: Program
): GLProgram {
	pixiProgram.attributeData = getAttributeData(program, gl);
	pixiProgram.uniformData = getUniformData(program, gl);

	const uniformData: Record<string, IGLUniformData> = {};
	for (const name in pixiProgram.uniformData) {
		const data = pixiProgram.uniformData[name];
		uniformData[name] = {
			location: gl.getUniformLocation(program, name) as WebGLUniformLocation,
			// PIXI's IGLUniformData.value type doesn't include `null`,
			// but `defaultValue` returns null for unknown types — the
			// real PIXI runtime uses the same shape. Cast to satisfy
			// the stricter declared type.
			value: defaultValue(data.type, data.size) as IGLUniformData['value']
		};
	}

	return new GLProgram(program, uniformData);
}

/** GLSL type names returned for the active GL types we care about. */
const GL_TO_GLSL_TYPES: Record<string, string> = {
	FLOAT: 'float',
	FLOAT_VEC2: 'vec2',
	FLOAT_VEC3: 'vec3',
	FLOAT_VEC4: 'vec4',
	INT: 'int',
	INT_VEC2: 'ivec2',
	INT_VEC3: 'ivec3',
	INT_VEC4: 'ivec4',
	UNSIGNED_INT: 'uint',
	UNSIGNED_INT_VEC2: 'uvec2',
	UNSIGNED_INT_VEC3: 'uvec3',
	UNSIGNED_INT_VEC4: 'uvec4',
	BOOL: 'bool',
	BOOL_VEC2: 'bvec2',
	BOOL_VEC3: 'bvec3',
	BOOL_VEC4: 'bvec4',
	FLOAT_MAT2: 'mat2',
	FLOAT_MAT3: 'mat3',
	FLOAT_MAT4: 'mat4',
	SAMPLER_2D: 'sampler2D',
	INT_SAMPLER_2D: 'sampler2D',
	UNSIGNED_INT_SAMPLER_2D: 'sampler2D',
	SAMPLER_CUBE: 'samplerCube',
	INT_SAMPLER_CUBE: 'samplerCube',
	UNSIGNED_INT_SAMPLER_CUBE: 'samplerCube',
	SAMPLER_2D_ARRAY: 'sampler2DArray',
	INT_SAMPLER_2D_ARRAY: 'sampler2DArray',
	UNSIGNED_INT_SAMPLER_2D_ARRAY: 'sampler2DArray'
};

/** Element count per GLSL type — PIXI uses this for default-value sizing. */
const GLSL_TO_SIZE: Record<string, number> = {
	float: 1,
	vec2: 2,
	vec3: 3,
	vec4: 4,
	int: 1,
	ivec2: 2,
	ivec3: 3,
	ivec4: 4,
	uint: 1,
	uvec2: 2,
	uvec3: 3,
	uvec4: 4,
	bool: 1,
	bvec2: 2,
	bvec3: 3,
	bvec4: 4,
	mat2: 4,
	mat3: 9,
	mat4: 16,
	sampler2D: 1
};

let glTable: Record<number, string> | null = null;

/** Lazy GL constant → GLSL type-name lookup. Populated on first call
 * because the `gl` constants are not module-scope-available. */
function mapType(gl: WebGL2RenderingContext, type: number): string {
	if (!glTable) {
		const names = Object.keys(GL_TO_GLSL_TYPES);
		glTable = {};
		for (let i = 0; i < names.length; i++) {
			const k = names[i] as keyof WebGL2RenderingContext;
			const c = gl[k] as unknown as number;
			if (typeof c === 'number') glTable[c] = GL_TO_GLSL_TYPES[names[i]];
		}
	}
	return glTable[type];
}

function mapSize(type: string): number {
	return GLSL_TO_SIZE[type];
}

interface PixiAttributeData {
	type: string;
	name: string;
	size: number;
	location: number;
}

function getAttributeData(
	program: WebGLProgram,
	gl: WebGL2RenderingContext
): Record<string, PixiAttributeData> {
	const attributes: Record<string, PixiAttributeData> = {};
	const totalAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES) as number;
	for (let i = 0; i < totalAttributes; i++) {
		const attribData = gl.getActiveAttrib(program, i);
		if (!attribData || attribData.name.startsWith('gl_')) continue;
		const type = mapType(gl, attribData.type);
		attributes[attribData.name] = {
			type,
			name: attribData.name,
			size: mapSize(type),
			location: gl.getAttribLocation(program, attribData.name)
		};
	}
	return attributes;
}

type DefaultUniformValue = number | boolean | Float32Array | Int32Array | Uint32Array | boolean[] | null;

interface PixiUniformData {
	name: string;
	index: number;
	type: string;
	size: number;
	isArray: boolean;
	value: DefaultUniformValue;
}

/**
 * Reproduces PIXI v6's `shader/utils/defaultValue` exactly. Inlined
 * because that helper is not in `@pixi/core`'s `exports` map; deep
 * imports would resolve in this repo but break for downstream users.
 */
function defaultValue(type: string, size: number): DefaultUniformValue {
	switch (type) {
		case 'float':
			return 0;
		case 'vec2':
			return new Float32Array(2 * size);
		case 'vec3':
			return new Float32Array(3 * size);
		case 'vec4':
			return new Float32Array(4 * size);
		case 'int':
		case 'uint':
		case 'sampler2D':
		case 'sampler2DArray':
			return 0;
		case 'ivec2':
			return new Int32Array(2 * size);
		case 'ivec3':
			return new Int32Array(3 * size);
		case 'ivec4':
			return new Int32Array(4 * size);
		case 'uvec2':
			return new Uint32Array(2 * size);
		case 'uvec3':
			return new Uint32Array(3 * size);
		case 'uvec4':
			return new Uint32Array(4 * size);
		case 'bool':
			return false;
		case 'bvec2':
			return booleanArray(2 * size);
		case 'bvec3':
			return booleanArray(3 * size);
		case 'bvec4':
			return booleanArray(4 * size);
		case 'mat2':
			return new Float32Array([1, 0, 0, 1]);
		case 'mat3':
			return new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
		case 'mat4':
			return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
	}
	return null;
}

function booleanArray(size: number): boolean[] {
	const a = new Array<boolean>(size);
	for (let i = 0; i < a.length; i++) a[i] = false;
	return a;
}

function getUniformData(
	program: WebGLProgram,
	gl: WebGL2RenderingContext
): Record<string, PixiUniformData> {
	const uniforms: Record<string, PixiUniformData> = {};
	const totalUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
	for (let i = 0; i < totalUniforms; i++) {
		const uniformData = gl.getActiveUniform(program, i);
		if (!uniformData) continue;
		const name = uniformData.name.replace(/\[.*?\]$/, '');
		const isArray = !!uniformData.name.match(/\[.*?\]$/);
		const type = mapType(gl, uniformData.type);
		uniforms[name] = {
			name,
			index: i,
			type,
			size: uniformData.size,
			isArray,
			value: defaultValue(type, uniformData.size)
		};
	}
	return uniforms;
}
