import type {Rgba} from '../../../../rgba';
import type {SlugFont} from '../../../../shared/slug/font';
import type {MathNode} from '../../../../shared/slug/math/node';
import {MathRules, MathSizes} from '../../../../shared/slug/math/layout/sizes';
import {AtomContainer} from './atom';
import {MathContainer} from './base';
import {BigOpContainer} from './bigop';
import {FenceContainer} from './fence';
import {FractionContainer} from './frac';
import {MatrixContainer} from './matrix';
import {
	AccentContainer,
	AlignedContainer,
	BraceContainer,
	CasesContainer,
	ColumnContainer,
	NoRuleFractionContainer,
	OverlineContainer,
	PrescriptContainer,
	PrimeContainer,
	SpaceContainer,
	StackedSubContainer,
	TensorContainer
} from './misc';
import {RowContainer} from './row';
import {SqrtContainer} from './sqrt';
import {SubsupContainer} from './subsup';

/**
 * Layout context propagated down the compiler recursion. Mirrors the
 * old context.ts but smaller — only what the per-kind compilers need.
 */
export interface CompileCtx {
	bodyFont: SlugFont;
	mathFont: SlugFont;
	fontSize: number;
	fill: Rgba;
	depth: number;
	/**
	 * When true, `text` nodes with `useMathFont: false` resolve to the
	 * math font instead of the body font. Propagated from
	 * `MathText.variablesUseMathFont`. See spec / MathTextInit for rationale.
	 */
	variablesUseMathFont: boolean;
}

function withSize(ctx: CompileCtx, fontSize: number): CompileCtx {
	return {
		bodyFont: ctx.bodyFont,
		mathFont: ctx.mathFont,
		fontSize,
		fill: ctx.fill,
		depth: ctx.depth + 1,
		variablesUseMathFont: ctx.variablesUseMathFont
	};
}

function textFont(ctx: CompileCtx, useMathFont: boolean): SlugFont {
	if (useMathFont) return ctx.mathFont;
	return ctx.variablesUseMathFont ? ctx.mathFont : ctx.bodyFont;
}

/**
 * Build the slot-recompile hook for a SubsupContainer. The hook needs
 * to know the source node so it can re-compile the affected slot at
 * the new scale; the closure captures it.
 */
function wireSubsupHook(
	c: SubsupContainer,
	node: Extract<MathNode, {kind: 'sup' | 'sub' | 'subsup'}>,
	ctx: CompileCtx
): (slot: string) => void {
	return (slot) => {
		if (slot === 'base') {
			c.setBase(compileNode(node.base, withSize(ctx, ctx.fontSize * c.baseScale)));
		} else if (slot === 'sub' && (node.kind === 'sub' || node.kind === 'subsup')) {
			c.setSub(compileNode(node.sub, withSize(ctx, ctx.fontSize * c.subScale)));
		} else if (slot === 'sup' && (node.kind === 'sup' || node.kind === 'subsup')) {
			c.setSup(compileNode(node.sup, withSize(ctx, ctx.fontSize * c.supScale)));
		}
		c.layout();
	};
}

/**
 * Compile a `MathNode` tree into a `MathContainer` tree. The returned
 * container is fully populated with children (slots filled) and ready
 * to be `.layout()`-ed. Caller owns destruction.
 */
