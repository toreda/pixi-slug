import opentype from 'opentype.js';
import { Defaults } from '../../defaults';
import type { SlugGlyphData } from './glyph/data';
import { slugGlyphCurves } from './glyph/curves';
import { slugGlyphBands } from './glyph/bands';
import { slugTexturePack } from './texture/pack';

/**
 * Preprocesses font glyph outlines into GPU-ready curve and band textures
 * for the Slug rendering algorithm.
 */
export class SlugFont {
	/** Curve texture data: quadratic Bezier control points (float RGBA) */
	public curveData: Float32Array;
	/** Band texture data: hierarchical band index (uint RGBA) */
	public bandData: Uint32Array;
	/** Texture width (must be power of 2). Smaller fonts can use smaller textures to save memory. */
	public readonly textureWidth: number;
	/** Preprocessed glyph data indexed by Unicode code point. */
	public readonly glyphs: Map<number, SlugGlyphData>;
	/** Advance widths for ALL glyphs (including empty ones like space), indexed by char code. */
	public readonly advances: Map<number, number>;
	/** Font units per em (used to normalize coordinates). */
	public unitsPerEm: number;

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
	}

	/**
	 * Load and preprocess a font file into curve and band texture data.
	 * Extracts glyph outlines as quadratic Bezier curves and packs them
	 * into the format expected by the Slug shaders.
	 *
	 * @param fontData		ArrayBuffer containing the font file (TTF/OTF)
	 */
	public async load(fontData: ArrayBuffer): Promise<void> {
		const font = opentype.parse(fontData);
		this.unitsPerEm = font.unitsPerEm;

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
			const curves = slugGlyphCurves(glyph.path.commands);
			if (curves.length === 0) {
				continue;
			}

			// Compute bounding box from glyph metrics
			const bounds = glyph.getBoundingBox();

			// Compute band assignments
			const bandResult = slugGlyphBands(
				curves,
				bounds.x1,
				bounds.y1,
				bounds.x2,
				bounds.y2
			);

			const glyphData: SlugGlyphData = {
				charCode,
				curves,
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
	}
}
