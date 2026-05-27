import type {Rgba} from '../../../../rgba';
import type {SlugFont} from '../../../../shared/slug/font';
import {MathRules, MathSizes} from '../../../../shared/slug/math/layout/sizes';
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
			fontSize * MathSizes.BigOpSymbol,
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
		const limitGap = MathRules.BigOpLimitGapEm * fontSize;
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
			// Stacked: center the symbol, upper limit, and lower limit at
			// a shared x. Limits sit above/below the symbol.
			const symW = this._symbol.mathWidth;
			const upW = upper ? upper.mathWidth : 0;
			const loW = lower ? lower.mathWidth : 0;
			const stackW = Math.max(symW, upW, loW);

			this._symbol.x = (stackW - symW) / 2;
			this._symbol.y = 0;

			let topY = -this._symbol.mathAscent;
			let bottomY = this._symbol.mathDescent;
			if (upper) {
				const upBaseline = -this._symbol.mathAscent - limitGap - upper.mathDescent;
				upper.x = (stackW - upW) / 2;
				upper.y = upBaseline;
				topY = upBaseline - upper.mathAscent;
			}
			if (lower) {
				const loBaseline = this._symbol.mathDescent + limitGap + lower.mathAscent;
				lower.x = (stackW - loW) / 2;
				lower.y = loBaseline;
				bottomY = loBaseline + lower.mathDescent;
			}
			opGroupWidth = stackW;
			opGroupAscent = -topY;
			opGroupDescent = bottomY;
		}

		// Body sits to the right of the op group, baseline-aligned.
		if (body) {
			body.x = opGroupWidth + bodyGap;
			body.y = 0;
		}

		const bodyWidth = body ? body.mathWidth : 0;
		this._width = opGroupWidth + (body ? bodyGap + bodyWidth : 0);
		this._ascent = Math.max(opGroupAscent, body ? body.mathAscent : 0);
		this._descent = Math.max(opGroupDescent, body ? body.mathDescent : 0);
	}
}