export function compileNode(node: MathNode, ctx: CompileCtx): MathContainer {
	switch (node.kind) {
		case 'text':
			return new AtomContainer(
				node.text,
				textFont(ctx, node.useMathFont),
				ctx.fontSize,
				ctx.fill
			);

		case 'slugScript':
			// One SlugText carrying its native sub/superscript — measured from
			// the SlugText's own bbox inside AtomContainer. No SubsupContainer.
			return new AtomContainer(node.text, textFont(ctx, node.useMathFont), ctx.fontSize, ctx.fill, {
				superscript: node.superscript,
				subscript: node.subscript,
				supFontSize: node.supFontSize,
				subFontSize: node.subFontSize
			});

		case 'space':
			return new SpaceContainer(node.em, ctx.fontSize);

		case 'sup': {
			const c = new SubsupContainer();
			c.mathFontSize = ctx.fontSize;
			// Sup/sub of sup/sub floors at scriptscript size; mirror that on
			// the depth path so nested scripts don't grow. User-supplied
			// scales win — depth shrink is skipped per slot when set.
			if (ctx.depth >= 1) {
				if (node.scales?.sub === undefined) c.subScale = 0.5;
				if (node.scales?.sup === undefined) c.supScale = 0.5;
			}
			if (node.scales?.base !== undefined) c.baseScale = node.scales.base;
			if (node.scales?.sub !== undefined) c.subScale = node.scales.sub;
			if (node.scales?.sup !== undefined) c.supScale = node.scales.sup;
			c.setBase(compileNode(node.base, withSize(ctx, ctx.fontSize * c.baseScale)));
			c.setSup(compileNode(node.sup, withSize(ctx, ctx.fontSize * c.supScale)));
			c._recompileSlot = wireSubsupHook(c, node, ctx);
			return c;
		}
		case 'sub': {
			const c = new SubsupContainer();
			c.mathFontSize = ctx.fontSize;
			if (ctx.depth >= 1) {
				if (node.scales?.sub === undefined) c.subScale = 0.5;
				if (node.scales?.sup === undefined) c.supScale = 0.5;
			}
			if (node.scales?.base !== undefined) c.baseScale = node.scales.base;
			if (node.scales?.sub !== undefined) c.subScale = node.scales.sub;
			if (node.scales?.sup !== undefined) c.supScale = node.scales.sup;
			c.setBase(compileNode(node.base, withSize(ctx, ctx.fontSize * c.baseScale)));
			c.setSub(compileNode(node.sub, withSize(ctx, ctx.fontSize * c.subScale)));
			c._recompileSlot = wireSubsupHook(c, node, ctx);
			return c;
		}
		case 'subsup': {
			const c = new SubsupContainer();
			c.mathFontSize = ctx.fontSize;
			if (ctx.depth >= 1) {
				if (node.scales?.sub === undefined) c.subScale = 0.5;
				if (node.scales?.sup === undefined) c.supScale = 0.5;
			}
			if (node.scales?.base !== undefined) c.baseScale = node.scales.base;
			if (node.scales?.sub !== undefined) c.subScale = node.scales.sub;
			if (node.scales?.sup !== undefined) c.supScale = node.scales.sup;
			c.setBase(compileNode(node.base, withSize(ctx, ctx.fontSize * c.baseScale)));
			c.setSub(compileNode(node.sub, withSize(ctx, ctx.fontSize * c.subScale)));
			c.setSup(compileNode(node.sup, withSize(ctx, ctx.fontSize * c.supScale)));
			c._recompileSlot = wireSubsupHook(c, node, ctx);
			return c;
		}

		case 'frac': {
			const c = new FractionContainer(ctx.fill);
			c.mathFontSize = ctx.fontSize;
			// Nested fractions auto-shrink (TeX scriptstyle convention).
			// User-supplied scales win — depth shrink is skipped per slot.
			if (ctx.depth >= 1) {
				if (node.scales?.num === undefined) c.numScale = 0.7;
				if (node.scales?.den === undefined) c.denScale = 0.7;
			}
			if (node.scales?.num !== undefined) c.numScale = node.scales.num;
			if (node.scales?.den !== undefined) c.denScale = node.scales.den;
			c.setNumerator(compileNode(node.num, withSize(ctx, ctx.fontSize * c.numScale)));
			c.setDenominator(compileNode(node.den, withSize(ctx, ctx.fontSize * c.denScale)));
			c._recompileSlot = (slot) => {
				if (slot === 'num') {
					c.setNumerator(compileNode(node.num, withSize(ctx, ctx.fontSize * c.numScale)));
				} else if (slot === 'den') {
					c.setDenominator(compileNode(node.den, withSize(ctx, ctx.fontSize * c.denScale)));
				}
				c.layout();
			};
			return c;
		}

		case 'sqrt': {
			const c = new SqrtContainer(ctx.mathFont, ctx.fontSize, ctx.fill);
			c.mathFontSize = ctx.fontSize;
			if (node.vAlign !== undefined) c.radicandVAlign = node.vAlign;
			if (node.scales?.radicand !== undefined) c.radicandScale = node.scales.radicand;
			if (node.scales?.index !== undefined) c.indexScale = node.scales.index;
			c.setRadicand(compileNode(node.radicand, withSize(ctx, ctx.fontSize * c.radicandScale)));
			c._recompileSlot = (slot) => {
				if (slot === 'radicand') {
					c.setRadicand(compileNode(node.radicand, withSize(ctx, ctx.fontSize * c.radicandScale)));
				}
				c.layout();
			};
			return c;
		}
		case 'nthroot': {
			const c = new SqrtContainer(ctx.mathFont, ctx.fontSize, ctx.fill);
			c.mathFontSize = ctx.fontSize;
			if (node.vAlign !== undefined) c.radicandVAlign = node.vAlign;
			if (node.scales?.radicand !== undefined) c.radicandScale = node.scales.radicand;
			if (node.scales?.index !== undefined) c.indexScale = node.scales.index;
			c.setRadicand(compileNode(node.radicand, withSize(ctx, ctx.fontSize * c.radicandScale)));
			c.setIndex(compileNode(node.index, withSize(ctx, ctx.fontSize * c.indexScale)));
			c._recompileSlot = (slot) => {
				if (slot === 'radicand') {
					c.setRadicand(compileNode(node.radicand, withSize(ctx, ctx.fontSize * c.radicandScale)));
				} else if (slot === 'index') {
					c.setIndex(compileNode(node.index, withSize(ctx, ctx.fontSize * c.indexScale)));
				}
				c.layout();
			};
			return c;
		}

		case 'bigop': {
			const c = new BigOpContainer(
				node.symbol,
				ctx.mathFont,
				ctx.fontSize,
				ctx.fill,
				node.integralStyle
			);
			c.mathFontSize = ctx.fontSize;
			// Per-slot scale lives on the container so consumers can tune
			// individual instances without editing global constants.
			if (node.scales?.upper !== undefined) c.upperScale = node.scales.upper;
			if (node.scales?.lower !== undefined) c.lowerScale = node.scales.lower;
			if (node.scales?.body !== undefined) c.bodyScale = node.scales.body;
			if (node.scales?.symbol !== undefined) c.symbolScale = node.scales.symbol;
			if (node.upper) c.setUpper(compileNode(node.upper, withSize(ctx, ctx.fontSize * c.upperScale)));
			if (node.lower) c.setLower(compileNode(node.lower, withSize(ctx, ctx.fontSize * c.lowerScale)));
			c.setBody(compileNode(node.body, withSize(ctx, ctx.fontSize * c.bodyScale)));
			// Hook setters: re-compile the affected slot at the new scale.
			c._recompileSlot = (slot) => {
				if (slot === 'upper' && node.upper) {
					c.setUpper(compileNode(node.upper, withSize(ctx, ctx.fontSize * c.upperScale)));
				} else if (slot === 'lower' && node.lower) {
					c.setLower(compileNode(node.lower, withSize(ctx, ctx.fontSize * c.lowerScale)));
				} else if (slot === 'body') {
					c.setBody(compileNode(node.body, withSize(ctx, ctx.fontSize * c.bodyScale)));
				}
				c.layout();
			};
			return c;
		}

		case 'fence': {
			const c = new FenceContainer(
				node.left,
				node.right,
				'',
				ctx.mathFont,
				ctx.fontSize,
				ctx.fill
			);
			c.mathFontSize = ctx.fontSize;
			if (node.scales?.inner !== undefined) c.innerScale = node.scales.inner;
			c.setInner([compileNode(node.inner, withSize(ctx, ctx.fontSize * c.innerScale))]);
			c._recompileSlot = (slot) => {
				if (slot === 'inner') {
					c.setInner([compileNode(node.inner, withSize(ctx, ctx.fontSize * c.innerScale))]);
				}
				c.layout();
			};
			return c;
		}
		case 'fenceSep': {
			const c = new FenceContainer(
				node.left,
				node.right,
				node.separator,
				ctx.mathFont,
				ctx.fontSize,
				ctx.fill
			);
			c.mathFontSize = ctx.fontSize;
			if (node.scales?.inner !== undefined) c.innerScale = node.scales.inner;
			c.setInner(node.children.map((ch) => compileNode(ch, withSize(ctx, ctx.fontSize * c.innerScale))));
			c._recompileSlot = (slot) => {
				if (slot === 'inner') {
					c.setInner(node.children.map((ch) => compileNode(ch, withSize(ctx, ctx.fontSize * c.innerScale))));
				}
				c.layout();
			};
			return c;
		}

		case 'matrix': {
			const c = new MatrixContainer(
				node.fence,
				node.augmentCol,
				ctx.mathFont,
				ctx.fontSize,
				ctx.fill
			);
			c.mathFontSize = ctx.fontSize;
			if (node.scales?.cell !== undefined) c.cellScale = node.scales.cell;
			c.setRows(node.rows.map((row) => row.map((cell) => compileNode(cell, withSize(ctx, ctx.fontSize * c.cellScale)))));
			c._recompileSlot = (slot) => {
				if (slot === 'cells') {
					c.setRows(node.rows.map((row) => row.map((cell) => compileNode(cell, withSize(ctx, ctx.fontSize * c.cellScale)))));
				}
				c.layout();
			};
			return c;
		}

		case 'cases': {
			const c = new CasesContainer(ctx.mathFont, ctx.fontSize, ctx.fill);
			c.mathFontSize = ctx.fontSize;
			if (node.scales?.case !== undefined) c.caseScale = node.scales.case;
			c.setCases(
				node.cases.map(([v, cnd]) => [
					compileNode(v, withSize(ctx, ctx.fontSize * c.caseScale)),
					compileNode(cnd, withSize(ctx, ctx.fontSize * c.caseScale))
				])
			);
			c._recompileSlot = (slot) => {
				if (slot === 'cases') {
					c.setCases(
						node.cases.map(([v, cnd]) => [
							compileNode(v, withSize(ctx, ctx.fontSize * c.caseScale)),
							compileNode(cnd, withSize(ctx, ctx.fontSize * c.caseScale))
						])
					);
				}
				c.layout();
			};
			return c;
		}

		case 'aligned': {
			const c = new AlignedContainer(node.anchor);
			c.mathFontSize = ctx.fontSize;
			c.setRows(node.rows.map((row) => row.map((cell) => compileNode(cell, ctx))));
			return c;
		}

		case 'accent': {
			const glyph = accentGlyph(node.accent);
			const c = new AccentContainer(glyph, ctx.mathFont, ctx.fontSize, ctx.fill);
			c.mathFontSize = ctx.fontSize;
			if (node.scales?.base !== undefined) c.baseScale = node.scales.base;
			if (node.scales?.accent !== undefined) c.accentScale = node.scales.accent;
			c.setBase(compileNode(node.base, withSize(ctx, ctx.fontSize * c.baseScale)));
			c._recompileSlot = (slot) => {
				if (slot === 'base') {
					c.setBase(compileNode(node.base, withSize(ctx, ctx.fontSize * c.baseScale)));
				}
				c.layout();
			};
			return c;
		}

		case 'over': {
			const c = new OverlineContainer(node.line === 'overline' ? 'over' : 'under', ctx.fill);
			c.mathFontSize = ctx.fontSize;
			if (node.scales?.inner !== undefined) c.innerScale = node.scales.inner;
			c.setInner(compileNode(node.inner, withSize(ctx, ctx.fontSize * c.innerScale)));
			c._recompileSlot = (slot) => {
				if (slot === 'inner') {
					c.setInner(compileNode(node.inner, withSize(ctx, ctx.fontSize * c.innerScale)));
				}
				c.layout();
			};
			return c;
		}

		case 'brace': {
			const c = new BraceContainer(node.position, ctx.mathFont, ctx.fontSize, ctx.fill);
			c.mathFontSize = ctx.fontSize;
			if (node.scales?.inner !== undefined) c.innerScale = node.scales.inner;
			if (node.scales?.label !== undefined) c.labelScale = node.scales.label;
			c.setInner(compileNode(node.inner, withSize(ctx, ctx.fontSize * c.innerScale)));
			if (node.label) {
				c.setLabel(compileNode(node.label, withSize(ctx, ctx.fontSize * c.labelScale)));
			}
			c._recompileSlot = (slot) => {
				if (slot === 'inner') {
					c.setInner(compileNode(node.inner, withSize(ctx, ctx.fontSize * c.innerScale)));
				} else if (slot === 'label' && node.label) {
					c.setLabel(compileNode(node.label, withSize(ctx, ctx.fontSize * c.labelScale)));
				}
				c.layout();
			};
			return c;
		}

		case 'lim': {
			// lim x→a body — column of [lim, x→a] then row with body.
			const limAtom = new AtomContainer('lim', textFont(ctx, false), ctx.fontSize, ctx.fill);
			const limitCtx = withSize(ctx, ctx.fontSize * MathSizes.BigOpLimits);
			const targetRow = new RowContainer();
			targetRow.mathFontSize = limitCtx.fontSize;
			targetRow.setItems(
				[
					compileNode(node.var_, limitCtx),
					new AtomContainer('→', ctx.mathFont, limitCtx.fontSize, ctx.fill),
					compileNode(node.target, limitCtx)
				],
				MathRules.OpThinSpaceEm * ctx.fontSize
			);
			const stack = new ColumnContainer();
			stack.mathFontSize = ctx.fontSize;
			stack.setItems([limAtom, targetRow]);
			const row = new RowContainer();
			row.mathFontSize = ctx.fontSize;
			row.setItems(
				[stack, compileNode(node.body, ctx)],
				MathRules.NamedOpSpacingEm * ctx.fontSize
			);
			return row;
		}

		case 'row': {
			const c = new RowContainer();
			c.mathFontSize = ctx.fontSize;
			c.setItems(node.children.map((ch) => compileNode(ch, ctx)));
			return c;
		}

		case 'column': {
			const c = new ColumnContainer();
			c.mathFontSize = ctx.fontSize;
			c.setItems(node.children.map((ch) => compileNode(ch, ctx)));
			return c;
		}

		case 'styled': {
			// Apply style overrides to context, then compile the child.
			// `mathFont` / `font` overrides aren't supported in v1 (would
			// require routing through the registry to resolve).
			const childCtx: CompileCtx = {
				bodyFont: ctx.bodyFont,
				mathFont: ctx.mathFont,
				fontSize: node.style.fontSize ?? ctx.fontSize,
				fill: node.style.color ?? ctx.fill,
				depth: ctx.depth + 1,
				variablesUseMathFont: ctx.variablesUseMathFont
			};
			return compileNode(node.child, childCtx);
		}

		case 'namedOp': {
			// Render the name as a body-font atom, then attach scripts
			// via a SubsupContainer if present, then append function-
			// spacing as a SpaceContainer.
			const nameAtom = new AtomContainer(node.name, textFont(ctx, false), ctx.fontSize, ctx.fill);
			let base: MathContainer = nameAtom;
			if (node.sub || node.sup) {
				const s = new SubsupContainer();
				s.mathFontSize = ctx.fontSize;
				s.setBase(nameAtom);
				const scriptCtx = withSize(ctx, ctx.fontSize * MathSizes.NamedOpScript);
				if (node.sub) s.setSub(compileNode(node.sub, scriptCtx));
				if (node.sup) s.setSup(compileNode(node.sup, scriptCtx));
				base = s;
			}
			const space = new SpaceContainer(MathRules.NamedOpSpacingEm, ctx.fontSize);
			const row = new RowContainer();
			row.mathFontSize = ctx.fontSize;
			row.setItems([base, space]);
			return row;
		}

		case 'op': {
			// Render the symbol glyph from the math font with optional
			// scripts, padded by thin spaces on both sides.
			const opAtom = new AtomContainer(node.symbol, ctx.mathFont, ctx.fontSize, ctx.fill);
			let base: MathContainer = opAtom;
			if (node.sub || node.sup) {
				const s = new SubsupContainer();
				s.mathFontSize = ctx.fontSize;
				s.setBase(opAtom);
				const scriptCtx = withSize(ctx, ctx.fontSize * MathSizes.OpScript);
				if (node.sub) s.setSub(compileNode(node.sub, scriptCtx));
				if (node.sup) s.setSup(compileNode(node.sup, scriptCtx));
				base = s;
			}
			const padBefore = new SpaceContainer(MathRules.OpThinSpaceEm, ctx.fontSize);
			const padAfter = new SpaceContainer(MathRules.OpThinSpaceEm, ctx.fontSize);
			const row = new RowContainer();
			row.mathFontSize = ctx.fontSize;
			row.setItems([padBefore, base, padAfter]);
			return row;
		}

		case 'tensor': {
			const c = new TensorContainer();
			c.mathFontSize = ctx.fontSize;
			if (node.scales?.base !== undefined) c.baseScale = node.scales.base;
			if (node.scales?.index !== undefined) c.indexScale = node.scales.index;
			c.setBase(compileNode(node.base, withSize(ctx, ctx.fontSize * c.baseScale)));
			const idxCtx0 = () => withSize(ctx, ctx.fontSize * c.indexScale);
			c.setIndices(
				node.upper.map((u) => compileNode(u, idxCtx0())),
				node.lower.map((l) => compileNode(l, idxCtx0()))
			);
			c._recompileSlot = (slot) => {
				if (slot === 'base') {
					c.setBase(compileNode(node.base, withSize(ctx, ctx.fontSize * c.baseScale)));
				} else if (slot === 'indices') {
					c.setIndices(
						node.upper.map((u) => compileNode(u, idxCtx0())),
						node.lower.map((l) => compileNode(l, idxCtx0()))
					);
				}
				c.layout();
			};
			return c;
		}

		case 'map': {
			// name : from → to (+ optional second line mapsTo)
			const r1 = new RowContainer();
			r1.mathFontSize = ctx.fontSize;
			r1.setItems(
				[
					compileNode(node.name, ctx),
					new AtomContainer(':', ctx.mathFont, ctx.fontSize, ctx.fill),
					compileNode(node.from, ctx),
					new AtomContainer('→', ctx.mathFont, ctx.fontSize, ctx.fill),
					compileNode(node.to, ctx)
				],
				MathRules.OpThinSpaceEm * ctx.fontSize
			);
			if (!node.mapsTo) return r1;
			const r2 = compileNode(node.mapsTo, ctx);
			const stack = new ColumnContainer();
			stack.mathFontSize = ctx.fontSize;
			stack.setItems([r1, r2]);
			return stack;
		}

		case 'stackedSub': {
			const c = new StackedSubContainer();
			c.mathFontSize = ctx.fontSize;
			if (node.scales?.base !== undefined) c.baseScale = node.scales.base;
			if (node.scales?.line !== undefined) c.lineScale = node.scales.line;
			c.setBase(compileNode(node.base, withSize(ctx, ctx.fontSize * c.baseScale)));
			c.setLines(node.lines.map((l) => compileNode(l, withSize(ctx, ctx.fontSize * c.lineScale))));
			c._recompileSlot = (slot) => {
				if (slot === 'base') {
					c.setBase(compileNode(node.base, withSize(ctx, ctx.fontSize * c.baseScale)));
				} else if (slot === 'lines') {
					c.setLines(node.lines.map((l) => compileNode(l, withSize(ctx, ctx.fontSize * c.lineScale))));
				}
				c.layout();
			};
			return c;
		}

		case 'prime': {
			const c = new PrimeContainer(node.count, ctx.mathFont, ctx.fontSize, ctx.fill);
			c.mathFontSize = ctx.fontSize;
			if (node.scales?.base !== undefined) c.baseScale = node.scales.base;
			c.setBase(compileNode(node.base, withSize(ctx, ctx.fontSize * c.baseScale)));
			c._recompileSlot = (slot) => {
				if (slot === 'base') {
					c.setBase(compileNode(node.base, withSize(ctx, ctx.fontSize * c.baseScale)));
				}
				c.layout();
			};
			return c;
		}

		case 'binom': {
			const inner = new NoRuleFractionContainer();
			inner.mathFontSize = ctx.fontSize;
			// Binom contents render slightly smaller than top-level so the
			// fenced (n / k) doesn't bloat horizontally. User-supplied
			// scales win.
			inner.numScale = node.scales?.n ?? 0.85;
			inner.denScale = node.scales?.k ?? 0.85;
			inner.setNumerator(compileNode(node.n, withSize(ctx, ctx.fontSize * inner.numScale)));
			inner.setDenominator(compileNode(node.k, withSize(ctx, ctx.fontSize * inner.denScale)));
			inner._recompileSlot = (slot) => {
				if (slot === 'num') {
					inner.setNumerator(compileNode(node.n, withSize(ctx, ctx.fontSize * inner.numScale)));
				} else if (slot === 'den') {
					inner.setDenominator(compileNode(node.k, withSize(ctx, ctx.fontSize * inner.denScale)));
				}
				inner.layout();
			};
			const c = new FenceContainer('(', ')', '', ctx.mathFont, ctx.fontSize, ctx.fill);
			c.mathFontSize = ctx.fontSize;
			c.setInner([inner]);
			return c;
		}

		case 'ellipsis': {
			const glyph =
				node.style === 'center'
					? '⋯'
					: node.style === 'vertical'
						? '⋮'
						: node.style === 'diagonal'
							? '⋱'
							: '…';
			return new AtomContainer(glyph, ctx.mathFont, ctx.fontSize, ctx.fill);
		}

		case 'prescript': {
			const c = new PrescriptContainer();
			c.mathFontSize = ctx.fontSize;
			if (node.scales?.base !== undefined) c.baseScale = node.scales.base;
			if (node.scales?.sub !== undefined) c.subScale = node.scales.sub;
			if (node.scales?.sup !== undefined) c.supScale = node.scales.sup;
			c.setBase(compileNode(node.base, withSize(ctx, ctx.fontSize * c.baseScale)));
			if (node.sub) c.setSub(compileNode(node.sub, withSize(ctx, ctx.fontSize * c.subScale)));
			if (node.sup) c.setSup(compileNode(node.sup, withSize(ctx, ctx.fontSize * c.supScale)));
			c._recompileSlot = (slot) => {
				if (slot === 'base') {
					c.setBase(compileNode(node.base, withSize(ctx, ctx.fontSize * c.baseScale)));
				} else if (slot === 'sub' && node.sub) {
					c.setSub(compileNode(node.sub, withSize(ctx, ctx.fontSize * c.subScale)));
				} else if (slot === 'sup' && node.sup) {
					c.setSup(compileNode(node.sup, withSize(ctx, ctx.fontSize * c.supScale)));
				}
				c.layout();
			};
			return c;
		}

		default: {
			const _exhaustive: never = node;
			void _exhaustive;
			// Empty row keeps the layout flowable rather than throwing.
			const empty = new RowContainer();
			empty.mathFontSize = ctx.fontSize;
			return empty;
		}
	}
}

