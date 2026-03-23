import {Buffer, Geometry, TYPES} from '@pixi/core';
import {Container} from '@pixi/display';
import {Mesh} from '@pixi/mesh';
import type {Shader} from '@pixi/core';
import {slugGlyphQuads} from '../../shared/slug/glyph/quad';
import type {SlugGlyphQuads} from '../../shared/slug/glyph/quad';
import {slugFontGpuV6} from './font/gpu';
import {slugShader} from './shader';
import {SlugTextInit} from '../../shared/slug/text/init';
import {SlugTextMixin} from '../../shared/slug/text/base';

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
			const shadowColor: [number, number, number, number] = ds.color
				? [ds.color[0], ds.color[1], ds.color[2], (ds.alpha ?? 1)]
				: [0, 0, 0, (ds.alpha ?? 1)];

			const shadowQuads = slugGlyphQuads(
				this._text, font.glyphs, font.advances,
				font.unitsPerEm, this._fontSize, font.textureWidth,
				shadowColor
			);

			if (shadowQuads.quadCount > 0) {
				const {mesh} = this._buildMesh(shadowQuads, gpu);
				const angle = ds.angle ?? Math.PI / 6;
				const dist = ds.distance ?? 5;
				mesh.x = Math.cos(angle) * dist;
				mesh.y = Math.sin(angle) * dist;
				this.addChild(mesh);
				this._meshes.push(mesh);
			}
		}

		if (hasStroke) {
			const strokeScale = (this._fontSize + this._strokeWidth * 2) / this._fontSize;
			const strokeFontSize = this._fontSize * strokeScale;
			const strokeQuads = slugGlyphQuads(
				this._text, font.glyphs, font.advances,
				font.unitsPerEm, strokeFontSize, font.textureWidth,
				this._strokeColor
			);

			if (strokeQuads.quadCount > 0) {
				const {mesh} = this._buildMesh(strokeQuads, gpu);
				const offset = this._strokeWidth;
				mesh.x = -offset;
				mesh.y = -offset;
				this.addChild(mesh);
				this._meshes.push(mesh);
			}
		}

		const fillQuads = slugGlyphQuads(
			this._text, font.glyphs, font.advances,
			font.unitsPerEm, this._fontSize, font.textureWidth,
			this._color
		);

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
		for (const mesh of this._meshes) {
			mesh.destroy();
		}
		this._meshes = [];
		super.destroy();
	}
}
