// Import submodule paths directly to avoid the @toreda/verify barrel,
// which pulls in `@toreda/fate` as a runtime dependency.
import {isIntPos} from '@toreda/verify/dist/is/int/pos';
import {isNumberFinite} from '@toreda/verify/dist/is/number/finite';

/**
 * User-facing color input accepted by `SlugText` color fields (fill,
 * strokeColor, dropShadow.color). Internally every color is stored as
 * a normalized `[r, g, b, a]` tuple in the 0..1 range. This type lets
 * callers pass the form most convenient to them.
 *
 * Forms:
 *  - **Hex string**: `'#FF0000'`, `'0xFF0000'`, `'FF0000'`, and the
 *    short `#F00` / `#F00F` / `#FF` / `#FFAA` / `#FFFFFF00` variants.
 *    2, 3, 4, 6, and 8 hex digits (after prefix) are accepted.
 *    6 digits preserve the existing alpha; 8 digits set alpha from
 *    the input.
 *  - **Number**: `0xFF0000` (≤ 0xFFFFFF preserves alpha), or
 *    `0xFF0000CC` ( > 0xFFFFFF sets alpha from input).
 *  - **Array**: `[r, g, b]` preserves alpha, `[r, g, b, a]` sets alpha.
 *    When every element is in `0..1`, values pass through as already
 *    normalized. When any element is `> 1`, all elements are treated
 *    as `0..255` and divided by 255.
 */
export type SlugTextColor =
	| string
	| number
	| readonly [number, number, number]
	| readonly [number, number, number, number];

/** Internal RGBA tuple used everywhere downstream. Values are 0..1. */
export type SlugTextColorRgba = [number, number, number, number];

/**
 * Color parse result with provenance flags. `rgbProvided` is true when
 * the input carried RGB (every accepted color form does, except `null` /
 * `undefined` / invalid input which fall back to `current` and report
 * `false`). `alphaProvided` is true when the input carried alpha — the
 * 8-digit hex / 4-element array / 8-digit-number forms.
 *
 * Decoration code uses these flags to maintain per-channel sticky
 * overrides — a fill update only invalidates a decoration's sticky
 * channel if the fill itself explicitly set that channel.
 */
export interface SlugTextColorParse {
	rgba: SlugTextColorRgba;
	rgbProvided: boolean;
	alphaProvided: boolean;
}

const PREFIX = '[SlugText:color]';

/** Log an invalid-color diagnostic without throwing. */
function reportColorError(message: string): void {
	console.error(`${PREFIX} ${message}`);
}

/** Expand a single hex character to a byte (0..255): `F` → 255. */
function expandNibble(c: string): number {
	return parseInt(c + c, 16);
}

/** Parse a `len`-character hex slice to a 0..255 byte. */
function parseByte(hex: string, start: number): number {
	return parseInt(hex.slice(start, start + 2), 16);
}

/**
 * Strip optional `#` or `0x` prefix and validate the remaining body is
 * hex-only + a supported digit count. Returns the stripped lowercase
 * body, or null on any validation failure.
 */
function normalizeHexBody(raw: string): string | null {
	const trimmed = raw.trim();
	if (!trimmed) {
		return null;
	}

	const lower = trimmed.toLowerCase();
	let body: string;
	if (lower.startsWith('#')) {
		body = lower.slice(1);
	} else if (lower.startsWith('0x')) {
		body = lower.slice(2);
	} else {
		body = lower;
	}

	if (!/^[0-9a-f]+$/.test(body)) {
		return null;
	}

	if (body.length !== 2 && body.length !== 3 && body.length !== 4 && body.length !== 6 && body.length !== 8) {
		return null;
	}

	return body;
}

/**
 * Convert a supported string form to an `{r, g, b, alphaFromInput?}`
 * intermediate representation. `alphaFromInput` is `undefined` when the
 * input length implies "preserve existing alpha". Returns null for
 * any invalid input.
 */
function parseHexString(raw: string): {r: number; g: number; b: number; alphaFromInput?: number} | null {
	const body = normalizeHexBody(raw);
	if (body === null) {
		return null;
	}

	// 2 digits → grayscale (GG → GGGGGG), preserve alpha.
	if (body.length === 2) {
		const v = parseInt(body, 16) / 255;
		return {r: v, g: v, b: v};
	}

	// 3 digits → RGB shorthand, preserve alpha.
	if (body.length === 3) {
		return {
			r: expandNibble(body[0]) / 255,
			g: expandNibble(body[1]) / 255,
			b: expandNibble(body[2]) / 255
		};
	}

	// 4 digits → RGBA shorthand, alpha from input.
	if (body.length === 4) {
		return {
			r: expandNibble(body[0]) / 255,
			g: expandNibble(body[1]) / 255,
			b: expandNibble(body[2]) / 255,
			alphaFromInput: expandNibble(body[3]) / 255
		};
	}

	// 6 digits → RRGGBB, preserve alpha.
	if (body.length === 6) {
		return {
			r: parseByte(body, 0) / 255,
			g: parseByte(body, 2) / 255,
			b: parseByte(body, 4) / 255
		};
	}

	// 8 digits → RRGGBBAA, alpha from input.
	return {
		r: parseByte(body, 0) / 255,
		g: parseByte(body, 2) / 255,
		b: parseByte(body, 4) / 255,
		alphaFromInput: parseByte(body, 6) / 255
	};
}

