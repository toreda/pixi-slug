import {slugResolvePhysicalAlign, type SlugTextStyleAlign, type SlugTextStylePhysicalAlign} from './align';
import {slugTextColorToRgba, type SlugTextColor, type SlugTextColorRgba} from './color';
import type {SlugTextDirection} from './direction';
import {numberValue} from '@toreda/strong-types';

/**
 * Logical alignment for a length-restricted decoration line. Reuses
 * the block-level alignment vocabulary minus `justify` (a single line
 * has nothing to fill against). Resolved against the current text
 * direction at draw-record build time:
 *  - LTR: `start` → physical-left, `end` → physical-right
 *  - RTL: `start` → physical-right, `end` → physical-left
 *  - `left`/`right`/`center` are direction-agnostic.
 *
 * Only meaningful when `length < 1` — at full width there's no offset
 * for alignment to control.
 */
export type SlugTextDecorationAlign = Exclude<SlugTextStyleAlign, 'justify'>;

/**
 * Physical alignment used by the renderer. Decoration input is the
 * full logical set; resolution folds in the text direction to produce
 * one of these. The render loop reads only this form and is locale-
 * agnostic.
 */
export type SlugTextDecorationPhysicalAlign = Exclude<SlugTextStylePhysicalAlign, 'justify'>;

/**
 * User-facing decoration config. Every field is optional — anything
 * omitted falls back to a sensible default at draw time:
 *  - `color` omitted → uses the text fill color.
 *  - `thickness` omitted → uses the font's metric (`underlineThickness`
 *    for underline/overline, `strikethroughSize` for strikethrough).
 *  - `length` omitted → 1.0 (full line width).
 *  - `align` omitted → `'start'`.
 */
export interface SlugTextDecoration {
	/**
	 * Line color. Accepts the same input forms as `fill` — hex string,
	 * hex number, or 3/4-element numeric array. Omit (or pass `null`)
	 * to inherit the text fill color.
	 */
	color?: SlugTextColor | null;
	/**
	 * Line thickness in pixels. Omit (or pass `null`) to use the font's
	 * own metric.
	 */
	thickness?: number | null;
	/**
	 * Line length as a fraction of the rendered text line, in `0..1`.
	 * `1` (or omitted) draws the full width. `0.5` draws a half-width
	 * line. `0` skips the draw entirely. Values outside `0..1` are
	 * clamped.
	 *
	 * On wrapped/multi-line text every rendered line gets its own
	 * length-restricted segment sized to that line's width.
	 */
	length?: number | null;
	/**
	 * Where a length-restricted line is anchored within the text line.
	 * `start`/`end` are resolved against text direction; `left`/`right`
	 * are direction-agnostic.
	 *  - `'start'` (default) → leading edge of the line in current direction.
	 *  - `'end'` → trailing edge of the line in current direction.
	 *  - `'center'` → centered in the line.
	 *  - `'left'` / `'right'` → physical left/right regardless of direction.
	 *
	 * Ignored at full width (`length === 1`).
	 */
	align?: SlugTextDecorationAlign | null;
}

/**
 * Input accepted by decoration setters and `options.underline` /
 * `options.strikethrough` / `options.overline`. The boolean shorthand
 * is equivalent to `{}` (enabled with all defaults) or omitted (disabled).
 */
export type SlugTextDecorationInput = boolean | SlugTextDecoration | null;

/**
 * Resolved user input. `color` and `thickness` stay nullable here —
 * `null` means "inherit at draw resolution" (fill color or font
 * metric). `length` and `align` are concrete after resolve, since
 * their defaults don't depend on other fields. This shape mirrors
 * the user's intent and is cheap to compare for setter no-ops.
 *
 * Render code should NOT read this directly; it should read the
 * fully-concrete `SlugTextDecorationDraw` produced by
 * `slugResolveDrawDecoration`, which folds the inheritance step in
 * once and emits final pixel values.
 */
export interface SlugTextDecorationResolved {
	enabled: boolean;
	color: SlugTextColorRgba | null;
	thickness: number | null;
	length: number;
	align: SlugTextDecorationAlign;
}

/**
 * Fully-concrete draw values for a single decoration. Produced once
 * whenever any input the resolution depends on changes (the user's
 * decoration input, the text fill color, the font, fontSize, or text
 * direction) and cached on the SlugText instance. Render code
 * consumes this and never re-runs the inheritance step per draw.
 *
 * - `enabled` false → renderer skips this decoration entirely; the
 *   other fields are filler.
 * - `color` is RGBA in 0..1.
 * - `thickness` is in pixels, already clamped to a 1px minimum.
 * - `length` is a clamped 0..1 fraction; `0` means skip the draw.
 * - `align` is the physical alignment, with `start`/`end` already
 *   resolved against text direction.
 */
