import opentype from 'opentype.js';
import {Defaults} from '../../defaults';
import type {SlugGlyphData} from './glyph/data';
import {slugGlyphCurves} from './glyph/curves';
import {slugGlyphBands} from './glyph/bands';
import {slugTexturePack} from './texture/pack';
/**
 * Preprocesses font glyph outlines into GPU-ready curve and band textures
 * for the Slug rendering algorithm.
 */
export class SlugFont {
	/** Curve texture data: quadratic Bezier control points (float RGBA) */
	public curveData: Float32Array;
	/** Band texture data: hierarchical band index (uint RGBA, uploaded as rgba32uint). */
	public bandData: Uint32Array;
	/** Texture width (must be power of 2). Smaller fonts can use smaller textures to save memory. */
	public readonly textureWidth: number;
	/** Preprocessed glyph data indexed by Unicode code point. */
	public readonly glyphs: Map<number, SlugGlyphData>;
	/** Advance widths for ALL glyphs (including empty ones like space), indexed by char code. */
	public readonly advances: Map<number, number>;
	/** Font units per em (used to normalize coordinates). */
	public unitsPerEm: number;
	/** Typographic ascender in font units (positive, above baseline). */
	public ascender: number;
	/** Typographic descender in font units (negative, below baseline). */
	public descender: number;
	/** Underline position in font units (negative = below baseline). */
	public underlinePosition: number;
	/** Underline thickness in font units. */
	public underlineThickness: number;
	/** Strikethrough position in font units (positive = above baseline). */
	public strikethroughPosition: number;
	/** Strikethrough thickness in font units. */
	public strikethroughSize: number;

	/**
	 * Version-specific GPU resources (textures, shader program) cached for sharing
	 * across all SlugText instances. Populated lazily by version-specific code
	 * (e.g. slugFontGpuV8). SlugFont itself never imports or knows about PixiJS.
	 */
	public gpuCache: unknown;

	/** Cleanup function for gpuCache, set by the version-specific factory. */
	private _gpuDestroy: (() => void) | null;

	constructor(textureWidth: number = Defaults.TEXTURE_SIZE) {
		if (textureWidth <= 0 || (textureWidth & (textureWidth - 1)) !== 0) {
			throw new Error(`textureWidth must be a power of 2, got ${textureWidth}`);
		}

		this.textureWidth = textureWidth;
		this.curveData = new Float32Array(0);
		this.bandData = new Uint32Array(0);
		this.glyphs = new Map();
		this.advances = new Map();
		this.unitsPerEm = 0;
		this.ascender = 0;
		this.descender = 0;
		this.underlinePosition = 0;
		this.underlineThickness = 0;
		this.strikethroughPosition = 0;
		this.strikethroughSize = 0;
		this.gpuCache = null;
		this._gpuDestroy = null;
	}

	/**
	 * Set the GPU cache cleanup function. Called by version-specific factories
	 * (e.g. slugFontGpuV8) when they populate gpuCache.
	 */
	public setGpuDestroy(fn: () => void): void {
		this._gpuDestroy = fn;
	}

	/**
	 * Destroy GPU resources (textures, etc.) owned by this font.
	 * Call only after all SlugText instances using this font are destroyed.
	 */
	public destroyGpu(): void {
		if (this._gpuDestroy) {
			this._gpuDestroy();
			this._gpuDestroy = null;
		}
		this.gpuCache = null;
	}

	/**
	 * GPU memory consumed by this font's curve and band textures, in bytes.
	 * Both textures use rgba32float (4 channels × 4 bytes per texel).
	 * Band data is uint32 reinterpreted as float32 bit patterns on upload.
	 * This is shared across all SlugText instances that use this font.
	 */
	public memoryBytes(): number {
		const bytesPerTexel = 4 * 4; // rgba32float
		const textureWidth = this.textureWidth;
		const curveRows = Math.ceil(this.curveData.length / 4 / textureWidth) || 1;
		const bandRows = Math.ceil(this.bandData.length / 4 / textureWidth) || 1;
		return (curveRows + bandRows) * textureWidth * bytesPerTexel;
	}

	public async load(fontData: ArrayBuffer): Promise<void> {
		const font = opentype.parse(fontData);
		this.unitsPerEm = font.unitsPerEm;
		this.ascender = font.ascender;
		this.descender = font.descender;

		// OS/2 table metrics for underline and strikethrough
		const post = (font as any).tables?.post;
		const os2 = (font as any).tables?.os2;
		this.underlinePosition = post?.underlinePosition ?? Math.round(-font.unitsPerEm * 0.1);
		this.underlineThickness = post?.underlineThickness ?? Math.round(font.unitsPerEm * 0.05);
		this.strikethroughPosition = os2?.yStrikeoutPosition ?? Math.round(font.ascender * 0.3);
		this.strikethroughSize = os2?.yStrikeoutSize ?? this.underlineThickness;

		const glyphList: SlugGlyphData[] = [];

		for (let i = 0; i < font.glyphs.length; i++) {
			const glyph = font.glyphs.get(i);
			const charCode = glyph.unicode;

			// Store advance width for all glyphs (including space/empty)
			if (charCode !== undefined && glyph.advanceWidth) {
				this.advances.set(charCode, glyph.advanceWidth);
			}

			if (!glyph.path || glyph.path.commands.length === 0) {
				continue;
			}

			if (charCode === undefined) {
				continue;
			}

			// Extract quadratic Bezier curves from glyph path
			const {curves, contourStarts} = slugGlyphCurves(glyph.path.commands);
			if (curves.length === 0) {
				continue;
			}

			// Compute bounding box from glyph metrics
			const bounds = glyph.getBoundingBox();

			// Compute band assignments
			const bandResult = slugGlyphBands(curves, bounds.x1, bounds.y1, bounds.x2, bounds.y2);

			const glyphData: SlugGlyphData = {
				charCode,
				curves,
				contourStarts,
				bounds: {
					minX: bounds.x1,
					minY: bounds.y1,
					maxX: bounds.x2,
					maxY: bounds.y2
				},
				advanceWidth: glyph.advanceWidth ?? 0,
				lsb: glyph.leftSideBearing ?? 0,
				hBandCount: bandResult.hBandCount,
				vBandCount: bandResult.vBandCount,
				hBands: bandResult.hBands,
				vBands: bandResult.vBands,
				curveOffset: 0,
				bandOffset: 0
			};

			glyphList.push(glyphData);
			this.glyphs.set(charCode, glyphData);
		}

		// Pack all glyph data into GPU textures
		const packed = slugTexturePack(glyphList, this.textureWidth);
		this.curveData = packed.curveData;
		this.bandData = packed.bandData;

		// Invalidate any existing GPU cache since font data changed.
		this.destroyGpu();
	}
}
