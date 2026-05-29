import {Graphics} from 'pixi.js';
import type {Rgba} from '../../../../rgba';
import type {SlugFont} from '../../../../shared/slug/font';
import {MathRules} from '../../../../shared/slug/math/layout/sizes';
import {AtomContainer} from './atom';
import {MathContainer} from './base';

/**
 * 2-D grid of math containers. Per-column auto-width, per-row
 * auto-height, optional fence glyphs around the whole grid, optional
 * vertical rule between two columns (augmented matrix).
 */
export class MatrixContainer extends MathContainer {
	private _rows: MathContainer[][] = [];
	private _fence: 'paren' | 'bracket' | 'brace' | 'abs' | 'none';
	private _augmentCol: number | null;
	private _left: AtomContainer | null = null;
	private _right: AtomContainer | null = null;
	private _augmentRule: Graphics;
	private _mathFont: SlugFont;
	private _fill: Rgba;

	private _cellScale: number = 1.0;
	public get cellScale(): number { return this._cellScale; }
	public set cellScale(v: number) {
		if (v === this._cellScale) return;
		this._cellScale = v;
		this._recompileSlot?.('cells');
	}

	constructor(
		fence: 'paren' | 'bracket' | 'brace' | 'abs' | 'none',
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

	public override layout(): void {
		const rows = this._rows;
		const numRows = rows.length;
		const numCols = rows[0]?.length ?? 0;
		if (numRows === 0 || numCols === 0) {
			this._width = 0;
			this._ascent = 0;
			this._descent = 0;
			this._augmentRule.clear();
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

		const rowBaselines: number[] = [];
		let y = 0;
		for (let r = 0; r < numRows; r++) {
			y += rowA[r];
			rowBaselines.push(y);
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

		// Optional fences.
		const fence = this._fence;
		let leftWidth = 0;
		let rightWidth = 0;
		if (fence !== 'none') {
			const [lChar, rChar] = fenceGlyphs(fence);
			const innerHeight = ascent + descent;
			const fenceScale = Math.max(1, innerHeight / fontSize);
			const fenceFontSize = fontSize * fenceScale;
			const pad = MathRules.FencePadEm * fontSize;

			if (!this._left) {
				this._left = new AtomContainer(lChar, this._mathFont, fenceFontSize, this._fill);
				this.addChild(this._left);
			} else {
				this._left.setText(lChar);
				this._left.setFontSize(fenceFontSize);
			}
			if (!this._right) {
				this._right = new AtomContainer(rChar, this._mathFont, fenceFontSize, this._fill);
				this.addChild(this._right);
			} else {
				this._right.setText(rChar);
				this._right.setFontSize(fenceFontSize);
			}
			this._left.layout();
			this._right.layout();

			this._left.x = 0;
			this._left.y = 0;
			leftWidth = this._left.mathWidth + pad;
			// Shift grid cells right by leftWidth.
			for (let r = 0; r < numRows; r++) {
				for (let c = 0; c < numCols; c++) rows[r][c].x += leftWidth;
			}
			// Shift augment rule too.
			this._augmentRule.x = leftWidth;
			this._right.x = leftWidth + totalW + pad;
			this._right.y = 0;
			rightWidth = pad + this._right.mathWidth;
		} else {
			this._augmentRule.x = 0;
		}

		this._width = leftWidth + totalW + rightWidth;
		this._ascent = ascent;
		this._descent = descent;
	}
}

function fenceGlyphs(fence: 'paren' | 'bracket' | 'brace' | 'abs'): [string, string] {
	switch (fence) {
		case 'paren':
			return ['(', ')'];
		case 'bracket':
			return ['[', ']'];
		case 'brace':
			return ['{', '}'];
		case 'abs':
			return ['|', '|'];
	}
}

function rgbaToHex(rgba: Rgba): number {
	const r = Math.max(0, Math.min(255, Math.round(rgba[0] * 255)));
	const g = Math.max(0, Math.min(255, Math.round(rgba[1] * 255)));
	const b = Math.max(0, Math.min(255, Math.round(rgba[2] * 255)));
	return (r << 16) | (g << 8) | b;
}
