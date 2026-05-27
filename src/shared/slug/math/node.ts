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
	| {kind: 'sup'; base: MathNode; sup: MathNode}
	| {kind: 'sub'; base: MathNode; sub: MathNode}
	| {kind: 'subsup'; base: MathNode; sub: MathNode; sup: MathNode}
	| {kind: 'frac'; num: MathNode; den: MathNode}
	| {kind: 'sqrt'; radicand: MathNode}
	| {kind: 'nthroot'; index: MathNode; radicand: MathNode}
	| {
			kind: 'bigop';
			symbol: string;
			lower: MathNode | null;
			upper: MathNode | null;
			body: MathNode;
			integralStyle: boolean;
	  }
	| {kind: 'fence'; left: string; right: string; inner: MathNode}
	| {kind: 'fenceSep'; left: string; right: string; children: MathNode[]; separator: string}
	| {
			kind: 'matrix';
			rows: MathNode[][];
			fence: 'paren' | 'bracket' | 'brace' | 'abs' | 'none';
			augmentCol: number | null;
	  }
	| {kind: 'cases'; cases: [MathNode, MathNode][]}
	| {kind: 'aligned'; rows: MathNode[][]; anchor: number}
	| {kind: 'accent'; base: MathNode; accent: 'vec' | 'hat' | 'bar' | 'dot' | 'ddot' | 'tilde'}
	| {kind: 'over'; inner: MathNode; line: 'overline' | 'underline'}
	| {kind: 'brace'; inner: MathNode; label: MathNode | null; position: 'over' | 'under'}
	| {kind: 'lim'; var_: MathNode; target: MathNode; body: MathNode}
	| {kind: 'row'; children: MathNode[]}
	| {kind: 'column'; children: MathNode[]}
	| {kind: 'styled'; child: MathNode; style: MathNodeStyle}
	| {kind: 'namedOp'; name: string; sub: MathNode | null; sup: MathNode | null}
	| {kind: 'op'; symbol: string; sub: MathNode | null; sup: MathNode | null}
	| {kind: 'tensor'; base: MathNode; upper: MathNode[]; lower: MathNode[]}
	| {kind: 'map'; name: MathNode; from: MathNode; to: MathNode; mapsTo: MathNode | null}
	| {kind: 'stackedSub'; base: MathNode; lines: MathNode[]}
	| {kind: 'prime'; base: MathNode; count: number}
	| {kind: 'binom'; n: MathNode; k: MathNode}
	| {kind: 'ellipsis'; style: 'baseline' | 'center' | 'vertical' | 'diagonal'}
	| {kind: 'prescript'; base: MathNode; sub: MathNode | null; sup: MathNode | null};

/** All `kind` values, for exhaustive switches. */
export type MathNodeKind = MathNode['kind'];