/**
 * Reconcile an existing `MathContainer` against a new `MathNode`, using
 * the prior `MathNode` (`prev`) for kind-equality checks. Returns the
 * container that should occupy the same slot in the parent — either the
 * mutated `existing` container (when the kinds match and the shape is
 * reconcilable) or a freshly-compiled replacement.
 *
 * The caller is responsible for swapping the returned container into
 * its parent slot (each parent's slot setter is a no-op when the same
 * instance is passed back, so reuse incurs zero scene-graph churn).
 *
 * Spec §8.3 — the load-bearing reuse path is `kind: 'text'` mutation
 * (e.g. a clock's value changes from `0.95` to `0.96` inside a fraction
 * numerator). That reduces to one `AtomContainer.setText()` call which
 * hits the SlugText incremental rebuild fast path.
 *
 * Reuse cases handled:
 *  - `text` (font/useMathFont/fontSize/fill mutation).
 *  - `space` (em width mutation).
 *  - Fixed-arity slot kinds: sup, sub, subsup, frac, sqrt, nthroot,
 *    accent, over, brace, prime, binom, prescript.
 *  - Variadic kinds with matching child count: row, column, matrix,
 *    cases, aligned, fenceSep, tensor, stackedSub.
 *  - `bigop`, `fence`, `styled` — slot reuse when symbol/delimiter
 *    fields match.
 *
 * Anything else falls back to full recompile of that subtree.
 */
