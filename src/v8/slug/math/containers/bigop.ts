import type {Rgba} from '../../../../rgba';
import type {SlugFont} from '../../../../shared/slug/font';
import {MathRules} from '../../../../shared/slug/math/layout/sizes';
import {AtomContainer} from './atom';
import {MathContainer} from './base';

/**
 * Big-operator (∑ ∏ ∫ ⋃ …) with optional limits and a body to the
 * right of the operator. Two layout modes:
 *   - Stacked (default, e.g. ∑): limits sit above and below the
 *     operator symbol.
 *   - Side-set (typically ∫): limits attach as sup/sub to the right
 *     of the operator symbol.
 *
 * Owned children:
 *   - one AtomContainer for the operator glyph (sized to `BigOpSymbol *
 *     fontSize`).
 *   - slots for `lower` / `upper` / `body` (set externally).
 */
export class BigOpContainer extends MathContainer {
	private _symbol: AtomContainer;
	private _lower: MathContainer | null = null;
	private _upper: MathContainer | null = null;
	private _body: MathContainer | null = null;
	private _integralStyle: boolean;

	/**
	 * Per-slot scale factors. Each slot's font size is the root
	 * `mathFontSize * <slot>Scale`. Setting one of these re-compiles
	 * the affected slot subtree at the new scale via the compiler-
	 * attached `_recompileSlot` hook, then re-runs layout. Inline
	 * literal defaults — tune per-instance after construction.
	 */
	private _upperScale: number = 0.75;
	private _lowerScale: number = 0.75;
	private _bodyScale: number = 1.0;
	/** Operator-glyph scale (∑ ∏ ∫ at this multiple of root size). */
	private _symbolScale: number = 1.8;
	/**
	 * Symmetric vertical margin between the operator glyph and each
	 * stacked limit, expressed in em (multiplied by `mathFontSize` at
	 * layout time). Applied identically above the symbol (gap to upper
	 * limit) and below (gap to lower limit). Tune per-instance to taste.
	 */
	public limitMarginEm: number = 0.15;

	public get upperScale(): number { return this._upperScale; }
	public set upperScale(v: number) {
		if (v === this._upperScale) return;
		this._upperScale = v;
		this._recompileSlot?.('upper');
	}
	public get lowerScale(): number { return this._lowerScale; }
	public set lowerScale(v: number) {
		if (v === this._lowerScale) return;
		this._lowerScale = v;
		this._recompileSlot?.('lower');
	}
	public get bodyScale(): number { return this._bodyScale; }
	public set bodyScale(v: number) {
		if (v === this._bodyScale) return;
		this._bodyScale = v;
		this._recompileSlot?.('body');
	}
	public get symbolScale(): number { return this._symbolScale; }
	public set symbolScale(v: number) {
		if (v === this._symbolScale) return;
		this._symbolScale = v;
		this._symbol.setFontSize(this.mathFontSize * v);
		this.layout();
	}

	constructor(
		symbol: string,
		mathFont: SlugFont,
		fontSize: number,
		fill: Rgba,
		integralStyle: boolean
	) {
		super();
		this.mathFontSize = fontSize;
		this._integralStyle = integralStyle;
		this._symbol = new AtomContainer(
			symbol,
			mathFont,
			fontSize * this._symbolScale,
			fill
		);
		this.addChild(this._symbol);
	}

	public setLower(c: MathContainer | null): void {
		if (this._lower === c) return;
		if (this._lower) this.removeChild(this._lower);
		this._lower = c;
		if (c) this.addChild(c);
	}

	public setUpper(c: MathContainer | null): void {
		if (this._upper === c) return;
		if (this._upper) this.removeChild(this._upper);
		this._upper = c;
		if (c) this.addChild(c);
	}

	public setBody(c: MathContainer): void {
		if (this._body === c) return;
		if (this._body) this.removeChild(this._body);
		this._body = c;
		this.addChild(c);
	}

