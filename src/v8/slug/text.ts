import { Buffer, BufferImageSource, BufferUsage, Container, Geometry, Mesh, Rectangle, Shader, Texture, UniformGroup } from 'pixi.js';
import { Defaults } from '../../defaults';
import { SlugFont } from '../../shared/slug/font';
import { slugGlyphQuads } from '../../shared/slug/glyph/quad';
import { slugShader } from './shader';

/**
 * Renderable text element using the Slug algorithm for PixiJS v8.
 * Renders font glyphs directly from quadratic Bezier curves on the GPU.
 */
export class SlugText extends Container {
	private _text: string;
	private _font: SlugFont;
	private _fontSize: number;
	private _color: [number, number, number, number];
	private _mesh: Mesh<Geometry, Shader> | null;
	private _curveTexture: Texture | null;
	private _bandTexture: Texture | null;
	private _supersampling: boolean;
	private _supersampleCount: number;
	private _uniforms: UniformGroup | null;
	private _vertexBytes: number;
	private _indexBytes: number;
	private _rebuildCount: number;

	constructor(text: string, font: SlugFont, fontSize: number = Defaults.FONT_SIZE) {
		super();
		this._text = text;
		this._font = font;
		this._fontSize = fontSize;
		this._color = [1, 1, 1, 1];
		this._mesh = null;
		this._curveTexture = null;
		this._bandTexture = null;
		this._supersampling = false;
		this._supersampleCount = Defaults.SUPERSAMPLE_COUNT;
		this._uniforms = null;
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

	/** The Slug font used for rendering. */
	public get font(): SlugFont {
		return this._font;
	}

	public set font(value: SlugFont) {
		if (this._font === value) return;
		this._font = value;
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
		if (this._supersampleCount === value) return;
		this._supersampleCount = value;
		if (this._uniforms && this._supersampling) {
			this._uniforms.uniforms.uSupersampleCount = value;
		}
	}

	/**
	 * Build mesh geometry and shader for current text + font.
	 * Creates per-glyph quads with the 5 vertex attributes required by the Slug shaders,
	 * creates separate curve and band GPU textures from the font data, and assembles a Mesh.
	 */
	private rebuild(): void {
		this._rebuildCount++;
		// Clean up previous mesh and textures
		if (this._mesh) {
			this.removeChild(this._mesh);
			this._mesh.destroy();
			this._mesh = null;
		}
		this._curveTexture?.destroy();
		this._curveTexture = null;
		this._bandTexture?.destroy();
		this._bandTexture = null;

		if (this._text.length === 0 || this._font.glyphs.size === 0) {
			return;
		}

		// Build per-glyph quads with all 5 vertex attributes
		const quads = slugGlyphQuads(
			this._text,
			this._font.glyphs,
			this._font.advances,
			this._font.unitsPerEm,
			this._fontSize,
			this._font.textureWidth,
			this._color
		);

		if (quads.quadCount === 0) {
			return;
		}

		// Track GPU buffer sizes for memoryBytes() reporting.
		// vertices: Float32Array → 4 bytes per element.
		// indices: Uint16Array → 2 bytes per element.
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
				aPositionNormal: { buffer: vertexBuffer, format: 'float32x4', stride, offset: 0 },
				aTexcoord:       { buffer: vertexBuffer, format: 'float32x4', stride, offset: 4 * 4 },
				aJacobian:       { buffer: vertexBuffer, format: 'float32x4', stride, offset: 8 * 4 },
				aBanding:        { buffer: vertexBuffer, format: 'float32x4', stride, offset: 12 * 4 },
				aColor:          { buffer: vertexBuffer, format: 'float32x4', stride, offset: 16 * 4 }
			},
			indexBuffer: quads.indices
		});

		// Compute local bounding box from vertex positions and set boundsArea so
		// PixiJS v8 can cull/inspect this container without needing an aPosition attribute.
		const floatsPerVertex = 20;
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		for (let i = 0; i < quads.vertices.length; i += floatsPerVertex) {
			const vx = quads.vertices[i];
			const vy = quads.vertices[i + 1];
			if (vx < minX) minX = vx;
			if (vx > maxX) maxX = vx;
			if (vy < minY) minY = vy;
			if (vy > maxY) maxY = vy;
		}
		this.boundsArea = new Rectangle(minX, minY, maxX - minX, maxY - minY);

		const textureWidth = this._font.textureWidth;

		// Curve texture: RGBA float32, one texel per 2 control points
		const curveRows = Math.ceil(this._font.curveData.length / 4 / textureWidth) || 1;
		this._curveTexture = new Texture({
			source: new BufferImageSource({
				resource: this._font.curveData,
				width: textureWidth,
				height: curveRows,
				format: 'rgba32float',
				autoGenerateMipmaps: false,
				scaleMode: 'nearest',
				alphaMode: 'no-premultiply-alpha'
			})
		});

		// Band texture: Uint32 integer values converted to Float32 float values and uploaded
		// as rgba32float. The shader recovers uint values via float-to-uint cast: uint(raw.x).
		// This is a VALUE conversion (6 → 6.0), NOT a bit-pattern reinterpretation.
		// Safe for all values < 2^24 (see port_risks.md JS-2).
		// DO NOT change to bit-pattern reinterpretation without also changing fetchBand()
		// in frag.glsl from uint() to floatBitsToUint().
		const bandRows = Math.ceil(this._font.bandData.length / 4 / textureWidth) || 1;
		this._bandTexture = new Texture({
			source: new BufferImageSource({
				resource: (() => { const f = new Float32Array(this._font.bandData.length); for (let i = 0; i < this._font.bandData.length; i++) f[i] = this._font.bandData[i]; return f; })(),
				width: textureWidth,
				height: bandRows,
				format: 'rgba32float',
				autoGenerateMipmaps: false,
				scaleMode: 'nearest',
				alphaMode: 'no-premultiply-alpha'
			})
		});

		const { shader, uniforms } = slugShader(this._curveTexture, this._bandTexture);
		this._uniforms = uniforms;
		this._uniforms.uniforms.uSupersampleCount = this._supersampling ? this._supersampleCount : 0;
		const mesh = new Mesh({ geometry, shader });
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
		return this.meshMemoryBytes() + this._font.memoryBytes();
	}

	public override destroy(): void {
		this._mesh?.destroy();
		this._curveTexture?.destroy();
		this._bandTexture?.destroy();
		super.destroy();
	}
}
