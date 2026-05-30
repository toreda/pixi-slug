import type {
	AccentScales,
	BigOpScales,
	BinomScales,
	BraceScales,
	CasesScales,
	FenceScales,
	FracScales,
	MathNode,
	MathNodeStyle,
	MatrixScales,
	OverScales,
	PrescriptScales,
	PrimeScales,
	SqrtScales,
	SqrtVAlign,
	StackedSubScales,
	SubsupScales,
	TensorScales
} from './node';

/**
 * Argument accepted anywhere a {@link MathNode} is required. Bare
 * strings auto-wrap to `m.text(s)` so common formulas stay terse.
 */
export type MathInput = MathNode | string;

function wrap(input: MathInput): MathNode {
	if (typeof input === 'string') {
		return {kind: 'text', text: input, useMathFont: false};
	}
	return input;
}

function wrapMaybe(input: MathInput | null | undefined): MathNode | null {
	if (input === null || input === undefined) return null;
	return wrap(input);
}

/**
 * A plain text atom usable as a SlugText-native script: either a bare
 * string or a `kind:'text'` node. Returns its `{text, useMathFont}` or
 * `null` if the input is a sub-expression that can't ride as a trailing
 * string on a single SlugText run.
 */
function asTextAtom(input: MathInput): {text: string; useMathFont: boolean} | null {
	if (typeof input === 'string') return {text: input, useMathFont: false};
	if (input.kind === 'text') return {text: input.text, useMathFont: input.useMathFont};
	return null;
}

/**
 * Build a sub/superscript node, preferring SlugText's built-in trailing-
 * script feature (`slugScript`) when the base AND every present script are
 * simple text atoms (`xᵢ`, `a²`, `x²ᵢ`). The native path renders the
 * scripts on the SAME SlugText run as the base — visually correct and the
 * only fully-working path. When the base or a script is a sub-expression
 * (fraction, root, nested script, …) the trailing-string model can't
 * express it, so fall back to the `SubsupContainer` layout (`sub`/`sup`/
 * `subsup` nodes). The script run inherits the base atom's font flag.
 */
function scriptNode(
	base: MathInput,
	sub: MathInput | null,
	sup: MathInput | null,
	scales: SubsupScales | undefined
): MathNode {
	const baseAtom = asTextAtom(base);
	const subAtom = sub === null ? null : asTextAtom(sub);
	const supAtom = sup === null ? null : asTextAtom(sup);
	const subOk = sub === null || subAtom !== null;
	const supOk = sup === null || supAtom !== null;

	if (baseAtom && subOk && supOk) {
		return {
			kind: 'slugScript',
			text: baseAtom.text,
			useMathFont: baseAtom.useMathFont,
			superscript: supAtom?.text ?? '',
			subscript: subAtom?.text ?? '',
			supFontSize: null,
			subFontSize: null
		};
	}

	// Fallback: layout path for sub-expression scripts/bases.
	if (sub !== null && sup !== null) {
		return {kind: 'subsup', base: wrap(base), sub: wrap(sub), sup: wrap(sup), scales};
	}
	if (sub !== null) {
		return {kind: 'sub', base: wrap(base), sub: wrap(sub), scales};
	}
	return {kind: 'sup', base: wrap(base), sup: wrap(sup as MathInput), scales};
}

/**
 * Construction surface for math formulas. Every method returns an
 * immutable {@link MathNode}; consumers compose subtrees freely.
 *
 * Obtain a builder via `MathText.build(m => …)`. The returned tree is
 * passed to `new MathText({formula})` or `mathText.setFormula(...)`.
 * See spec §5.2–§5.3 for the full surface.
 */
export interface MathBuilder {
	// --- Atoms ----------------------------------------------------------
	text(s: string): MathNode;
	mathText(s: string): MathNode;
	space(em: number): MathNode;

