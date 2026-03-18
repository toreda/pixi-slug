import { Texture } from '@pixi/core';
import { Container } from '@pixi/display';
import { Mesh, MeshGeometry, MeshMaterial } from '@pixi/mesh';
import { SlugFont } from '../../shared/slug/font';
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
	private _mesh: Mesh | null;
	private _curveTexture: Texture | null;
	private _bandTexture: Texture | null;

	constructor(text: string, font: SlugFont) {
		super();
		this._text = text;
		this._font = font;
		this._mesh = null;
		this._curveTexture = null;
		this._bandTexture = null;
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

	/**
	 * Build mesh geometry and shader for current text + font.
	 * Creates per-glyph quads with the 5 vertex attributes required by the Slug shaders.
	 */
	private rebuild(): void {
		// TODO: Build per-glyph quads with 5 attributes
		// TODO: Create MeshGeometry from glyph quads
		// TODO: Create GPU textures from font.curveData and font.bandData
		// TODO: Create Shader via slugShader()
		// TODO: Create Mesh and add as child
	}

	public destroy(): void {
		this._mesh?.destroy();
		this._curveTexture?.destroy();
		this._bandTexture?.destroy();
		super.destroy();
	}
}
