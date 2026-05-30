import type {Rgba} from '../../../../rgba';
import type {SlugFont} from '../../../../shared/slug/font';
import type {SlugGlyphData} from '../../../../shared/slug/glyph/data';
import type {SqrtVAlign} from '../../../../shared/slug/math/node';
import {MathRules} from '../../../../shared/slug/math/layout/sizes';
import {slugRadicalOutline} from '../../../../shared/slug/math/radical';
import {MathContainer} from './base';
import {SyntheticGlyphMesh} from './synthetic-glyph-mesh';

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
	private _radical: SyntheticGlyphMesh;
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

	/**
	 * How the radicand is positioned vertically within the radical.
	 *  - `'bottom'` (default): the radical's valley hugs the radicand's
	 *    visible INK bottom, so content sits flush at the bottom of the
	 *    bracket. For a no-descender radicand like `b²−4ac` this removes
	 *    the empty band the descender-box height would otherwise leave
	 *    below the glyphs.
	 *  - `'baseline'`: the radical brackets the radicand's full layout box
	 *    (down to the font descender line) — the historical behavior,
	 *    useful when the radical should align with sibling baselines.
	 *  - `'center'`: center the radicand's ink box vertically within the
	 *    radical's interior — for short content that would otherwise look
	 *    like it's resting on the valley floor.
	 */
	private _radicandVAlign: SqrtVAlign = 'bottom';
	public get radicandVAlign(): SqrtVAlign { return this._radicandVAlign; }
	public set radicandVAlign(v: SqrtVAlign) {
		if (v === this._radicandVAlign) return;
		this._radicandVAlign = v;
		this.layout();
	}

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
		this._radical = new SyntheticGlyphMesh(mathFont, fill, 'radical');
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

		// Use the radicand's INK extent (actual visible glyph bounds), not
		// its layout box, so the radical hugs the content. For `b²−4ac`
		// the ink descent is 0 (no descenders), whereas the layout-box
		// descent would be the font descender — bracketing to that leaves
		// an empty band of radical below the glyphs.
		const radInkAscent = rad.mathInkAscent;
		const radInkDescent = rad.mathInkDescent;

		// Breathing room between the vinculum and the radicand top, and a
		// small clearance below the content before the valley floor.
		const gap = ruleThickness;
		const bottomClearance = ruleThickness;

		// `radY` is the radicand's baseline offset in local space. For
		// `'baseline'` it stays at 0 (aligned with the rest of the formula);
		// the other modes SHIFT the radicand vertically inside the radical
		// so its visible ink sits where requested. `topY` is the bar top and
		// `bottomY` the valley floor; both follow from the shifted content.
		let radY: number;
		let topY: number;
		let bottomY: number;

		if (this._radicandVAlign === 'baseline') {
			// Historical behavior: radicand on the baseline; bar clears the
			// ink top, valley drops to the full layout box (font descender).
			radY = 0;
			topY = -radInkAscent - gap;
			bottomY = rad.mathDescent;
		} else if (this._radicandVAlign === 'center') {
			// Center the ink box in the interior. Keep the radicand on the
			// baseline and pad equally above the ink top and below the ink
			// bottom.
			radY = 0;
			topY = -radInkAscent - gap;
			bottomY = radInkDescent + gap;
		} else {
			// 'bottom' (default): the radical sits at its natural
			// position (radicand on the baseline) and the valley is at a
			// small clearance below the visible ink bottom — so the content
			// rests near the valley floor rather than floating above it.
			//
			// The earlier behavior already did this, but with the radicand
			// kept on the baseline the *bar* rises to clear the ink top
			// (which, for `b²`, includes the raised superscript). That makes
			// the radical taller at the top while the main row hugs the
			// valley — reading as "content pushed up". The fix: the bar only
			// needs to clear the ink top by `gap`, and the valley only needs
			// `bottomClearance` below the ink bottom — both tight to the
			// CONTENT, not to the baseline. The radicand stays on the
			// baseline so the formula reads on one line.
			radY = 0;
			topY = -radInkAscent - gap;
			bottomY = radInkDescent + bottomClearance;
		}

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

		// Radicand baseline placed per `radicandVAlign` (computed above).
		rad.x = radX;
		rad.y = radY;

		// Position index above-left, hanging over the hook's shoulder.
		if (idx) {
			idx.x = 0;
			idx.y = topY + idx.mathDescent;
		}

		this._width = barRightLocal;
		// Ascent reaches the bar top (`-topY` from baseline) plus any index.
		this._ascent = -topY + (idx ? idx.mathAscent + idx.mathDescent : 0);
		// Descent reaches the valley floor, but never less than the
		// radicand's own layout descent at its (possibly shifted) baseline —
		// a descender in the radicand (e.g. √(y_p)) must not be clipped by a
		// too-tight sibling baseline.
		this._descent = Math.max(bottomY, radY + rad.mathDescent);

		// Ink extents mirror the layout box here: the radical's drawn
		// silhouette is the visible content, so ink == box for the parent's
		// purposes.
		this._inkAscent = this._ascent;
		this._inkDescent = this._descent;

		// Suppress unused-var warning: mathFont retained via _radical too,
		// kept here for symmetry with sibling containers.
		void this._mathFont;
	}
}
