/**
 * Mock the pixi.js v8 surface that v8/slug/text.ts imports. The synchronous
 * `boundsArea` test below exercises only the CPU-side plan/rebuild path —
 * no GPU attach runs because `onRender` is not invoked — so we just need
 * stand-ins that let module loading succeed and the constructor finish.
 *
 * `Container` is the only one with non-trivial behavior: SlugText reads
 * `boundsArea` after assignment, and the v8 `width`/`height` getters in
 * real PIXI ultimately read it via `getLocalBounds()`. We expose
 * `boundsArea` as a plain property and derive `width` / `height` from it
 * so the assertion mirrors what user code would observe.
 */
jest.mock('pixi.js', () => {
	class FakeRectangle {
		constructor(
			public x: number = 0,
			public y: number = 0,
			public width: number = 0,
			public height: number = 0
		) {}
	}
	class FakeContainer {
		public children: unknown[] = [];
		public boundsArea: FakeRectangle | undefined;
		public eventMode: string = 'auto';
		public interactiveChildren: boolean = true;
		public destroyed: boolean = false;
		public onRender: ((renderer: unknown) => void) | null = null;
		addChild(child: unknown): unknown {
			this.children.push(child);
			return child;
		}
		removeChild(child: unknown): void {
			const i = this.children.indexOf(child);
			if (i >= 0) this.children.splice(i, 1);
		}
		destroy(): void {
			this.destroyed = true;
		}
		// `width` / `height` on the real v8 Container go through
		// `getLocalBounds()`, which honors `boundsArea` when set. Mirror
		// that so the test asserts via the same surface application code
		// uses.
		get width(): number {
			return this.boundsArea ? this.boundsArea.width : 0;
		}
		get height(): number {
			return this.boundsArea ? this.boundsArea.height : 0;
		}
	}
	class FakeBuffer {
		constructor(public opts: unknown) {}
	}
	class FakeGeometry {
		constructor(public opts: unknown) {}
		destroy(): void {}
	}
	class FakeShader {
		public resources: Record<string, unknown> = {};
		constructor(public opts: unknown) {}
		destroy(): void {}
	}
	class FakeMesh {
		public x: number = 0;
		public y: number = 0;
		public geometry: FakeGeometry;
		public shader: FakeShader;
		constructor(opts: {geometry: FakeGeometry; shader: FakeShader}) {
			this.geometry = opts.geometry;
			this.shader = opts.shader;
		}
		destroy(): void {}
	}
	class FakeGraphics {
		rect(): this {
			return this;
		}
		fill(): this {
			return this;
		}
		destroy(): void {}
	}
	class FakeUniformGroup {
		public uniforms: Record<string, unknown>;
		constructor(uniforms: Record<string, unknown>) {
			this.uniforms = uniforms;
		}
	}
	class FakeGlProgram {
		static from(opts: unknown): FakeGlProgram {
			return new FakeGlProgram(opts);
		}
		constructor(public opts: unknown) {}
	}
	class FakeBufferImageSource {
		constructor(public opts: unknown) {}
		update(): void {}
	}
	class FakeTexture {
		public source: unknown;
		constructor(opts: {source: unknown}) {
			this.source = opts.source;
		}
		destroy(): void {}
	}
	return {
		__esModule: true,
		Buffer: FakeBuffer,
		BufferImageSource: FakeBufferImageSource,
		BufferUsage: {VERTEX: 'VERTEX'},
		Container: FakeContainer,
		Geometry: FakeGeometry,
		GlProgram: FakeGlProgram,
		Graphics: FakeGraphics,
		Mesh: FakeMesh,
		Rectangle: FakeRectangle,
		RendererType: {WEBGL: 'webgl', WEBGPU: 'webgpu'},
		Shader: FakeShader,
		Texture: FakeTexture,
		UniformGroup: FakeUniformGroup
	};
});

// `slugShader` reads the GLSL source via webpack raw imports. Stub the
// shader factory so the v8 attach path can build a Shader without
// touching the real GLSL files (those imports are webpack-only and
// fail under Jest's transform).
jest.mock('../../../src/shared/shader/slug/vert.glsl', () => 'STUB_VERT', {virtual: true});
jest.mock('../../../src/shared/shader/slug/frag.glsl', () => 'STUB_FRAG', {virtual: true});

jest.mock('../../../src/v8/slug/shader', () => ({
	__esModule: true,
	slugShader: () => ({
		shader: {resources: {}, destroy: () => undefined},
		uniforms: {
			uniforms: {
				uFillBoundsPx: new Float32Array(4),
				uFillParams0: new Float32Array(4),
				uFillTextureSizePx: new Float32Array(2),
				uFillTextureScale: new Float32Array(2),
				uFillTextureOffset: new Float32Array(2)
			}
		}
	})
}));

// `_attachGpu` calls `slugFontGpuV8(font, ensureResult, renderer)` to
// build / fetch the per-font GPU cache record. Stub it to return a
// minimal record so the attach path runs without a real renderer or
// GPU. `programReady` is left undefined so the attach takes the
// synchronous path (the parallel-compile gate is not what this suite
// is testing — the flicker regression is about the gap between
// teardown and re-attach on the *fast* path; the parallel-compile
// path makes the same gap longer but does not introduce it).
jest.mock('../../../src/v8/slug/font/gpu', () => ({
	__esModule: true,
	slugFontGpuV8: () => ({
		glProgram: {},
		curveTexture: {},
		bandTexture: {},
		fallbackWhite: {}
	})
}));

