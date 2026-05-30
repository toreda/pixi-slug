/**
 * Per-context font-size multipliers used by the math layout engine.
 * Modeled on TeX's `mathstyle` levels (display / text / script /
 * scriptscript), scoped to what v1 actually needs. See spec §6.2.
 *
 * All values are multipliers applied to the enclosing context's
 * effective fontSize. The base case (top-level body / row content) is
 * implicitly `1.0` and not listed.
 */
export const MathSizes = {
	/** Superscript / subscript size, one level down from the base. */
	Script: 0.7,
	/** Script-of-script (sup-of-sub etc.). Two levels down — floor. */
	ScriptScript: 0.5,
	/** Numerator/denominator of a top-level fraction — same as base. */
	FracTopLevel: 1.0,
	/** Numerator/denominator of a nested fraction. */
	FracNested: 0.7,
	/** Lower/upper limits of a big-op (stacked above/below). */
	BigOpLimits: 0.7,
	/** Big-op operator glyph (∑ ∏ ∫ …). Larger than its arguments. */
	BigOpSymbol: 1.8,
	/** N-th root index — small superscript-ish above the radical hook. */
	RootIndex: 0.6,
	/** Accent glyph (vec / hat / bar …) over the base. */
	Accent: 0.8,
	/** Rows of an m.cases block. */
	CasesRow: 0.9,
	/** Named-operator scripts (sin² etc.) — slightly larger than ordinary scripts. */
	NamedOpScript: 0.75,
	/** Op-atom scripts (⊗_R etc.) — operator-script size, smaller than NamedOpScript. */
	OpScript: 0.7,
	/** Tensor-index columns (T^{ijk}_{lmn}). */
	TensorIndex: 0.7,
	/** Prime glyph (f′ f″ f‴). */
	Prime: 0.7,
	/** Binom n / k. */
	BinomTopLevel: 0.85,
	/** Stacked multi-line subscript under a big-op. */
	StackedSub: 0.7,
	/** Prescript sub/sup. */
	Prescript: 0.7,
	/** Label slot on overbrace/underbrace. */
	BraceLabel: 0.7
} as const;

/**
 * Vertical-rule and gap dimensions, expressed as em multipliers.
 * Em-units are converted to pixels by multiplying with the current
 * `fontSize` at the rendering site.
 */
export const MathRules = {
	/** Fraction rule thickness. */
	FracRuleEm: 0.05,
	/** Square-root vinculum thickness. */
	SqrtRuleEm: 0.05,
	/** Over/underline thickness. */
	OverLineEm: 0.05,
	/** Em-padding added to each side of a fraction rule beyond max(num,den) width. */
	FracRulePadEm: 0.1,
	/** Gap between numerator/rule and rule/denominator. */
	FracGapEm: 0.15,
	/** Gap between big-op operator and its body. */
	BigOpBodyGapEm: 0.15,
	/** Gap between big-op operator and stacked upper/lower limit. */
	BigOpLimitGapEm: 0.1,
	/** Gap between sup/sub and the base they attach to. */
	ScriptGapEm: 0.05,
	/** Gap between adjacent matrix cells horizontally. */
	MatrixColGapEm: 0.6,
	/** Gap between adjacent matrix rows vertically. */
	MatrixRowGapEm: 0.4,
	/** Em padding on each side of a fence glyph relative to its inner content. */
	FencePadEm: 0.05,
	/**
	 * Stroke thickness of a SYNTHESIZED stretchy fence (matrix bracket /
	 * paren / brace / abs), as an em multiplier. Stays constant as the
	 * fence stretches in height — the whole point of synthesizing the
	 * outline instead of scaling a font glyph (see fences.ts).
	 */
	FenceStrokeEm: 0.06,
	/**
	 * Width of a synthesized stretchy fence (left edge to opening), as an
	 * em multiplier. The bracket serif reach / paren belly depth.
	 */
	FenceWidthEm: 0.28,
	/** Gap between an accent glyph and its base. */
	AccentGapEm: 0.05,
	/** Gap between the cases brace and the first column. */
	CasesBraceGapEm: 0.2,
	/** Gap between value and condition columns in m.cases. */
	CasesColGapEm: 1.0,
	/** Gap between brace glyph and label in over/underbrace. */
	BraceLabelGapEm: 0.1,
	/** Multi-line text default spacing (multiplier on em). */
	DefaultLineSpacing: 1.2,
	/** Function-spacing thin-space after named ops (sin _x_). */
	NamedOpSpacingEm: 0.18,
	/** Math-class thin space inserted around binary operators. */
	OpThinSpaceEm: 0.16,
	/** Stacked-subscript line spacing (multiplier on the stacked-sub size). */
	StackedSubLineSpacingEm: 1.0
} as const;
