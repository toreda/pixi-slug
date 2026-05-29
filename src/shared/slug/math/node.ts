import type {Rgba} from '../../../rgba';
import type {SlugTextFontInput} from '../text/init';

/**
 * Per-node style override applied via `m.styled(child, style)`. Layered
 * on top of the child's resolved style; fields left undefined inherit.
 * `variant` substitutes the corresponding Unicode-math-alphanumeric code
 * points before glyph lookup (R → ℝ under 'bb', etc.).
 */
export interface MathNodeStyle {
	color?: Rgba;
	font?: SlugTextFontInput;
	fontSize?: number;
	mathFont?: SlugTextFontInput;
	variant?: 'normal' | 'bb' | 'cal' | 'frak' | 'script';
}

/**
 * Per-slot scale overrides forwarded from a builder call to the
 * corresponding `MathContainer` constructor. Each field is a multiplier
 * applied to the enclosing fontSize for one slot of one formula kind
 * (`m.frac(...).scales.num`, `m.summation(...).scales.symbol`, etc.).
 *
 * When a field is supplied the container uses it as both its default
 * scale AND its at-depth scale — the depth-based auto-shrink (nested
 * fractions to 0.7, nested sub/sup to 0.5, etc.) is skipped for any
 * slot the user explicitly set. Fields left undefined fall back to the
 * container's hard-coded default and the depth rule still applies.
 *
 * Shapes are split per-kind so the type checker enforces which slots
 * each kind has; see the `scales?` field on the per-kind variants of
 * `MathNode`.
 */
export interface SubsupScales {
	base?: number;
	sub?: number;
	sup?: number;
}
export interface FracScales {
	num?: number;
	den?: number;
}
export interface SqrtScales {
	radicand?: number;
	index?: number;
}
export interface BigOpScales {
	upper?: number;
	lower?: number;
	body?: number;
	/** Big-op operator glyph (∑ ∏ ∫ …). Independent of the slot scales. */
	symbol?: number;
}
export interface FenceScales {
	inner?: number;
}
export interface MatrixScales {
	cell?: number;
}
export interface CasesScales {
	case?: number;
}
export interface AccentScales {
	base?: number;
	accent?: number;
}
export interface OverScales {
	inner?: number;
}
export interface BraceScales {
	inner?: number;
	label?: number;
}
export interface TensorScales {
	base?: number;
	index?: number;
}
export interface StackedSubScales {
	base?: number;
	line?: number;
}
export interface PrimeScales {
	base?: number;
}
export interface BinomScales {
	n?: number;
	k?: number;
}
export interface PrescriptScales {
	base?: number;
	sub?: number;
	sup?: number;
}

/**
 * Discriminated union representing every kind of math expression the
 * layout engine knows how to render. Construct via the `MathBuilder`
 * (see `MathText.build`) — direct literal construction is unsupported
 * and may break across spec revisions.
 *
 * Layout rules per kind live in `src/shared/slug/math/layout/`; sizing
 * constants in `src/shared/slug/math/layout/sizes.ts`. See spec §5.6.
 */
export type MathNode =
	| {kind: 'text'; text: string; useMathFont: boolean}
	| {kind: 'space'; em: number}
	| {kind: 'sup'; base: MathNode; sup: MathNode; scales?: SubsupScales}
	| {kind: 'sub'; base: MathNode; sub: MathNode; scales?: SubsupScales}
	| {kind: 'subsup'; base: MathNode; sub: MathNode; sup: MathNode; scales?: SubsupScales}
	| {kind: 'frac'; num: MathNode; den: MathNode; scales?: FracScales}
	| {kind: 'sqrt'; radicand: MathNode; scales?: SqrtScales}
	| {kind: 'nthroot'; index: MathNode; radicand: MathNode; scales?: SqrtScales}
	| {
			kind: 'bigop';
			symbol: string;
			lower: MathNode | null;
			upper: MathNode | null;
			body: MathNode;
			integralStyle: boolean;
			scales?: BigOpScales;
	  }
	| {kind: 'fence'; left: string; right: string; inner: MathNode; scales?: FenceScales}
	| {
			kind: 'fenceSep';
			left: string;
			right: string;
			children: MathNode[];
			separator: string;
			scales?: FenceScales;
	  }
	| {
			kind: 'matrix';
			rows: MathNode[][];
			fence: 'paren' | 'bracket' | 'brace' | 'abs' | 'none';
			augmentCol: number | null;
			scales?: MatrixScales;
	  }
	| {kind: 'cases'; cases: [MathNode, MathNode][]; scales?: CasesScales}
	| {kind: 'aligned'; rows: MathNode[][]; anchor: number}
	| {
			kind: 'accent';
			base: MathNode;
			accent: 'vec' | 'hat' | 'bar' | 'dot' | 'ddot' | 'tilde';
			scales?: AccentScales;
	  }
	| {kind: 'over'; inner: MathNode; line: 'overline' | 'underline'; scales?: OverScales}
	| {
			kind: 'brace';
			inner: MathNode;
			label: MathNode | null;
			position: 'over' | 'under';
			scales?: BraceScales;
	  }
	| {kind: 'lim'; var_: MathNode; target: MathNode; body: MathNode}
	| {kind: 'row'; children: MathNode[]}
	| {kind: 'column'; children: MathNode[]}
	| {kind: 'styled'; child: MathNode; style: MathNodeStyle}
	| {kind: 'namedOp'; name: string; sub: MathNode | null; sup: MathNode | null}
	| {kind: 'op'; symbol: string; sub: MathNode | null; sup: MathNode | null}
	| {
			kind: 'tensor';
			base: MathNode;
			upper: MathNode[];
			lower: MathNode[];
			scales?: TensorScales;
	  }
	| {kind: 'map'; name: MathNode; from: MathNode; to: MathNode; mapsTo: MathNode | null}
	| {kind: 'stackedSub'; base: MathNode; lines: MathNode[]; scales?: StackedSubScales}
	| {kind: 'prime'; base: MathNode; count: number; scales?: PrimeScales}
	| {kind: 'binom'; n: MathNode; k: MathNode; scales?: BinomScales}
	| {kind: 'ellipsis'; style: 'baseline' | 'center' | 'vertical' | 'diagonal'}
	| {
			kind: 'prescript';
			base: MathNode;
			sub: MathNode | null;
			sup: MathNode | null;
			scales?: PrescriptScales;
	  };

