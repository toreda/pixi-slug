import {Graphics} from 'pixi.js';
import type {Rgba} from '../../../../rgba';
import type {SlugFont} from '../../../../shared/slug/font';
import {MathRules, MathSizes} from '../../../../shared/slug/math/layout/sizes';
import {AtomContainer} from './atom';
import {MathContainer} from './base';
import {RowContainer} from './row';

// Helper used by several decoration containers below.
function rgbaToHex(rgba: Rgba): number {
	const r = Math.max(0, Math.min(255, Math.round(rgba[0] * 255)));
	const g = Math.max(0, Math.min(255, Math.round(rgba[1] * 255)));
	const b = Math.max(0, Math.min(255, Math.round(rgba[2] * 255)));
	return (r << 16) | (g << 8) | b;
}

/** Vertical stack of containers, centered horizontally. */
export class ColumnContainer extends MathContainer {
	private _items: MathContainer[] = [];

	public setItems(items: MathContainer[]): void {
		for (const c of this._items) this.removeChild(c);
		this._items = items;
		for (const c of items) this.addChild(c);
	}

	public override layout(): void {
		const items = this._items;
		if (items.length === 0) {
			this._width = 0;
			this._ascent = 0;
			this._descent = 0;
			return;
		}
		for (const c of items) c.layout();
		let width = 0;
		for (const c of items) if (c.mathWidth > width) width = c.mathWidth;

		const lineSpacing = MathRules.DefaultLineSpacing * this.mathFontSize;
		let y = 0;
		let ascent = items[0].mathAscent;
		let descent = 0;
		for (let i = 0; i < items.length; i++) {
			const c = items[i];
			c.x = (width - c.mathWidth) / 2;
			c.y = y;
			descent = y + c.mathDescent;
			if (i < items.length - 1) y += lineSpacing;
		}
		this._width = width;
		this._ascent = ascent;
		this._descent = descent;
	}
}

/** Accent over a base: vec, hat, bar, dot, ddot, tilde. */
export class AccentContainer extends MathContainer {
	private _base: MathContainer | null = null;
	private _accent: AtomContainer;

	constructor(glyph: string, mathFont: SlugFont, fontSize: number, fill: Rgba) {
		super();
		this.mathFontSize = fontSize;
		this._accent = new AtomContainer(glyph, mathFont, fontSize * MathSizes.Accent, fill);
		this.addChild(this._accent);
	}

	public setBase(c: MathContainer): void {
		if (this._base === c) return;
		if (this._base) this.removeChild(this._base);
		this._base = c;
		this.addChild(c);
	}

	public override layout(): void {
		const base = this._base;
		if (!base) {
			this._width = 0;
			this._ascent = 0;
			this._descent = 0;
			return;
		}
		base.layout();
		this._accent.layout();
		const gap = MathRules.AccentGapEm * this.mathFontSize;
		base.x = 0;
		base.y = 0;
		this._accent.x = (base.mathWidth - this._accent.mathWidth) / 2;
		this._accent.y = -base.mathAscent - gap - this._accent.mathDescent;
		this._width = base.mathWidth;
		this._ascent = base.mathAscent + gap + this._accent.mathAscent + this._accent.mathDescent;
		this._descent = base.mathDescent;
	}
}

/** Over/underline: a horizontal rule above or below the inner content. */
export class OverlineContainer extends MathContainer {
	private _inner: MathContainer | null = null;
	private _line: Graphics;
	private _fill: Rgba;
	private _side: 'over' | 'under';

	constructor(position: 'over' | 'under', fill: Rgba) {
		super();
		this._side = position;
		this._fill = fill;
		this._line = new Graphics();
		this.addChild(this._line);
	}

	public setInner(c: MathContainer): void {
		if (this._inner === c) return;
		if (this._inner) this.removeChild(this._inner);
		this._inner = c;
		this.addChild(c);
	}

