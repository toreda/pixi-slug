import {Graphics} from 'pixi.js';
import type {Rgba} from '../../../../rgba';
import type {SlugFont} from '../../../../shared/slug/font';
import type {SlugGlyphData} from '../../../../shared/slug/glyph/data';
import {MathRules} from '../../../../shared/slug/math/layout/sizes';
import {slugFenceOutline, type FenceShape} from '../../../../shared/slug/math/fences';
import {MathContainer} from './base';
import {SyntheticGlyphMesh} from './synthetic-glyph-mesh';

/**
 * 2-D grid of math containers. Per-column auto-width, per-row
 * auto-height, optional fence glyphs around the whole grid, optional
 * vertical rule between two columns (augmented matrix).
 *
 * The surrounding fences (`[ ]`, `( )`, `{ }`, `| |`) are SYNTHESIZED
 * Slug outlines that stretch in height with a constant stroke weight —
 * NOT scaled-up font glyphs. A scaled font `[` thickens its stem in
 * proportion to height (a 4-row matrix would get a 4× heavy bracket) and
 * is capped by the single glyph's designed height; a synthesized outline
 * keeps the delimiter thin and tall for an n×n grid while rendering
 * through the same coverage shader as the cells, so it stays
 * resolution-independent. See {@link slugFenceOutline} and the sqrt
 * radical for the same technique.
 *
 * The fences are vertically positioned to STRADDLE the grid's math axis
 * (the centered baseline), so a tall bracket grows symmetrically above
 * and below center rather than hanging off one baseline.
 */
export class MatrixContainer extends MathContainer {
	private _rows: MathContainer[][] = [];
	private _fence: FenceShape | 'none';
	private _augmentCol: number | null;
	private _leftFence: SyntheticGlyphMesh | null = null;
	private _rightFence: SyntheticGlyphMesh | null = null;
	private _augmentRule: Graphics;
	private _mathFont: SlugFont;
	private _fill: Rgba;

	/**
	 * Cache of registered synthetic fence glyphs keyed by a quantized
	 * geometry + shape + mirror signature. Synthetic-glyph registration is
	 * append-only in the font's curve/band textures, so re-registering a
	 * continuously resizing fence every frame would grow the textures
	 * without bound. Quantizing height/width/thickness to a small grid
	 * collapses a smooth resize into a finite set of reused outlines; the
	 * Slug shader stretches a slightly-off bucket to the exact target rect,
	 * so the quantization is invisible. Mirror flag distinguishes the
	 * right (opening-left) member from the left.
	 */
	private _glyphCache: Map<string, SlugGlyphData> = new Map();

	private _cellScale: number = 1.0;
	public get cellScale(): number { return this._cellScale; }
	public set cellScale(v: number) {
		if (v === this._cellScale) return;
		this._cellScale = v;
		this._recompileSlot?.('cells');
	}

	constructor(
		fence: FenceShape | 'none',
		augmentCol: number | null,
		mathFont: SlugFont,
		fontSize: number,
		fill: Rgba
	) {
		super();
		this.mathFontSize = fontSize;
		this._fence = fence;
		this._augmentCol = augmentCol;
		this._mathFont = mathFont;
		this._fill = fill;
		this._augmentRule = new Graphics();
		this.addChild(this._augmentRule);
	}

	public setRows(rows: MathContainer[][]): void {
		// Remove old cells.
		for (const row of this._rows) for (const c of row) this.removeChild(c);
		this._rows = rows;
		for (const row of rows) for (const c of row) this.addChild(c);
	}

	/**
	 * Get (or register and cache) a synthetic fence glyph for the given
	 * pixel geometry, shape and side. The outline is generated in pixel
	 * units mapped 1:1 to em-space so the X/Y stretch applied by the mesh
	 * is uniform and the stroke weight stays consistent. Quantizes the
	 * inputs to bound how many distinct outlines get packed into the shared
	 * textures. `mirror` flips the outline horizontally for the right
	 * member so a single shape definition serves both sides symmetrically.
	 */
	private _getFenceGlyph(
		shape: FenceShape,
		height: number,
		width: number,
		thickness: number,
		mirror: boolean
	): SlugGlyphData | null {
		const qHeight = Math.max(1, Math.round(height / 4) * 4);
		const qWidth = Math.max(1, Math.round(width / 2) * 2);
		const qThick = Math.max(0.5, Math.round(thickness * 2) / 2);
		const key = `${shape}:${qHeight}:${qWidth}:${qThick}:${mirror ? 'm' : 'n'}`;

		const cached = this._glyphCache.get(key);
		if (cached) return cached;

		const outline = slugFenceOutline(shape, {
			height: qHeight,
			width: qWidth,
			thickness: qThick
		});
		// Mirror about the bounding-box center for the right member.
		if (mirror) {
			const maxX = outline.bounds.maxX;
			for (const c of outline.curves) {
				c.p1x = maxX - c.p1x;
				c.p2x = maxX - c.p2x;
				c.p3x = maxX - c.p3x;
			}
		}
		const result = this._mathFont.registerSynthetic({
			curves: outline.curves,
			contourStarts: outline.contourStarts,
			bounds: outline.bounds
		});
		if (result === null) return null;
		this._glyphCache.set(key, result.glyph);
		return result.glyph;
	}

