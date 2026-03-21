import {Buffer, BufferUsage, Container, Geometry, Mesh, Rectangle, Shader, UniformGroup} from 'pixi.js';
import {Defaults} from '../../defaults';
import {SlugFont} from '../../shared/slug/font';
import {slugGlyphQuads} from '../../shared/slug/glyph/quad';
import {slugFontGpuV8} from './font/gpu';
import {slugShader} from './shader';
import {numberValue} from '@toreda/strong-types';

/**
 * Renderable text element using the Slug algorithm for PixiJS v8.
 * Renders font glyphs directly from quadratic Bezier curves on the GPU.
 *
 * GPU textures and the compiled shader program are owned by SlugFont (via gpuCache)
 * and shared across all SlugText instances using the same font. SlugText owns only
 * its per-instance vertex/index buffers and mesh.
 */
export class SlugText extends Container {
	private _text: string;
	private _fontRef: WeakRef<SlugFont>;
	private _fontSize: number;
	private _color: [number, number, number, number];
	private _mesh: Mesh<Geometry, Shader> | null;
	private _supersampling: boolean;
	private _supersampleCount: number;
	private _uniforms: UniformGroup | null;
	private _vertexBytes: number;
	private _indexBytes: number;
	private _rebuildCount: number;
	public wordWrap: boolean;

	constructor(text: string, font: SlugFont, fontSize: number = Defaults.FONT_SIZE) {
		super();
		this._text = text;
		this._fontRef = new WeakRef(font);
		this._fontSize = fontSize;
		this._color = [1, 1, 1, 1];
		this._mesh = null;
		this._supersampling = false;
		this._supersampleCount = Defaults.SUPERSAMPLE_COUNT;
		this._uniforms = null;
		this._vertexBytes = 0;
		this._indexBytes = 0;
		this._rebuildCount = 0;
		this.wordWrap = false;

		this.rebuild();
	}

	/** The text string to render. */
	public get text(): string {
		return this._text;
	}

	public set text(value: string) {
		if (this._text === value) return;
		this._text = value;
		this.rebuild();
	}

	/**
	 * The Slug font used for rendering, or null if the font has been garbage collected.
	 * Returns null only if the font was destroyed and no strong references remain.
	 */
	public get font(): SlugFont | null {
		return this._fontRef.deref() ?? null;
	}

	public set font(value: SlugFont) {
		if (this._fontRef.deref() === value) return;
		this._fontRef = new WeakRef(value);
		this.rebuild();
	}

	/** Font size in pixels. */
	public get fontSize(): number {
		return this._fontSize;
	}

	public set fontSize(value: number) {
		if (this._fontSize === value) return;
		this._fontSize = value;
		this.rebuild();
	}

	/** Text color as [r, g, b, a] in 0-1 range. */
	public get color(): [number, number, number, number] {
		return this._color;
	}

	public set color(value: [number, number, number, number]) {
		this._color = value;
		this.rebuild();
	}

	/** Enable supersampling for smoother edges. */
	public get supersampling(): boolean {
		return this._supersampling;
	}

	public set supersampling(value: boolean) {
		if (this._supersampling === value) return;
		this._supersampling = value;
		if (this._uniforms) {
			this._uniforms.uniforms.uSupersampleCount = value ? this._supersampleCount : 0;
		}
	}

	/** Number of supersamples (2, 4, 8, or 16). Only used when supersampling is true. */
	public get supersampleCount(): number {
		return this._supersampleCount;
	}

	public set supersampleCount(value: number) {
		const clamped = Math.min(Math.max(value, 1), Defaults.MAX_SUPERSAMPLE_COUNT);
		if (this._supersampleCount === clamped) return;
		this._supersampleCount = clamped;
		if (this._uniforms && this._supersampling) {
			this._uniforms.uniforms.uSupersampleCount = clamped;
		}
	}

