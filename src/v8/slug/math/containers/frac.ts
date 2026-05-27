import {Graphics} from 'pixi.js';
import type {Rgba} from '../../../../rgba';
import {MathRules} from '../../../../shared/slug/math/layout/sizes';
import {MathContainer} from './base';

/**
 * Fraction: numerator stacked over denominator with a horizontal rule
 * between. The rule is drawn at this container's local math-axis y;
 * numerator sits above, denominator below, both horizontally centered
 * inside the rule's width.
 *
 * Each slot is its own opaque `MathContainer`. The fraction reads only
 * the slot's `mathWidth` / `mathAscent` / `mathDescent` — never reaches
 * into the slot's children. That means a numerator like `x_i` reports
 * a descent that includes the subscript's drop, and the layout below
 * uses that to position the slot AS A WHOLE (not the rule) — keeping
 * the rule tight to the visual centers rather than the script extents.
 *
 * Implementation note: we use the slot's REPORTED ascent/descent for
 * positioning rather than the font's natural metrics. The result is
 * that `x_i` over `n` produces a rule placed at the math axis with the
 * subscript `i` floating to the right of `x`, AND the whole `x_i` is
 * positioned so the `x` baseline sits at the expected numerator height.
 * The earlier flat-placement layout got this wrong because it tried to
 * use raw font metrics from a non-existent shared baseline; the slot
 * model gets it right because each slot computes its own metrics from
 * its own contents.
 */
export class FractionContainer extends MathContainer {
	private _numerator: MathContainer | null = null;
	private _denominator: MathContainer | null = null;
	private _rule: Graphics;
	private _fill: Rgba;

	constructor(fill: Rgba) {
		super();
		this._fill = fill;
		this._rule = new Graphics();
		this.addChild(this._rule);
	}

	public setNumerator(c: MathContainer): void {
		if (this._numerator === c) return;
		if (this._numerator) this.removeChild(this._numerator);
		this._numerator = c;
		this.addChild(c);
	}

	public setDenominator(c: MathContainer): void {
		if (this._denominator === c) return;
		if (this._denominator) this.removeChild(this._denominator);
		this._denominator = c;
		this.addChild(c);
	}

	public setFill(fill: Rgba): void {
		this._fill = fill;
	}

	public override layout(): void {
		const num = this._numerator;
		const den = this._denominator;
		if (!num || !den) {
			this._width = 0;
			this._ascent = 0;
			this._descent = 0;
			this._rule.clear();
			return;
		}
		num.layout();
		den.layout();

		const fontSize = this.mathFontSize;
		const pad = MathRules.FracRulePadEm * fontSize;
		const gap = MathRules.FracGapEm * fontSize;
		const ruleThickness = MathRules.FracRuleEm * fontSize;
		const ruleWidth = Math.max(num.mathWidth, den.mathWidth) + 2 * pad;

		// Math axis: the rule's y-position. Conventionally ~0.3 em above
		// the baseline of the surrounding text — same height as the
		// horizontal stroke of a `+` or `=`.
		const axisY = -fontSize * 0.3;

		// Numerator baseline: positioned so the numerator's BOTTOM
		// (baseline + descent) sits `gap` above the rule. Same logic
		// for the denominator's top in reverse. Using the slot's full
		// reported descent/ascent means a numerator like `x_i` (whose
		// subscript drops below `x`'s baseline) will see the subscript
		// drop INTO the gap region rather than pushing the whole
		// numerator upward — that's the bug the rule-based layout had.
		const numBaselineY = axisY - gap - ruleThickness / 2 - num.mathDescent;
		const denBaselineY = axisY + gap + ruleThickness / 2 + den.mathAscent;

		// Center numerator / denominator horizontally inside the rule.
		num.x = (ruleWidth - num.mathWidth) / 2;
		num.y = numBaselineY;
		den.x = (ruleWidth - den.mathWidth) / 2;
		den.y = denBaselineY;

		// Draw the rule as a filled rect (PIXI v8 Graphics needs an
		// explicit fill or stroke call; rect+fill avoids needing a
		// stroke width override).
		this._rule.clear();
		const color = rgbaToHex(this._fill);
		const alpha = this._fill[3];
		this._rule
			.rect(0, axisY - ruleThickness / 2, ruleWidth, ruleThickness)
			.fill({color, alpha});

		this._width = ruleWidth;
		this._ascent = -numBaselineY + num.mathAscent;
		this._descent = denBaselineY + den.mathDescent;
	}
}

function rgbaToHex(rgba: Rgba): number {
	const r = Math.max(0, Math.min(255, Math.round(rgba[0] * 255)));
	const g = Math.max(0, Math.min(255, Math.round(rgba[1] * 255)));
	const b = Math.max(0, Math.min(255, Math.round(rgba[2] * 255)));
	return (r << 16) | (g << 8) | b;
}
