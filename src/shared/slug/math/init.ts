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
}