export interface SlugTextDecorationDraw {
	enabled: boolean;
	color: SlugTextColorRgba;
	thickness: number;
	length: number;
	align: SlugTextDecorationPhysicalAlign;
}

/** Disabled decoration with all overrides cleared. */
export function slugDecorationDisabled(): SlugTextDecorationResolved {
	return {enabled: false, color: null, thickness: null, length: 1, align: 'start'};
}

/**
 * Structural equality for two resolved decorations. Used by setters
 * to skip a rebuild when an assignment is a no-op.
 */
export function decorationsEqual(a: SlugTextDecorationResolved, b: SlugTextDecorationResolved): boolean {
	if (a.enabled !== b.enabled) return false;
	if (a.thickness !== b.thickness) return false;
	if (a.length !== b.length) return false;
	if (a.align !== b.align) return false;
	const ac = a.color, bc = b.color;
	if (ac === null && bc === null) return true;
	if (ac === null || bc === null) return false;
	return ac[0] === bc[0] && ac[1] === bc[1] && ac[2] === bc[2] && ac[3] === bc[3];
}

/**
 * Resolve a decoration's logical alignment to physical. Delegates to
 * the shared block-level resolver — `justify` is excluded at the type
 * level, so the cast is safe.
 */
function physicalAlign(
	align: SlugTextDecorationAlign,
	direction: SlugTextDirection
): SlugTextDecorationPhysicalAlign {
	return slugResolvePhysicalAlign(align, direction) as SlugTextDecorationPhysicalAlign;
}

/**
 * Fold the user's resolved input plus the current fill color, font
 * metric, and text direction into a fully-concrete draw record.
 * Called by SlugText whenever any of those inputs change — never
 * per-draw.
 *
 * @param input Resolved user input. `null` color/thickness inherits.
 * @param fillRgba Current text fill color, used when `input.color` is null.
 * @param defaultThicknessPx Pixel-space thickness from the font metric
 *  (`font.underlineThickness * scale` for underline/overline,
 *  `font.strikethroughSize * scale` for strikethrough), used when
 *  `input.thickness` is null. Already scaled by fontSize/unitsPerEm.
 * @param direction Current text direction; resolves `start`/`end` align.
 */
export function slugResolveDrawDecoration(
	input: SlugTextDecorationResolved,
	fillRgba: SlugTextColorRgba,
	defaultThicknessPx: number,
	direction: SlugTextDirection
): SlugTextDecorationDraw {
	const color: SlugTextColorRgba = input.color
		? [input.color[0], input.color[1], input.color[2], input.color[3]]
		: [fillRgba[0], fillRgba[1], fillRgba[2], fillRgba[3]];
	const thickness = Math.max(input.thickness ?? defaultThicknessPx, 1);
	return {
		enabled: input.enabled,
		color,
		thickness,
		length: input.length,
		align: physicalAlign(input.align, direction)
	};
}

/** Disabled draw record — safe filler when render code holds a slot for a disabled decoration. */
export function slugDrawDecorationDisabled(): SlugTextDecorationDraw {
	return {enabled: false, color: [0, 0, 0, 1], thickness: 1, length: 1, align: 'left'};
}

/**
 * Resolve a user input value into the stored form.
 *
 * - `false` / `null` / `undefined` → disabled, no overrides.
 * - `true` → enabled, both overrides null (use fill + font metric).
 * - object → enabled; provided fields normalized, omitted fields null.
 *
 * Unlike `slugTextColorToRgba`, an explicit `color: null` here does NOT
 * preserve any prior color — it means "inherit the fill".
 */
export function slugResolveDecoration(input: SlugTextDecorationInput | undefined): SlugTextDecorationResolved {
	if (input === true) {
		return {enabled: true, color: null, thickness: null, length: 1, align: 'start'};
	}
	if (input === false || input === null || input === undefined) {
		return slugDecorationDisabled();
	}
	const color = input.color === null || input.color === undefined
		? null
		: slugTextColorToRgba(input.color, [0, 0, 0, 1]);
	const thickness = input.thickness === null || input.thickness === undefined
		? null
		: numberValue(input.thickness, 0);
	const rawLength = input.length === null || input.length === undefined
		? 1
		: numberValue(input.length, 1);
	const length = Math.min(Math.max(rawLength, 0), 1);
	const align: SlugTextDecorationAlign =
		input.align === 'center' ||
		input.align === 'end' ||
		input.align === 'left' ||
		input.align === 'right'
			? input.align
			: 'start';
	return {enabled: true, color, thickness, length, align};
}
