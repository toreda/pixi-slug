import {SlugFont} from '../font';
import {TextStyleOptions} from 'pixi.js';
import type {SlugFontErrorPolicy} from '../font/error/policy';
import {SlugTextStyleAlign} from './style/align';
import type {SlugTextColor} from './style/color';
import type {SlugTextDecorationInput} from './style/decoration';
import type {SlugTextDirection} from './style/direction';
import type {SlugTextJustify} from './style/justify';
import type {SlugStrokeAlphaMode} from './style/stroke/alpha/mode';

/**
 * Resolved drop shadow state kept on `SlugText` after input validation.
 * All numeric fields are concrete (no `null` / `undefined`) and `color`
 * is always a normalized RGBA tuple. Consumers that read the current
 * shadow — render passes, `dropShadow` getter — work with this shape.
 */
export interface SlugDropShadowResolved {
	alpha: number;
	angle: number;
	blur: number;
	color: [number, number, number, number];
	distance: number;
}

/**
 * Drop shadow configuration matching PIXI.Text's TextDropShadow API.
 * Presence of this object in options enables the drop shadow.
 */
export interface SlugDropShadow {
	/** Shadow opacity (0-1). @default 1 */
	alpha?: number | null;
	/** Shadow angle in radians. 0=right, PI/2=down. @default Math.PI/6 */
	angle?: number | null;
	/** Shadow blur radius in pixels. 0=sharp. @default 0 */
	blur?: number | null;
	/**
	 * Shadow color. Accepts a hex string (`'#FF0000'`, `'0xFF0000AA'`,
	 * `'FF0'`, etc.), a hex number (`0xFF0000` or `0xFF0000AA`), or a
	 * 3/4-element numeric array (0..1 normalized, or 0..255).
	 * 6-digit / 3-element forms preserve the existing alpha; 8-digit /
	 * 4-element forms set alpha from input.
	 * @default [0,0,0,1]
	 */
	color?: SlugTextColor | null;
	/** Shadow distance in pixels. @default 5 */
	distance?: number | null;
}

/**
 * Stroke configuration for SlugText. Extends PIXI.Text's stroke API
 * with SlugText-specific alpha gradient support.
 *
 * Stroke is enabled when width > 0.
 *
 * ## Alpha Modes
 *
 * **`'uniform'`** (default): Uniform alpha across the full stroke width.
 * The alpha component of `color` applies to every pixel of the stroke.
 *
 * **`'gradient'`**: Alpha varies per pixel from the glyph boundary outward.
 * - The 1st pixel of stroke uses `alphaStart`.
 * - Each subsequent pixel changes by `alphaRate`.
 * - The outermost pixel alpha = `alphaStart + alphaRate * (width - 1)`.
 * - `alphaRate` can be positive (fade in) or negative (fade out).
 * - Final alpha per pixel is clamped to 0–1.
 */
export interface SlugStroke {
	/**
	 * Stroke color. Accepts a hex string (`'#FF0000'`, `'0xFF0000AA'`,
	 * `'FF0'`, etc.), a hex number (`0xFF0000` or `0xFF0000AA`), or a
	 * 3/4-element numeric array (0..1 normalized, or 0..255).
	 * 6-digit / 3-element forms preserve the existing alpha; 8-digit /
	 * 4-element forms set alpha from input.
	 * @default [0,0,0,1]
	 */
	color?: SlugTextColor | null;
	/** Stroke width in pixels. 0 = disabled. @default 0 */
	width?: number | null;
	/** How alpha is applied across the stroke width. @default 'single' */
	alphaMode?: SlugStrokeAlphaMode | null;
	/**
	 * Starting alpha for the innermost pixel of stroke (closest to glyph boundary).
	 * Used when `alphaMode` is `'gradient'`. Ignored in `'uniform'` mode.
	 * @default 1
	 */
	alphaStart?: number | null;
	/**
	 * Alpha change per pixel moving outward from the glyph boundary.
	 * Used when `alphaMode` is `'gradient'`. Ignored in `'uniform'` mode.
	 *
	 * Positive values increase alpha outward (fade in from glyph edge).
	 * Negative values decrease alpha outward (fade out from glyph edge).
	 *
	 * Example: `alphaStart: 1, alphaRate: -0.2` on a 5px stroke produces
	 * pixel alphas of [1.0, 0.8, 0.6, 0.4, 0.2] from inner to outer edge.
	 * @default 0
	 */
	alphaRate?: number | null;
}

/**
 * Text style options compatible with PIXI.Text's TextStyleOptions.
 * Defined here to avoid version-specific PixiJS imports in shared code.
 */
