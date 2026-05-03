import {BufferImageSource, GlProgram, Texture} from 'pixi.js';
import type {SlugFont} from '../../../shared/slug/font';
import type {SlugFontEnsureResult} from '../../../shared/slug/font';

import vertSource from '../../../shared/shader/slug/vert.glsl';
import fragSource from '../../../shared/shader/slug/frag.glsl';

/**
 * Cached GPU resources for a SlugFont in PixiJS v8.
 * Created once per font and shared across all SlugText instances.
 */
export interface SlugFontGpuV8 {
	curveTexture: Texture;
	bandTexture: Texture;
	glProgram: GlProgram;
	/**
	 * 1x1 white RGBA8 placeholder. Bound to `uFillGradient` and
	 * `uFillTexture` when the text has no gradient / no texture so the
	 * sampler always has a valid texture (WebGL requires this even when
	 * `uFillMode == 0` and the sampler is never read).
	 */
	fallbackWhite: Texture;
	/**
	 * Reference to the `Float32Array` currently owned by the curve
	 * texture. When `font.curveData` no longer matches this reference,
	 * the buffer was reallocated by an `ensureGlyphs` grow and the
	 * curve texture must be recreated. When it still matches but new
	 * data was appended, a `source.update()` reuploads the same buffer.
	 */
	_curveBuffer: Float32Array;
	/** Reference to the `Float32Array` view onto `font.bandData` currently owned by the band texture. */
	_bandBuffer: Float32Array;
}

/**
 * Reinterpret a Uint32 band buffer as a Float32 view sharing the same
 * memory. PixiJS v8's `mapFormatToGlFormat` mismaps `rgba32uint` to
 * `gl.RGBA` instead of `gl.RGBA_INTEGER`, causing GL_INVALID_OPERATION
 * on upload. Uploading as `rgba32float` with bit-pattern reinterpretation
 * sidesteps the bug; the shader recovers the original uint32 values via
 * `floatBitsToUint`.
 */
function bandViewAsFloat(bandData: Uint32Array): Float32Array {
	return new Float32Array(bandData.buffer, bandData.byteOffset, bandData.length);
}

/**
 * Build a curve texture from `font.curveData`. The buffer is shared
 * (not copied) — PixiJS v8 reads from the live reference on every
 * upload, so subsequent `font.ensureGlyphs` calls that mutate the
 * buffer will be visible after a `source.update()`.
 */
function makeCurveTexture(font: SlugFont): Texture {
	const textureWidth = font.textureWidth;
	const curveRows = Math.ceil(font.curveData.length / 4 / textureWidth) || 1;
	return new Texture({
		source: new BufferImageSource({
			resource: font.curveData,
			width: textureWidth,
			height: curveRows,
			format: 'rgba32float',
			autoGenerateMipmaps: false,
			scaleMode: 'nearest',
			alphaMode: 'no-premultiply-alpha'
		})
	});
}

function makeBandTexture(font: SlugFont, bandView: Float32Array): Texture {
	const textureWidth = font.textureWidth;
	const bandRows = Math.ceil(font.bandData.length / 4 / textureWidth) || 1;
	return new Texture({
		source: new BufferImageSource({
			resource: bandView,
			width: textureWidth,
			height: bandRows,
			format: 'rgba32float',
			autoGenerateMipmaps: false,
			scaleMode: 'nearest',
			alphaMode: 'no-premultiply-alpha'
		})
	});
}

function makeFallbackWhite(): Texture {
	const data = new Uint8Array([255, 255, 255, 255]);
	return new Texture({
		source: new BufferImageSource({
			resource: data,
			width: 1,
			height: 1,
			format: 'rgba8unorm',
			autoGenerateMipmaps: false,
			scaleMode: 'nearest',
			alphaMode: 'no-premultiply-alpha'
		})
	});
}

/**
 * Create or retrieve cached V8 GPU resources for a SlugFont, syncing
 * the curve and band textures with whatever glyph data the font now
 * holds. On first call (cache miss), creates curve/band textures and a
 * GlProgram from the current `font.curveData` / `font.bandData`. On
 * subsequent calls:
 *
 *  - If the underlying buffers were reallocated (grew during a recent
 *    {@link SlugFont.ensureGlyphs}), recreate the affected texture
 *    pointing at the new buffer.
 *  - If `ensureResult.addedAny === true` but the buffers did not grow,
 *    issue a `source.update()` to reupload the existing buffer (whose
 *    tail bytes were just written by the appender).
 *  - Otherwise, return the cached object unchanged.
 *
 * `ensureResult` is optional. Pass `null` (or omit) when no
 * `ensureGlyphs` call preceded this — typical for the cache-miss path
 * where every byte of the texture is fresh anyway.
 */
export function slugFontGpuV8(font: SlugFont, ensureResult: SlugFontEnsureResult | null = null): SlugFontGpuV8 {
	const cached = font.gpuCache as SlugFontGpuV8 | null;

	if (cached) {
		const bandView = bandViewAsFloat(font.bandData);
		let curveChanged = false;
		let bandChanged = false;

		// Buffer-reference change → grow happened → recreate texture so
		// PIXI samples from the new (larger) backing memory.
		if (cached._curveBuffer !== font.curveData) {
			cached.curveTexture.destroy();
			cached.curveTexture = makeCurveTexture(font);
			cached._curveBuffer = font.curveData;
			curveChanged = true;
		}
		if (cached._bandBuffer.buffer !== bandView.buffer) {
			cached.bandTexture.destroy();
			cached.bandTexture = makeBandTexture(font, bandView);
			cached._bandBuffer = bandView;
			bandChanged = true;
		}

		// In-place append (no grow) — same buffer reference, but the
		// trailing bytes were just written by `slugTextureAppendGlyphs`.
		// Tell PIXI to reupload so the GPU sees the new data.
		if (!curveChanged && ensureResult?.addedAny) {
			cached.curveTexture.source.update();
		}
		if (!bandChanged && ensureResult?.addedAny) {
			cached.bandTexture.source.update();
		}

		return cached;
	}

	// Cache miss — first time this font has been used by the v8 GPU
	// path. Create textures sized to the data the font currently holds
	// (which may be empty if `ensureGlyphs` hasn't been called yet, or
	// already populated if a preload ran).
	const bandView = bandViewAsFloat(font.bandData);
	const curveTexture = makeCurveTexture(font);
	const bandTexture = makeBandTexture(font, bandView);

	// GlProgram.from() caches internally by source text, but we hold
	// the reference so SlugText instances don't need to import shader sources.
	const glProgram = GlProgram.from({
		vertex: vertSource,
		fragment: fragSource
	});

	const fallbackWhite = makeFallbackWhite();

	const cache: SlugFontGpuV8 = {
		curveTexture,
		bandTexture,
		glProgram,
		fallbackWhite,
		_curveBuffer: font.curveData,
		_bandBuffer: bandView
	};

	font.gpuCache = cache;
	font.setGpuDestroy(() => {
		cache.curveTexture.destroy();
		cache.bandTexture.destroy();
		cache.fallbackWhite.destroy();
	});

	return cache;
}