/** All `kind` values, for exhaustive switches. */
export type MathNodeKind = MathNode['kind'];

/**
 * Total `MathNode` count in a tree, counting the root and every descendant
 * node (children of `row`/`column`/`matrix`/`cases`/`aligned`/`fenceSep`/
 * `tensor`/`stackedSub`, base+sub+sup of script-like kinds, num+den of
 * fractions, slots of big-ops, etc.). For multi-line input pass each line
 * separately and sum.
 *
 * Useful for diagnostics and budgeting — a formula of `nodeCount` N
 * creates O(N) `MathContainer`s and at most N `SlugText` leaves.
 */
export function mathNodeCount(node: MathNode): number {
	switch (node.kind) {
		case 'text':
		case 'space':
		case 'ellipsis':
			return 1;
		case 'sup':
			return 1 + mathNodeCount(node.base) + mathNodeCount(node.sup);
		case 'sub':
			return 1 + mathNodeCount(node.base) + mathNodeCount(node.sub);
		case 'subsup':
			return 1 + mathNodeCount(node.base) + mathNodeCount(node.sub) + mathNodeCount(node.sup);
		case 'frac':
			return 1 + mathNodeCount(node.num) + mathNodeCount(node.den);
		case 'sqrt':
			return 1 + mathNodeCount(node.radicand);
		case 'nthroot':
			return 1 + mathNodeCount(node.index) + mathNodeCount(node.radicand);
		case 'bigop': {
			let n = 1 + mathNodeCount(node.body);
			if (node.lower) n += mathNodeCount(node.lower);
			if (node.upper) n += mathNodeCount(node.upper);
			return n;
		}
		case 'fence':
			return 1 + mathNodeCount(node.inner);
		case 'fenceSep': {
			let n = 1;
			for (const c of node.children) n += mathNodeCount(c);
			return n;
		}
		case 'matrix': {
			let n = 1;
			for (const row of node.rows) for (const c of row) n += mathNodeCount(c);
			return n;
		}
		case 'cases': {
			let n = 1;
			for (const [v, c] of node.cases) n += mathNodeCount(v) + mathNodeCount(c);
			return n;
		}
		case 'aligned': {
			let n = 1;
			for (const row of node.rows) for (const c of row) n += mathNodeCount(c);
			return n;
		}
		case 'accent':
			return 1 + mathNodeCount(node.base);
		case 'over':
			return 1 + mathNodeCount(node.inner);
		case 'brace':
			return 1 + mathNodeCount(node.inner) + (node.label ? mathNodeCount(node.label) : 0);
		case 'lim':
			return 1 + mathNodeCount(node.var_) + mathNodeCount(node.target) + mathNodeCount(node.body);
		case 'row':
		case 'column': {
			let n = 1;
			for (const c of node.children) n += mathNodeCount(c);
			return n;
		}
		case 'styled':
			return 1 + mathNodeCount(node.child);
		case 'namedOp':
		case 'op':
			return 1 + (node.sub ? mathNodeCount(node.sub) : 0) + (node.sup ? mathNodeCount(node.sup) : 0);
		case 'tensor': {
			let n = 1 + mathNodeCount(node.base);
			for (const u of node.upper) n += mathNodeCount(u);
			for (const l of node.lower) n += mathNodeCount(l);
			return n;
		}
		case 'map':
			return (
				1 +
				mathNodeCount(node.name) +
				mathNodeCount(node.from) +
				mathNodeCount(node.to) +
				(node.mapsTo ? mathNodeCount(node.mapsTo) : 0)
			);
		case 'stackedSub': {
			let n = 1 + mathNodeCount(node.base);
			for (const l of node.lines) n += mathNodeCount(l);
			return n;
		}
		case 'prime':
			return 1 + mathNodeCount(node.base);
		case 'binom':
			return 1 + mathNodeCount(node.n) + mathNodeCount(node.k);
		case 'prescript':
			return (
				1 +
				mathNodeCount(node.base) +
				(node.sub ? mathNodeCount(node.sub) : 0) +
				(node.sup ? mathNodeCount(node.sup) : 0)
			);
		default: {
			const _exhaustive: never = node;
			void _exhaustive;
			return 1;
		}
	}
}
