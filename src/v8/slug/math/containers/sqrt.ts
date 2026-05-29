import type {Rgba} from '../../../../rgba';
import type {SlugFont} from '../../../../shared/slug/font';
import type {SlugGlyphData} from '../../../../shared/slug/glyph/data';
import {MathRules} from '../../../../shared/slug/math/layout/sizes';
import {slugRadicalOutline} from '../../../../shared/slug/math/radical';
import {MathContainer} from './base';
import {RadicalMesh} from './radical-mesh';

/**
 * Square root / n-th root:
 *   - `radicand` slot: the expression under the radical.
 *   - optional `index` slot: the small n in `ⁿ√x`.
 *   - The radical sign (nib → deep-V valley → diagonal upstroke →
 *     horizontal vinculum) is a SYNTHESIZED outline rendered through the
 *     Slug coverage shader — the SAME path as font glyphs — so it stays
 *     resolution-independent and scales in lockstep with the surrounding
 *     text. A PIXI `Graphics` decoration would bake its antialiasing at
 *     build time and drift out of visual register as the formula scales
 *     or transforms; a synthesized Slug glyph does not. The outline is
 *     one closed contour, so the upstroke→vinculum corner is a single
 *     filled region with no seam.
 *
 * The radicand sits in its own coord space. The radical's outline is
 * synthesized to bracket the radicand's height and span its width.
 */
export class SqrtContainer extends MathContainer {
	private _radicand: MathContainer | null = null;
	private _index: MathContainer | null = null;
	private _radical: RadicalMesh;
	private _fill: Rgba;
	private _mathFont: SlugFont;

	/**
	 * Cache of registered synthetic radical glyphs keyed by a quantized
	 * geometry signature. Synthetic-glyph registration is append-only in
	 * the font's curve/band textures, so re-registering a continuously
	 * animating radical every frame would grow the textures without
	 * bound. Quantizing the geometry (height/width/thickness bucketed to
	 * a few px) collapses a smooth resize into a small finite set of
	 * registered outlines that get reused. The visual cost of the
	 * quantization is invisible because the Slug shader renders each
	 * bucket resolution-independently — a slightly-off bucket size is
	 * stretched to the exact target rect by the mesh, and the stroke
	 * proportions are regenerated per bucket so they stay correct.
	 */
	private _glyphCache: Map<string, SlugGlyphData> = new Map();

	private _radicandScale: number = 1.0;
	private _indexScale: number = 0.6;
	public get radicandScale(): number { return this._radicandScale; }
	public set radicandScale(v: number) {
		if (v === this._radicandScale) return;
		this._radicandScale = v;
		this._recompileSlot?.('radicand');
	}
	public get indexScale(): number { return this._indexScale; }
	public set indexScale(v: number) {
		if (v === this._indexScale) return;
		this._indexScale = v;
		this._recompileSlot?.('index');
	}

	constructor(mathFont: SlugFont, fontSize: number, fill: Rgba) {
		super();
		this.mathFontSize = fontSize;
		this._fill = fill;
		this._mathFont = mathFont;
		this._radical = new RadicalMesh(mathFont, fill);
		this.addChild(this._radical);
	}

	public setRadicand(c: MathContainer): void {
		if (this._radicand === c) return;
		if (this._radicand) this.removeChild(this._radicand);
		this._radicand = c;
		this.addChild(c);
	}

	public setIndex(c: MathContainer | null): void {
		if (this._index === c) return;
		if (this._index) this.removeChild(this._index);
		this._index = c;
		if (c) this.addChild(c);
	}