	/**
	 * A single text run that renders its sub/superscript using SlugText's
	 * built-in script feature instead of the math engine's `SubsupContainer`
	 * layout. `opts.superscript` / `opts.subscript` are trailing strings
	 * appended to `base` on the same SlugText; `opts.supFontSize` /
	 * `opts.subFontSize` override the script pixel size (omit to derive from
	 * the base size). `opts.useMathFont` routes the run through the math
	 * font (matches `m.mathText`).
	 *
	 * `m.sup`/`m.sub`/`m.subsup` now route to this same native path
	 * automatically when their base and scripts are simple text atoms, so
	 * `m.sub('x', 'i')` and `m.slug('x', {subscript: 'i'})` are equivalent.
	 * Reach for `m.slug` directly only when you need the per-script font-
	 * size overrides (`supFontSize`/`subFontSize`); use the `sup`/`sub`
	 * family when a script is itself a sub-expression the trailing-string
	 * model cannot express.
	 */
	slug(
		base: string,
		opts?: {
			superscript?: string;
			subscript?: string;
			supFontSize?: number | null;
			subFontSize?: number | null;
			useMathFont?: boolean;
		}
	): MathNode;

	// --- Scripts --------------------------------------------------------
	/**
	 * Superscript `base^sup`. When BOTH `base` and `sup` are simple text
	 * atoms (a bare string or `m.text`/`m.mathText`) this routes to
	 * SlugText's built-in trailing-script feature (same as {@link slug}) —
	 * the scripts ride on the base's SlugText run, which is the visually
	 * correct, fully-working path. When either side is a sub-expression
	 * (fraction, root, nested script, …) it falls back to the
	 * `SubsupContainer` layout. `opts.scales` only applies on the fallback
	 * path. See {@link sub} / {@link subsup} for the sub/both forms.
	 */
	sup(base: MathInput, sup: MathInput, opts?: {scales?: SubsupScales}): MathNode;
	/**
	 * Subscript `base_sub` (e.g. `xᵢ`). Routes to SlugText's built-in
	 * trailing-script feature when `base` and `sub` are simple text atoms,
	 * else falls back to `SubsupContainer`. See {@link sup} for routing
	 * details.
	 */
	sub(base: MathInput, sub: MathInput, opts?: {scales?: SubsupScales}): MathNode;
	/**
	 * Combined sub+superscript `base_sub^sup` (e.g. `x²ᵢ`). Routes to
	 * SlugText's built-in script feature when `base`, `sub` and `sup` are
	 * all simple text atoms, else falls back to `SubsupContainer`. See
	 * {@link sup} for routing details.
	 */
	subsup(
		base: MathInput,
		sub: MathInput,
		sup: MathInput,
		opts?: {scales?: SubsupScales}
	): MathNode;

	// --- Fractions and roots --------------------------------------------
	frac(num: MathInput, den: MathInput, opts?: {scales?: FracScales}): MathNode;
	sqrt(radicand: MathInput, opts?: {scales?: SqrtScales; vAlign?: SqrtVAlign}): MathNode;
	nthroot(
		index: MathInput,
		radicand: MathInput,
		opts?: {scales?: SqrtScales; vAlign?: SqrtVAlign}
	): MathNode;

	// --- Big operators --------------------------------------------------
	summation(
		lower: MathInput | null,
		upper: MathInput | null,
		body: MathInput,
		opts?: {scales?: BigOpScales}
	): MathNode;
	product(
		lower: MathInput | null,
		upper: MathInput | null,
		body: MathInput,
		opts?: {scales?: BigOpScales}
	): MathNode;
	integral(
		lower: MathInput | null,
		upper: MathInput | null,
		body: MathInput,
		opts?: {scales?: BigOpScales}
	): MathNode;
	bigOp(
		symbol: string,
		lower: MathInput | null,
		upper: MathInput | null,
		body: MathInput,
		opts?: {scales?: BigOpScales}
	): MathNode;
	contour(
		lower: MathInput | null,
		upper: MathInput | null,
		body: MathInput,
		opts?: {scales?: BigOpScales}
	): MathNode;
	doubleIntegral(
		lower: MathInput | null,
		upper: MathInput | null,
		body: MathInput,
		opts?: {scales?: BigOpScales}
	): MathNode;
	tripleIntegral(
		lower: MathInput | null,
		upper: MathInput | null,
		body: MathInput,
		opts?: {scales?: BigOpScales}
	): MathNode;
	surfaceIntegral(
		lower: MathInput | null,
		upper: MathInput | null,
		body: MathInput,
		opts?: {scales?: BigOpScales}
	): MathNode;