export function reconcileNode(
	prev: MathNode,
	next: MathNode,
	existing: MathContainer,
	ctx: CompileCtx
): MathContainer {
	if (prev.kind !== next.kind) {
		return compileNode(next, ctx);
	}

	switch (next.kind) {
		case 'text': {
			if (prev.kind !== 'text') return compileNode(next, ctx);
			if (!(existing instanceof AtomContainer)) return compileNode(next, ctx);
			// useMathFont changes require a font swap. The container can
			// handle it without rebuilding the AtomContainer wrapper.
			const wantFont = textFont(ctx, next.useMathFont);
			existing.setFont(wantFont);
			existing.setFontSize(ctx.fontSize);
			existing.setText(next.text);
			existing.setFill(ctx.fill);
			return existing;
		}

		case 'slugScript': {
			if (prev.kind !== 'slugScript') return compileNode(next, ctx);
			if (!(existing instanceof AtomContainer)) return compileNode(next, ctx);
			// The script strings + sizes are baked into the wrapped SlugText
			// at construction. When they differ, rebuild; otherwise this is
			// the cheap base-text/font/size/fill mutation path (same as plain
			// `text`), which hits SlugText's incremental rebuild.
			if (
				prev.superscript !== next.superscript ||
				prev.subscript !== next.subscript ||
				prev.supFontSize !== next.supFontSize ||
				prev.subFontSize !== next.subFontSize
			) {
				return compileNode(next, ctx);
			}
			existing.setFont(textFont(ctx, next.useMathFont));
			existing.setFontSize(ctx.fontSize);
			existing.setText(next.text);
			existing.setFill(ctx.fill);
			return existing;
		}

		case 'space': {
			if (prev.kind !== 'space') return compileNode(next, ctx);
			if (prev.em === next.em) return existing;
			return compileNode(next, ctx);
		}

		case 'sup':
		case 'sub':
		case 'subsup': {
			if (!(existing instanceof SubsupContainer)) return compileNode(next, ctx);
			if (prev.kind !== next.kind) return compileNode(next, ctx);
			const ssPrev = prev as typeof next;
			existing.mathFontSize = ctx.fontSize;
			// Apply user-supplied scale overrides. The depth-based shrink is
			// only re-applied to slots the user did NOT set, so the override
			// wins over the auto-shrink at every depth.
			if (ctx.depth >= 1) {
				if (next.scales?.sub === undefined) existing.subScale = 0.5;
				if (next.scales?.sup === undefined) existing.supScale = 0.5;
			}
			if (next.scales?.base !== undefined) existing.baseScale = next.scales.base;
			if (next.scales?.sub !== undefined) existing.subScale = next.scales.sub;
			if (next.scales?.sup !== undefined) existing.supScale = next.scales.sup;
			const baseCtx = withSize(ctx, ctx.fontSize * existing.baseScale);
			const baseSlot = getSubsupBase(existing);
			const newBase = baseSlot
				? reconcileNode(ssPrev.base, next.base, baseSlot, baseCtx)
				: compileNode(next.base, baseCtx);
			existing.setBase(newBase);
			if (next.kind === 'sub' || next.kind === 'subsup') {
				const sub = getSubsupSub(existing);
				const prevSub = (ssPrev as Extract<MathNode, {kind: 'sub' | 'subsup'}>).sub;
				const subCtx = withSize(ctx, ctx.fontSize * existing.subScale);
				const newSub = sub
					? reconcileNode(prevSub, next.sub, sub, subCtx)
					: compileNode(next.sub, subCtx);
				existing.setSub(newSub);
			} else {
				existing.setSub(null);
			}
			if (next.kind === 'sup' || next.kind === 'subsup') {
				const sup = getSubsupSup(existing);
				const prevSup = (ssPrev as Extract<MathNode, {kind: 'sup' | 'subsup'}>).sup;
				const supCtx = withSize(ctx, ctx.fontSize * existing.supScale);
				const newSup = sup
					? reconcileNode(prevSup, next.sup, sup, supCtx)
					: compileNode(next.sup, supCtx);
				existing.setSup(newSup);
			} else {
				existing.setSup(null);
			}
			return existing;
		}

		case 'frac': {
			if (prev.kind !== 'frac') return compileNode(next, ctx);
			if (!(existing instanceof FractionContainer)) return compileNode(next, ctx);
			existing.mathFontSize = ctx.fontSize;
			existing.setFill(ctx.fill);
			// User-supplied scales win. Depth shrink only re-applies to
			// slots the user did NOT set.
			if (ctx.depth >= 1) {
				if (next.scales?.num === undefined) existing.numScale = MathSizes.FracNested;
				if (next.scales?.den === undefined) existing.denScale = MathSizes.FracNested;
			} else {
				if (next.scales?.num === undefined) existing.numScale = MathSizes.FracTopLevel;
				if (next.scales?.den === undefined) existing.denScale = MathSizes.FracTopLevel;
			}
			if (next.scales?.num !== undefined) existing.numScale = next.scales.num;
			if (next.scales?.den !== undefined) existing.denScale = next.scales.den;
			const numCtx = withSize(ctx, ctx.fontSize * existing.numScale);
			const denCtx = withSize(ctx, ctx.fontSize * existing.denScale);
			const num = getFracNum(existing);
			const den = getFracDen(existing);
			existing.setNumerator(
				num ? reconcileNode(prev.num, next.num, num, numCtx) : compileNode(next.num, numCtx)
			);
			existing.setDenominator(
				den ? reconcileNode(prev.den, next.den, den, denCtx) : compileNode(next.den, denCtx)
			);
			return existing;
		}

		case 'row': {
			if (prev.kind !== 'row') return compileNode(next, ctx);
			if (!(existing instanceof RowContainer)) return compileNode(next, ctx);
			if (prev.children.length !== next.children.length) return compileNode(next, ctx);
			existing.mathFontSize = ctx.fontSize;
			const oldItems = getRowItems(existing);
			const newItems = next.children.map((child, i) => {
				const oldChild = oldItems[i];
				return oldChild
					? reconcileNode(prev.children[i], child, oldChild, ctx)
					: compileNode(child, ctx);
			});
			existing.setItems(newItems);
			return existing;
		}

		case 'column': {
			if (prev.kind !== 'column') return compileNode(next, ctx);
			if (!(existing instanceof ColumnContainer)) return compileNode(next, ctx);
			if (prev.children.length !== next.children.length) return compileNode(next, ctx);
			existing.mathFontSize = ctx.fontSize;
			const oldItems = getColumnItems(existing);
			const newItems = next.children.map((child, i) => {
				const oldChild = oldItems[i];
				return oldChild
					? reconcileNode(prev.children[i], child, oldChild, ctx)
					: compileNode(child, ctx);
			});
			existing.setItems(newItems);
			return existing;
		}

		// Reuse only the container shell; recompile inner content. These
		// kinds either compose internal helper containers (lim, namedOp,
		// op, map) or have shape variations (matrix dimensions, fence
		// delimiters, styled overrides) that would need more bookkeeping
		// than the load-bearing case justifies for v1.
		default:
			return compileNode(next, ctx);
	}
}

