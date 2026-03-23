import {
	Buffer,
	BufferUsage,
	Container,
	Geometry,
	Mesh,
	Rectangle,
	Shader,
	UniformGroup
} from 'pixi.js';
import {slugGlyphQuads} from '../../shared/slug/glyph/quad';
import type {SlugGlyphQuads} from '../../shared/slug/glyph/quad';
import {slugFontGpuV8} from './font/gpu';
import {slugShader} from './shader';
import {SlugTextInit} from '../../shared/slug/text/init';
import {SlugTextMixin} from '../../shared/slug/text/base';
import type {SlugFont} from '../../shared/slug/font';

const SlugTextV8Base = SlugTextMixin(Container);

/**
 * Renderable text element using the Slug algorithm for PixiJS v8.
 * Extends Container (via SlugTextMixin) for scene graph compatibility.
 *
 * Supports multi-pass rendering for stroke and drop shadow effects:
 * - Drop shadow: rendered first (behind) with shadow color and offset
 * - Stroke: rendered second with stroke color and extra dilation
 * - Fill: rendered last (on top) with the normal text color
 *
 * GPU textures and the compiled shader program are owned by SlugFont (via gpuCache)
 * and shared across all SlugText instances using the same font.
 */
export class SlugText extends SlugTextV8Base {
	/** All meshes for the current text (shadow + stroke + fill). */
	private _meshes: Mesh<Geometry, Shader>[];
	/** Uniforms for the fill pass (controls supersampling). */
	private _uniforms: UniformGroup | null;

	constructor(init: SlugTextInit) {
		super();
		this.initBase(init);
		this._meshes = [];
		this._uniforms = null;

		this.rebuild();
	}

	public onSupersamplingChanged(): void {
		if (this._uniforms) {
			this._uniforms.uniforms.uSupersampleCount = this._supersampling ? this._supersampleCount : 0;
		}
	}

	public onSupersampleCountChanged(): void {
		if (this._uniforms && this._supersampling) {
			this._uniforms.uniforms.uSupersampleCount = this._supersampleCount;
		}
	}

	/**
	 * Build a Mesh from quad data with optional stroke expansion.
	 */
	private _buildMesh(
		quads: SlugGlyphQuads,
		gpu: ReturnType<typeof slugFontGpuV8>,
		strokeExpand: number = 0
	): {mesh: Mesh<Geometry, Shader>; uniforms: UniformGroup} {
		const stride = 20 * 4;
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

		const {shader, uniforms} = slugShader(gpu.glProgram, gpu.curveTexture, gpu.bandTexture);
		uniforms.uniforms.uSupersampleCount = this._supersampling ? this._supersampleCount : 0;
		uniforms.uniforms.uStrokeExpand = strokeExpand;

		return {mesh: new Mesh({geometry, shader}), uniforms};
	}

	public rebuild(): void {
		this._rebuildCount++;

		// Remove all previous meshes from display list.
		// Don't call mesh.destroy() — it can interfere with shared GlProgram
		// resources when multiple meshes use the same shader program.
		for (const mesh of this._meshes) {
			this.removeChild(mesh);
		}
		this._meshes = [];
		this._uniforms = null;

		const font = this._fontRef?.deref();
		if (!font || this._text.length === 0 || font.glyphs.size === 0) {
			return;
		}

		const gpu = slugFontGpuV8(font);
		const hasShadow = this._dropShadow !== null;
		const hasStroke = this._strokeWidth > 0;

		// --- Drop shadow pass ---
		if (hasShadow) {
			const ds = this._dropShadow!;
			const shadowAlpha = ds.alpha ?? 1;
			const shadowColor: [number, number, number, number] = ds.color
				? [ds.color[0], ds.color[1], ds.color[2], shadowAlpha]
				: [0, 0, 0, shadowAlpha];
			const blur = ds.blur ?? 0;

			const shadowQuads = slugGlyphQuads(
				this._text, font.glyphs, font.advances,
				font.unitsPerEm, this._fontSize, font.textureWidth,
				shadowColor, blur
			);

			if (shadowQuads.quadCount > 0) {
				const {mesh, uniforms: shadowUniforms} = this._buildMesh(shadowQuads, gpu, blur);
				// Blur reuses stroke dilation: expand by blur radius,
				// fade alpha from full at glyph edge to 0 at outer edge.
				if (blur > 0) {
					shadowUniforms.uniforms.uStrokeAlphaStart = shadowAlpha;
					shadowUniforms.uniforms.uStrokeAlphaRate = -shadowAlpha / blur;
				}
				// Offset shadow by angle + distance
				const angle = ds.angle ?? Math.PI / 6;
				const dist = ds.distance ?? 5;
				mesh.x = Math.cos(angle) * dist;
				mesh.y = Math.sin(angle) * dist;
				this.addChild(mesh);
				this._meshes.push(mesh);
			}
		}

		// --- Stroke pass ---
		// Same font size as fill but with expanded quads (extraExpand = strokeWidth).
		// Each glyph quad is pushed outward by strokeWidth pixels on all sides,
		// and em-space texcoords expand to match, so the shader renders the
		// wider glyph area in the stroke color behind the fill.
		if (hasStroke) {
			const strokeQuads = slugGlyphQuads(
				this._text, font.glyphs, font.advances,
				font.unitsPerEm, this._fontSize, font.textureWidth,
				this._strokeColor, this._strokeWidth
			);

			if (strokeQuads.quadCount > 0) {
				const {mesh, uniforms: strokeUniforms} = this._buildMesh(strokeQuads, gpu, this._strokeWidth);
				strokeUniforms.uniforms.uStrokeAlphaStart = this._strokeAlphaStart;
				strokeUniforms.uniforms.uStrokeAlphaRate =
					this._strokeAlphaMode === 'gradient' ? this._strokeAlphaRate : 0;
				this.addChild(mesh);
				this._meshes.push(mesh);
			}
		}

		// --- Fill pass ---
		const fillQuads = slugGlyphQuads(
			this._text, font.glyphs, font.advances,
			font.unitsPerEm, this._fontSize, font.textureWidth,
			this._color
		);

		if (fillQuads.quadCount > 0) {
			const {mesh, uniforms} = this._buildMesh(fillQuads, gpu);
			this._uniforms = uniforms;
			this.addChild(mesh);
			this._meshes.push(mesh);

			// Track memory for the fill pass (representative of total)
			this._vertexBytes = fillQuads.vertices.byteLength;
			this._indexBytes = fillQuads.indices.byteLength;

			// Bounds from fill pass vertices
			const floatsPerVertex = 20;
			let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
			for (let i = 0; i < fillQuads.vertices.length; i += floatsPerVertex) {
				const vx = fillQuads.vertices[i];
				const vy = fillQuads.vertices[i + 1];
				if (vx < minX) minX = vx;
				if (vx > maxX) maxX = vx;
				if (vy < minY) minY = vy;
				if (vy > maxY) maxY = vy;
			}
			this.boundsArea = new Rectangle(minX, minY, maxX - minX, maxY - minY);
		}
	}

	override destroy(): void {
		for (const mesh of this._meshes) {
			mesh.destroy();
		}
		this._meshes = [];
		super.destroy();
	}
}
