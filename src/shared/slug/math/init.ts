import type {Rgba} from '../../../rgba';
import type {SlugFontErrorPolicy} from '../font/error/policy';
import type {SlugTextFontInput} from '../text/init';
import type {MathNode} from './node';

/**
 * Style options for `MathText`. Applied as defaults to every child
 * SlugText. Override per-node with `m.styled(...)`.
 */
export interface MathTextStyleOptions {
	fill?: Rgba | null;
}

/**
 * Resolved style snapshot returned by `MathText.style`. Today only `fill`
 * is meaningful; the bag exists so future global style fields (stroke,
 * shadow, …) can be added without churning the public API.
 */
export interface MathTextStyle {
	fill: Rgba;
}

/**
 * Required inputs to construct a `MathText`. Mirrors `SlugTextInit`.
 */
export interface MathTextInit {
	/** The formula tree (or array of trees, for multi-line layouts). */
	formula: MathNode | MathNode[];
	/** Body font used for ordinary text runs. Defaults to the bundled Roboto fallback. */
	font?: SlugTextFontInput | null;
	/**
	 * Math font used for operator/fence/symbol glyphs. Defaults to the
	 * bundled math fallback (currently a stub aliasing Roboto until the
	 * STIX/LatinModern subset ships — spec §7).
	 */
	mathFont?: SlugTextFontInput | null;
	/** Base font size in pixels. Default 24. */
	fontSize?: number | null;
	options?: MathTextStyleOptions | null;
	/** Forwarded to child SlugTexts. */
	fallbackWhileLoading?: boolean | null;
	errorPolicy?: Partial<SlugFontErrorPolicy>;
	/** Multi-line alignment. Default `'left'`. */
	align?: 'left' | 'center' | 'right' | 'equals' | null;
	/** Multi-line spacing multiplier on em. Default 1.2. */
	lineSpacing?: number | null;
	/**
	 * When true (default), `text` nodes with `useMathFont: false` — which
	 * includes bare strings auto-wrapped from `m.row('x', ...)` — render
	 * with the math font instead of the body font. This gives formulas a
	 * unified math-typographic look without forcing every variable through
	 * `m.mathText(...)`. Set false to restore the prior behavior where
	 * bare strings use the body font.
	 */
	variablesUseMathFont?: boolean | null;
	/**
	 * Reserved per spec §5.1 — column gap for top-level `m.column(...)`
	 * stacks. The value is stored but not wired through ColumnContainer in
	 * v1 (which uses `lineSpacing` for inter-row spacing). Setting this
	 * today is a no-op; included so consumer code can be written against
	 * the spec API without churn when the wiring lands.
	 */
	columnGap?: number | null;
}
