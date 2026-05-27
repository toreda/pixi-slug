/**
 * Regression test for the multi-font / shared-font generation counter.
 *
 * Scenario the fix addresses:
 *   1. SlugText A is created on FontX, processing some glyphs.
 *   2. SlugText B is created on FontX (or a different SlugText with the
 *      same font), referencing additional glyphs that overflow the
 *      curve / band buffers.
 *   3. `slugFontGpuV8`'s cache-hit grow path destroys FontX's old
 *      `curveTexture` / `bandTexture` and replaces them with fresh
 *      instances built around the new (larger) backing buffers.
 *   4. SlugText A's previously-allocated `Shader.resources.uCurveTexture`
 *      / `uBandTexture` still point at the *destroyed* texture sources.
 *   5. Without the generation bump on the cache + the per-slot/per-text
 *      rebind on `_render`, A would draw against destroyed PIXI
 *      resources and either render garbled glyphs or nothing at all.
 *
 * These tests exercise only the GPU-cache side of the fix — the cache
 * must (a) initialise `generation` to 0 on miss, (b) bump it once when
 * either buffer is replaced, and (c) leave it alone when only an
 * in-place upload happens. The SlugText side that compares this counter
 * and rebinds is exercised via real rendering in the example pages and
 * by the broader multi-font end-to-end behaviour; mocking PIXI's
 * Shader.resources here would not catch real binding bugs.
 */
jest.mock('pixi.js', () => {
	class FakeBufferImageSource {
		constructor(_opts: unknown) {}
		update(): void {}
	}
	class FakeTexture {
		public source: {update: () => void};
		constructor(opts: {source: {update: () => void}}) {
			this.source = opts.source;
		}
		destroy(): void {}
	}
	let nextKey = 1;
	class FakeGlProgram {
		public _key: number;
		constructor(public opts: {vertex: string; fragment: string}) {
			this._key = nextKey++;
		}
		static from(opts: {vertex: string; fragment: string}): FakeGlProgram {
			return new FakeGlProgram(opts);
		}
	}
	return {
		__esModule: true,
		BufferImageSource: FakeBufferImageSource,
		Texture: FakeTexture,
		GlProgram: FakeGlProgram
	};
});

jest.mock('../../../../src/shared/shader/slug/vert.glsl', () => 'STUB_VERT', {virtual: true});
jest.mock('../../../../src/shared/shader/slug/frag.glsl', () => 'STUB_FRAG', {virtual: true});
jest.mock('../../../../src/v8/slug/font/compile', () => ({
	__esModule: true,
	slugCompileAndInject: jest.fn()
}));

import {SlugFont} from '../../../../src/shared/slug/font';
import {slugFontGpuV8, type SlugFontGpuV8} from '../../../../src/v8/slug/font/gpu';

function makeFont(): SlugFont {
	return new SlugFont();
}

describe('SlugFontGpuV8.generation', () => {
	it('initialises to 0 on cache miss', () => {
		const cache = slugFontGpuV8(makeFont()) as SlugFontGpuV8;
		expect(cache.generation).toBe(0);
	});

	it('does not bump generation on a no-op cache hit (no grow, no append)', () => {
		const font = makeFont();
		const first = slugFontGpuV8(font);
		const startGen = first.generation;

		// Second call with no buffer change must return the same cache
		// record and leave generation untouched — the steady-state path
		// must not produce spurious rebinds.
		const second = slugFontGpuV8(font);
		expect(second).toBe(first);
		expect(second.generation).toBe(startGen);
	});

	it('bumps generation when font.curveData is reallocated (curve buffer grow)', () => {
		const font = makeFont();
		const cache = slugFontGpuV8(font);
		const startGen = cache.generation;

		// Simulate `ensureGlyphs` having reallocated the curve buffer:
		// new `Float32Array` instance, distinct from the one the cache
		// is currently holding.
		font.curveData = new Float32Array(font.curveData.length + 4096);

		const after = slugFontGpuV8(font);
		expect(after.generation).toBe(startGen + 1);
	});

	it('bumps generation when font.bandData is reallocated (band buffer grow)', () => {
		const font = makeFont();
		const cache = slugFontGpuV8(font);
		const startGen = cache.generation;

		font.bandData = new Uint32Array(font.bandData.length + 4096);

		const after = slugFontGpuV8(font);
		expect(after.generation).toBe(startGen + 1);
	});

	it('bumps generation twice when both buffers are reallocated in one cycle', () => {
		const font = makeFont();
		const cache = slugFontGpuV8(font);
		const startGen = cache.generation;

		font.curveData = new Float32Array(font.curveData.length + 4096);
		font.bandData = new Uint32Array(font.bandData.length + 4096);

		const after = slugFontGpuV8(font);
		expect(after.generation).toBe(startGen + 2);
	});

	it('does not bump generation on an in-place buffer append (same reference, addedAny=true)', () => {
		const font = makeFont();
		const cache = slugFontGpuV8(font);
		const startGen = cache.generation;

		// Buffer references unchanged but `addedAny=true` triggers the
		// `source.update()` reupload path — that path keeps the same
		// Texture instances and must NOT bump the generation. Bumping
		// here would force every other SlugText sharing the font to
		// pointlessly reread `shader.resources` even though their
		// bindings remain valid.
		const after = slugFontGpuV8(font, {addedAny: true, appended: null});
		expect(after.generation).toBe(startGen);
	});

	it('keeps each font instance on its own generation counter', () => {
		const fontA = makeFont();
		const fontB = makeFont();
		const cacheA = slugFontGpuV8(fontA);
		const cacheB = slugFontGpuV8(fontB);

		expect(cacheA.generation).toBe(0);
		expect(cacheB.generation).toBe(0);

		// Grow A only; B's counter must stay at 0.
		fontA.curveData = new Float32Array(fontA.curveData.length + 4096);
		const afterA = slugFontGpuV8(fontA);
		const stillB = slugFontGpuV8(fontB);
		expect(afterA.generation).toBe(1);
		expect(stillB.generation).toBe(0);
	});
});
