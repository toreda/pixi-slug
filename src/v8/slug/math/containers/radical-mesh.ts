import {
	Buffer,
	BufferUsage,
	Container,
	Geometry,
	Mesh,
	type Renderer,
	type Shader,
	type UniformGroup,
	type WebGLRenderer
} from 'pixi.js';
import {Constants} from '../../../../constants';
import type {Rgba} from '../../../../rgba';
import type {SlugFont} from '../../../../shared/slug/font';
import type {SlugGlyphData} from '../../../../shared/slug/glyph/data';
import {slugSyntheticGlyphQuad} from '../../../../shared/slug/glyph/quad';
import {slugFontGpuV8, type SlugFontGpuV8} from '../../font/gpu';
import {slugShader} from '../../shader';

/**
 * Renders ONE synthetic glyph (a math decoration such as a square-root
 * radical) through the Slug coverage shader, so it stays
 * resolution-independent and scales in lockstep with surrounding text.
 *
 * This is a deliberately minimal sibling of {@link SlugText}: a single
 * quad, single render pass (solid fill), no stroke/shadow/incremental
 * machinery. It owns its `Mesh` / `Geometry` / `Shader`, binds the
 * font's shared curve/band textures + program via {@link slugFontGpuV8},
 * and — like a `SlugMeshSlot` — rebinds those sampler resources when the
 * font's GPU `generation` advances (a buffer grow destroyed and
 * recreated the textures this mesh still points at).
 *
 * The destination rectangle (where the glyph's em-space bounds map in
 * local pixel space) is set via {@link setGlyph}; the mesh is (re)built
 * lazily on the next `onRender` tick so a renderer is in hand for the
 * GPU texture sync.
 *
 * Hit-testing is disabled: the geometry uses `aPositionNormal`, not
 * PIXI's `aVertexPosition`, so `Mesh.containsPoint` would crash (same
 * reason `SlugText` opts its subtree out).
 */
export class RadicalMesh extends Container {
	private _font: SlugFont;
	private _glyph: SlugGlyphData | null = null;
	private _dstX = 0;
	private _dstY = 0;
	private _dstW = 0;
	private _dstH = 0;
	private _color: Rgba;

	private _mesh: Mesh<Geometry, Shader> | null = null;
	private _geometry: Geometry | null = null;
	private _shader: Shader | null = null;
	private _uniforms: UniformGroup | null = null;
	private _vertexBuffer: Buffer | null = null;
	private _indexBuffer: Buffer | null = null;
	/** Live typed-array views the mesh owns (one quad's worth). */
	private _vertices: Float32Array | null = null;
	private _indices: Uint32Array | null = null;
	private _gpuGeneration = -1;

	/** Set true by `setGlyph` and consumed by the next `onRender`. */
	private _dirty = false;
	private _onRenderHandler: (renderer: Renderer) => void;

	constructor(font: SlugFont, color: Rgba) {
		super();
		this._font = font;
		this._color = color;
		this._onRenderHandler = (renderer: Renderer): void => this._attach(renderer);
		this.eventMode = 'none';
		this.interactiveChildren = false;
	}

	/**
	 * Point this mesh at a (synthetic) glyph and the local-pixel-space
	 * rectangle its em-space bounds should map onto. Pass `null` to draw
	 * nothing. Defers the actual mesh build to the next render tick.
	 */
	public setGlyph(
		glyph: SlugGlyphData | null,
		dstX: number,
		dstY: number,
		dstW: number,
		dstH: number
	): void {
		this._glyph = glyph;
		this._dstX = dstX;
		this._dstY = dstY;
		this._dstW = dstW;
		this._dstH = dstH;
		this._dirty = true;
		// Arm onRender so the (re)build happens with a renderer available.
		this.onRender = this._onRenderHandler;
	}

	public setColor(color: Rgba): void {
		this._color = color;
		this._dirty = true;
		this.onRender = this._onRenderHandler;
	}

	private _buildQuadVertices(): {vertices: Float32Array; indices: Uint32Array} | null {
		const glyph = this._glyph;
		if (!glyph || this._dstW <= 0 || this._dstH <= 0) {
			return null;
		}
		const quad = slugSyntheticGlyphQuad(
			glyph,
			this._dstX,
			this._dstY,
			this._dstW,
			this._dstH,
			this._font.textureWidth,
			this._color
		);
		if (quad.quadCount === 0) {
			return null;
		}
		return {vertices: quad.vertices, indices: quad.indices};
	}

