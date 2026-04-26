import {type SlugFontErrorMode} from '../font/error/mode';

/**
 * Exhaustive list of valid `SlugFontErrorMode` literals. Use for strict
 * equality checks when validating user input (settings, options).
 */
export const SLUG_FONT_ERROR_MODES: readonly SlugFontErrorMode[] = ['throw', 'error', 'warn', 'silent'];

/** True when `value` is exactly one of the `SlugFontErrorMode` literals. */
export function isSlugFontErrorMode(value: unknown): value is SlugFontErrorMode {
	return typeof value === 'string' && (SLUG_FONT_ERROR_MODES as readonly string[]).includes(value);
}
