import {FORMATS, TYPES} from '@pixi/constants';
import {BaseTexture, Program, Texture, type Renderer} from '@pixi/core';
import type {SlugFont, SlugFontEnsureResult} from '../../../shared/slug/font';
import {SlugFonts} from '../../../shared/slug/fonts';

import vertSource from '../../shader/slug/vert.glsl';
import fragSource from '../../../shared/shader/slug/frag.glsl';
import {slugCompileAndInject} from './compile';

/** Slug's GLSL is `#version 300 es`. PIXI v7's own `generateProgram`
 * (line 11 of node_modules/pixi-v7-core/.../generateProgram.js) uses the
 * same regex check to skip the alphabetical attribute pre-sort for
 * `#version 300 es` shaders — we mirror that decision so post-link
 * state matches what PIXI's sync path would have produced. */
const SORT_ATTRIBUTES = false;
const KHR_EXT = 'KHR_parallel_shader_compile';

/**
 * Cached GPU resources for a SlugFont in PixiJS v7.
 * Created once per font and shared across all SlugText instances.
 *
 * `fallbackWhite` is the placeholder bound to the fill samplers
 * (`uFillGradient`, `uFillTexture`) when a text instance has no gradient
 * or fill texture. WebGL requires a valid texture binding for every
 * sampler in the program even when the sampler isn't read at runtime;
 * `Texture.WHITE` is a PIXI built-in shared white texture, so the cache
 * doesn't own its lifetime.
 */
export interface SlugFontGpuV7 {
	curveTexture: Texture;
	bandTexture: Texture;
	fallbackWhite: Texture;
	program: Program;
	/**
	 * When the parallel-compile path is taken, resolves once the program
	 * is linked AND the resulting `GLProgram` has been injected into
	 * PIXI v7's per-program/per-context cache (`program.glPrograms`).
	 * Resolves to `true` on a successful injection, `false` when
	 * injection failed (PIXI internal drift) and the caller should
	 * expect PIXI's sync path on first draw instead.
	 *
	 * Absent on the legacy / sync path — callers should treat
	 * `programReady === undefined` as "no async wait needed; PIXI will
	 * compile on first draw".
	 */
	programReady?: Promise<boolean>;
	/**
	 * Reference to the `Float32Array` currently owned by the curve
	 * texture. When `font.curveData` no longer matches this reference,
	 * the buffer was reallocated by an `ensureGlyphs` grow and the
	 * curve texture must be recreated.
	 */
	_curveBuffer: Float32Array;
	/** Reference to the band buffer view. Compared by `.buffer` identity. */
	_bandBuffer: Float32Array;
}

function bandViewAsFloat(bandData: Uint32Array): Float32Array {
	return new Float32Array(bandData.buffer, bandData.byteOffset, bandData.length);
}

function makeCurveTexture(font: SlugFont): Texture {
	const textureWidth = font.textureWidth;
	const curveRows = Math.ceil(font.curveData.length / 4 / textureWidth) || 1;
	const base = BaseTexture.fromBuffer(font.curveData, textureWidth, curveRows, {
		format: FORMATS.RGBA,
		type: TYPES.FLOAT
	});
	return new Texture(base);
}

function makeBandTexture(font: SlugFont, bandView: Float32Array): Texture {
	const textureWidth = font.textureWidth;
	const bandRows = Math.ceil(font.bandData.length / 4 / textureWidth) || 1;
	const base = BaseTexture.fromBuffer(bandView, textureWidth, bandRows, {
		format: FORMATS.RGBA,
		type: TYPES.FLOAT
	});
	return new Texture(base);
}

/**
 * Create or retrieve cached V7 GPU resources for a SlugFont, syncing
 * the curve and band textures with whatever glyph data the font now
 * holds. See {@link slugFontGpuV8} for the full sync semantics —
 * behavior is identical aside from the v7-specific `BaseTexture` API.
 *
 * `renderer` is optional. When provided AND
 * `SlugFonts.parallelShaderCompile === true` AND
 * `KHR_parallel_shader_compile` is available on the renderer's GL
 * context, the cache-miss path compiles the Slug shader off the main
 * thread using {@link slugBuildGlProgramAsync} and pre-populates PIXI's
 * `program.glPrograms[CONTEXT_UID]` so the next draw skips PIXI's
 * blocking compile. Otherwise the cache-miss path constructs a
 * `Program` exactly as before and PIXI compiles synchronously on first
 * draw — preserving pre-feature behavior verbatim. The decision is
 * read once on cache miss; flipping the toggle later does not affect
 * already-compiled fonts.
 */
export function slugFontGpuV7(
	font: SlugFont,
	ensureResult: SlugFontEnsureResult | null = null,
	renderer: Renderer | null = null
): SlugFontGpuV7 {
	const cached = font.gpuCache as SlugFontGpuV7 | null;

	if (cached) {
		const bandView = bandViewAsFloat(font.bandData);
		let curveChanged = false;
		let bandChanged = false;

		if (cached._curveBuffer !== font.curveData) {
			cached.curveTexture.destroy(true);
			cached.curveTexture = makeCurveTexture(font);
			cached._curveBuffer = font.curveData;
			curveChanged = true;
		}
		if (cached._bandBuffer.buffer !== bandView.buffer) {
			cached.bandTexture.destroy(true);
			cached.bandTexture = makeBandTexture(font, bandView);
			cached._bandBuffer = bandView;
			bandChanged = true;
		}

		// Same buffer reference + new data appended → reupload via update().
		// PIXI v7's BaseTexture.update() bumps the dirty counter and the
		// texture system re-uploads the resource on next bind.
		if (!curveChanged && ensureResult?.addedAny) {
			cached.curveTexture.baseTexture.update();
		}
		if (!bandChanged && ensureResult?.addedAny) {
			cached.bandTexture.baseTexture.update();
		}

		return cached;
	}

	const bandView = bandViewAsFloat(font.bandData);
	const curveTexture = makeCurveTexture(font);
	const bandTexture = makeBandTexture(font, bandView);
	const program = Program.from(vertSource, fragSource);

	const cache: SlugFontGpuV7 = {
		curveTexture,
		bandTexture,
		fallbackWhite: Texture.WHITE,
		program,
		_curveBuffer: font.curveData,
		_bandBuffer: bandView
	};

	// Parallel-compile path: only entered when a renderer is available
	// (i.e. the caller knows which GL context to compile against), the
	// global toggle is on, and the GL context advertises the KHR
	// extension. Any failure short of a thrown exception falls back
	// transparently — `programReady` is omitted in that case so callers
	// know to expect PIXI's sync compile on first draw (today's path).
	if (renderer && SlugFonts.parallelShaderCompile) {
		const gl = renderer.gl as WebGL2RenderingContext;
		if (gl && typeof gl.getExtension === 'function' && gl.getExtension(KHR_EXT)) {
			cache.programReady = slugCompileAndInject(
				gl,
				renderer,
				program,
				program.vertexSrc,
				program.fragmentSrc,
				SORT_ATTRIBUTES
			);
		}
	}

	font.gpuCache = cache;
	font.setGpuDestroy(() => {
		cache.curveTexture.destroy(true);
		cache.bandTexture.destroy(true);
	});

	return cache;
}
