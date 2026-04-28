import type {SlugTextDirection} from './direction';

/**
 * Logical alignment for the whole text block. Resolved against the
 * current text direction at draw-record build time:
 *  - LTR: `start` → physical-left, `end` → physical-right
 *  - RTL: `start` → physical-right, `end` → physical-left
 *  - `left`/`right`/`center`/`justify` are direction-agnostic.
 *
 * `left` and `right` are kept alongside `start`/`end` so layouts that
 * must align to a screen edge (regardless of localization) can express
 * that directly.
 */
export type SlugTextStyleAlign = 'start' | 'end' | 'left' | 'center' | 'right' | 'justify';

/**
 * Physical alignment used by the renderer. The block-level resolver
 * folds in the text direction to produce one of these. Render code is
 * locale-agnostic — it never re-reads `direction`.
 */
export type SlugTextStylePhysicalAlign = 'left' | 'center' | 'right' | 'justify';

/**
 * Resolve a logical block-level alignment to its physical form by
 * folding in the current text direction.
 */
export function slugResolvePhysicalAlign(
	align: SlugTextStyleAlign,
	direction: SlugTextDirection
): SlugTextStylePhysicalAlign {
	if (align === 'start') return direction === 'rtl' ? 'right' : 'left';
	if (align === 'end') return direction === 'rtl' ? 'left' : 'right';
	return align;
}
