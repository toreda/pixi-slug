import type {MathNode, MathNodeStyle} from './node';

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

	// --- Scripts --------------------------------------------------------
	sup(base: MathInput, sup: MathInput): MathNode;
	sub(base: MathInput, sub: MathInput): MathNode;
	subsup(base: MathInput, sub: MathInput, sup: MathInput): MathNode;

	// --- Fractions and roots --------------------------------------------
	frac(num: MathInput, den: MathInput): MathNode;
	sqrt(radicand: MathInput): MathNode;
	nthroot(index: MathInput, radicand: MathInput): MathNode;

	// --- Big operators --------------------------------------------------
	summation(lower: MathInput | null, upper: MathInput | null, body: MathInput): MathNode;
	product(lower: MathInput | null, upper: MathInput | null, body: MathInput): MathNode;
	integral(lower: MathInput | null, upper: MathInput | null, body: MathInput): MathNode;
	bigOp(
		symbol: string,
		lower: MathInput | null,
		upper: MathInput | null,
		body: MathInput
	): MathNode;
	contour(lower: MathInput | null, upper: MathInput | null, body: MathInput): MathNode;
	doubleIntegral(lower: MathInput | null, upper: MathInput | null, body: MathInput): MathNode;
	tripleIntegral(lower: MathInput | null, upper: MathInput | null, body: MathInput): MathNode;
	surfaceIntegral(lower: MathInput | null, upper: MathInput | null, body: MathInput): MathNode;

	// --- Fences ---------------------------------------------------------
	paren(inner: MathInput): MathNode;
	bracket(inner: MathInput): MathNode;
	brace(inner: MathInput): MathNode;
	angle(inner: MathInput): MathNode;
	abs(inner: MathInput): MathNode;
	norm(inner: MathInput): MathNode;
	floor(inner: MathInput): MathNode;
	ceil(inner: MathInput): MathNode;
	fence(left: string, right: string, inner: MathInput): MathNode;
	fenceSep(left: string, right: string, children: MathInput[], separator?: string): MathNode;
	bra(phi: MathInput): MathNode;
	ket(psi: MathInput): MathNode;
	braket(phi: MathInput, psi: MathInput): MathNode;
	bracketOp(phi: MathInput, op: MathInput, psi: MathInput): MathNode;
	setBuilder(x: MathInput, condition: MathInput): MathNode;

	// --- Matrices & systems ---------------------------------------------
	matrix(
		rows: MathInput[][],
		fence?: 'paren' | 'bracket' | 'brace' | 'abs' | 'none',
		options?: {augmentCol?: number | null}
	): MathNode;
	cases(cases: [MathInput, MathInput][]): MathNode;
	aligned(rows: MathInput[][], anchor?: number): MathNode;

	// --- Accents / decorations ------------------------------------------
	vec(base: MathInput): MathNode;
	hat(base: MathInput): MathNode;
	bar(base: MathInput): MathNode;
	dot(base: MathInput): MathNode;
	ddot(base: MathInput): MathNode;
	tilde(base: MathInput): MathNode;
	overline(inner: MathInput): MathNode;
	underline(inner: MathInput): MathNode;
	overbrace(inner: MathInput, label?: MathInput | null): MathNode;
	underbrace(inner: MathInput, label?: MathInput | null): MathNode;
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
	tensor(base: MathInput, upper: MathInput[], lower: MathInput[]): MathNode;
	map(name: MathInput, from: MathInput, to: MathInput, mapsTo?: MathInput | null): MathNode;
	stackedSub(base: MathInput, ...lines: MathInput[]): MathNode;
	prime(base: MathInput, count?: number): MathNode;
	binom(n: MathInput, k: MathInput): MathNode;
	ellipsis(style?: 'baseline' | 'center' | 'vertical' | 'diagonal'): MathNode;
	prescript(base: MathInput, sub?: MathInput | null, sup?: MathInput | null): MathNode;
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

	sup: (base, sup) => ({kind: 'sup', base: wrap(base), sup: wrap(sup)}),
	sub: (base, sub) => ({kind: 'sub', base: wrap(base), sub: wrap(sub)}),
	subsup: (base, sub, sup) => ({
		kind: 'subsup',
		base: wrap(base),
		sub: wrap(sub),
		sup: wrap(sup)
	}),

	frac: (num, den) => ({kind: 'frac', num: wrap(num), den: wrap(den)}),
	sqrt: (radicand) => ({kind: 'sqrt', radicand: wrap(radicand)}),
	nthroot: (index, radicand) => ({
		kind: 'nthroot',
		index: wrap(index),
		radicand: wrap(radicand)
	}),

	summation: (lower, upper, body) => ({
		kind: 'bigop',
		symbol: '∑',
		lower: wrapMaybe(lower),
		upper: wrapMaybe(upper),
		body: wrap(body),
		integralStyle: false
	}),
	product: (lower, upper, body) => ({
		kind: 'bigop',
		symbol: '∏',
		lower: wrapMaybe(lower),
		upper: wrapMaybe(upper),
		body: wrap(body),
		integralStyle: false
	}),
	integral: (lower, upper, body) => ({
		kind: 'bigop',
		symbol: '∫',
		lower: wrapMaybe(lower),
		upper: wrapMaybe(upper),
		body: wrap(body),
		integralStyle: true
	}),
	bigOp: (symbol, lower, upper, body) => ({
		kind: 'bigop',
		symbol,
		lower: wrapMaybe(lower),
		upper: wrapMaybe(upper),
		body: wrap(body),
		integralStyle: false
	}),
	contour: (lower, upper, body) => ({
		kind: 'bigop',
		symbol: '∮',
		lower: wrapMaybe(lower),
		upper: wrapMaybe(upper),
		body: wrap(body),
		integralStyle: true
	}),
	doubleIntegral: (lower, upper, body) => ({
		kind: 'bigop',
		symbol: '∬',
		lower: wrapMaybe(lower),
		upper: wrapMaybe(upper),
		body: wrap(body),
		integralStyle: true
	}),
	tripleIntegral: (lower, upper, body) => ({
		kind: 'bigop',
		symbol: '∭',
		lower: wrapMaybe(lower),
		upper: wrapMaybe(upper),
		body: wrap(body),
		integralStyle: true
	}),
	surfaceIntegral: (lower, upper, body) => ({
		kind: 'bigop',
		symbol: '∯',
		lower: wrapMaybe(lower),
		upper: wrapMaybe(upper),
		body: wrap(body),
		integralStyle: true
	}),

	paren: (inner) => ({kind: 'fence', left: '(', right: ')', inner: wrap(inner)}),
	bracket: (inner) => ({kind: 'fence', left: '[', right: ']', inner: wrap(inner)}),
	brace: (inner) => ({kind: 'fence', left: '{', right: '}', inner: wrap(inner)}),
	angle: (inner) => ({kind: 'fence', left: '⟨', right: '⟩', inner: wrap(inner)}),
	abs: (inner) => ({kind: 'fence', left: '|', right: '|', inner: wrap(inner)}),
	norm: (inner) => ({kind: 'fence', left: '‖', right: '‖', inner: wrap(inner)}),
	floor: (inner) => ({kind: 'fence', left: '⌊', right: '⌋', inner: wrap(inner)}),
	ceil: (inner) => ({kind: 'fence', left: '⌈', right: '⌉', inner: wrap(inner)}),
	fence: (left, right, inner) => ({kind: 'fence', left, right, inner: wrap(inner)}),
	fenceSep: (left, right, children, separator = '|') => ({
		kind: 'fenceSep',
		left,
		right,
		children: children.map(wrap),
		separator
	}),
	bra: (phi) => ({kind: 'fence', left: '⟨', right: '|', inner: wrap(phi)}),
	ket: (psi) => ({kind: 'fence', left: '|', right: '⟩', inner: wrap(psi)}),
	braket: (phi, psi) => ({
		kind: 'fenceSep',
		left: '⟨',
		right: '⟩',
		children: [wrap(phi), wrap(psi)],
		separator: '|'
	}),
	bracketOp: (phi, op, psi) => ({
		kind: 'fenceSep',
		left: '⟨',
		right: '⟩',
		children: [wrap(phi), wrap(op), wrap(psi)],
		separator: '|'
	}),
	setBuilder: (x, condition) => ({
		kind: 'fenceSep',
		left: '{',
		right: '}',
		children: [wrap(x), wrap(condition)],
		separator: '|'
	}),

	matrix: (rows, fence = 'bracket', options) => ({
		kind: 'matrix',
		rows: rows.map((r) => r.map(wrap)),
		fence,
		augmentCol: options?.augmentCol ?? null
	}),
	cases: (cases) => ({
		kind: 'cases',
		cases: cases.map(([v, c]) => [wrap(v), wrap(c)] as [MathNode, MathNode])
	}),
	aligned: (rows, anchor = 1) => ({
		kind: 'aligned',
		rows: rows.map((r) => r.map(wrap)),
		anchor
	}),

	vec: (base) => ({kind: 'accent', base: wrap(base), accent: 'vec'}),
	hat: (base) => ({kind: 'accent', base: wrap(base), accent: 'hat'}),
	bar: (base) => ({kind: 'accent', base: wrap(base), accent: 'bar'}),
	dot: (base) => ({kind: 'accent', base: wrap(base), accent: 'dot'}),
	ddot: (base) => ({kind: 'accent', base: wrap(base), accent: 'ddot'}),
	tilde: (base) => ({kind: 'accent', base: wrap(base), accent: 'tilde'}),
	overline: (inner) => ({kind: 'over', inner: wrap(inner), line: 'overline'}),
	underline: (inner) => ({kind: 'over', inner: wrap(inner), line: 'underline'}),
	overbrace: (inner, label) => ({
		kind: 'brace',
		inner: wrap(inner),
		label: wrapMaybe(label),
		position: 'over'
	}),
	underbrace: (inner, label) => ({
		kind: 'brace',
		inner: wrap(inner),
		label: wrapMaybe(label),
		position: 'under'
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

	tensor: (base, upper, lower) => ({
		kind: 'tensor',
		base: wrap(base),
		upper: upper.map(wrap),
		lower: lower.map(wrap)
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
	prime: (base, count = 1) => ({kind: 'prime', base: wrap(base), count}),
	binom: (n, k) => ({kind: 'binom', n: wrap(n), k: wrap(k)}),
	ellipsis: (style = 'baseline') => ({kind: 'ellipsis', style}),
	prescript: (base, sub, sup) => ({
		kind: 'prescript',
		base: wrap(base),
		sub: wrapMaybe(sub),
		sup: wrapMaybe(sup)
	})
};