	/**
	 * Get (or register and cache) a synthetic radical glyph for the given
	 * pixel geometry. The outline is generated in pixel units mapped 1:1
	 * to em-space so the X/Y stretch applied by the mesh is uniform and
	 * the stroke weight stays consistent. Quantizes the inputs to bound
	 * how many distinct outlines get packed into the shared textures.
	 */
	private _getRadicalGlyph(
		height: number,
		hookWidth: number,
		barRight: number,
		thickness: number
	): SlugGlyphData | null {
		// Quantize to a small grid so a smooth resize reuses buckets.
		// 4px height/width buckets are finer than the eye can distinguish
		// once the shader stretches the bucket to the exact target.
		const qHeight = Math.max(1, Math.round(height / 4) * 4);
		const qHook = Math.max(1, Math.round(hookWidth / 2) * 2);
		const qBar = Math.max(qHook + 1, Math.round(barRight / 8) * 8);
		const qThick = Math.max(0.5, Math.round(thickness * 2) / 2);
		const key = `${qHeight}:${qHook}:${qBar}:${qThick}`;

		const cached = this._glyphCache.get(key);
		if (cached) return cached;

		const outline = slugRadicalOutline({
			height: qHeight,
			hookWidth: qHook,
			barRight: qBar,
			thickness: qThick
		});
		const result = this._mathFont.registerSynthetic({
			curves: outline.curves,
			contourStarts: outline.contourStarts,
			bounds: outline.bounds
		});
		if (result === null) {
			return null;
		}
		this._glyphCache.set(key, result.glyph);
		return result.glyph;
	}

	public override layout(): void {
		const rad = this._radicand;
		if (!rad) {
			this._width = 0;
			this._ascent = 0;
			this._descent = 0;
			this._radical.setGlyph(null, 0, 0, 0, 0);
			return;
		}
		rad.layout();

		const fontSize = this.mathFontSize;
		const pad = MathRules.FencePadEm * fontSize;
		const ruleThickness = MathRules.SqrtRuleEm * fontSize;

		const radAscent = rad.mathAscent;
		const radDescent = rad.mathDescent;

		// Breathing room between the vinculum and the radicand top.
		const gap = ruleThickness;

		// Vertical span the radical must cover, in local pixels: from the
		// top of the bar down to the bottom of the radicand.
		const topY = -radAscent - gap; // bar top (local px, Y down)
		const bottomY = radDescent; // valley floor
		const totalHeight = bottomY - topY;

		// Hook proportions scale with the bracketed height so the check
		// mark keeps its shape at any size.
		const hookWidth = Math.max(fontSize * 0.5, totalHeight * 0.42);

		// Index hangs above the hook's left shoulder and shifts the whole
		// figure right when present.
		const idx = this._index;
		let indexOffsetX = 0;
		if (idx) {
			idx.layout();
			indexOffsetX = Math.max(0, idx.mathWidth - hookWidth * 0.5);
		}

		const hookLeftX = indexOffsetX;
		// Radicand starts just right of where the upstroke reaches the bar.
		const radX = hookLeftX + hookWidth + pad;
		// The vinculum spans the radicand plus a little overshoot on each end.
		const barRightLocal = radX + rad.mathWidth + pad; // absolute local x
		const barRightInGlyph = barRightLocal - hookLeftX; // x within the outline

		// Register / fetch the synthetic outline for this geometry. The
		// outline is generated in pixel-unit coordinates and normalized so
		// its bounding box starts at the origin.
		const glyph = this._getRadicalGlyph(
			totalHeight,
			hookWidth,
			barRightInGlyph,
			ruleThickness
		);

		// Map the glyph's normalized bounds box 1:1 onto local pixel space
		// so the stroke weight is not distorted by a non-uniform stretch.
		// The box may be marginally wider/taller than the requested
		// geometry (the inner nib edge offsets the silhouette slightly);
		// using the glyph's own bounds keeps em→px at unit scale. Y maps
		// so the bar top lands at `topY`.
		const boxW = glyph ? glyph.bounds.maxX : barRightInGlyph;
		const boxH = glyph ? glyph.bounds.maxY : totalHeight;
		this._radical.setGlyph(glyph, hookLeftX, topY, boxW, boxH);

		// Radicand sits with its baseline at this container's baseline.
		rad.x = radX;
		rad.y = 0;

		// Position index above-left, hanging over the hook's shoulder.
		if (idx) {
			idx.x = 0;
			idx.y = topY + idx.mathDescent;
		}

		this._width = barRightLocal;
		this._ascent = radAscent + gap + (idx ? idx.mathAscent + idx.mathDescent : 0);
		this._descent = radDescent;

		// Suppress unused-var warning: mathFont retained via _radical too,
		// kept here for symmetry with sibling containers.
		void this._mathFont;
	}
}