	private _attach(renderer: Renderer): void {
		if (!this._dirty) {
			// Steady state: nothing changed, but the font's textures may
			// have been replaced by a grow triggered elsewhere — rebind.
			this._syncGeneration(renderer);
			return;
		}
		this._dirty = false;

		const built = this._buildQuadVertices();
		if (built === null) {
			// Nothing to draw — drop any existing mesh.
			this._teardownMesh();
			this.onRender = null;
			return;
		}

		// Sync the font's GPU cache so the synthetic glyph's freshly
		// appended curve/band texels are uploaded before we draw.
		const gpu = slugFontGpuV8(this._font, null, renderer as WebGLRenderer);

		if (this._mesh === null) {
			this._createMesh(gpu, built.vertices, built.indices);
		} else {
			this._updateMesh(gpu, built.vertices, built.indices);
		}
	}

	private _createMesh(
		gpu: SlugFontGpuV8,
		vertices: Float32Array,
		indices: Uint32Array
	): void {
		const stride = Constants.FLOATS_PER_VERTEX * Constants.BYTES_PER_FLOAT;
		const vec4Bytes = Constants.FLOATS_PER_VEC4 * Constants.BYTES_PER_FLOAT;

		// Own the arrays so updates are a plain `.set()` into a stable
		// reference (mirrors the SlugMeshSlot contract). One quad is a
		// fixed size — it never needs to grow.
		this._vertices = vertices;
		this._indices = indices;

		const vertexBuffer = new Buffer({
			data: vertices,
			label: 'slug-radical-vertex-buffer',
			usage: BufferUsage.VERTEX,
			shrinkToFit: false
		});
		const indexBuffer = new Buffer({
			data: indices,
			label: 'slug-radical-index-buffer',
			usage: BufferUsage.INDEX,
			shrinkToFit: false
		});

		const geometry = new Geometry({
			attributes: {
				aPositionNormal: {buffer: vertexBuffer, format: 'float32x4', stride, offset: 0},
				aTexcoord: {buffer: vertexBuffer, format: 'float32x4', stride, offset: vec4Bytes},
				aJacobian: {buffer: vertexBuffer, format: 'float32x4', stride, offset: vec4Bytes * 2},
				aBanding: {buffer: vertexBuffer, format: 'float32x4', stride, offset: vec4Bytes * 3},
				aColor: {buffer: vertexBuffer, format: 'float32x4', stride, offset: vec4Bytes * 4}
			},
			indexBuffer
		});

		const {shader, uniforms} = slugShader(
			gpu.glProgram,
			gpu.curveTexture,
			gpu.bandTexture,
			gpu.fallbackWhite
		);

		const mesh = new Mesh({geometry, shader});
		this._mesh = mesh;
		this._geometry = geometry;
		this._shader = shader;
		this._uniforms = uniforms;
		this._vertexBuffer = vertexBuffer;
		this._indexBuffer = indexBuffer;
		this._gpuGeneration = gpu.generation;
		void this._uniforms; // retained for future per-frame uniform writes

		this.addChild(mesh);
	}

	private _updateMesh(
		gpu: SlugFontGpuV8,
		vertices: Float32Array,
		indices: Uint32Array
	): void {
		const vb = this._vertexBuffer!;
		const ib = this._indexBuffer!;
		const vArr = this._vertices!;
		const iArr = this._indices!;
		// One quad always fits the initial allocation, so this is a pure
		// in-place data rewrite — no buffer reallocation needed.
		vArr.set(vertices);
		iArr.set(indices);
		vb.setDataWithSize(vArr, vArr.length, true);
		ib.setDataWithSize(iArr, iArr.length, true);

		// Rebind textures if the font grew its buffers since last attach.
		if (this._gpuGeneration !== gpu.generation) {
			const resources = this._shader!.resources as Record<string, unknown>;
			resources.uCurveTexture = gpu.curveTexture.source;
			resources.uBandTexture = gpu.bandTexture.source;
			this._gpuGeneration = gpu.generation;
		}
	}

	private _syncGeneration(renderer: Renderer): void {
		if (this._mesh === null || this._shader === null) {
			return;
		}
		const gpu = slugFontGpuV8(this._font, null, renderer as WebGLRenderer);
		if (this._gpuGeneration === gpu.generation) {
			return;
		}
		const resources = this._shader.resources as Record<string, unknown>;
		resources.uCurveTexture = gpu.curveTexture.source;
		resources.uBandTexture = gpu.bandTexture.source;
		this._gpuGeneration = gpu.generation;
	}

	private _teardownMesh(): void {
		if (this._mesh) {
			this.removeChild(this._mesh);
			this._mesh.destroy();
		}
		this._geometry?.destroy();
		this._vertexBuffer?.destroy();
		this._indexBuffer?.destroy();
		this._mesh = null;
		this._geometry = null;
		this._shader = null;
		this._uniforms = null;
		this._vertexBuffer = null;
		this._indexBuffer = null;
		this._vertices = null;
		this._indices = null;
		this._gpuGeneration = -1;
	}

	public override destroy(options?: Parameters<Container['destroy']>[0]): void {
		this.onRender = null;
		this._teardownMesh();
		super.destroy(options);
	}
}
