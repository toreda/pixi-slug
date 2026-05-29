import {Graphics} from 'pixi.js';
import type {Rgba} from '../../../../rgba';
import type {SlugFont} from '../../../../shared/slug/font';
import {MathRules} from '../../../../shared/slug/math/layout/sizes';
import {AtomContainer} from './atom';
import {MathContainer} from './base';

/**
 * Square root / n-th root:
 *   - `radicand` slot: the expression under the radical.
 *   - optional `index` slot: the small n in `ⁿ√x`.
 *   - Owned glyphs: a `√` SlugText for the hook, scaled to the
 *     radicand's height.
 *   - Owned `Graphics` for the vinculum (horizontal bar over the
 *     radicand).
 *
 * The radicand sits in its own coord space. The hook is positioned to
 * its left, scaled so its height brackets the radicand. The vinculum
 * starts at the radicand's left edge and extends to its right.
 */
export class SqrtContainer extends MathContainer {
	private _radicand: MathContainer | null = null;
	private _index: MathContainer | null = null;
	private _hook: AtomContainer;
	private _vinculum: Graphics;
	private _fill: Rgba;
	private _mathFont: SlugFont;

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
		this._hook = new AtomContainer('√', mathFont, fontSize, fill);
		this._vinculum = new Graphics();
		this.addChild(this._hook);
		this.addChild(this._vinculum);
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

	public override layout(): void {
		const rad = this._radicand;
		if (!rad) {
			this._width = 0;
			this._ascent = 0;
			this._descent = 0;
			this._vinculum.clear();
			return;
		}
		rad.layout();

		const fontSize = this.mathFontSize;
		const pad = MathRules.FencePadEm * fontSize;
		const ruleThickness = MathRules.SqrtRuleEm * fontSize;

		// Scale the hook to bracket the radicand. The hook glyph at its
		// natural fontSize spans the font's full vertical metric; scale
		// it up so its height matches `radAscent + radDescent`.
		const radTotal = rad.mathAscent + rad.mathDescent;
		const hookScale = Math.max(1, radTotal / fontSize);
		this._hook.setFontSize(fontSize * hookScale);
		this._hook.layout();

		// Optional index hangs above the hook's notch.
		const idx = this._index;
		let indexOffsetX = 0;
		if (idx) {
			idx.layout();
			indexOffsetX = Math.max(0, idx.mathWidth - this._hook.mathWidth * 0.4);
		}

		const hookX = indexOffsetX;
		const radX = hookX + this._hook.mathWidth + pad;

		this._hook.x = hookX;
		this._hook.y = 0;

		// Radicand sits with its baseline at this container's baseline.
		rad.x = radX;
		rad.y = 0;

		// Vinculum: horizontal bar at the top of the radicand, extending
		// from radicand's left edge to its right edge.
		const vY = -rad.mathAscent - ruleThickness * 0.5;
		this._vinculum.clear();
		const color = rgbaToHex(this._fill);
		const alpha = this._fill[3];
		this._vinculum
			.rect(radX, vY - ruleThickness / 2, rad.mathWidth + pad, ruleThickness)
			.fill({color, alpha});

		// Position index above-left if present.
		if (idx) {
			idx.x = 0;
			idx.y = -rad.mathAscent + idx.mathDescent * 0.5;
		}

		this._width = radX + rad.mathWidth + pad;
		this._ascent =
			rad.mathAscent + ruleThickness + (idx ? idx.mathAscent + idx.mathDescent : 0);
		this._descent = rad.mathDescent;

		// Suppress unused-var warning: mathFont retained for later (e.g.
		// detecting whether the font has a √ glyph and falling back to a
		// pure-graphics radical hook if not).
		void this._mathFont;
	}
}

function rgbaToHex(rgba: Rgba): number {
	const r = Math.max(0, Math.min(255, Math.round(rgba[0] * 255)));
	const g = Math.max(0, Math.min(255, Math.round(rgba[1] * 255)));
	const b = Math.max(0, Math.min(255, Math.round(rgba[2] * 255)));
	return (r << 16) | (g << 8) | b;
}