export interface SlugTextStyleOptions {
	fontSize?: number | null;
	/**
	 * Fill color. Accepts a hex string (`'#FF0000'`, `'0xFF0000AA'`,
	 * `'FF0'`, etc.), a hex number (`0xFF0000` or `0xFF0000AA`), or a
	 * 3/4-element numeric array (0..1 normalized, or 0..255).
	 * 6-digit / 3-element forms preserve the existing alpha; 8-digit /
	 * 4-element forms set alpha from input.
	 * @default [1,1,1,1] (white)
	 */
	fill?: SlugTextColor | null;
	wordWrap?: boolean | null;
	wordWrapWidth?: number | null;
	align?: SlugTextStyleAlign;
	/**
	 * Justify strategy used when `align === 'justify'`. Mirrors CSS
	 * `text-justify`. Ignored for any other alignment.
	 *  - `'inter-word'` (default) → expand inter-word gaps only.
	 *  - `'inter-character'` → distribute extra width across every
	 *    inter-glyph gap (CJK-style "distribute" justification).
	 * @default 'inter-word'
	 */
	textJustify?: SlugTextJustify;
	breakWords?: boolean;
	/**
	 * Text direction. Today this only affects how decoration
	 * `start`/`end` alignment resolves — glyph layout still runs
	 * left-to-right regardless. Full RTL glyph layout will land as a
	 * separate feature; the field is exposed now so application code
	 * can be written direction-aware without API churn later.
	 * @default 'ltr'
	 */
	direction?: SlugTextDirection | null;
	/**
	 * Draw an underline below the text. `true` enables with default
	 * color (fill) and thickness (font metric). Pass an object to
	 * override `color` and/or `thickness` independently — omitted
	 * fields fall back to those same defaults.
	 * @default false
	 */
	underline?: SlugTextDecorationInput;
	/**
	 * Draw a strikethrough line through the text. Same input shape as
	 * `underline`.
	 * @default false
	 */
	strikethrough?: SlugTextDecorationInput;
	/**
	 * Draw an overline above the text (aligned to the rendered glyph
	 * top). Same input shape as `underline`.
	 * @default false
	 */
	overline?: SlugTextDecorationInput;
	/** Stroke configuration. Stroke is disabled when width is 0 or omitted. */
	stroke?: SlugStroke | null;
	/** Drop shadow configuration. Presence enables shadow. */
	dropShadow?: SlugDropShadow | null;
}

/**
 * Alias/URL pair in object form. Either field may be omitted; at least
 * one must be present. When both are present, `alias` binds to the
 * font loaded from `url` (the alias is never URL-sniffed). When only
 * `url` is present, the URL itself doubles as the alias.
 */
export interface SlugTextFontRef {
	alias?: string;
	url?: string;
}

/**
 * Font input accepted by `SlugText`. Resolved through
 * `slugResolveFontInput`:
 *  - `SlugFont`: used directly.
 *  - `string`: URL-sniffed — absolute/protocol-relative/root-relative/
 *    explicit-relative paths, paths containing `/`, and strings ending
 *    in `.ttf`/`.otf`/`.woff`/`.woff2` are fetched as URLs. Everything
 *    else is looked up as a registered alias.
 *  - `[alias]` or `[alias, url]`: tuple form. Single element is sniffed
 *    like a bare string; the two-element form always treats element 0
 *    as a pure alias and element 1 as the URL source.
 *  - `{alias?, url?}`: object form. `alias` is always a pure alias;
 *    `url` is the source. When only `url` is present it also becomes
 *    the alias.
 *  - `ArrayBuffer` / `Uint8Array`: raw font bytes (e.g. webpack asset
 *    imports). Parsed but not cached — call `SlugFonts.register(name, font)`
 *    afterwards to cache under a name.
 *  - `FontFace` / `FontFace[]`: the PIXI Assets loader default return
 *    type. The URL is extracted from `FontFace.src` and fetched as
 *    bytes; base64 `data:` URIs are decoded inline.
 */
export type SlugTextFontInput =
	| SlugFont
	| string
	| [string]
	| [string, string]
	| SlugTextFontRef
	| ArrayBuffer
	| Uint8Array
	| FontFace
	| FontFace[];

/**
 * Object with required properties to instantiate `SlugText`.
 */
export interface SlugTextInit {
	text: string;
	font: SlugTextFontInput;
	supersampling?: boolean | null;
	supersampleCount?: number | null;
	options?: SlugTextStyleOptions;
	/**
	 * When `font` resolves asynchronously (URL string or raw bytes) and is
	 * not yet loaded, render using the `SlugFonts` fallback font until the
	 * real font resolves.
	 * @default Defaults.SlugText.FallbackWhileLoading (true)
	 */
	fallbackWhileLoading?: boolean | null;
	/**
	 * Per-case override of the font resolver's error behavior. Missing
	 * cases fall back to `Defaults.SlugText.ErrorPolicy`.
	 */
	errorPolicy?: Partial<SlugFontErrorPolicy>;
}