	/**
	 * Build mesh geometry for current text + font.
	 * Creates per-glyph quads with the 5 vertex attributes required by the Slug shaders.
	 * Textures and shader program come from the font's shared GPU cache.
	 */
	private rebuild(): void {
		this._rebuildCount++;

		// Clean up previous mesh (per-instance resource).
		if (this._mesh) {
			this.removeChild(this._mesh);
			this._mesh.destroy();
			this._mesh = null;
		}

		const font = this._fontRef.deref();
		if (!font || this._text.length === 0 || font.glyphs.size === 0) {
			return;
		}

		// Build per-glyph quads with all 5 vertex attributes
		const quads = slugGlyphQuads(
			this._text,
			font.glyphs,
			font.advances,
			font.unitsPerEm,
			this._fontSize,
			font.textureWidth,
			this._color
		);

		if (quads.quadCount === 0) {
			return;
		}

		// Track GPU buffer sizes for memoryBytes() reporting.
		this._vertexBytes = quads.vertices.byteLength;
		this._indexBytes = quads.indices.byteLength;

		// Create geometry with 5 interleaved vec4 attributes
		const stride = 20 * 4; // 20 floats * 4 bytes per float
		const vertexBuffer = new Buffer({
			data: quads.vertices,
			label: 'slug-vertex-buffer',
			usage: BufferUsage.VERTEX
		});

		const geometry = new Geometry({
			attributes: {
				aPositionNormal: {buffer: vertexBuffer, format: 'float32x4', stride, offset: 0},
				aTexcoord: {buffer: vertexBuffer, format: 'float32x4', stride, offset: 4 * 4},
				aJacobian: {buffer: vertexBuffer, format: 'float32x4', stride, offset: 8 * 4},
				aBanding: {buffer: vertexBuffer, format: 'float32x4', stride, offset: 12 * 4},
				aColor: {buffer: vertexBuffer, format: 'float32x4', stride, offset: 16 * 4}
			},
			indexBuffer: quads.indices
		});

		// Compute local bounding box from vertex positions and set boundsArea so
		// PixiJS v8 can cull/inspect this container without needing an aPosition attribute.
		const floatsPerVertex = 20;
		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity;
		for (let i = 0; i < quads.vertices.length; i += floatsPerVertex) {
			const vx = quads.vertices[i];
			const vy = quads.vertices[i + 1];
			if (vx < minX) minX = vx;
			if (vx > maxX) maxX = vx;
			if (vy < minY) minY = vy;
			if (vy > maxY) maxY = vy;
		}
		this.boundsArea = new Rectangle(minX, minY, maxX - minX, maxY - minY);

		// GPU resources from font cache (created once, shared across all SlugText instances).
		const gpu = slugFontGpuV8(font);

		// Per-instance shader: shares GlProgram + textures, owns its own UniformGroup.
		const {shader, uniforms} = slugShader(gpu.glProgram, gpu.curveTexture, gpu.bandTexture);
		this._uniforms = uniforms;
		this._uniforms.uniforms.uSupersampleCount = this._supersampling ? this._supersampleCount : 0;

		const mesh = new Mesh({geometry, shader});
		this._mesh = mesh;
		this.addChild(mesh);
	}

	/** Number of times rebuild() has been called on this instance. */
	public get rebuildCount(): number {
		return this._rebuildCount;
	}

	/**
	 * GPU memory consumed by this text object's vertex and index buffers, in bytes.
	 * Does not include the font textures — those are shared and reported by SlugFont.memoryBytes().
	 */
	public meshMemoryBytes(): number {
		return this._vertexBytes + this._indexBytes;
	}

	/**
	 * Total GPU memory for this text object plus its font's textures, in bytes.
	 * Use this when the font is not shared, or to get a complete per-instance total.
	 */
	public totalMemoryBytes(): number {
		const font = this._fontRef.deref();
		return this.meshMemoryBytes() + (font ? font.memoryBytes() : 0);
	}

	public override destroy(): void {
		this._mesh?.destroy();
		// DO NOT destroy textures — they belong to the font's GPU cache
		// and are shared across all SlugText instances.
		super.destroy();
	}
}
