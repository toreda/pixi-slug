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
}

function withSize(ctx: CompileCtx, fontSize: number): CompileCtx {
	return {
		bodyFont: ctx.bodyFont,
		mathFont: ctx.mathFont,
		fontSize,
		fill: ctx.fill,
		depth: ctx.depth + 1
	};
}

function scriptSizeForDepth(ctx: CompileCtx): number {
	return ctx.fontSize * (ctx.depth >= 1 ? MathSizes.ScriptScript : MathSizes.Script);
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
				node.useMathFont ? ctx.mathFont : ctx.bodyFont,
				ctx.fontSize,
				ctx.fill
			);

		case 'space':
			return new SpaceContainer(node.em, ctx.fontSize);

		case 'sup': {
			const c = new SubsupContainer();
			c.mathFontSize = ctx.fontSize;
			c.setBase(compileNode(node.base, ctx));
			c.setSup(compileNode(node.sup, withSize(ctx, scriptSizeForDepth(ctx))));
			return c;
		}
		case 'sub': {
			const c = new SubsupContainer();
			c.mathFontSize = ctx.fontSize;
			c.setBase(compileNode(node.base, ctx));
			c.setSub(compileNode(node.sub, withSize(ctx, scriptSizeForDepth(ctx))));
			return c;
		}
		case 'subsup': {
			const c = new SubsupContainer();
			c.mathFontSize = ctx.fontSize;
			c.setBase(compileNode(node.base, ctx));
			const childCtx = withSize(ctx, scriptSizeForDepth(ctx));
			c.setSub(compileNode(node.sub, childCtx));
			c.setSup(compileNode(node.sup, childCtx));
			return c;
		}

		case 'frac': {
			const c = new FractionContainer(ctx.fill);
			c.mathFontSize = ctx.fontSize;
			const childSize = ctx.fontSize * (ctx.depth >= 1 ? MathSizes.FracNested : MathSizes.FracTopLevel);
			const childCtx = withSize(ctx, childSize);
			c.setNumerator(compileNode(node.num, childCtx));
			c.setDenominator(compileNode(node.den, childCtx));
			return c;
		}

		case 'sqrt': {
			const c = new SqrtContainer(ctx.mathFont, ctx.fontSize, ctx.fill);
			c.mathFontSize = ctx.fontSize;
			c.setRadicand(compileNode(node.radicand, ctx));
			return c;
		}
		case 'nthroot': {
			const c = new SqrtContainer(ctx.mathFont, ctx.fontSize, ctx.fill);
			c.mathFontSize = ctx.fontSize;
			c.setRadicand(compileNode(node.radicand, ctx));
			c.setIndex(compileNode(node.index, withSize(ctx, ctx.fontSize * MathSizes.RootIndex)));
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
			const limitCtx = withSize(ctx, ctx.fontSize * MathSizes.BigOpLimits);
			if (node.lower) c.setLower(compileNode(node.lower, limitCtx));
			if (node.upper) c.setUpper(compileNode(node.upper, limitCtx));
			c.setBody(compileNode(node.body, ctx));
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
			c.setInner([compileNode(node.inner, ctx)]);
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
			c.setInner(node.children.map((ch) => compileNode(ch, ctx)));
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
			c.setRows(node.rows.map((row) => row.map((cell) => compileNode(cell, ctx))));
			return c;
		}

		case 'cases': {
			const c = new CasesContainer(ctx.mathFont, ctx.fontSize, ctx.fill);
			c.mathFontSize = ctx.fontSize;
			const rowCtx = withSize(ctx, ctx.fontSize * MathSizes.CasesRow);
			c.setCases(
				node.cases.map(([v, cnd]) => [compileNode(v, rowCtx), compileNode(cnd, rowCtx)])
			);
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
			c.setBase(compileNode(node.base, ctx));
			return c;
		}

		case 'over': {
			const c = new OverlineContainer(node.line === 'overline' ? 'over' : 'under', ctx.fill);
			c.mathFontSize = ctx.fontSize;
			c.setInner(compileNode(node.inner, ctx));
			return c;
		}

		case 'brace': {
			const c = new BraceContainer(node.position, ctx.mathFont, ctx.fontSize, ctx.fill);
			c.mathFontSize = ctx.fontSize;
			c.setInner(compileNode(node.inner, ctx));
			if (node.label) {
				c.setLabel(
					compileNode(node.label, withSize(ctx, ctx.fontSize * MathSizes.BraceLabel))
				);
			}
			return c;
		}

		case 'lim': {
			// lim x→a body — column of [lim, x→a] then row with body.
			const limAtom = new AtomContainer('lim', ctx.bodyFont, ctx.fontSize, ctx.fill);
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
				depth: ctx.depth + 1
			};
			return compileNode(node.child, childCtx);
		}

		case 'namedOp': {
			// Render the name as a body-font atom, then attach scripts
			// via a SubsupContainer if present, then append function-
			// spacing as a SpaceContainer.
			const nameAtom = new AtomContainer(node.name, ctx.bodyFont, ctx.fontSize, ctx.fill);
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
			c.setBase(compileNode(node.base, ctx));
			const idxCtx = withSize(ctx, ctx.fontSize * MathSizes.TensorIndex);
			c.setIndices(
				node.upper.map((u) => compileNode(u, idxCtx)),
				node.lower.map((l) => compileNode(l, idxCtx))
			);
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
			c.setBase(compileNode(node.base, ctx));
			const lineCtx = withSize(ctx, ctx.fontSize * MathSizes.StackedSub);
			c.setLines(node.lines.map((l) => compileNode(l, lineCtx)));
			return c;
		}

		case 'prime': {
			const c = new PrimeContainer(node.count, ctx.mathFont, ctx.fontSize, ctx.fill);
			c.mathFontSize = ctx.fontSize;
			c.setBase(compileNode(node.base, ctx));
			return c;
		}

		case 'binom': {
			const inner = new NoRuleFractionContainer();
			inner.mathFontSize = ctx.fontSize;
			const childCtx = withSize(ctx, ctx.fontSize * MathSizes.BinomTopLevel);
			inner.setNumerator(compileNode(node.n, childCtx));
			inner.setDenominator(compileNode(node.k, childCtx));
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
			c.setBase(compileNode(node.base, ctx));
			const scriptCtx = withSize(ctx, ctx.fontSize * MathSizes.Prescript);
			if (node.sub) c.setSub(compileNode(node.sub, scriptCtx));
			if (node.sup) c.setSup(compileNode(node.sup, scriptCtx));
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