	public override layout(): void {
		this._symbol.layout();
		const lower = this._lower;
		const upper = this._upper;
		const body = this._body;

		if (lower) lower.layout();
		if (upper) upper.layout();
		if (body) body.layout();

		const fontSize = this.mathFontSize;
		const limitGap = this.limitMarginEm * fontSize;
		const bodyGap = MathRules.BigOpBodyGapEm * fontSize;

		let opGroupWidth: number;
		let opGroupAscent: number;
		let opGroupDescent: number;

		if (this._integralStyle) {
			// Side-set: place limits to the right of the symbol at script
			// positions, same way SubsupContainer does it.
			this._symbol.x = 0;
			this._symbol.y = 0;
			const scriptX = this._symbol.mathWidth + fontSize * 0.05;
			let supBaselineY = 0;
			let subBaselineY = 0;
			if (upper) {
				supBaselineY = -this._symbol.mathAscent * 0.55 - upper.mathDescent;
				upper.x = scriptX;
				upper.y = supBaselineY;
			}
			if (lower) {
				subBaselineY =
					this._symbol.mathDescent + 0.25 * fontSize + lower.mathAscent;
				lower.x = scriptX;
				lower.y = subBaselineY;
			}
			const scriptW = Math.max(upper ? upper.mathWidth : 0, lower ? lower.mathWidth : 0);
			opGroupWidth = scriptX + scriptW;
			opGroupAscent = Math.max(
				this._symbol.mathAscent,
				upper ? -supBaselineY + upper.mathAscent : 0
			);
			opGroupDescent = Math.max(
				this._symbol.mathDescent,
				lower ? subBaselineY + lower.mathDescent : 0
			);
		} else {
			// Stacked: limits center on the SYMBOL's optical x-center, not
			// on the bbox of the symbol+limits stack. Using the stack
			// midpoint would shift the symbol leftward when a wide
			// subscript appears; centering on the symbol keeps the operator
			// glyph anchored and lets the limits overhang freely.
			const symW = this._symbol.mathWidth;
			const upW = upper ? upper.mathWidth : 0;
			const loW = lower ? lower.mathWidth : 0;

			// Shift the whole stack right by however far the widest limit
			// overhangs the symbol on the left, so the container's local
			// x=0 stays at the leftmost visible content.
			const halfOverhang = Math.max(0, (upW - symW) / 2, (loW - symW) / 2);
			const symbolX = halfOverhang;
			const symbolCenterX = symbolX + symW / 2;

			this._symbol.x = symbolX;
			this._symbol.y = 0;

			let topY = -this._symbol.mathAscent;
			let bottomY = this._symbol.mathDescent;
			if (upper) {
				const upBaseline = -this._symbol.mathAscent - limitGap - upper.mathDescent;
				upper.x = symbolCenterX - upW / 2;
				upper.y = upBaseline;
				topY = upBaseline - upper.mathAscent;
			}
			if (lower) {
				const loBaseline = this._symbol.mathDescent + limitGap + lower.mathAscent;
				lower.x = symbolCenterX - loW / 2;
				lower.y = loBaseline;
				bottomY = loBaseline + lower.mathDescent;
			}
			opGroupWidth = Math.max(symbolX + symW, upper ? upper.x + upW : 0, lower ? lower.x + loW : 0);
			opGroupAscent = -topY;
			opGroupDescent = bottomY;
		}

		// Body sits to the right of the op group. In stacked mode, center
		// the body's vertical midline on the SYMBOL's vertical midline so
		// the body floats opposite the operator's optical center rather
		// than dangling off its baseline.
		if (body) {
			body.x = opGroupWidth + bodyGap;
			if (this._integralStyle) {
				body.y = 0;
			} else {
				const symMidY = (-this._symbol.mathAscent + this._symbol.mathDescent) / 2;
				const bodyMidY = (-body.mathAscent + body.mathDescent) / 2;
				body.y = symMidY - bodyMidY;
			}
		}

		const bodyWidth = body ? body.mathWidth : 0;
		this._width = opGroupWidth + (body ? bodyGap + bodyWidth : 0);
		this._ascent = Math.max(opGroupAscent, body ? -body.y + body.mathAscent : 0);
		this._descent = Math.max(opGroupDescent, body ? body.y + body.mathDescent : 0);
	}
}
