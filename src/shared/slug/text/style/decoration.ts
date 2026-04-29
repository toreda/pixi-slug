import {slugResolvePhysicalAlign, type SlugTextStyleAlign, type SlugTextStylePhysicalAlign} from './align';
import {slugTextColorParse, type SlugTextColor, type SlugTextColorRgba} from './color';
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
 * Resolved user input with per-channel sticky-color tracking.
 *
 * `colorRgb` and `colorAlpha` are independent sticky channels:
 *  - `null` means "inherit from the text fill at draw resolution".
 *  - non-null means the user explicitly set that channel; it persists
 *    until either the user clears it or the fill is updated with an
 *    explicit value for that same channel (per-channel invalidation).
 *
 * The split is necessary because color inputs may carry RGB only
 * (3-element / 6-digit hex) or RGB + alpha (4-element / 8-digit hex /
 * 8-digit number). Decorations need to remember exactly which of those
 * channels the user committed to.
 *
 * Provenance flag mapping (set by `slugResolveDecoration`):
 *  - 6-digit hex / 3-element array → `colorRgb` set, `colorAlpha` null
 *  - 8-digit hex / 4-element array → both set
 *  - omitted color → both null
 *
 * `thickness` keeps the same null-means-inherit rule against the font
 * metric. `length` and `align` are concrete after resolve.
 *
 * Render code should NOT read this directly; it should read the
 * fully-concrete `SlugTextDecorationDraw` produced by
 * `slugResolveDrawDecoration`, which folds the inheritance step in
 * once and emits final pixel values.
 */
export interface SlugTextDecorationResolved {
	enabled: boolean;
	colorRgb: [number, number, number] | null;
	colorAlpha: number | null;
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
	return {enabled: false, colorRgb: null, colorAlpha: null, thickness: null, length: 1, align: 'start'};
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
	if (a.colorAlpha !== b.colorAlpha) return false;
	const ar = a.colorRgb, br = b.colorRgb;
	if (ar === null && br === null) return true;
	if (ar === null || br === null) return false;
	return ar[0] === br[0] && ar[1] === br[1] && ar[2] === br[2];
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
 * Per-channel inheritance: each channel of the final color is the
 * decoration's sticky value if set, otherwise the matching channel of
 * `fillRgba`. RGB and alpha are independent — a decoration can have a
 * sticky alpha while inheriting RGB from the fill, or vice versa.
 *
 * @param input Resolved user input. Null `colorRgb` / `colorAlpha` /
 *  `thickness` inherit.
 * @param fillRgba Representative fill RGBA used when channels inherit.
 *  For solid fills this is the fill color; for gradient/texture fills
 *  it's `slugFillRepresentativeColor` (gradient first stop or white).
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
	const r = input.colorRgb ? input.colorRgb[0] : fillRgba[0];
	const g = input.colorRgb ? input.colorRgb[1] : fillRgba[1];
	const b = input.colorRgb ? input.colorRgb[2] : fillRgba[2];
	const a = input.colorAlpha !== null ? input.colorAlpha : fillRgba[3];
	const thickness = Math.max(input.thickness ?? defaultThicknessPx, 1);
	return {
		enabled: input.enabled,
		color: [r, g, b, a],
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
 * Resolve a user input value into the stored form, splitting any color
 * input into per-channel sticky overrides.
 *
 * - `false` / `null` / `undefined` → disabled, no overrides.
 * - `true` → enabled, all channels inherit (`colorRgb` / `colorAlpha` /
 *   `thickness` all null).
 * - object → enabled; provided fields normalized, omitted fields null.
 *
 * Color provenance:
 *  - 6-digit hex / 3-element array → `colorRgb` set, `colorAlpha` null.
 *  - 8-digit hex / 4-element array / 8-digit number → both set.
 *  - explicit `color: null` → both null (inherit the fill).
 *
 * Merging with prior state: a setter that wants to preserve sticky
 * channels across edits (e.g., setting only RGB without losing a
 * previously-set alpha) should call `slugMergeDecoration` rather than
 * this resolver directly.
 */
export function slugResolveDecoration(input: SlugTextDecorationInput | undefined): SlugTextDecorationResolved {
	if (input === true) {
		return {enabled: true, colorRgb: null, colorAlpha: null, thickness: null, length: 1, align: 'start'};
	}
	if (input === false || input === null || input === undefined) {
		return slugDecorationDisabled();
	}
	let colorRgb: [number, number, number] | null = null;
	let colorAlpha: number | null = null;
	if (input.color !== null && input.color !== undefined) {
		const parse = slugTextColorParse(input.color, [0, 0, 0, 1]);
		if (parse.rgbProvided) {
			colorRgb = [parse.rgba[0], parse.rgba[1], parse.rgba[2]];
		}
		if (parse.alphaProvided) {
			colorAlpha = parse.rgba[3];
		}
	}
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
	return {enabled: true, colorRgb, colorAlpha, thickness, length, align};
}

/**
 * Apply a fill change to a decoration's sticky channels: clear sticky
 * RGB if the new fill explicitly carried RGB, clear sticky alpha if it
 * explicitly carried alpha. Channels not explicitly carried are
 * preserved.
 *
 * Returns a new resolved decoration; never mutates the input.
 *
 * Called by `SlugText._resolveDecorations` whenever the fill changes,
 * so per-channel stickiness behaves as documented:
 *  - decoration alpha stays sticky across an RGB-only fill update
 *  - an RGBA fill update overrides previously-sticky decoration alpha
 */
export function slugApplyFillToDecoration(
	decoration: SlugTextDecorationResolved,
	fillRgbProvided: boolean,
	fillAlphaProvided: boolean
): SlugTextDecorationResolved {
	if (!decoration.enabled) return decoration;
	const nextRgb = fillRgbProvided ? null : decoration.colorRgb;
	const nextAlpha = fillAlphaProvided ? null : decoration.colorAlpha;
	if (nextRgb === decoration.colorRgb && nextAlpha === decoration.colorAlpha) {
		return decoration;
	}
	return {
		enabled: decoration.enabled,
		colorRgb: nextRgb,
		colorAlpha: nextAlpha,
		thickness: decoration.thickness,
		length: decoration.length,
		align: decoration.align
	};
}
