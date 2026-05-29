import {Container, Rectangle} from 'pixi.js';
import type {Rgba} from '../../rgba';
import type {SlugFont} from '../../shared/slug/font';
import {SlugFonts} from '../../shared/slug/fonts';
import {slugResolveFontInput, slugTryResolveFontInputSync} from '../../shared/slug/fonts/resolve';
import type {SlugFontErrorPolicy} from '../../shared/slug/font/error/policy';
import type {SlugTextFontInput} from '../../shared/slug/text/init';
import {Defaults} from '../../defaults';
import {
	mathBuilder,
	mathFontFallback,
	mathNodeCount,
	type MathBuilder,
	type MathNode,
	type MathTextInit,
	type MathTextStyle
} from '../../shared/slug/math';
import {compileNode, reconcileNode, type CompileCtx} from './math/containers/compile';
import {MathContainer} from './math/containers/base';
import {RowContainer} from './math/containers/row';
import {AtomContainer} from './math/containers/atom';
import {ColumnContainer} from './math/containers/misc';

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
	private _bodyFontInput: SlugTextFontInput | null;
	private _mathFontInput: SlugTextFontInput | null;
	private _errorPolicy: SlugFontErrorPolicy;
	private _fontSize: number;
	private _fill: Rgba;
	private _align: 'left' | 'center' | 'right' | 'equals';
	private _lineSpacing: number;
	private _columnGap: number;
	private _variablesUseMathFont: boolean;
	private _root: MathContainer | null;
	/**
	 * The `MathNode` tree most recently compiled into `_root`. `rebuild()`
	 * uses this to drive `reconcileNode` so unchanged subtrees reuse their
	 * `MathContainer` (and the underlying `SlugText`) instead of being
	 * destroyed and recreated. Tracks the SINGLE-LINE case; multi-line
	 * rebuilds always do a full recompile.
	 */
	private _prevSingleLine: MathNode | null;

	constructor(init: MathTextInit) {
		super();
		this._formula = init.formula;
		this._fontSize = typeof init.fontSize === 'number' ? init.fontSize : DEFAULT_MATH_FONT_SIZE;
		this._fill =
			(init.options?.fill as Rgba | undefined) ?? ([...Defaults.SlugText.FillColor] as Rgba);
		this._align = init.align ?? 'left';
		this._lineSpacing = typeof init.lineSpacing === 'number' ? init.lineSpacing : DEFAULT_LINE_SPACING;
		this._columnGap = typeof init.columnGap === 'number' ? init.columnGap : 0;
		this._variablesUseMathFont =
			typeof init.variablesUseMathFont === 'boolean' ? init.variablesUseMathFont : true;
		this._root = null;
		this._prevSingleLine = null;
		this._bodyFont = null;
		this._mathFont = null;
		this._bodyFontInput = init.font ?? null;
		this._mathFontInput = init.mathFont ?? null;
		this._errorPolicy = {
			...Defaults.SlugText.ErrorPolicy,
			...(init.errorPolicy ?? {})
		};

		this.eventMode = 'none';
		this.interactiveChildren = false;

		this._resolveBodyFont(this._bodyFontInput);
		this._resolveMathFont(this._mathFontInput);
		this.rebuild();
	}

	private _resolveBodyFont(input: SlugTextFontInput | null): void {
		const sync = input ? slugTryResolveFontInputSync(input) : null;
		if (sync) {
			this._bodyFont = sync;
			return;
		}
		this._bodyFont = SlugFonts.fallback();
		if (!input) return;
		void slugResolveFontInput(input, this._errorPolicy).then((resolved: SlugFont | null) => {
			// Drop the result if a newer setter has replaced the input we
			// were resolving — protects against stale promises overwriting
			// a fresh font assignment.
			if (this._bodyFontInput !== input) return;
			if (resolved && this._bodyFont !== resolved) {
				this._bodyFont = resolved;
				this.rebuild();
			}
		});
	}

	private _resolveMathFont(input: SlugTextFontInput | null): void {
		const sync = input ? slugTryResolveFontInputSync(input) : null;
		if (sync) {
			this._mathFont = sync;
			return;
		}
		this._mathFont = mathFontFallback() ?? SlugFonts.fallback();
		if (!input) return;
		void slugResolveFontInput(input, this._errorPolicy).then((resolved: SlugFont | null) => {
			if (this._mathFontInput !== input) return;
			if (resolved && this._mathFont !== resolved) {
				this._mathFont = resolved;
				this.rebuild();
			}
		});
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

	public get variablesUseMathFont(): boolean {
		return this._variablesUseMathFont;
	}
	public set variablesUseMathFont(v: boolean) {
		if (v === this._variablesUseMathFont) return;
		this._variablesUseMathFont = v;
		this.rebuild();
	}

	/**
	 * Body font input (the unresolved value the consumer passed in). Set
	 * to swap the font used for ordinary text runs; resolution is async —
	 * the formula re-renders with the new font once it resolves.
	 */
	public get font(): SlugTextFontInput | null {
		return this._bodyFontInput;
	}
	public set font(v: SlugTextFontInput | null) {
		if (v === this._bodyFontInput) return;
		this._bodyFontInput = v;
		this._resolveBodyFont(v);
		this.rebuild();
	}

	/**
	 * Math font input — operator/fence/symbol glyphs. Set to override the
	 * bundled math fallback. On resolution failure the fallback is used
	 * and a warning is logged (see [[`mathFontFallback`]]).
	 */
	public get mathFont(): SlugTextFontInput | null {
		return this._mathFontInput;
	}
	public set mathFont(v: SlugTextFontInput | null) {
		if (v === this._mathFontInput) return;
		this._mathFontInput = v;
		this._resolveMathFont(v);
		this.rebuild();
	}

	/**
	 * Snapshot of the current resolved style. Today only `fill` is
	 * meaningful — the bag exists so future global style fields (stroke,
	 * shadow, …) can land without changing the public API shape.
	 *
	 * The setter accepts a partial — any field left unset is preserved.
	 */
	public get style(): MathTextStyle {
		return {fill: this._fill};
	}
	public set style(v: Partial<MathTextStyle>) {
		let changed = false;
		if (v.fill && v.fill !== this._fill) {
			this._fill = v.fill;
			changed = true;
		}
		if (changed) this.rebuild();
	}

	/**
	 * Reserved per spec §5.1. Stored but not currently wired through
	 * `ColumnContainer`, which uses `lineSpacing` for inter-row spacing.
	 * Setting today is a no-op; the property is here so consumer code
	 * written against the spec API doesn't churn when wiring lands.
	 */
	public get columnGap(): number {
		return this._columnGap;
	}
	public set columnGap(v: number) {
		this._columnGap = v;
	}

	/**
	 * Total `MathNode` count across the current formula. Multi-line input
	 * sums the lines. Read-only debug value — useful for budgeting against
	 * the perf characteristics in spec §9.
	 */
	public get nodeCount(): number {
		const f = this._formula;
		if (Array.isArray(f)) {
			let n = 0;
			for (const line of f) n += mathNodeCount(line);
			return n;
		}
		return mathNodeCount(f);
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
	 * Re-compile the current formula. On the single-line path with a
	 * previously-compiled tree, run `reconcileNode` so unchanged subtrees
	 * keep their `MathContainer` (and the underlying `SlugText`) — see
	 * spec §8.3. On structural mismatches, on the multi-line path, or
	 * on the first build, fall back to a full compile.
	 */
	public rebuild(): void {
		if (this.destroyed) return;
		if (!this._bodyFont || !this._mathFont) return;

		const ctx: CompileCtx = {
			bodyFont: this._bodyFont,
			mathFont: this._mathFont,
			fontSize: this._fontSize,
			fill: this._fill,
			depth: 0,
			variablesUseMathFont: this._variablesUseMathFont
		};

		const lines = Array.isArray(this._formula) ? this._formula : [this._formula];
		let root: MathContainer;
		if (lines.length === 1) {
			const next = lines[0];
			const prev = this._prevSingleLine;
			if (prev && this._root && !this._root.destroyed) {
				// Reconcile in place. `reconcileNode` may return the same
				// container or a fresh one if structure changed at the root.
				const reconciled = reconcileNode(prev, next, this._root, ctx);
				if (reconciled !== this._root) {
					this.removeChild(this._root);
					this._root.destroy({children: true});
					this._root = null;
				}
				root = reconciled;
			} else {
				// First build or last build was multi-line — full compile.
				if (this._root && !this._root.destroyed) {
					this.removeChild(this._root);
					this._root.destroy({children: true});
					this._root = null;
				}
				root = compileNode(next, ctx);
			}
			this._prevSingleLine = next;
		} else {
			// Multi-line path: full recompile. The previous single-line
			// tracker is cleared because reconciling a multi-line formula
			// against a single-line previous tree is not supported.
			this._prevSingleLine = null;
			if (this._root && !this._root.destroyed) {
				this.removeChild(this._root);
				this._root.destroy({children: true});
				this._root = null;
			}
			const col = new ColumnContainer();
			col.mathFontSize = this._fontSize;
			col.setLineSpacing(this._lineSpacing);
			const children = lines.map((line) => {
				// Wrap each line in a Row so multi-line alignment can
				// apply per-row horizontal shifts.
				const r = new RowContainer();
				r.mathFontSize = this._fontSize;
				r.setItems([compileNode(line, ctx)]);
				return r;
			});
			col.setItems(children);

			if (this._align === 'equals') {
				// Pre-layout each row so we know its leftmost `=` x in
				// local row coords; pass those as anchors to the column.
				for (const r of children) r.layout();
				const anchors = children.map((r) => findFirstEqualsX(r));
				// If NO row has an `=`, the spec says fall back to 'left'
				// for the whole column (the per-line fallback already
				// applies row-by-row inside ColumnContainer).
				const anyEquals = anchors.some((a) => a != null);
				if (anyEquals) {
					col.setAlign('anchor', anchors);
				} else {
					col.setAlign('left');
				}
			} else {
				col.setAlign(this._align);
			}

			root = col;
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

/**
 * Walk a laid-out `MathContainer` subtree (post-`layout()`) and return
 * the local-x of the leftmost `AtomContainer` whose text is `'='`, or
 * `null` if none. Walks in display order so the FIRST `=` (leftmost in
 * reading order) wins. Accumulates parent x-offsets along the way so the
 * returned value is in the subtree-root's local coordinate space.
 *
 * Used by `align: 'equals'` (§5.5) to column-align each line's `=` glyph.
 */
function findFirstEqualsX(c: MathContainer, accX: number = 0): number | null {
	if (c instanceof AtomContainer) {
		// Reach into the AtomContainer's text via its public surface — it
		// exposes the wrapped SlugText's text through `(c as any)._text`
		// only privately, so we route through a tagged getter on the
		// container itself for cleanliness.
		const text = atomText(c);
		if (text === '=') return accX + c.x;
		return null;
	}
	// Generic Container — iterate children in z-order.
	let best: number | null = null;
	let bestX = Infinity;
	for (const child of c.children) {
		if (!(child instanceof MathContainer)) continue;
		const x = findFirstEqualsX(child, accX + c.x);
		if (x != null && x < bestX) {
			best = x;
			bestX = x;
		}
	}
	return best;
}

/** Read the text from an AtomContainer without exposing private fields. */
function atomText(a: AtomContainer): string {
	// AtomContainer's only child is its `SlugText`; read its text.
	const child = a.children[0] as {text?: string} | undefined;
	return child && typeof child.text === 'string' ? child.text : '';
}
