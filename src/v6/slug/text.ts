import { BaseTexture, Buffer, FORMATS, Geometry, TYPES, Texture } from '@pixi/core';
import { Container } from '@pixi/display';
import { Mesh } from '@pixi/mesh';
import type { Shader } from '@pixi/core';
import { Defaults } from '../../defaults';
import { SlugFont } from '../../shared/slug/font';
import { slugGlyphQuads } from '../../shared/slug/glyph/quad';
import { slugShader } from './shader';

/**
 * Renderable text element using the Slug algorithm for PixiJS v6.
 * Renders font glyphs directly from quadratic Bezier curves on the GPU.
 *
 * Note: Requires WebGL2. The application must be configured with
 * `preferWebGLVersion: 2` to enable the WebGL2 features required by Slug.
 */
export class SlugText extends Container {
	private _text: string;
	private _font: SlugFont;
	private _fontSize: number;
	private _color: [number, number, number, number];
	private _mesh: Mesh<Shader> | null;
	private _curveTexture: Texture | null;
	private _bandTexture: Texture | null;
	private _supersampling: boolean;
	private _supersampleCount: number;
	private _shader: Shader | null;
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
		this._bandTexture?.destroy();
		this._curveTexture = null;
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
		this._vertexBytes = quads.vertices.byteLength;
		this._indexBytes = quads.indices.byteLength;

		// Create geometry with 5 interleaved vec4 attributes
		const stride = 20 * 4; // 20 floats * 4 bytes per float
		const vertexBuffer = new Buffer(quads.vertices.buffer as ArrayBuffer, true);
		const geometry = new Geometry();

		geometry.addAttribute('aPositionNormal', vertexBuffer, 4, false, TYPES.FLOAT, stride, 0);
		geometry.addAttribute('aTexcoord', vertexBuffer, 4, false, TYPES.FLOAT, stride, 4 * 4);
		geometry.addAttribute('aJacobian', vertexBuffer, 4, false, TYPES.FLOAT, stride, 8 * 4);
		geometry.addAttribute('aBanding', vertexBuffer, 4, false, TYPES.FLOAT, stride, 12 * 4);
		geometry.addAttribute('aColor', vertexBuffer, 4, false, TYPES.FLOAT, stride, 16 * 4);
		// PixiJS v6 only supports Uint16 index buffers. Convert from Uint32.
		// Max 65535 vertices = ~16383 glyphs — sufficient for text rendering.
		const indices16 = new Uint16Array(quads.indices.length);
		for (let i = 0; i < quads.indices.length; i++) {
			indices16[i] = quads.indices[i];
		}
		geometry.addIndex(indices16 as any);

		// Curve texture: RGBA float32
		const textureWidth = this._font.textureWidth;
		const curveRows = Math.ceil(this._font.curveData.length / 4 / textureWidth) || 1;
		const curveBase = BaseTexture.fromBuffer(this._font.curveData, textureWidth, curveRows, {
			format: FORMATS.RGBA,
			type: TYPES.FLOAT
		});
		this._curveTexture = new Texture(curveBase);

		// Band texture: Uint32 integer values converted to Float32 float values
		// and uploaded as RGBA FLOAT. The shader recovers uint values via
		// float-to-uint cast: uint(raw.x + 0.5). Safe for values < 2^24.
		// DO NOT use RGBA_INTEGER — the shader uses sampler2D, not usampler2D.
		const bandRows = Math.ceil(this._font.bandData.length / 4 / textureWidth) || 1;
		const bandFloat = new Float32Array(this._font.bandData.length);
		for (let i = 0; i < this._font.bandData.length; i++) {
			bandFloat[i] = this._font.bandData[i];
		}
		const bandBase = BaseTexture.fromBuffer(bandFloat, textureWidth, bandRows, {
			format: FORMATS.RGBA,
			type: TYPES.FLOAT
		});
		this._bandTexture = new Texture(bandBase);

		// Create shader with resolution. In v6, uResolution is not auto-populated
		// so we pass it at shader creation time. For dynamic resize, it would need
		// to be updated per frame.
		// TODO: Update resolution on resize.
		const shader = slugShader(this._curveTexture, this._bandTexture, [800, 400]);
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
		return this.meshMemoryBytes() + this._font.memoryBytes();
	}

	public destroy(): void {
		this._mesh?.destroy();
		this._curveTexture?.destroy();
		this._bandTexture?.destroy();
		super.destroy();
	}
}
