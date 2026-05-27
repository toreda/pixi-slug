import type {Rgba} from '../../../../rgba';
import type {SlugFont} from '../../../../shared/slug/font';
import {MathRules} from '../../../../shared/slug/math/layout/sizes';
import {AtomContainer} from './atom';
import {MathContainer} from './base';

/**
 * Auto-scaling fence: `(...)`, `[...]`, `{...}`, `|...|`, `⟨...⟩`,
 * `⌊...⌋`, `⌈...⌉`, and the separator-fence forms (bra-ket, set-builder)
 * that take multiple children with a separator glyph between.
 *
 * The fence glyph SlugTexts are sized so their natural height brackets
 * the inner content's total vertical extent. We don't use the
 * OpenType MATH table's stretchy variants in v1 — just scale the glyph
 * via fontSize. Good enough for most reasonable sizes.
 */
export class FenceContainer extends MathContainer {
	private _left: AtomContainer | null = null;
	private _right: AtomContainer | null = null;
	private _separators: AtomContainer[] = [];
	private _inner: MathContainer[] = [];
	private _leftChar: string;
	private _rightChar: string;
	private _separatorChar: string;
	private _mathFont: SlugFont;
	private _fill: Rgba;

	constructor(
		left: string,
		right: string,
		separator: string,
		mathFont: SlugFont,
		fontSize: number,
		fill: Rgba
	) {
		super();
		this.mathFontSize = fontSize;
		this._leftChar = left;
		this._rightChar = right;
		this._separatorChar = separator;
		this._mathFont = mathFont;
		this._fill = fill;
	}

	/**
	 * Set inner content. For separator-fences (bra-ket, set-builder)
	 * pass multiple containers; the fence draws the separator glyph
	 * between adjacent pairs. For ordinary fences pass a single
	 * container.
	 */
	public setInner(items: MathContainer[]): void {
		// Remove old inner + separators.
		for (const c of this._inner) this.removeChild(c);
		for (const s of this._separators) this.removeChild(s);
		this._inner = items;
		this._separators = [];
		for (const c of items) this.addChild(c);
		// One separator per gap.
		if (this._separatorChar && items.length > 1) {
			for (let i = 0; i < items.length - 1; i++) {
				const sep = new AtomContainer(
					this._separatorChar,
					this._mathFont,
					this.mathFontSize,
					this._fill
				);
				this._separators.push(sep);
				this.addChild(sep);
			}
		}
	}

	public override layout(): void {
		// Layout the inner row first (children + separators interleaved).
		const items = this._inner;
		if (items.length === 0) {
			this._width = 0;
			this._ascent = 0;
			this._descent = 0;
			return;
		}
		for (const c of items) c.layout();
		for (const s of this._separators) s.layout();

		const sepGap = MathRules.OpThinSpaceEm * this.mathFontSize;
		let innerWidth = 0;
		let innerAscent = 0;
		let innerDescent = 0;
		for (let i = 0; i < items.length; i++) {
			innerWidth += items[i].mathWidth;
			if (items[i].mathAscent > innerAscent) innerAscent = items[i].mathAscent;
			if (items[i].mathDescent > innerDescent) innerDescent = items[i].mathDescent;
			if (i < items.length - 1) {
				const sep = this._separators[i];
				innerWidth += sepGap + sep.mathWidth + sepGap;
				if (sep.mathAscent > innerAscent) innerAscent = sep.mathAscent;
				if (sep.mathDescent > innerDescent) innerDescent = sep.mathDescent;
			}
		}

		// Scale fence glyphs to bracket the inner total height.
		const fontSize = this.mathFontSize;
		const innerHeight = innerAscent + innerDescent;
		const fenceScale = Math.max(1, innerHeight / fontSize);
		const fenceFontSize = fontSize * fenceScale;
		const pad = MathRules.FencePadEm * fontSize;

		// (Re)create left / right glyphs at the scaled size. We rebuild
		// these each layout because the scale can change as inner
		// content changes; the AtomContainer's setFontSize handles the
		// resize without reallocating the SlugText.
		if (this._leftChar && !this._left) {
			this._left = new AtomContainer(
				this._leftChar,
				this._mathFont,
				fenceFontSize,
				this._fill
			);
			this.addChild(this._left);
		} else if (this._left) {
			this._left.setFontSize(fenceFontSize);
		}
		if (this._rightChar && !this._right) {
			this._right = new AtomContainer(
				this._rightChar,
				this._mathFont,
				fenceFontSize,
				this._fill
			);
			this.addChild(this._right);
		} else if (this._right) {
			this._right.setFontSize(fenceFontSize);
		}
		if (this._left) this._left.layout();
		if (this._right) this._right.layout();

		// Place: [left] [pad] [inner row interleaved with separators] [pad] [right]
		let x = 0;
		if (this._left) {
			this._left.x = x;
			this._left.y = 0;
			x += this._left.mathWidth + pad;
		}
		for (let i = 0; i < items.length; i++) {
			items[i].x = x;
			items[i].y = 0;
			x += items[i].mathWidth;
			if (i < items.length - 1) {
				const sep = this._separators[i];
				x += sepGap;
				sep.x = x;
				sep.y = 0;
				x += sep.mathWidth + sepGap;
			}
		}
		if (this._right) {
			x += pad;
			this._right.x = x;
			this._right.y = 0;
			x += this._right.mathWidth;
		}

		this._width = x;
		this._ascent = Math.max(innerAscent, this._left?.mathAscent ?? 0, this._right?.mathAscent ?? 0);
		this._descent = Math.max(innerDescent, this._left?.mathDescent ?? 0, this._right?.mathDescent ?? 0);
	}
}