	// --- Fences ---------------------------------------------------------
	paren(inner: MathInput, opts?: {scales?: FenceScales}): MathNode;
	bracket(inner: MathInput, opts?: {scales?: FenceScales}): MathNode;
	brace(inner: MathInput, opts?: {scales?: FenceScales}): MathNode;
	angle(inner: MathInput, opts?: {scales?: FenceScales}): MathNode;
	abs(inner: MathInput, opts?: {scales?: FenceScales}): MathNode;
	norm(inner: MathInput, opts?: {scales?: FenceScales}): MathNode;
	floor(inner: MathInput, opts?: {scales?: FenceScales}): MathNode;
	ceil(inner: MathInput, opts?: {scales?: FenceScales}): MathNode;
	fence(left: string, right: string, inner: MathInput, opts?: {scales?: FenceScales}): MathNode;
	fenceSep(
		left: string,
		right: string,
		children: MathInput[],
		separator?: string,
		opts?: {scales?: FenceScales}
	): MathNode;
	bra(phi: MathInput, opts?: {scales?: FenceScales}): MathNode;
	ket(psi: MathInput, opts?: {scales?: FenceScales}): MathNode;
	braket(phi: MathInput, psi: MathInput, opts?: {scales?: FenceScales}): MathNode;
	bracketOp(phi: MathInput, op: MathInput, psi: MathInput, opts?: {scales?: FenceScales}): MathNode;
	setBuilder(x: MathInput, condition: MathInput, opts?: {scales?: FenceScales}): MathNode;

	// --- Matrices & systems ---------------------------------------------
	matrix(
		rows: MathInput[][],
		fence?: 'paren' | 'bracket' | 'brace' | 'abs' | 'none',
		options?: {augmentCol?: number | null; scales?: MatrixScales}
	): MathNode;
	cases(cases: [MathInput, MathInput][], opts?: {scales?: CasesScales}): MathNode;
	aligned(rows: MathInput[][], anchor?: number): MathNode;

	// --- Accents / decorations ------------------------------------------
	vec(base: MathInput, opts?: {scales?: AccentScales}): MathNode;
	hat(base: MathInput, opts?: {scales?: AccentScales}): MathNode;
	bar(base: MathInput, opts?: {scales?: AccentScales}): MathNode;
	dot(base: MathInput, opts?: {scales?: AccentScales}): MathNode;
	ddot(base: MathInput, opts?: {scales?: AccentScales}): MathNode;
	tilde(base: MathInput, opts?: {scales?: AccentScales}): MathNode;
	overline(inner: MathInput, opts?: {scales?: OverScales}): MathNode;
	underline(inner: MathInput, opts?: {scales?: OverScales}): MathNode;
	overbrace(inner: MathInput, label?: MathInput | null, opts?: {scales?: BraceScales}): MathNode;
	underbrace(inner: MathInput, label?: MathInput | null, opts?: {scales?: BraceScales}): MathNode;
	lim(var_: MathInput, target: MathInput, body: MathInput): MathNode;

	// --- Grouping & layout ----------------------------------------------
	row(...children: MathInput[]): MathNode;
	column(...children: MathInput[]): MathNode;
	styled(child: MathInput, style: MathNodeStyle): MathNode;

