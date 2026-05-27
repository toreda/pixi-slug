import {Container, Rectangle} from 'pixi.js';
import type {Rgba} from '../../rgba';
import type {SlugFont} from '../../shared/slug/font';
import {SlugFonts} from '../../shared/slug/fonts';
import {slugResolveFontInput, slugTryResolveFontInputSync} from '../../shared/slug/fonts/resolve';
import type {SlugFontErrorPolicy} from '../../shared/slug/font/error/policy';
import {Defaults} from '../../defaults';
import {
	mathBuilder,
	mathFontFallback,
	type MathBuilder,
	type MathNode,
	type MathTextInit
} from '../../shared/slug/math';
import {compileNode, type CompileCtx} from './math/containers/compile';
import {MathContainer} from './math/containers/base';
import {RowContainer} from './math/containers/row';
import {ColumnContainer} from './math/containers/misc';
import {MathRules} from '../../shared/slug/math/layout/sizes';

const DEFAULT_MATH_FONT_SIZE = 24;
const DEFAULT_LINE_SPACING = 1.2;

/**
 * Math-formula renderer. Hosts a single root `MathContainer` (the
 * compiled form of the user's `MathNode` tree). The container's nested
 * children handle their own layout in their own coordinate spaces;
 * `MathText` only positions the root and reads its overall bbox.
 *
 * Multi-line formulas (`formula: MathNode[]`) compile to a
 * `ColumnContainer` wrapping per-line root containers. Single-line
 * formulas (`formula: MathNode`) compile to a single root.
 *
 * `setFormula` discards the previous root container and compiles a
 * fresh tree. Container re-use across `setFormula` calls is a v1
 * follow-up — the cost today is one full compile per mutation, which
 * is fast enough for interactive editing but not optimal for animation
 * that mutates the formula every frame.
 */
export class MathText extends Container {
	private _formula: MathNode | MathNode[];
	private _bodyFont: SlugFont | null;
	private _mathFont: SlugFont | null;
	private _fontSize: number;
	private _fill: Rgba;
	private _align: 'left' | 'center' | 'right' | 'equals';
	private _lineSpacing: number;
	private _root: MathContainer | null;

	constructor(init: MathTextInit) {
		super();
		this._formula = init.formula;
		this._fontSize = typeof init.fontSize === 'number' ? init.fontSize : DEFAULT_MATH_FONT_SIZE;
		this._fill =
			(init.options?.fill as Rgba | undefined) ?? ([...Defaults.SlugText.FillColor] as Rgba);
		this._align = init.align ?? 'left';
		this._lineSpacing = typeof init.lineSpacing === 'number' ? init.lineSpacing : DEFAULT_LINE_SPACING;
		this._root = null;
		this._bodyFont = null;
		this._mathFont = null;

		this.eventMode = 'none';
		this.interactiveChildren = false;

		this._resolveFonts(init);
	}

	private _resolveFonts(init: MathTextInit): void {
		const policy: SlugFontErrorPolicy = {
			...Defaults.SlugText.ErrorPolicy,
			...(init.errorPolicy ?? {})
		};

		const bodyInput = init.font ?? null;
		const bodySync = bodyInput ? slugTryResolveFontInputSync(bodyInput) : null;
		if (bodySync) {
			this._bodyFont = bodySync;
		} else {
			this._bodyFont = SlugFonts.fallback();
			if (bodyInput) {
				void slugResolveFontInput(bodyInput, policy).then((resolved: SlugFont | null) => {
					if (resolved && this._bodyFont !== resolved) {
						this._bodyFont = resolved;
						this.rebuild();
					}
				});
			}
		}

		const mathInput = init.mathFont ?? null;
		const mathSync = mathInput ? slugTryResolveFontInputSync(mathInput) : null;
		if (mathSync) {
			this._mathFont = mathSync;
		} else {
			this._mathFont = mathFontFallback() ?? SlugFonts.fallback();
			if (mathInput) {
				void slugResolveFontInput(mathInput, policy).then((resolved: SlugFont | null) => {
					if (resolved && this._mathFont !== resolved) {
						this._mathFont = resolved;
						this.rebuild();
					}
				});
			}
		}

		this.rebuild();
	}

	// --- Public API -----------------------------------------------------

	public static build(fn: (m: MathBuilder) => MathNode | MathNode[]): MathNode | MathNode[] {
		return fn(mathBuilder);
	}

	public get formula(): MathNode | MathNode[] {
		return this._formula;
	}
	public set formula(value: MathNode | MathNode[]) {
		this._formula = value;
		this.rebuild();
	}
	public setFormula(value: MathNode | MathNode[]): void {
		this._formula = value;
		this.rebuild();
	}

	public get fontSize(): number {
		return this._fontSize;
	}
	public set fontSize(v: number) {
		if (v === this._fontSize) return;
		this._fontSize = v;
		this.rebuild();
	}

	public get fill(): Rgba {
		return this._fill;
	}
	public set fill(v: Rgba) {
		this._fill = v;
		this.rebuild();
	}

	public get align(): 'left' | 'center' | 'right' | 'equals' {
		return this._align;
	}
	public set align(v: 'left' | 'center' | 'right' | 'equals') {
		if (v === this._align) return;
		this._align = v;
		this.rebuild();
	}

	public get lineSpacing(): number {
		return this._lineSpacing;
	}
	public set lineSpacing(v: number) {
		if (v === this._lineSpacing) return;
		this._lineSpacing = v;
		this.rebuild();
	}

	public get bbox(): Rectangle {
		if (!this._root) return new Rectangle(0, 0, 0, 0);
		return new Rectangle(
			0,
			-this._root.mathAscent,
			this._root.mathWidth,
			this._root.mathAscent + this._root.mathDescent
		);
	}

	/**
	 * Discard the previous root container and compile a fresh one from
	 * the current formula. Multi-line formulas (`formula: MathNode[]`)
	 * become a `ColumnContainer` of per-line roots; single-line formulas
	 * become a single root.
	 */
	public rebuild(): void {
		if (this.destroyed) return;
		if (!this._bodyFont || !this._mathFont) return;

		if (this._root && !this._root.destroyed) {
			this.removeChild(this._root);
			this._root.destroy({children: true});
		}

		const ctx: CompileCtx = {
			bodyFont: this._bodyFont,
			mathFont: this._mathFont,
			fontSize: this._fontSize,
			fill: this._fill,
			depth: 0
		};

		const lines = Array.isArray(this._formula) ? this._formula : [this._formula];
		let root: MathContainer;
		if (lines.length === 1) {
			root = compileNode(lines[0], ctx);
		} else {
			const col = new ColumnContainer();
			col.mathFontSize = this._fontSize;
			const children = lines.map((line) => {
				// Wrap each line in a Row so multi-line alignment can
				// apply per-row horizontal shifts later.
				const r = new RowContainer();
				r.mathFontSize = this._fontSize;
				r.setItems([compileNode(line, ctx)]);
				return r;
			});
			col.setItems(children);
			root = col;
			void this._align;
			void MathRules;
		}

		this._root = root;
		this.addChild(root);
		root.layout();
		// Shift the root so its top-left aligns to (0, 0) in MathText
		// local space — callers usually want the formula to start at the
		// MathText's position, not have negative-y content extending
		// above it.
		root.y = root.mathAscent;
		root.x = 0;
	}

	public destroy(options?: Parameters<Container['destroy']>[0]): void {
		if (this._root && !this._root.destroyed) {
			this._root.destroy({children: true});
			this._root = null;
		}
		super.destroy(options);
	}
}
