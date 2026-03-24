import {SlugFont} from '../font';
import {TextStyleOptions} from 'pixi.js';
import {SlugTextStyleAlign} from './style/align';
import type {SlugStrokeAlphaMode} from './style/stroke/alpha/mode';

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
	/** Shadow color as [r,g,b,a] in 0-1 range. @default [0,0,0,1] */
	color?: [number, number, number, number] | null;
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
	/** Stroke color as [r,g,b,a] in 0-1 range. @default [0,0,0,1] */
	color?: [number, number, number, number] | null;
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
	/** Fill color as [r,g,b,a] in 0-1 range. @default [1,1,1,1] (white) */
	fill?: [number, number, number, number] | null;
	wordWrap?: boolean | null;
	wordWrapWidth?: number | null;
	align?: SlugTextStyleAlign;
	breakWords?: boolean;
	/** Draw an underline below the text. @default false */
	underline?: boolean;
	/** Draw a strikethrough line through the text. @default false */
	strikethrough?: boolean;
	/** Stroke configuration. Stroke is disabled when width is 0 or omitted. */
	stroke?: SlugStroke | null;
	/** Drop shadow configuration. Presence enables shadow. */
	dropShadow?: SlugDropShadow | null;
}

export interface SlugTextInit {
	text: string;
	slugFont: SlugFont;
	supersampling?: boolean | null;
	supersampleCount?: number | null;
	options?: SlugTextStyleOptions;
}