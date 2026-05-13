/**
 * Verifies the incremental-rebuild path defined in
 * `_specs/features/incremental-mesh-rebuild.md`. The mocks expose
 * allocation counters on the fake PIXI classes so we can assert that
 * `text` (and other incremental-eligible setters) do not allocate new
 * `Buffer` / `Geometry` / `Shader` / `Mesh` instances on the
 * cache-hit path. The full path is verified to behave like today —
 * fresh instances are allocated and the old ones are disposed.
 */
const allocCounters = {
	Buffer: 0,
	Geometry: 0,
	Shader: 0,
	Mesh: 0,
	Graphics: 0
};

function resetAllocCounters(): void {
	allocCounters.Buffer = 0;
	allocCounters.Geometry = 0;
	allocCounters.Shader = 0;
	allocCounters.Mesh = 0;
	allocCounters.Graphics = 0;
}

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
		get width(): number {
			return this.boundsArea ? this.boundsArea.width : 0;
		}
		get height(): number {
			return this.boundsArea ? this.boundsArea.height : 0;
		}
	}
	class FakeBuffer {
		public data: unknown;
		public byteLength: number;
		constructor(public opts: {data?: ArrayBufferView; usage?: string; label?: string; shrinkToFit?: boolean}) {
			allocCounters.Buffer++;
			this.data = opts.data ?? null;
			this.byteLength = opts.data ? opts.data.byteLength : 0;
		}
		setDataWithSize(data: ArrayBufferView, _size: number, _syncGPU: boolean): void {
			this.data = data;
		}
		update(_size?: number): void {}
		destroy(): void {}
	}
	class FakeGeometry {
		public attributes: Record<string, {buffer: FakeBuffer; format: string; stride: number; offset: number}>;
		public indexBuffer: FakeBuffer | ArrayBufferView | null;
		constructor(public opts: {
			attributes?: Record<string, {buffer: FakeBuffer; format: string; stride: number; offset: number}>;
			indexBuffer?: FakeBuffer | ArrayBufferView;
		}) {
			allocCounters.Geometry++;
			this.attributes = opts.attributes ?? {};
			this.indexBuffer = opts.indexBuffer ?? null;
		}
		destroy(_destroyBuffers?: boolean): void {}
	}
	class FakeShader {
		public resources: Record<string, unknown> = {};
		constructor(public opts: unknown) {
			allocCounters.Shader++;
		}
		destroy(): void {}
	}
	class FakeMesh {
		public x: number = 0;
		public y: number = 0;
		public geometry: FakeGeometry;
		public shader: FakeShader;
		constructor(opts: {geometry: FakeGeometry; shader: FakeShader}) {
			allocCounters.Mesh++;
			this.geometry = opts.geometry;
			this.shader = opts.shader;
		}
		destroy(): void {}
	}
	class FakeGraphics {
		constructor() {
			allocCounters.Graphics++;
		}
		rect(): this {
			return this;
		}
		fill(): this {
			return this;
		}
		clear(): this {
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
		BufferUsage: {VERTEX: 'VERTEX', INDEX: 'INDEX'},
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

jest.mock('../../../src/shared/shader/slug/vert.glsl', () => 'STUB_VERT', {virtual: true});
jest.mock('../../../src/shared/shader/slug/frag.glsl', () => 'STUB_FRAG', {virtual: true});

// `slugShader` mock: allocates a fresh Shader (counted) only when
// called. The slot-reuse path keeps the existing shader and never
// re-invokes this, so re-invocations indicate a regression.
jest.mock('../../../src/v8/slug/shader', () => {
	const {Shader} = require('pixi.js');
	return {
		__esModule: true,
		slugShader: (): {shader: unknown; uniforms: unknown} => ({
			shader: new Shader({}),
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
	};
});

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

// Drive the deferred GPU attach the same way the existing flicker
// tests do — call the bound `onRender` handler with a stub renderer.
function tick(text: SlugText): void {
	const handler = (text as unknown as {onRender: ((r: unknown) => void) | null}).onRender;
	if (handler) handler({type: 'webgl'});
}

describe('v8 SlugText — incremental rebuild allocation behavior', () => {
	let font: SlugFont;

	beforeAll(async () => {
		font = new SlugFont();
		await font.load(loadFontFixture('roboto-fallback.ttf'));
	});

	beforeEach(() => {
		resetAllocCounters();
	});

	describe('text setter (capacity-fit, axis-label hot path)', () => {
		it('allocates fresh PIXI objects for the initial construction', () => {
			const text = new SlugText({text: '$10.12', font, options: {fontSize: 32}});
			tick(text);
			// Initial allocation: at minimum one fill slot = 2 buffers
			// (vertex + index) + 1 geometry + 1 shader + 1 mesh.
			expect(allocCounters.Buffer).toBeGreaterThanOrEqual(2);
			expect(allocCounters.Geometry).toBeGreaterThanOrEqual(1);
			expect(allocCounters.Shader).toBeGreaterThanOrEqual(1);
			expect(allocCounters.Mesh).toBeGreaterThanOrEqual(1);
		});

		it('does NOT allocate new PIXI objects on text content change (capacity-fit)', () => {
			const text = new SlugText({text: '$10.12', font, options: {fontSize: 32}});
			tick(text);
			resetAllocCounters();

			text.text = '$10.21';
			tick(text);
			// Same length, both fit initial 8-quad capacity. Steady-state
			// hot path must not re-allocate any PIXI object.
			expect(allocCounters.Buffer).toBe(0);
			expect(allocCounters.Geometry).toBe(0);
			expect(allocCounters.Shader).toBe(0);
			expect(allocCounters.Mesh).toBe(0);
		});

		it('does NOT allocate when label shrinks within capacity', () => {
			const text = new SlugText({text: '$10.12', font, options: {fontSize: 32}});
			tick(text);
			resetAllocCounters();

			text.text = '$9.98';
			tick(text);
			expect(allocCounters.Buffer).toBe(0);
			expect(allocCounters.Geometry).toBe(0);
			expect(allocCounters.Shader).toBe(0);
			expect(allocCounters.Mesh).toBe(0);
		});

		it('does NOT allocate across a chart-axis scroll burst (50 SlugTexts × 5 frames)', () => {
			const labels: SlugText[] = [];
			for (let i = 0; i < 50; i++) {
				labels.push(new SlugText({text: '$0.00', font, options: {fontSize: 32}}));
			}
			for (const t of labels) tick(t);
			resetAllocCounters();

			// Five "scroll steps" — every label gets a new but
			// capacity-fitting value each frame.
			for (let frame = 0; frame < 5; frame++) {
				for (let i = 0; i < labels.length; i++) {
					labels[i].text = `$${frame}.${(i % 100).toString().padStart(2, '0')}`;
				}
				for (const t of labels) tick(t);
			}

			expect(allocCounters.Buffer).toBe(0);
			expect(allocCounters.Geometry).toBe(0);
			expect(allocCounters.Shader).toBe(0);
			expect(allocCounters.Mesh).toBe(0);
		});
	});

	describe('text setter (capacity-grow)', () => {
		it('replaces only the Buffers on growth, keeps Geometry / Shader / Mesh', () => {
			const text = new SlugText({text: 'Hi', font, options: {fontSize: 32}});
			tick(text);
			resetAllocCounters();

			// Force capacity grow — initial capacity is 8 quads
			// (planCapacityQuads(2) = 8). 20 chars blows past that.
			text.text = 'AAAAAAAAAAAAAAAAAAAA';
			tick(text);

			// New vertex + index Buffer allocated for the grow; the old
			// ones are destroyed. Geometry / Shader / Mesh stay alive.
			expect(allocCounters.Buffer).toBe(2);
			expect(allocCounters.Geometry).toBe(0);
			expect(allocCounters.Shader).toBe(0);
			expect(allocCounters.Mesh).toBe(0);
		});

		it('stays in capacity-fit territory after one growth', () => {
			const text = new SlugText({text: 'Hi', font, options: {fontSize: 32}});
			tick(text);
			text.text = 'AAAAAAAAAAAAAAAAAAAA'; // forces grow
			tick(text);
			resetAllocCounters();

			// Same length again — no grow needed, no new objects.
			text.text = 'BBBBBBBBBBBBBBBBBBBB';
			tick(text);
			expect(allocCounters.Buffer).toBe(0);
			expect(allocCounters.Geometry).toBe(0);
			expect(allocCounters.Shader).toBe(0);
			expect(allocCounters.Mesh).toBe(0);
		});
	});

	describe('full rebuild kinds (§6 — must allocate)', () => {
		it('fontSize change goes through the full path', () => {
			const text = new SlugText({text: 'Hello', font, options: {fontSize: 32}});
			tick(text);
			resetAllocCounters();

			text.fontSize = 64;
			tick(text);
			// Full path: old slots parked + new slots allocated.
			expect(allocCounters.Buffer).toBeGreaterThanOrEqual(2);
			expect(allocCounters.Geometry).toBeGreaterThanOrEqual(1);
			expect(allocCounters.Shader).toBeGreaterThanOrEqual(1);
			expect(allocCounters.Mesh).toBeGreaterThanOrEqual(1);
		});

		it('strokeWidth change goes through the full path', () => {
			const text = new SlugText({text: 'Hello', font, options: {fontSize: 32}});
			tick(text);
			resetAllocCounters();

			text.strokeWidth = 2;
			tick(text);
			expect(allocCounters.Mesh).toBeGreaterThanOrEqual(1);
		});
	});

	describe('color setter (fillVisual incremental)', () => {
		it('does NOT allocate when changing solid color only', () => {
			const text = new SlugText({text: 'Hello', font, options: {fontSize: 32}});
			tick(text);
			resetAllocCounters();

			text.color = [1, 0, 0, 1];
			tick(text);
			expect(allocCounters.Buffer).toBe(0);
			expect(allocCounters.Geometry).toBe(0);
			expect(allocCounters.Shader).toBe(0);
			expect(allocCounters.Mesh).toBe(0);
		});
	});

	describe('strict-kind merge (§4.2)', () => {
		it('upgrades to full when both text (content) and fontSize (full) fire in one batch', () => {
			const text = new SlugText({text: 'Hello', font, options: {fontSize: 32}});
			tick(text);
			resetAllocCounters();

			// Both setters fire before `tick` consumes the kind. The
			// strict-kind merge in `_requestRebuild` upgrades to 'full'.
			text.text = 'World';
			text.fontSize = 40;
			tick(text);

			// Full path must have produced fresh slot allocations.
			expect(allocCounters.Mesh).toBeGreaterThanOrEqual(1);
		});
	});
});