	public override layout(): void {
		const inner = this._inner;
		if (!inner) {
			this._width = 0;
			this._ascent = 0;
			this._descent = 0;
			this._line.clear();
			return;
		}
		inner.layout();
		const fontSize = this.mathFontSize;
		const t = MathRules.OverLineEm * fontSize;
		const gap = MathRules.AccentGapEm * fontSize;
		inner.x = 0;
		inner.y = 0;
		this._line.clear();
		const color = rgbaToHex(this._fill);
		const alpha = this._fill[3];
		if (this._side === 'over') {
			const y = -inner.mathAscent - gap - t / 2;
			this._line.rect(0, y - t / 2, inner.mathWidth, t).fill({color, alpha});
			this._width = inner.mathWidth;
			this._ascent = inner.mathAscent + gap + t;
			this._descent = inner.mathDescent;
		} else {
			const y = inner.mathDescent + gap + t / 2;
			this._line.rect(0, y - t / 2, inner.mathWidth, t).fill({color, alpha});
			this._width = inner.mathWidth;
			this._ascent = inner.mathAscent;
			this._descent = inner.mathDescent + gap + t;
		}
	}
}

/** Over/underbrace with optional label. */
export class BraceContainer extends MathContainer {
	private _inner: MathContainer | null = null;
	private _label: MathContainer | null = null;
	private _brace: AtomContainer;
	private _side: 'over' | 'under';

	constructor(
		position: 'over' | 'under',
		mathFont: SlugFont,
		fontSize: number,
		fill: Rgba
	) {
		super();
		this.mathFontSize = fontSize;
		this._side = position;
		const glyph = position === 'over' ? '⏞' : '⏟';
		this._brace = new AtomContainer(glyph, mathFont, fontSize, fill);
		this.addChild(this._brace);
	}

	public setInner(c: MathContainer): void {
		if (this._inner === c) return;
		if (this._inner) this.removeChild(this._inner);
		this._inner = c;
		this.addChild(c);
	}

	public setLabel(c: MathContainer | null): void {
		if (this._label === c) return;
		if (this._label) this.removeChild(this._label);
		this._label = c;
		if (c) this.addChild(c);
	}

	public override layout(): void {
		const inner = this._inner;
		if (!inner) {
			this._width = 0;
			this._ascent = 0;
			this._descent = 0;
			return;
		}
		inner.layout();
		this._brace.layout();
		const label = this._label;
		if (label) label.layout();

		const fontSize = this.mathFontSize;
		const gap = MathRules.AccentGapEm * fontSize;
		const labelGap = MathRules.BraceLabelGapEm * fontSize;
		const braceX = (inner.mathWidth - this._brace.mathWidth) / 2;
		inner.x = 0;
		inner.y = 0;

		if (this._side === 'over') {
			const braceY = -inner.mathAscent - gap - this._brace.mathDescent;
			this._brace.x = braceX;
			this._brace.y = braceY;
			let ascent = inner.mathAscent + gap + this._brace.mathAscent + this._brace.mathDescent;
			if (label) {
				const labelY = braceY - this._brace.mathAscent - labelGap - label.mathDescent;
				label.x = (inner.mathWidth - label.mathWidth) / 2;
				label.y = labelY;
				ascent = -labelY + label.mathAscent;
			}
			this._width = inner.mathWidth;
			this._ascent = ascent;
			this._descent = inner.mathDescent;
		} else {
			const braceY = inner.mathDescent + gap + this._brace.mathAscent;
			this._brace.x = braceX;
			this._brace.y = braceY;
			let descent = inner.mathDescent + gap + this._brace.mathAscent + this._brace.mathDescent;
			if (label) {
				const labelY = braceY + this._brace.mathDescent + labelGap + label.mathAscent;
				label.x = (inner.mathWidth - label.mathWidth) / 2;
				label.y = labelY;
				descent = labelY + label.mathDescent;
			}
			this._width = inner.mathWidth;
			this._ascent = inner.mathAscent;
			this._descent = descent;
		}
	}
}

