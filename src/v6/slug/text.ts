import {Buffer, Geometry, TYPES} from '@pixi/core';
import {Container} from '@pixi/display';
import {Mesh} from '@pixi/mesh';
import type {Shader} from '@pixi/core';
import {slugGlyphQuads, slugGlyphQuadsMultiline} from '../../shared/slug/glyph/quad';
import type {SlugGlyphQuads} from '../../shared/slug/glyph/quad';
import {slugTextWrap} from '../../shared/slug/text/wrap';
import {slugFontGpuV6} from './font/gpu';
import {slugShader} from './shader';
import {SlugTextInit} from '../../shared/slug/text/init';
import {SlugTextMixin} from '../../shared/slug/text/base';
import type {SlugFont} from '../../shared/slug/font';

const SlugTextV6Base = SlugTextMixin(Container);

/**
 * Renderable text element using the Slug algorithm for PixiJS v6.
 * Extends Container (via SlugTextMixin) for scene graph compatibility.
 *
 * Note: Requires WebGL2. The application must be configured with
 * `preferWebGLVersion: 2` to enable the WebGL2 features required by Slug.
 */
export class SlugText extends SlugTextV6Base {
	private _meshes: Mesh<Shader>[];
	private _shader: Shader | null;

	constructor(init: SlugTextInit) {
		super();
		this.initBase(init);
		this._meshes = [];
		this._shader = null;

		this.rebuild();
	}

	public onSupersamplingChanged(): void {
		if (this._shader) {
			this._shader.uniforms.uSupersampleCount = this._supersampling ? this._supersampleCount : 0;
		}
	}

	public onSupersampleCountChanged(): void {
		if (this._shader && this._supersampling) {
			this._shader.uniforms.uSupersampleCount = this._supersampleCount;
		}
	}

	private _makeQuads(
		font: SlugFont,
		text: string,
		color: [number, number, number, number],
		extraExpand: number = 0
	): SlugGlyphQuads {
		const hasNewline = text.indexOf('\n') >= 0;
		const wrapping = this._wordWrap && this._wordWrapWidth > 0;
		if (wrapping || hasNewline) {
			const scale = this._fontSize / font.unitsPerEm;
			const width = wrapping ? this._wordWrapWidth : 0;
			const {lines} = slugTextWrap(text, font.advances, scale, width, this._breakWords);
			const lineHeight = (font.ascender - font.descender) * scale;
			return slugGlyphQuadsMultiline(
				lines, font.glyphs, font.advances, font.unitsPerEm,
				this._fontSize, font.textureWidth, lineHeight, color, extraExpand
			);
		}
		return slugGlyphQuads(
			text, font.glyphs, font.advances, font.unitsPerEm,
			this._fontSize, font.textureWidth, color, extraExpand
		);
	}

	private _buildMesh(
		quads: SlugGlyphQuads,
		gpu: ReturnType<typeof slugFontGpuV6>
	): {mesh: Mesh<Shader>; shader: Shader} {
		const stride = 20 * 4;
		const vertexBuffer = new Buffer(quads.vertices.buffer as ArrayBuffer, true);
		const geometry = new Geometry();

		geometry.addAttribute('aPositionNormal', vertexBuffer, 4, false, TYPES.FLOAT, stride, 0);
		geometry.addAttribute('aTexcoord', vertexBuffer, 4, false, TYPES.FLOAT, stride, 4 * 4);
		geometry.addAttribute('aJacobian', vertexBuffer, 4, false, TYPES.FLOAT, stride, 8 * 4);
		geometry.addAttribute('aBanding', vertexBuffer, 4, false, TYPES.FLOAT, stride, 12 * 4);
		geometry.addAttribute('aColor', vertexBuffer, 4, false, TYPES.FLOAT, stride, 16 * 4);

		const indices16 = new Uint16Array(quads.indices.length);
		for (let i = 0; i < quads.indices.length; i++) {
			indices16[i] = quads.indices[i];
		}
		geometry.addIndex(indices16 as any);

		const shader = slugShader(gpu.program, gpu.curveTexture, gpu.bandTexture, [800, 400]);
		shader.uniforms.uSupersampleCount = this._supersampling ? this._supersampleCount : 0;
		return {mesh: new Mesh(geometry, shader), shader};
	}

	public rebuild(): void {
		this._rebuildCount++;

		for (const mesh of this._meshes) {
			this.removeChild(mesh);
			mesh.destroy();
		}
		this._meshes = [];
		this._shader = null;

		const font = this._fontRef?.deref();
		if (!font || this._text.length === 0 || font.glyphs.size === 0) {
			return;
		}

		const gpu = slugFontGpuV6(font);
		const hasShadow = this._dropShadow !== null;
		const hasStroke = this._strokeWidth > 0;

		if (hasShadow) {
			const ds = this._dropShadow!;
			const shadowAlpha = ds.alpha ?? 1;
			const shadowColor: [number, number, number, number] = ds.color
				? [ds.color[0], ds.color[1], ds.color[2], shadowAlpha]
				: [0, 0, 0, shadowAlpha];
			const blur = ds.blur ?? 0;

			const shadowQuads = this._makeQuads(font, this._text, shadowColor, blur);

			if (shadowQuads.quadCount > 0) {
				const {mesh, shader} = this._buildMesh(shadowQuads, gpu);
				shader.uniforms.uStrokeExpand = blur;
				if (blur > 0) {
					shader.uniforms.uStrokeAlphaStart = shadowAlpha;
					shader.uniforms.uStrokeAlphaRate = -shadowAlpha / blur;
				}
				const angle = ds.angle ?? Math.PI / 6;
				const dist = ds.distance ?? 5;
				mesh.x = Math.cos(angle) * dist;
				mesh.y = Math.sin(angle) * dist;
				this.addChild(mesh);
				this._meshes.push(mesh);
			}
		}

		if (hasStroke) {
			const strokeQuads = this._makeQuads(font, this._text, this._strokeColor, this._strokeWidth);

			if (strokeQuads.quadCount > 0) {
				const {mesh, shader} = this._buildMesh(strokeQuads, gpu);
				shader.uniforms.uStrokeExpand = this._strokeWidth;
				shader.uniforms.uStrokeAlphaStart = this._strokeAlphaStart;
				shader.uniforms.uStrokeAlphaRate =
					this._strokeAlphaMode === 'gradient' ? this._strokeAlphaRate : 0;
				this.addChild(mesh);
				this._meshes.push(mesh);
			}
		}

		const fillQuads = this._makeQuads(font, this._text, this._color);

		if (fillQuads.quadCount > 0) {
			const {mesh, shader} = this._buildMesh(fillQuads, gpu);
			this._shader = shader;
			this.addChild(mesh);
			this._meshes.push(mesh);

			this._vertexBytes = fillQuads.vertices.byteLength;
			this._indexBytes = fillQuads.indices.byteLength;
		}
	}

	public destroy(): void {
		this._releaseFontOnDestroy();
		for (const mesh of this._meshes) {
			mesh.destroy();
		}
		this._meshes = [];
		super.destroy();
	}
}