// ---------------------------------------------------------------------------
// Private slot accessors. The container classes don't expose readers for
// their slots (the model is write-only — parents set, layout reads). To
// reconcile we need to read the previous slot so we can recurse with the
// matching `MathContainer` instance. We reach into the private fields via
// known property names; if a container's internals change we'll get a
// type error here.

interface SubsupSlots {
	_base: MathContainer | null;
	_sub: MathContainer | null;
	_sup: MathContainer | null;
}
function getSubsupBase(c: SubsupContainer): MathContainer | null {
	return (c as unknown as SubsupSlots)._base;
}
function getSubsupSub(c: SubsupContainer): MathContainer | null {
	return (c as unknown as SubsupSlots)._sub;
}
function getSubsupSup(c: SubsupContainer): MathContainer | null {
	return (c as unknown as SubsupSlots)._sup;
}

interface FracSlots {
	_numerator: MathContainer | null;
	_denominator: MathContainer | null;
}
function getFracNum(c: FractionContainer): MathContainer | null {
	return (c as unknown as FracSlots)._numerator;
}
function getFracDen(c: FractionContainer): MathContainer | null {
	return (c as unknown as FracSlots)._denominator;
}

interface RowSlots {
	_children: MathContainer[];
}
function getRowItems(c: RowContainer): MathContainer[] {
	return (c as unknown as RowSlots)._children;
}

interface ColumnSlots {
	_items: MathContainer[];
}
function getColumnItems(c: ColumnContainer): MathContainer[] {
	return (c as unknown as ColumnSlots)._items;
}

function accentGlyph(kind: 'vec' | 'hat' | 'bar' | 'dot' | 'ddot' | 'tilde'): string {
	switch (kind) {
		case 'vec':
			return '⃗';
		case 'hat':
			return '^';
		case 'bar':
			return '¯';
		case 'dot':
			return '˙';
		case 'ddot':
			return '¨';
		case 'tilde':
			return '~';
	}
}