/**
 * Binomial coefficient — same vertical layout as a fraction, but
 * without the horizontal rule, wrapped in auto-scaling parens. We
 * compose this from existing pieces inside the compiler (a fraction
 * with `hideRule:true` would be cleaner; for now the compiler emits a
 * dedicated `NoRuleFractionContainer` below).
 */
export class NoRuleFractionContainer extends MathContainer {
	private _num: MathContainer | null = null;
	private _den: MathContainer | null = null;

	public setNumerator(c: MathContainer): void {
		if (this._num === c) return;
		if (this._num) this.removeChild(this._num);
		this._num = c;
		this.addChild(c);
	}
	public setDenominator(c: MathContainer): void {
		if (this._den === c) return;
		if (this._den) this.removeChild(this._den);
		this._den = c;
		this.addChild(c);
	}

	public override layout(): void {
		const num = this._num;
		const den = this._den;
		if (!num || !den) {
			this._width = 0;
			this._ascent = 0;
			this._descent = 0;
			return;
		}
		num.layout();
		den.layout();
		const fontSize = this.mathFontSize;
		const pad = MathRules.FracRulePadEm * fontSize;
		const gap = MathRules.FracGapEm * fontSize;
		const width = Math.max(num.mathWidth, den.mathWidth) + 2 * pad;
		const axisY = -fontSize * 0.3;
		const numBaselineY = axisY - gap - num.mathDescent;
		const denBaselineY = axisY + gap + den.mathAscent;
		num.x = (width - num.mathWidth) / 2;
		num.y = numBaselineY;
		den.x = (width - den.mathWidth) / 2;
		den.y = denBaselineY;
		this._width = width;
		this._ascent = -numBaselineY + num.mathAscent;
		this._descent = denBaselineY + den.mathDescent;
	}
}

/**
 * `cases` — a left brace plus a 2-column body (value / condition).
 * Internally just a fenced one-sided `{` wrapping a matrix-like body.
 * Implemented by composing the brace AtomContainer + a sub-row layout.
 */
export class CasesContainer extends MathContainer {
	private _cases: [MathContainer, MathContainer][] = [];
	private _brace: AtomContainer;
	private _mathFont: SlugFont;
	private _fill: Rgba;

	constructor(mathFont: SlugFont, fontSize: number, fill: Rgba) {
		super();
		this.mathFontSize = fontSize;
		this._mathFont = mathFont;
		this._fill = fill;
		this._brace = new AtomContainer('{', mathFont, fontSize, fill);
		this.addChild(this._brace);
	}

	public setCases(cases: [MathContainer, MathContainer][]): void {
		// Remove all old cells.
		for (const [v, c] of this._cases) {
			this.removeChild(v);
			this.removeChild(c);
		}
		this._cases = cases;
		for (const [v, c] of cases) {
			this.addChild(v);
			this.addChild(c);
		}
	}

	public override layout(): void {
		const cases = this._cases;
		if (cases.length === 0) {
			this._width = 0;
			this._ascent = 0;
			this._descent = 0;
			return;
		}
		// Lay out each cell.
		let valW = 0;
		let condW = 0;
		const rowMetrics: {a: number; d: number}[] = [];
		for (const [v, c] of cases) {
			v.layout();
			c.layout();
			if (v.mathWidth > valW) valW = v.mathWidth;
			if (c.mathWidth > condW) condW = c.mathWidth;
			rowMetrics.push({
				a: Math.max(v.mathAscent, c.mathAscent),
				d: Math.max(v.mathDescent, c.mathDescent)
			});
		}
		const fontSize = this.mathFontSize;
		const colGap = MathRules.CasesColGapEm * fontSize;
		const rowGap = MathRules.MatrixRowGapEm * fontSize;
		const braceGap = MathRules.CasesBraceGapEm * fontSize;

		// Stack rows.
		let y = 0;
		const baselines: number[] = [];
		for (let i = 0; i < cases.length; i++) {
			y += rowMetrics[i].a;
			baselines.push(y);
			y += rowMetrics[i].d;
			if (i < cases.length - 1) y += rowGap;
		}
		const gridH = y;
		const gridCenter = gridH / 2;

		// Scale the brace to match grid height.
		const braceScale = Math.max(1, gridH / fontSize);
		this._brace.setFontSize(fontSize * braceScale);
		this._brace.layout();
		const bw = this._brace.mathWidth;

		// Place brace + cells, centered on the math axis.
		this._brace.x = 0;
		this._brace.y = 0;
		const startX = bw + braceGap;
		for (let i = 0; i < cases.length; i++) {
			const [v, c] = cases[i];
			v.x = startX;
			v.y = baselines[i] - gridCenter;
			c.x = startX + valW + colGap;
			c.y = baselines[i] - gridCenter;
		}
		this._width = startX + valW + colGap + condW;
		this._ascent = gridCenter;
		this._descent = gridCenter;

		// Suppress unused-var warning for unused fields.
		void this._mathFont;
		void this._fill;
	}
}

