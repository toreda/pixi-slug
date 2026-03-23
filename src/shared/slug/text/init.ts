import {SlugFont} from '../font';
import {TextStyleOptions} from 'pixi.js';
import {SlugTextStyleAlign} from './style/align';

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
 * Stroke configuration matching PIXI.Text's stroke API.
 * Stroke is enabled when width > 0.
 */
export interface SlugStroke {
	/** Stroke color as [r,g,b,a] in 0-1 range. @default [0,0,0,1] */
	color?: [number, number, number, number] | null;
	/** Stroke width in pixels. 0 = disabled. @default 0 */
	width?: number | null;
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