import {readFileSync} from 'fs';
import {resolve} from 'path';
import {SlugFont} from '../../../src/shared/slug/font';
import {SlugText} from '../../../src/v8/slug/text';

function loadFontFixture(filename: string): ArrayBuffer {
	const buf = readFileSync(resolve(__dirname, '../../../assets/fonts', filename));
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

describe('v8 SlugText', () => {
	let font: SlugFont;

	beforeAll(async () => {
		font = new SlugFont();
		await font.load(loadFontFixture('roboto-fallback.ttf'));
	});

	describe('synchronous bounds (regression: 0.3.0 deferred boundsArea)', () => {
		it('exposes width > 0 immediately after construction', () => {
			const text = new SlugText({text: 'Hello', font, options: {fontSize: 32}});
			expect(text.width).toBeGreaterThan(0);
		});

		it('exposes height > 0 immediately after construction', () => {
			const text = new SlugText({text: 'Hello', font, options: {fontSize: 32}});
			expect(text.height).toBeGreaterThan(0);
		});

		it('updates width synchronously after the text setter', () => {
			const text = new SlugText({text: 'A', font, options: {fontSize: 32}});
			const shortWidth = text.width;
			text.text = 'AAAAAAAAAA';
			expect(text.width).toBeGreaterThan(shortWidth);
		});

		it('clears bounds when text is set to empty', () => {
			const text = new SlugText({text: 'Hello', font, options: {fontSize: 32}});
			expect(text.width).toBeGreaterThan(0);
			text.text = '';
			expect(text.width).toBe(0);
			expect(text.height).toBe(0);
		});

		it('produces width matching fontSize scaling', () => {
			const small = new SlugText({text: 'Hello', font, options: {fontSize: 16}});
			const large = new SlugText({text: 'Hello', font, options: {fontSize: 64}});
			// 4x font size should scale width by ~4x. Allow generous slack
			// for layout rounding — the assertion is "scales roughly with
			// fontSize", not an exact pixel match.
			expect(large.width).toBeGreaterThan(small.width * 3);
		});
	});

	describe('atomic re-attach (regression: 0.3.x flicker on rapid mutation)', () => {
		// Stand-in for a v8 `Renderer`. `_attachGpu` reads `renderer.type`
		// to decide WebGL vs other; setting it to anything other than
		// `RendererType.WEBGL` ('webgl') routes through the non-WebGL
		// branch which skips the parallel-compile gate. The mocked
		// `slugFontGpuV8` returns a record without `programReady`, so
		// the synchronous attach path runs either way.
		const fakeRenderer = {type: 'webgpu'} as unknown as Parameters<
			NonNullable<SlugText['onRender']>
		>[0];

		// Drive one render tick. Mirrors what PIXI does each frame for
		// containers with `onRender` set.
		function tick(text: SlugText): void {
			text.onRender?.(fakeRenderer);
		}

		it('keeps display-list children attached during the rebuild → attach gap', () => {
			const text = new SlugText({text: 'Hello', font, options: {fontSize: 32}});
			tick(text); // first attach lands
			expect(text.children.length).toBeGreaterThan(0);

			// Mutate. Under 0.3.0 / 0.3.1 the old children would be torn
			// down here and `children.length` would drop to 0 until the
			// next tick. Under the atomic-reattach fix they stay until
			// the next attach replaces them.
			text.text = 'World';
			expect(text.children.length).toBeGreaterThan(0);

			// After the next tick the new children are attached and the
			// old ones are flushed, so the count is still > 0.
			tick(text);
			expect(text.children.length).toBeGreaterThan(0);
		});

		it('never drops child count to zero across a rapid mutation sequence', () => {
			const text = new SlugText({text: 'frame-0', font, options: {fontSize: 24}});
			tick(text);
			expect(text.children.length).toBeGreaterThan(0);

			// 30 frames of "every frame mutates the text" — the pattern
			// that produced visible flicker on Y-axis tick labels and
			// FPS counters in the bug report.
			for (let i = 1; i <= 30; i++) {
				text.text = `frame-${i}`;
				// Sample BEFORE the tick — this is the window where the
				// flicker happened (text was torn down inside `rebuild()`
				// before `_attachGpu` re-attached on the next frame).
				expect(text.children.length).toBeGreaterThan(0);
				tick(text);
				// Sample AFTER the tick — the new children are now on
				// the display list and the old ones have been flushed.
				expect(text.children.length).toBeGreaterThan(0);
			}
		});

		it('flushes held-over children when text is set to empty', () => {
			const text = new SlugText({text: 'Hello', font, options: {fontSize: 32}});
			tick(text);
			expect(text.children.length).toBeGreaterThan(0);

			// Empty text produces no plan, so no upcoming attach drives
			// the swap — `rebuild()` must flush the held-over state
			// inline or the old meshes leak onto the display list.
			text.text = '';
			expect(text.children.length).toBe(0);
		});

		it('does not double-attach when destroyed mid-rebuild', () => {
			const text = new SlugText({text: 'Hello', font, options: {fontSize: 32}});
			tick(text);
			expect(text.children.length).toBeGreaterThan(0);

			// Mutate then destroy before the attach runs. `destroy()`
			// must clean up both the still-attached old meshes AND any
			// held-over state, so nothing leaks.
			text.text = 'World';
			text.destroy();
			// `onRender` must be cleared so PIXI doesn't keep firing it
			// on a dead instance.
			expect(text.onRender).toBeNull();
		});
	});
});