/**
 * `aligned` multi-line equation system. Anchors the `anchor`-th column
 * across every row at a shared x. Cells in column < anchor right-align
 * to that anchor; cells at and beyond left-align from it.
 */
export class AlignedContainer extends MathContainer {
	private _rows: MathContainer[][] = [];
	private _anchor: number;

	constructor(anchor: number) {
		super();
		this._anchor = anchor;
	}

	public setRows(rows: MathContainer[][]): void {
		for (const row of this._rows) for (const c of row) this.removeChild(c);
		this._rows = rows;
		for (const row of rows) for (const c of row) this.addChild(c);
	}

	public override layout(): void {
		const rows = this._rows;
		if (rows.length === 0) {
			this._width = 0;
			this._ascent = 0;
			this._descent = 0;
			return;
		}
		let maxLeft = 0;
		let maxRight = 0;
		const perRowLeft: number[] = [];
		for (const row of rows) {
			for (const c of row) c.layout();
			let left = 0;
			let right = 0;
			for (let c = 0; c < row.length; c++) {
				if (c < this._anchor) left += row[c].mathWidth;
				else right += row[c].mathWidth;
			}
			perRowLeft.push(left);
			if (left > maxLeft) maxLeft = left;
			if (right > maxRight) maxRight = right;
		}
		const fontSize = this.mathFontSize;
		const lineSpacing = MathRules.DefaultLineSpacing * fontSize;
		let y = 0;
		let ascent = 0;
		let descent = 0;
		for (let r = 0; r < rows.length; r++) {
			const row = rows[r];
			const rowA = Math.max(0, ...row.map((b) => b.mathAscent));
			const rowD = Math.max(0, ...row.map((b) => b.mathDescent));
			if (r === 0) ascent = rowA;
			let x = maxLeft - perRowLeft[r];
			for (const c of row) {
				c.x = x;
				c.y = y;
				x += c.mathWidth;
			}
			descent = y + rowD;
			if (r < rows.length - 1) y += lineSpacing;
		}
		this._width = maxLeft + maxRight;
		this._ascent = ascent;
		this._descent = descent;
	}
}

/** Tensor with aligned multi-column upper/lower indices. */
export class TensorContainer extends MathContainer {
	private _base: MathContainer | null = null;
	private _upper: MathContainer[] = [];
	private _lower: MathContainer[] = [];

	public setBase(c: MathContainer): void {
		if (this._base === c) return;
		if (this._base) this.removeChild(this._base);
		this._base = c;
		this.addChild(c);
	}
	public setIndices(upper: MathContainer[], lower: MathContainer[]): void {
		for (const c of this._upper) this.removeChild(c);
		for (const c of this._lower) this.removeChild(c);
		this._upper = upper;
		this._lower = lower;
		for (const c of upper) this.addChild(c);
		for (const c of lower) this.addChild(c);
	}