function parseNumber(n: number): {r: number; g: number; b: number; alphaFromInput?: number} | null {
	if (!isIntPos(n) || n > 0xffffffff) {
		return null;
	}

	if (n <= 0xffffff) {
		return {
			r: ((n >> 16) & 0xff) / 255,
			g: ((n >> 8) & 0xff) / 255,
			b: (n & 0xff) / 255
		};
	}

	// 8-digit RRGGBBAA — mask against 0xffffffff then extract each byte.
	// `>>> 0` forces unsigned 32-bit interpretation for the high byte.
	const u = n >>> 0;
	return {
		r: ((u >>> 24) & 0xff) / 255,
		g: ((u >>> 16) & 0xff) / 255,
		b: ((u >>> 8) & 0xff) / 255,
		alphaFromInput: (u & 0xff) / 255
	};
}

/**
 * Detect whether an array's numeric values should be treated as already
 * normalized (`0..1`) or as 8-bit (`0..255`). The rule is intentionally
 * coarse: if every element is `≤ 1` we normalize; if any element is
 * `> 1` we treat the entire array as 8-bit. Returns null if any element
 * is out-of-range (negative, > 255, or non-finite).
 */
function parseArray(arr: readonly number[]): {r: number; g: number; b: number; alphaFromInput?: number} | null {
	if (arr.length !== 3 && arr.length !== 4) {
		return null;
	}

	for (let i = 0; i < arr.length; i++) {
		const v = arr[i];
		if (!isNumberFinite(v) || v < 0 || v > 255) {
			return null;
		}
	}

	let anyAbove1 = false;
	for (let i = 0; i < arr.length; i++) {
		if (arr[i] > 1) {
			anyAbove1 = true;
			break;
		}
	}

	const scale = anyAbove1 ? 1 / 255 : 1;
	const result: {r: number; g: number; b: number; alphaFromInput?: number} = {
		r: arr[0] * scale,
		g: arr[1] * scale,
		b: arr[2] * scale
	};

	if (arr.length === 4) {
		result.alphaFromInput = arr[3] * scale;
	}

	return result;
}

/**
 * Normalize any supported color form to an `[r, g, b, a]` tuple in
 * 0..1 alongside provenance flags. Invalid / null / undefined input
 * logs via `console.error` (when invalid) and returns `current`
 * unchanged with both provenance flags false — the helper never throws
 * and never guesses at user intent.
 *
 * `rgbProvided` is true when the input form supplied RGB; `alphaProvided`
 * is true only when the input form carried alpha (8-digit hex,
 * 4-element array, or 8-digit-number). Both are false for `null` /
 * `undefined` / invalid input.
 */
export function slugTextColorParse(
	input: SlugTextColor | null | undefined,
	current: readonly [number, number, number, number]
): SlugTextColorParse {
	if (input === null || input === undefined) {
		return {
			rgba: [current[0], current[1], current[2], current[3]],
			rgbProvided: false,
			alphaProvided: false
		};
	}

	let parsed: {r: number; g: number; b: number; alphaFromInput?: number} | null;
	if (typeof input === 'string') {
		parsed = parseHexString(input);
		if (!parsed) {
			reportColorError(`Invalid hex string "${input}" — expected 2, 3, 4, 6, or 8 hex digits, optionally prefixed with # or 0x.`);
			return {
				rgba: [current[0], current[1], current[2], current[3]],
				rgbProvided: false,
				alphaProvided: false
			};
		}
	} else if (typeof input === 'number') {
		parsed = parseNumber(input);
		if (!parsed) {
			reportColorError(`Invalid hex number ${input} — expected a finite integer in 0..0xFFFFFFFF.`);
			return {
				rgba: [current[0], current[1], current[2], current[3]],
				rgbProvided: false,
				alphaProvided: false
			};
		}
	} else if (Array.isArray(input)) {
		parsed = parseArray(input as readonly number[]);
		if (!parsed) {
			reportColorError(`Invalid color array [${(input as readonly number[]).join(', ')}] — each element must be a finite number in 0..255, and the array must have 3 or 4 elements.`);
			return {
				rgba: [current[0], current[1], current[2], current[3]],
				rgbProvided: false,
				alphaProvided: false
			};
		}
	} else {
		reportColorError(`Unsupported color input type (${typeof input}). Expected string, number, or [r, g, b] / [r, g, b, a] array.`);
		return {
			rgba: [current[0], current[1], current[2], current[3]],
			rgbProvided: false,
			alphaProvided: false
		};
	}

	const alphaProvided = parsed.alphaFromInput !== undefined;
	return {
		rgba: [
			parsed.r,
			parsed.g,
			parsed.b,
			alphaProvided ? (parsed.alphaFromInput as number) : current[3]
		],
		rgbProvided: true,
		alphaProvided
	};
}

/**
 * Tuple-only convenience wrapper — preserved for the many callers that
 * don't need provenance flags.
 */
export function slugTextColorToRgba(
	input: SlugTextColor | null | undefined,
	current: readonly [number, number, number, number]
): SlugTextColorRgba {
	return slugTextColorParse(input, current).rgba;
}