	// --- Named operators (upright, function-spacing) --------------------
	namedOp(name: string, sub?: MathInput | null, sup?: MathInput | null): MathNode;
	sin(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	cos(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	tan(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	cot(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	sec(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	csc(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	arcsin(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	arccos(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	arctan(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	sinh(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	cosh(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	tanh(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	log(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	ln(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	exp(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	det(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	tr(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	dim(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	rank(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	gcd(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	max(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	min(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	sup_(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	inf_(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	mod(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	Re(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	Im(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	arg(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	ker(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	span(sub?: MathInput | null, sup?: MathInput | null): MathNode;
	hom(sub?: MathInput | null, sup?: MathInput | null): MathNode;

	// --- Op atoms with math-class spacing -------------------------------
	op(symbol: string, sub?: MathInput | null, sup?: MathInput | null): MathNode;
	times(): MathNode;
	cdot(): MathNode;
	pm(): MathNode;
	mp(): MathNode;
	leq(): MathNode;
	geq(): MathNode;
	neq(): MathNode;
	approx(): MathNode;
	equiv(): MathNode;
	cong(): MathNode;
	sim(): MathNode;
	to(): MathNode;
	mapsto(): MathNode;
	implies(): MathNode;
	iff_(): MathNode;
	Implies(): MathNode;
	iff_long(): MathNode;
	in_(): MathNode;
	notIn(): MathNode;
	subset(): MathNode;
	subseteq(): MathNode;
	cup(): MathNode;
	cap(): MathNode;
	emptySet(): MathNode;
	land(): MathNode;
	lor(): MathNode;
	lnot(): MathNode;
	forall(): MathNode;
	exists(): MathNode;
	infty(): MathNode;
	circ(): MathNode;
	oplus(): MathNode;
	otimes(): MathNode;
	degree(): MathNode;

	// --- Survey-driven additional primitives ----------------------------
	tensor(
		base: MathInput,
		upper: MathInput[],
		lower: MathInput[],
		opts?: {scales?: TensorScales}
	): MathNode;
	map(name: MathInput, from: MathInput, to: MathInput, mapsTo?: MathInput | null): MathNode;
	stackedSub(base: MathInput, ...lines: MathInput[]): MathNode;
	prime(base: MathInput, count?: number, opts?: {scales?: PrimeScales}): MathNode;
	binom(n: MathInput, k: MathInput, opts?: {scales?: BinomScales}): MathNode;
	ellipsis(style?: 'baseline' | 'center' | 'vertical' | 'diagonal'): MathNode;
	prescript(
		base: MathInput,
		sub?: MathInput | null,
		sup?: MathInput | null,
		opts?: {scales?: PrescriptScales}
	): MathNode;
}

/**
 * Internal helper: build a named-op node with optional scripts. All
 * preset functions in §5.3.1 reduce to this.
 */
function namedOpNode(
	name: string,
	sub: MathInput | null | undefined,
	sup: MathInput | null | undefined
): MathNode {
	return {kind: 'namedOp', name, sub: wrapMaybe(sub), sup: wrapMaybe(sup)};
}

/**
 * Internal helper: build an op-atom node. All preset op functions in
 * §5.3.3 reduce to this.
 */
function opNode(
	symbol: string,
	sub: MathInput | null | undefined,
	sup: MathInput | null | undefined
): MathNode {
	return {kind: 'op', symbol, sub: wrapMaybe(sub), sup: wrapMaybe(sup)};
}

/**
 * Singleton {@link MathBuilder} instance. Stateless — every method
 * constructs a fresh {@link MathNode} from its inputs.
 */
export const mathBuilder: MathBuilder = {
	text: (s) => ({kind: 'text', text: s, useMathFont: false}),
	mathText: (s) => ({kind: 'text', text: s, useMathFont: true}),
	space: (em) => ({kind: 'space', em}),

	slug: (base, opts) => ({
		kind: 'slugScript',
		text: base,
		useMathFont: opts?.useMathFont ?? false,
		superscript: opts?.superscript ?? '',
		subscript: opts?.subscript ?? '',
		supFontSize: opts?.supFontSize ?? null,
		subFontSize: opts?.subFontSize ?? null
	}),

	sup: (base, sup, opts) => scriptNode(base, null, sup, opts?.scales),
	sub: (base, sub, opts) => scriptNode(base, sub, null, opts?.scales),
	subsup: (base, sub, sup, opts) => scriptNode(base, sub, sup, opts?.scales),

	frac: (num, den, opts) => ({
		kind: 'frac',
		num: wrap(num),
		den: wrap(den),
		scales: opts?.scales
	}),
	sqrt: (radicand, opts) => ({
		kind: 'sqrt',
		radicand: wrap(radicand),
		scales: opts?.scales,
		vAlign: opts?.vAlign
	}),
	nthroot: (index, radicand, opts) => ({
		kind: 'nthroot',
		index: wrap(index),
		radicand: wrap(radicand),
		scales: opts?.scales,
		vAlign: opts?.vAlign
	}),

	summation: (lower, upper, body, opts) => ({
		kind: 'bigop',
		symbol: '∑',
		lower: wrapMaybe(lower),
		upper: wrapMaybe(upper),
		body: wrap(body),
		integralStyle: false,
		scales: opts?.scales
	}),
	product: (lower, upper, body, opts) => ({
		kind: 'bigop',
		symbol: '∏',
		lower: wrapMaybe(lower),
		upper: wrapMaybe(upper),
		body: wrap(body),
		integralStyle: false,
		scales: opts?.scales
	}),
	integral: (lower, upper, body, opts) => ({
		kind: 'bigop',
		symbol: '∫',
		lower: wrapMaybe(lower),
		upper: wrapMaybe(upper),
		body: wrap(body),
		integralStyle: true,
		scales: opts?.scales
	}),
	bigOp: (symbol, lower, upper, body, opts) => ({
		kind: 'bigop',
		symbol,
		lower: wrapMaybe(lower),
		upper: wrapMaybe(upper),
		body: wrap(body),
		integralStyle: false,
		scales: opts?.scales
	}),
	contour: (lower, upper, body, opts) => ({
		kind: 'bigop',
		symbol: '∮',
		lower: wrapMaybe(lower),
		upper: wrapMaybe(upper),
		body: wrap(body),
		integralStyle: true,
		scales: opts?.scales
	}),
	doubleIntegral: (lower, upper, body, opts) => ({
		kind: 'bigop',
		symbol: '∬',
		lower: wrapMaybe(lower),
		upper: wrapMaybe(upper),
		body: wrap(body),
		integralStyle: true,
		scales: opts?.scales
	}),
	tripleIntegral: (lower, upper, body, opts) => ({
		kind: 'bigop',
		symbol: '∭',
		lower: wrapMaybe(lower),
		upper: wrapMaybe(upper),
		body: wrap(body),
		integralStyle: true,
		scales: opts?.scales
	}),
	surfaceIntegral: (lower, upper, body, opts) => ({
		kind: 'bigop',
		symbol: '∯',
		lower: wrapMaybe(lower),
		upper: wrapMaybe(upper),
		body: wrap(body),
		integralStyle: true,
		scales: opts?.scales
	}),

	paren: (inner, opts) => ({
		kind: 'fence',
		left: '(',
		right: ')',
		inner: wrap(inner),
		scales: opts?.scales
	}),
	bracket: (inner, opts) => ({
		kind: 'fence',
		left: '[',
		right: ']',
		inner: wrap(inner),
		scales: opts?.scales
	}),
	brace: (inner, opts) => ({
		kind: 'fence',
		left: '{',
		right: '}',
		inner: wrap(inner),
		scales: opts?.scales
	}),
	angle: (inner, opts) => ({
		kind: 'fence',
		left: '⟨',
		right: '⟩',
		inner: wrap(inner),
		scales: opts?.scales
	}),
	abs: (inner, opts) => ({
		kind: 'fence',
		left: '|',
		right: '|',
		inner: wrap(inner),
		scales: opts?.scales
	}),
	norm: (inner, opts) => ({
		kind: 'fence',
		left: '‖',
		right: '‖',
		inner: wrap(inner),
		scales: opts?.scales
	}),
	floor: (inner, opts) => ({
		kind: 'fence',
		left: '⌊',
		right: '⌋',
		inner: wrap(inner),
		scales: opts?.scales
	}),
	ceil: (inner, opts) => ({
		kind: 'fence',
		left: '⌈',
		right: '⌉',
		inner: wrap(inner),
		scales: opts?.scales
	}),
	fence: (left, right, inner, opts) => ({
		kind: 'fence',
		left,
		right,
		inner: wrap(inner),
		scales: opts?.scales
	}),
	fenceSep: (left, right, children, separator = '|', opts) => ({
		kind: 'fenceSep',
		left,
		right,
		children: children.map(wrap),
		separator,
		scales: opts?.scales
	}),
	bra: (phi, opts) => ({
		kind: 'fence',
		left: '⟨',
		right: '|',
		inner: wrap(phi),
		scales: opts?.scales
	}),
	ket: (psi, opts) => ({
		kind: 'fence',
		left: '|',
		right: '⟩',
		inner: wrap(psi),
		scales: opts?.scales
	}),
	braket: (phi, psi, opts) => ({
		kind: 'fenceSep',
		left: '⟨',
		right: '⟩',
		children: [wrap(phi), wrap(psi)],
		separator: '|',
		scales: opts?.scales
	}),
	bracketOp: (phi, op, psi, opts) => ({
		kind: 'fenceSep',
		left: '⟨',
		right: '⟩',
		children: [wrap(phi), wrap(op), wrap(psi)],
		separator: '|',
		scales: opts?.scales
	}),
	setBuilder: (x, condition, opts) => ({
		kind: 'fenceSep',
		left: '{',
		right: '}',
		children: [wrap(x), wrap(condition)],
		separator: '|',
		scales: opts?.scales
	}),

	matrix: (rows, fence = 'bracket', options) => ({
		kind: 'matrix',
		rows: rows.map((r) => r.map(wrap)),
		fence,
		augmentCol: options?.augmentCol ?? null,
		scales: options?.scales
	}),
	cases: (cases, opts) => ({
		kind: 'cases',
		cases: cases.map(([v, c]) => [wrap(v), wrap(c)] as [MathNode, MathNode]),
		scales: opts?.scales
	}),
	aligned: (rows, anchor = 1) => ({
		kind: 'aligned',
		rows: rows.map((r) => r.map(wrap)),
		anchor
	}),

	vec: (base, opts) => ({kind: 'accent', base: wrap(base), accent: 'vec', scales: opts?.scales}),
	hat: (base, opts) => ({kind: 'accent', base: wrap(base), accent: 'hat', scales: opts?.scales}),
	bar: (base, opts) => ({kind: 'accent', base: wrap(base), accent: 'bar', scales: opts?.scales}),
	dot: (base, opts) => ({kind: 'accent', base: wrap(base), accent: 'dot', scales: opts?.scales}),
	ddot: (base, opts) => ({kind: 'accent', base: wrap(base), accent: 'ddot', scales: opts?.scales}),
	tilde: (base, opts) => ({
		kind: 'accent',
		base: wrap(base),
		accent: 'tilde',
		scales: opts?.scales
	}),
	overline: (inner, opts) => ({
		kind: 'over',
		inner: wrap(inner),
		line: 'overline',
		scales: opts?.scales
	}),
	underline: (inner, opts) => ({
		kind: 'over',
		inner: wrap(inner),
		line: 'underline',
		scales: opts?.scales
	}),
	overbrace: (inner, label, opts) => ({
		kind: 'brace',
		inner: wrap(inner),
		label: wrapMaybe(label),
		position: 'over',
		scales: opts?.scales
	}),
	underbrace: (inner, label, opts) => ({
		kind: 'brace',
		inner: wrap(inner),
		label: wrapMaybe(label),
		position: 'under',
		scales: opts?.scales
	}),
	lim: (var_, target, body) => ({
		kind: 'lim',
		var_: wrap(var_),
		target: wrap(target),
		body: wrap(body)
	}),

	row: (...children) => ({kind: 'row', children: children.map(wrap)}),
	column: (...children) => ({kind: 'column', children: children.map(wrap)}),
	styled: (child, style) => ({kind: 'styled', child: wrap(child), style}),

	namedOp: (name, sub, sup) => namedOpNode(name, sub, sup),
	sin: (sub, sup) => namedOpNode('sin', sub, sup),
	cos: (sub, sup) => namedOpNode('cos', sub, sup),
	tan: (sub, sup) => namedOpNode('tan', sub, sup),
	cot: (sub, sup) => namedOpNode('cot', sub, sup),
	sec: (sub, sup) => namedOpNode('sec', sub, sup),
	csc: (sub, sup) => namedOpNode('csc', sub, sup),
	arcsin: (sub, sup) => namedOpNode('arcsin', sub, sup),
	arccos: (sub, sup) => namedOpNode('arccos', sub, sup),
	arctan: (sub, sup) => namedOpNode('arctan', sub, sup),
	sinh: (sub, sup) => namedOpNode('sinh', sub, sup),
	cosh: (sub, sup) => namedOpNode('cosh', sub, sup),
	tanh: (sub, sup) => namedOpNode('tanh', sub, sup),
	log: (sub, sup) => namedOpNode('log', sub, sup),
	ln: (sub, sup) => namedOpNode('ln', sub, sup),
	exp: (sub, sup) => namedOpNode('exp', sub, sup),
	det: (sub, sup) => namedOpNode('det', sub, sup),
	tr: (sub, sup) => namedOpNode('tr', sub, sup),
	dim: (sub, sup) => namedOpNode('dim', sub, sup),
	rank: (sub, sup) => namedOpNode('rank', sub, sup),
	gcd: (sub, sup) => namedOpNode('gcd', sub, sup),
	max: (sub, sup) => namedOpNode('max', sub, sup),
	min: (sub, sup) => namedOpNode('min', sub, sup),
	sup_: (sub, sup) => namedOpNode('sup', sub, sup),
	inf_: (sub, sup) => namedOpNode('inf', sub, sup),
	mod: (sub, sup) => namedOpNode('mod', sub, sup),
	Re: (sub, sup) => namedOpNode('Re', sub, sup),
	Im: (sub, sup) => namedOpNode('Im', sub, sup),
	arg: (sub, sup) => namedOpNode('arg', sub, sup),
	ker: (sub, sup) => namedOpNode('ker', sub, sup),
	span: (sub, sup) => namedOpNode('span', sub, sup),
	hom: (sub, sup) => namedOpNode('Hom', sub, sup),

	op: (symbol, sub, sup) => opNode(symbol, sub, sup),
	times: () => opNode('×', null, null),
	cdot: () => opNode('·', null, null),
	pm: () => opNode('±', null, null),
	mp: () => opNode('∓', null, null),
	leq: () => opNode('≤', null, null),
	geq: () => opNode('≥', null, null),
	neq: () => opNode('≠', null, null),
	approx: () => opNode('≈', null, null),
	equiv: () => opNode('≡', null, null),
	cong: () => opNode('≅', null, null),
	sim: () => opNode('∼', null, null),
	to: () => opNode('→', null, null),
	mapsto: () => opNode('↦', null, null),
	implies: () => opNode('⇒', null, null),
	iff_: () => opNode('⇔', null, null),
	Implies: () => opNode('⟹', null, null),
	iff_long: () => opNode('⟺', null, null),
	in_: () => opNode('∈', null, null),
	notIn: () => opNode('∉', null, null),
	subset: () => opNode('⊂', null, null),
	subseteq: () => opNode('⊆', null, null),
	cup: () => opNode('∪', null, null),
	cap: () => opNode('∩', null, null),
	emptySet: () => opNode('∅', null, null),
	land: () => opNode('∧', null, null),
	lor: () => opNode('∨', null, null),
	lnot: () => opNode('¬', null, null),
	forall: () => opNode('∀', null, null),
	exists: () => opNode('∃', null, null),
	infty: () => opNode('∞', null, null),
	circ: () => opNode('∘', null, null),
	oplus: () => opNode('⊕', null, null),
	otimes: () => opNode('⊗', null, null),
	degree: () => opNode('°', null, null),

	tensor: (base, upper, lower, opts) => ({
		kind: 'tensor',
		base: wrap(base),
		upper: upper.map(wrap),
		lower: lower.map(wrap),
		scales: opts?.scales
	}),
	map: (name, from, to, mapsTo) => ({
		kind: 'map',
		name: wrap(name),
		from: wrap(from),
		to: wrap(to),
		mapsTo: wrapMaybe(mapsTo)
	}),
	stackedSub: (base, ...lines) => ({
		kind: 'stackedSub',
		base: wrap(base),
		lines: lines.map(wrap)
	}),
	prime: (base, count = 1, opts) => ({
		kind: 'prime',
		base: wrap(base),
		count,
		scales: opts?.scales
	}),
	binom: (n, k, opts) => ({kind: 'binom', n: wrap(n), k: wrap(k), scales: opts?.scales}),
	ellipsis: (style = 'baseline') => ({kind: 'ellipsis', style}),
	prescript: (base, sub, sup, opts) => ({
		kind: 'prescript',
		base: wrap(base),
		sub: wrapMaybe(sub),
		sup: wrapMaybe(sup),
		scales: opts?.scales
	})
};
