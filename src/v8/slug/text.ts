import {
	Buffer,
	BufferUsage,
	Container,
	Geometry,
	Graphics,
	Mesh,
	Rectangle,
	Shader,
	UniformGroup
} from 'pixi.js';
import {slugGlyphQuads, slugGlyphQuadsMultiline} from '../../shared/slug/glyph/quad';
import type {SlugGlyphQuads} from '../../shared/slug/glyph/quad';
import {slugTextWrap} from '../../shared/slug/text/wrap';
import {slugMeasureText} from '../../shared/slug/text/measure';
import {slugFontGpuV8} from './font/gpu';
import {slugShader} from './shader';
import {SlugTextInit} from '../../shared/slug/text/init';
import {SlugTextMixin} from '../../shared/slug/text/base';
import type {SlugFont} from '../../shared/slug/font';

/**
 * The Mixin pattern is necessary due to Container API difference
 * per PIXI version while supporting multiple PIXI versions. If we
 * only supported V8 this would be `extends Container` instead.
 */
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
	/** Graphics child for underline/strikethrough decorations. */
	private _decorations: Graphics | null;

	constructor(init: SlugTextInit) {
		super();
		this.initBase(init);
		this._meshes = [];
		this._uniforms = null;
		this._decorations = null;

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

	/**
	 * Build glyph quads, handling word wrap when enabled.
	 * Returns single-line or multi-line quads depending on _wordWrap state.
	 */
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

	public rebuild(): void {
		this._rebuildCount++;

		// Remove all previous meshes from display list.
		// Don't call mesh.destroy() — it can interfere with shared GlProgram
		// resources when multiple meshes use the same shader program.
		for (const mesh of this._meshes) {
			this.removeChild(mesh);
		}
		this._meshes = [];
		if (this._decorations) {
			this.removeChild(this._decorations);
			this._decorations.destroy();
			this._decorations = null;
		}
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

			const shadowQuads = this._makeQuads(font, this._text, shadowColor, blur);

			if (shadowQuads.quadCount > 0) {
				const {mesh, uniforms: shadowUniforms} = this._buildMesh(shadowQuads, gpu, blur);
				if (blur > 0) {
					shadowUniforms.uniforms.uStrokeAlphaStart = shadowAlpha;
					shadowUniforms.uniforms.uStrokeAlphaRate = -shadowAlpha / blur;
				}
				const angle = ds.angle ?? Math.PI / 6;
				const dist = ds.distance ?? 5;
				mesh.x = Math.cos(angle) * dist;
				mesh.y = Math.sin(angle) * dist;
				this.addChild(mesh);
				this._meshes.push(mesh);
			}
		}

		// --- Stroke pass ---
		if (hasStroke) {
			const strokeQuads = this._makeQuads(font, this._text, this._strokeColor, this._strokeWidth);

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
		const fillQuads = this._makeQuads(font, this._text, this._color);

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

		// --- Text decorations (underline / strikethrough) ---
		if ((this._underline || this._strikethrough) && font) {
			const scale = this._fontSize / font.unitsPerEm;
			const lineHeight = (font.ascender - font.descender) * scale;
			const fillColor = (this._color[0] * 255) << 16 | (this._color[1] * 255) << 8 | (this._color[2] * 255);

			// Determine lines for measurement — match the quad builder's decision.
			const hasNewline = this._text.indexOf('\n') >= 0;
			const wrapping = this._wordWrap && this._wordWrapWidth > 0;
			let lines: string[];
			if (wrapping || hasNewline) {
				const width = wrapping ? this._wordWrapWidth : 0;
				lines = slugTextWrap(this._text, font.advances, scale, width, this._breakWords).lines;
			} else {
				lines = [this._text];
			}

			const gfx = new Graphics();

			for (let l = 0; l < lines.length; l++) {
				const line = lines[l];
				const lineW = slugMeasureText(line, font.advances, scale);
				const lineY = l * lineHeight;

				// Per-line baseline matches slugGlyphQuads' own maxGlyphTop scan,
				// so decorations align with the actual glyph positions on this line.
				let maxGlyphTop = 0;
				for (let i = 0; i < line.length; i++) {
					const g = font.glyphs.get(line.charCodeAt(i));
					if (g && g.bounds.maxY > maxGlyphTop) maxGlyphTop = g.bounds.maxY;
				}
				const baselineY = maxGlyphTop * scale;

				if (this._underline) {
					const ulY = baselineY + lineY - font.underlinePosition * scale;
					const ulH = Math.max(font.underlineThickness * scale, 1);
					gfx.rect(0, ulY, lineW, ulH);
					gfx.fill({color: fillColor, alpha: this._color[3]});
				}

				if (this._strikethrough) {
					const stY = baselineY + lineY - font.strikethroughPosition * scale;
					const stH = Math.max(font.strikethroughSize * scale, 1);
					gfx.rect(0, stY, lineW, stH);
					gfx.fill({color: fillColor, alpha: this._color[3]});
				}
			}

			this._decorations = gfx;
			this.addChild(gfx);
		}
	}

	override destroy(): void {
		for (const mesh of this._meshes) {
			mesh.destroy();
		}
		this._meshes = [];
		if (this._decorations) {
			this._decorations.destroy();
			this._decorations = null;
		}
		super.destroy();
	}
}