	public override layout(): void {
		const base = this._base;
		if (!base) {
			this._width = 0;
			this._ascent = 0;
			this._descent = 0;
			return;
		}
		base.layout();
		for (const c of this._upper) c.layout();
		for (const c of this._lower) c.layout();
		base.x = 0;
		base.y = 0;

		const fontSize = this.mathFontSize;
		const scriptX = base.mathWidth + fontSize * 0.05;
		const numCols = Math.max(this._upper.length, this._lower.length);
		const colW: number[] = new Array(numCols).fill(0);
		for (let c = 0; c < numCols; c++) {
			const up = this._upper[c];
			const lo = this._lower[c];
			if (up && up.mathWidth > colW[c]) colW[c] = up.mathWidth;
			if (lo && lo.mathWidth > colW[c]) colW[c] = lo.mathWidth;
		}
		const colGap = MathRules.OpThinSpaceEm * fontSize;
		let totalIdxW = colGap * Math.max(0, numCols - 1);
		for (const w of colW) totalIdxW += w;

		const supBaselineY = -base.mathAscent * 0.55;
		const subBaselineY = base.mathDescent + 0.25 * fontSize;
		let x = scriptX;
		let ascentExtra = 0;
		let descentExtra = 0;
		for (let c = 0; c < numCols; c++) {
			const up = this._upper[c];
			const lo = this._lower[c];
			if (up) {
				const dy = supBaselineY - up.mathDescent;
				up.x = x + (colW[c] - up.mathWidth) / 2;
				up.y = dy;
				if (-dy + up.mathAscent > ascentExtra) ascentExtra = -dy + up.mathAscent;
			}
			if (lo) {
				const dy = subBaselineY + lo.mathAscent;
				lo.x = x + (colW[c] - lo.mathWidth) / 2;
				lo.y = dy;
				if (dy + lo.mathDescent > descentExtra) descentExtra = dy + lo.mathDescent;
			}
			x += colW[c] + colGap;
		}

		this._width = scriptX + totalIdxW;
		this._ascent = Math.max(base.mathAscent, ascentExtra);
		this._descent = Math.max(base.mathDescent, descentExtra);
	}
}

/**
 * Prescript: scripts attached to the LEFT of a base. Same vertical
 * positions as ordinary sup/sub.
 */
export class PrescriptContainer extends MathContainer {
	private _base: MathContainer | null = null;
	private _sub: MathContainer | null = null;
	private _sup: MathContainer | null = null;

	public setBase(c: MathContainer): void {
		if (this._base === c) return;
		if (this._base) this.removeChild(this._base);
		this._base = c;
		this.addChild(c);
	}
	public setSub(c: MathContainer | null): void {
		if (this._sub === c) return;
		if (this._sub) this.removeChild(this._sub);
		this._sub = c;
		if (c) this.addChild(c);
	}
	public setSup(c: MathContainer | null): void {
		if (this._sup === c) return;
		if (this._sup) this.removeChild(this._sup);
		this._sup = c;
		if (c) this.addChild(c);
	}

	public override layout(): void {
		const base = this._base;
		if (!base) {
			this._width = 0;
			this._ascent = 0;
			this._descent = 0;
			return;
		}
		base.layout();
		const sup = this._sup;
		const sub = this._sub;
		if (sup) sup.layout();
		if (sub) sub.layout();
		const fontSize = this.mathFontSize;
		const scriptW = Math.max(sup?.mathWidth ?? 0, sub?.mathWidth ?? 0);
		const gap = fontSize * 0.05;
		let supY = 0;
		let subY = 0;
		if (sup) {
			supY = -base.mathAscent * 0.55 - sup.mathDescent;
			sup.x = scriptW - sup.mathWidth;
			sup.y = supY;
		}
		if (sub) {
			subY = base.mathDescent + 0.25 * fontSize + sub.mathAscent;
			sub.x = scriptW - sub.mathWidth;
			sub.y = subY;
		}
		base.x = scriptW + gap;
		base.y = 0;
		this._width = scriptW + gap + base.mathWidth;
		this._ascent = Math.max(base.mathAscent, sup ? -supY + sup.mathAscent : 0);
		this._descent = Math.max(base.mathDescent, sub ? subY + sub.mathDescent : 0);
	}
}

