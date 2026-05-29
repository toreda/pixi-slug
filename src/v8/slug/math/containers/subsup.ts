import {MathContainer} from './base';

/**
 * Sub / sup / subsup: a `base` container plus optional `sub` and `sup`
 * containers attached at its top-right and bottom-right. The base
 * occupies the full container width up to its right edge; scripts hang
 * to the right beyond that.
 *
 * Script vertical placement uses the base's own ascent/descent so the
 * positioning is consistent whether the base is a single letter or a
 * tall composite like a fenced expression.
 */
export class SubsupContainer extends MathContainer {
	private _base: MathContainer | null = null;
	private _sub: MathContainer | null = null;
	private _sup: MathContainer | null = null;

	private _baseScale: number = 1.0;
	private _subScale: number = 0.7;
	private _supScale: number = 0.7;
	public get baseScale(): number { return this._baseScale; }
	public set baseScale(v: number) {
		if (v === this._baseScale) return;
		this._baseScale = v;
		this._recompileSlot?.('base');
	}
	public get subScale(): number { return this._subScale; }
	public set subScale(v: number) {
		if (v === this._subScale) return;
		this._subScale = v;
		this._recompileSlot?.('sub');
	}
	public get supScale(): number { return this._supScale; }
	public set supScale(v: number) {
		if (v === this._supScale) return;
		this._supScale = v;
		this._recompileSlot?.('sup');
	}

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
		base.x = 0;
		base.y = 0;

		const sub = this._sub;
		const sup = this._sup;
		if (sub) sub.layout();
		if (sup) sup.layout();

		const fontSize = this.mathFontSize;
		const scriptGap = fontSize * 0.05; // small horizontal pad after base
		const scriptX = base.mathWidth + scriptGap;

		// Vertical positions of script baselines, relative to the base's
		// baseline (y=0). Standard convention: sup baseline ~ 0.55 * base
		// ascent above; sub baseline ~ base descent + ~0.25 em below.
		let supBaselineY = 0;
		let subBaselineY = 0;
		if (sup) {
			supBaselineY = -base.mathAscent * 0.55 - sup.mathDescent;
			sup.x = scriptX;
			sup.y = supBaselineY;
		}
		if (sub) {
			subBaselineY = base.mathDescent + 0.25 * fontSize + sub.mathAscent;
			sub.x = scriptX;
			sub.y = subBaselineY;
		}

		const scriptWidth = Math.max(sup ? sup.mathWidth : 0, sub ? sub.mathWidth : 0);
		this._width = scriptX + scriptWidth;
		this._ascent = Math.max(
			base.mathAscent,
			sup ? -supBaselineY + sup.mathAscent : 0
		);
		this._descent = Math.max(
			base.mathDescent,
			sub ? subBaselineY + sub.mathDescent : 0
		);
	}
}