	public override layout(): void {
		const rows = this._rows;
		const numRows = rows.length;
		const numCols = rows[0]?.length ?? 0;
		if (numRows === 0 || numCols === 0) {
			this._width = 0;
			this._ascent = 0;
			this._descent = 0;
			this._augmentRule.clear();
			this._leftFence?.setGlyph(null, 0, 0, 0, 0);
			this._rightFence?.setGlyph(null, 0, 0, 0, 0);
			return;
		}

		// Lay out cells; collect per-column widths, per-row ascent/descent.
		const colW = new Array(numCols).fill(0);
		const rowA = new Array(numRows).fill(0);
		const rowD = new Array(numRows).fill(0);
		for (let r = 0; r < numRows; r++) {
			for (let c = 0; c < numCols; c++) {
				const cell = rows[r][c];
				cell.layout();
				if (cell.mathWidth > colW[c]) colW[c] = cell.mathWidth;
				if (cell.mathAscent > rowA[r]) rowA[r] = cell.mathAscent;
				if (cell.mathDescent > rowD[r]) rowD[r] = cell.mathDescent;
			}
		}

		const fontSize = this.mathFontSize;
		const colGap = MathRules.MatrixColGapEm * fontSize;
		const rowGap = MathRules.MatrixRowGapEm * fontSize;

		// Place cells. Grid baseline = vertical center of the grid.
		let totalW = 0;
		for (let c = 0; c < numCols; c++) totalW += colW[c];
		totalW += colGap * (numCols - 1);

		let y = 0;
		for (let r = 0; r < numRows; r++) {
			y += rowA[r];
			let x = 0;
			for (let c = 0; c < numCols; c++) {
				const cell = rows[r][c];
				cell.x = x + (colW[c] - cell.mathWidth) / 2;
				cell.y = y;
				x += colW[c] + colGap;
			}
			y += rowD[r];
			if (r < numRows - 1) y += rowGap;
		}
		const gridHeight = y;
		const gridCenter = gridHeight / 2;
		// Shift every cell so the grid is centered on the math axis.
		for (let r = 0; r < numRows; r++) {
			for (let c = 0; c < numCols; c++) {
				rows[r][c].y -= gridCenter;
			}
		}
		const ascent = gridCenter;
		const descent = gridCenter;

		// Augmented matrix rule.
		this._augmentRule.clear();
		if (
			this._augmentCol !== null &&
			this._augmentCol > 0 &&
			this._augmentCol < numCols
		) {
			let xRule = 0;
			for (let c = 0; c < this._augmentCol; c++) xRule += colW[c] + colGap;
			xRule -= colGap / 2;
			const t = MathRules.FracRuleEm * fontSize;
			const color = rgbaToHex(this._fill);
			const alpha = this._fill[3];
			this._augmentRule
				.rect(xRule - t / 2, -ascent, t, ascent + descent)
				.fill({color, alpha});
		}

		// Optional synthetic fences. They straddle the math axis: the dst
		// rect runs from `-ascent` (top) down to `+descent` (bottom), so a
		// tall bracket grows symmetrically about center and aligns with the
		// centered grid — fixing the old behavior where a baseline-anchored
		// scaled glyph sat offset below the cells.
		const fence = this._fence;
		let leftWidth = 0;
		let rightWidth = 0;
		if (fence !== 'none') {
			const innerHeight = ascent + descent;
			const pad = MathRules.FencePadEm * fontSize;
			const thickness = MathRules.FenceStrokeEm * fontSize;
			// Fence width grows mildly with height so a tall delimiter keeps
			// pleasing proportions, but is bounded so it never dominates.
			const fenceWidth = Math.min(
				MathRules.FenceWidthEm * fontSize * 1.5,
				Math.max(MathRules.FenceWidthEm * fontSize, innerHeight * 0.12)
			);

			const leftGlyph = this._getFenceGlyph(fence, innerHeight, fenceWidth, thickness, false);
			const rightGlyph = this._getFenceGlyph(fence, innerHeight, fenceWidth, thickness, true);

			if (!this._leftFence) {
				this._leftFence = new SyntheticGlyphMesh(this._mathFont, this._fill, 'fence');
				this.addChild(this._leftFence);
			}
			if (!this._rightFence) {
				this._rightFence = new SyntheticGlyphMesh(this._mathFont, this._fill, 'fence');
				this.addChild(this._rightFence);
			}

			// Map each glyph's own normalized bounds 1:1 to local pixel
			// space (em→px unit scale, so the stroke is not distorted by a
			// non-uniform stretch). Top of the dst rect is `-ascent`.
			const leftW = leftGlyph ? leftGlyph.bounds.maxX : fenceWidth;
			const rightW = rightGlyph ? rightGlyph.bounds.maxX : fenceWidth;
			this._leftFence.setGlyph(leftGlyph, 0, -ascent, leftW, innerHeight);

			leftWidth = leftW + pad;
			// Shift grid cells + augment rule right past the left fence.
			for (let r = 0; r < numRows; r++) {
				for (let c = 0; c < numCols; c++) rows[r][c].x += leftWidth;
			}
			this._augmentRule.x = leftWidth;

			const rightX = leftWidth + totalW + pad;
			this._rightFence.setGlyph(rightGlyph, rightX, -ascent, rightW, innerHeight);
			rightWidth = pad + rightW;
		} else {
			this._augmentRule.x = 0;
			this._leftFence?.setGlyph(null, 0, 0, 0, 0);
			this._rightFence?.setGlyph(null, 0, 0, 0, 0);
		}

		this._width = leftWidth + totalW + rightWidth;
		this._ascent = ascent;
		this._descent = descent;
	}
}

function rgbaToHex(rgba: Rgba): number {
	const r = Math.max(0, Math.min(255, Math.round(rgba[0] * 255)));
	const g = Math.max(0, Math.min(255, Math.round(rgba[1] * 255)));
	const b = Math.max(0, Math.min(255, Math.round(rgba[2] * 255)));
	return (r << 16) | (g << 8) | b;
}
