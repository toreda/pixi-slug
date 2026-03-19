import { Buffer, BufferImageSource, BufferUsage, Container, Geometry, Mesh, Shader, Texture } from 'pixi.js';
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
	private _combinedTexture: Texture | null;

	constructor(text: string, font: SlugFont, fontSize: number = Defaults.FONT_SIZE) {
		super();
		this._text = text;
		this._font = font;
		this._fontSize = fontSize;
		this._color = [1, 1, 1, 1];
		this._mesh = null;
		this._combinedTexture = null;

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

	/**
	 * Build mesh geometry and shader for current text + font.
	 * Creates per-glyph quads with the 5 vertex attributes required by the Slug shaders,
	 * creates a combined GPU texture from the font's curve and band data, and assembles a Mesh.
	 */
	private rebuild(): void {
		// Clean up previous mesh and texture
		if (this._mesh) {
			this.removeChild(this._mesh);
			this._mesh.destroy();
			this._mesh = null;
		}
		this._combinedTexture?.destroy();
		this._combinedTexture = null;

		if (this._text.length === 0 || this._font.glyphs.size === 0) {
			return;
		}

		// Build per-glyph quads with all 5 vertex attributes
		const quads = slugGlyphQuads(
			this._text,
			this._font.glyphs,
			this._font.unitsPerEm,
			this._fontSize,
			this._font.textureWidth,
			this._color
		);

		if (quads.quadCount === 0) {
			return;
		}

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
				aTexcoord: { buffer: vertexBuffer, format: 'float32x4', stride, offset: 4 * 4 },
				aJacobian: { buffer: vertexBuffer, format: 'float32x4', stride, offset: 8 * 4 },
				aBanding: { buffer: vertexBuffer, format: 'float32x4', stride, offset: 12 * 4 },
				aColor: { buffer: vertexBuffer, format: 'float32x4', stride, offset: 16 * 4 }
			},
			indexBuffer: quads.indices
		});

		// Create a single combined texture with curve data in top rows
		// and band data in bottom rows. This avoids PixiJS v8's issues
		// with binding multiple TextureSource resources to a single shader.
		const textureWidth = this._font.textureWidth;
		const curveRows = Math.ceil(this._font.curveData.length / 4 / textureWidth) || 1;
		const bandRows = Math.ceil(this._font.bandData.length / 4 / textureWidth) || 1;
		const totalRows = curveRows + bandRows;
		const totalTexels = textureWidth * totalRows * 4;

		// Convert band data (Uint32Array) to Float32Array
		const bandAsFloat = new Float32Array(this._font.bandData.length);
		for (let i = 0; i < this._font.bandData.length; i++) {
			bandAsFloat[i] = this._font.bandData[i];
		}

		const combinedData = new Float32Array(totalTexels);
		// Curve data goes in top rows (starting at row 0)
		combinedData.set(this._font.curveData);
		// Band data goes below (starting at row curveRows)
		combinedData.set(bandAsFloat, curveRows * textureWidth * 4);

		this._combinedTexture = new Texture({
			source: new BufferImageSource({
				resource: combinedData,
				width: textureWidth,
				height: totalRows,
				format: 'rgba32float',
				autoGenerateMipmaps: false,
				scaleMode: 'nearest',
				alphaMode: 'no-premultiply-alpha'
			})
		});

		// Create shader and mesh
		// Curve data at row 0, band data at row curveRows
		const shader = slugShader(this._font, this._combinedTexture, curveRows);
		const mesh = new Mesh({ geometry, shader });
		this._mesh = mesh;
		this.addChild(mesh);
	}

	public override destroy(): void {
		this._mesh?.destroy();
		this._combinedTexture?.destroy();
		super.destroy();
	}
}
