import {FORMATS, TYPES} from '@pixi/constants';
import {BaseTexture, Program, Texture, type Renderer} from '@pixi/core';
import type {SlugFont, SlugFontEnsureResult} from '../../../shared/slug/font';
import {SlugFonts} from '../../../shared/slug/fonts';

import vertSource from '../../shader/slug/vert.glsl';
import fragSource from '../../../shared/shader/slug/frag.glsl';
import {slugCompileAndInject} from './compile';

/** Slug's GLSL is `#version 300 es`. PIXI v6's own `generateProgram`
 * uses the same regex check to skip the alphabetical attribute pre-sort
 * for `#version 300 es` shaders — we mirror that decision so post-link
 * state matches what PIXI's sync path would have produced. */
const SORT_ATTRIBUTES = false;
const KHR_EXT = 'KHR_parallel_shader_compile';

/**
 * Cached GPU resources for a SlugFont in PixiJS v6.
 * Created once per font and shared across all SlugText instances.
 */
export interface SlugFontGpuV6 {
	curveTexture: Texture;
	bandTexture: Texture;
	fallbackWhite: Texture;
	program: Program;
	/**
	 * When the parallel-compile path is taken, resolves once the program
	 * is linked AND the resulting `GLProgram` has been injected into
	 * PIXI v6's per-program/per-context cache (`program.glPrograms`).
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
	 * Bumped every time `curveTexture` or `bandTexture` is replaced
	 * (i.e. a buffer grow forced a destroy + recreate). Mirrors
	 * `SlugFontGpuV8.generation` — see that field for the full rationale.
	 * Read by every SlugText on every `_render` so stationary SlugTexts
	 * sharing a font with a just-grown SlugText can rebind their meshes'
	 * shader samplers to the new texture instances before drawing.
	 */
	generation: number;
	/** Reference to the `Float32Array` currently owned by the curve texture. */
	_curveBuffer: Float32Array;
	/** Reference to the band buffer view; compared by `.buffer` identity. */
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
 * Create or retrieve cached V6 GPU resources for a SlugFont, syncing
 * the curve and band textures with whatever glyph data the font now
 * holds. See {@link slugFontGpuV8} for the sync semantics — v6 uses
 * the same `BaseTexture.update()` reupload mechanism as v7.
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
export function slugFontGpuV6(
	font: SlugFont,
	ensureResult: SlugFontEnsureResult | null = null,
	renderer: Renderer | null = null
): SlugFontGpuV6 {
	const cached = font.gpuCache as SlugFontGpuV6 | null;

	if (cached) {
		const bandView = bandViewAsFloat(font.bandData);
		let curveChanged = false;
		let bandChanged = false;

		if (cached._curveBuffer !== font.curveData) {
			cached.curveTexture.destroy(true);
			cached.curveTexture = makeCurveTexture(font);
			cached._curveBuffer = font.curveData;
			cached.generation++;
			curveChanged = true;
		}
		if (cached._bandBuffer.buffer !== bandView.buffer) {
			cached.bandTexture.destroy(true);
			cached.bandTexture = makeBandTexture(font, bandView);
			cached._bandBuffer = bandView;
			cached.generation++;
			bandChanged = true;
		}

		// Same buffer reference. Mark dirty unconditionally on cache hit
		// because another SlugText sharing this font may have written
		// new glyph bytes since the last `_render`. See v8's gpu.ts for
		// the full rationale.
		if (!curveChanged) {
			cached.curveTexture.baseTexture.update();
		}
		if (!bandChanged) {
			cached.bandTexture.baseTexture.update();
		}

		return cached;
	}

	const bandView = bandViewAsFloat(font.bandData);
	const curveTexture = makeCurveTexture(font);
	const bandTexture = makeBandTexture(font, bandView);
	const program = Program.from(vertSource, fragSource);

	const cache: SlugFontGpuV6 = {
		curveTexture,
		bandTexture,
		fallbackWhite: Texture.WHITE,
		program,
		generation: 0,
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
