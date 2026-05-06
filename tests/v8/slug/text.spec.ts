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
});