/**
 * Stacked subscript under a base — multi-line content rendered as a
 * tall subscript. Used for combinatorial sums where the index spans
 * multiple lines under a big-op.
 */
export class StackedSubContainer extends MathContainer {
	private _base: MathContainer | null = null;
	private _lines: MathContainer[] = [];

	public setBase(c: MathContainer): void {
		if (this._base === c) return;
		if (this._base) this.removeChild(this._base);
		this._base = c;
		this.addChild(c);
	}
	public setLines(lines: MathContainer[]): void {
		for (const l of this._lines) this.removeChild(l);
		this._lines = lines;
		for (const l of lines) this.addChild(l);
	}

	public override layout(): void {
		const base = this._base;
		if (!base) {
			this._width = 0;
			this._ascent = 0;
			this._descent = 0;
			return;
		}
		base.layout();
		base.x = 0;
		base.y = 0;
		for (const l of this._lines) l.layout();

		const fontSize = this.mathFontSize;
		const colW = Math.max(0, ...this._lines.map((l) => l.mathWidth));
		const lineSp = MathRules.StackedSubLineSpacingEm * fontSize;
		const subDx = (base.mathWidth - colW) / 2;
		let y = base.mathDescent + 0.2 * fontSize + (this._lines[0]?.mathAscent ?? 0);
		let descent = base.mathDescent;
		for (let i = 0; i < this._lines.length; i++) {
			const l = this._lines[i];
			l.x = subDx + (colW - l.mathWidth) / 2;
			l.y = y;
			descent = y + l.mathDescent;
			if (i < this._lines.length - 1) y += lineSp;
		}
		this._width = Math.max(base.mathWidth, colW);
		this._ascent = base.mathAscent;
		this._descent = descent;
	}
}

/**
 * Prime / multi-prime: a `′` × count atom rendered as a superscript on
 * the base. Distinct from a normal sup because the prime glyph sits
 * with its OWN baseline aligned to the script-top, not the script-baseline.
 */
export class PrimeContainer extends MathContainer {
	private _base: MathContainer | null = null;
	private _primes: AtomContainer;

	constructor(count: number, mathFont: SlugFont, fontSize: number, fill: Rgba) {
		super();
		this.mathFontSize = fontSize;
		const text = '′'.repeat(Math.max(1, count));
		this._primes = new AtomContainer(text, mathFont, fontSize * MathSizes.Prime, fill);
		this.addChild(this._primes);
	}

	public setBase(c: MathContainer): void {
		if (this._base === c) return;
		if (this._base) this.removeChild(this._base);
		this._base = c;
		this.addChild(c);
	}

	public override layout(): void {
		const base = this._base;
		if (!base) {
			this._width = 0;
			this._ascent = 0;
			this._descent = 0;
			return;
		}
		base.layout();
		this._primes.layout();
		base.x = 0;
		base.y = 0;
		const dy = -base.mathAscent * 0.55 - this._primes.mathDescent;
		this._primes.x = base.mathWidth;
		this._primes.y = dy;
		this._width = base.mathWidth + this._primes.mathWidth;
		this._ascent = Math.max(base.mathAscent, -dy + this._primes.mathAscent);
		this._descent = base.mathDescent;
	}
}

/** Fixed horizontal whitespace; no children, no decorations. */
export class SpaceContainer extends MathContainer {
	constructor(emWidth: number, fontSize: number) {
		super();
		this.mathFontSize = fontSize;
		this._width = emWidth * fontSize;
		// ascent/descent stay 0; a space has no vertical extent.
	}

	public override layout(): void {
		// width is set in constructor; nothing else to position.
	}
}

/**
 * `lim` notation: the word `lim` over a target expression like `x→a`,
 * with a body to the right. Implemented as a column for the lim+target
 * stack, then a row with the body. Compiler builds this via the
 * primitives rather than a dedicated container; this thin wrapper is
 * here so the compiler dispatch table can name it explicitly.
 */
export {RowContainer as LimContainer};
