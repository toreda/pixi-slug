import {SlugFont} from '../../font';
import {SlugFonts} from '../../fonts';
import {MATH_FALLBACK_ALIAS, mathFallbackBytes} from './stub';

/**
 * Cached math fallback `SlugFont`. Parsed on first call to
 * {@link mathFontFallback} and reused thereafter. Per spec §7.2 the
 * fallback is registered under {@link MATH_FALLBACK_ALIAS} so it can be
 * looked up by name from anywhere.
 */
let _mathFallback: SlugFont | null = null;
let _mathFallbackTried = false;

/**
 * Lazily parse and register the bundled math fallback font. Returns
 * the parsed `SlugFont` or `null` if parsing fails (in which case the
 * caller should fall back to whatever {@link SlugFonts.fallback}
 * returns — usually the body Roboto fallback).
 *
 * Idempotent: the parse happens once per process; subsequent calls
 * return the cached instance.
 */
export function mathFontFallback(): SlugFont | null {
	if (_mathFallback) return _mathFallback;
	if (_mathFallbackTried) return null;
	_mathFallbackTried = true;

	try {
		const font = new SlugFont();
		const bytes = mathFallbackBytes;
		const copy = bytes.buffer.slice(
			bytes.byteOffset,
			bytes.byteOffset + bytes.byteLength
		) as ArrayBuffer;
		font.loadSync(copy);
		_mathFallback = font;
		SlugFonts.register(MATH_FALLBACK_ALIAS, font);
		// eslint-disable-next-line no-console
		console.log('[MathText] math fallback loaded:', {
			bytes: mathFallbackBytes.length,
			glyphs: font.glyphs.size,
			advances: font.advances.size,
			unitsPerEm: font.unitsPerEm,
			ascender: font.ascender
		});
		return font;
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error('[MathText] math fallback failed to parse:', e);
		return null;
	}
}

/**
 * Reset the cached math fallback. Test helper — never called from
 * production code.
 */
export function _resetMathFontFallback(): void {
	_mathFallback = null;
	_mathFallbackTried = false;
}
