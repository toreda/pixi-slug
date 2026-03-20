import {Buffer, Geometry, TYPES} from '@pixi/core';
import {Container} from '@pixi/display';
import {Mesh} from '@pixi/mesh';
import type {Shader} from '@pixi/core';
import {Defaults} from '../../defaults';
import {SlugFont} from '../../shared/slug/font';
import {slugGlyphQuads} from '../../shared/slug/glyph/quad';
import {slugFontGpuV6} from './font/gpu';
import {slugShader} from './shader';

/**
 * Renderable text element using the Slug algorithm for PixiJS v6.
 * Renders font glyphs directly from quadratic Bezier curves on the GPU.
 *
 * Note: Requires WebGL2. The application must be configured with
 * `preferWebGLVersion: 2` to enable the WebGL2 features required by Slug.
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
	private _mesh: Mesh<Shader> | null;
	private _supersampling: boolean;
	private _supersampleCount: number;
	private _shader: Shader | null;
	private _vertexBytes: number;
	private _indexBytes: number;
	private _rebuildCount: number;

	constructor(text: string, font: SlugFont, fontSize: number = Defaults.FONT_SIZE) {
		super();
		this._text = text;
		this._fontRef = new WeakRef(font);
		this._fontSize = fontSize;
		this._color = [1, 1, 1, 1];
		this._mesh = null;
		this._supersampling = false;
		this._supersampleCount = Defaults.SUPERSAMPLE_COUNT;
		this._shader = null;
		this._vertexBytes = 0;
		this._indexBytes = 0;
		this._rebuildCount = 0;

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
		if (this._shader) {
			this._shader.uniforms.uSupersampleCount = value ? this._supersampleCount : 0;
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
		if (this._shader && this._supersampling) {
			this._shader.uniforms.uSupersampleCount = clamped;
		}
	}

	/**
	 * Build mesh geometry for current text + font.
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
		const stride = 20 * 4;
		const vertexBuffer = new Buffer(quads.vertices.buffer as ArrayBuffer, true);
		const geometry = new Geometry();

		geometry.addAttribute('aPositionNormal', vertexBuffer, 4, false, TYPES.FLOAT, stride, 0);
		geometry.addAttribute('aTexcoord', vertexBuffer, 4, false, TYPES.FLOAT, stride, 4 * 4);
		geometry.addAttribute('aJacobian', vertexBuffer, 4, false, TYPES.FLOAT, stride, 8 * 4);
		geometry.addAttribute('aBanding', vertexBuffer, 4, false, TYPES.FLOAT, stride, 12 * 4);
		geometry.addAttribute('aColor', vertexBuffer, 4, false, TYPES.FLOAT, stride, 16 * 4);

		// PixiJS v6 only supports Uint16 index buffers. Convert from Uint32.
		const indices16 = new Uint16Array(quads.indices.length);
		for (let i = 0; i < quads.indices.length; i++) {
			indices16[i] = quads.indices[i];
		}
		geometry.addIndex(indices16 as any);

		// GPU resources from font cache (created once, shared).
		const gpu = slugFontGpuV6(font);

		// Per-instance shader with shared program + textures.
		// TODO: Update resolution on resize.
		const shader = slugShader(gpu.program, gpu.curveTexture, gpu.bandTexture, [800, 400]);
		this._shader = shader;
		shader.uniforms.uSupersampleCount = this._supersampling ? this._supersampleCount : 0;
		this._mesh = new Mesh(geometry, shader);
		this.addChild(this._mesh);
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

	public destroy(): void {
		this._mesh?.destroy();
		// DO NOT destroy textures — they belong to the font's GPU cache.
		super.destroy();
	}
}
