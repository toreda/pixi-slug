import {SlugFont} from '../font';
import {SlugFonts} from '../fonts';
import {slugFontErrorRaise} from '../font/error/raise';
import {type SlugFontErrorPolicy} from '../font/error/policy';

/** Duck-type guard for a browser `FontFace`. Avoids depending on the global. */
function isFontFaceLike(v: unknown): v is FontFace {
	if (!v || typeof v !== 'object') {
		return false;
	}

	const o = v as Record<string, unknown>;
	return (
		'family' in o &&
		'status' in o &&
		'loaded' in o &&
		typeof (o.loaded as {then?: unknown})?.then === 'function'
	);
}

/**
 * Classify a raw string as URL-like. Returns true when the string should
 * be fetched as a font file; false means alias lookup. User strings pass
 * through verbatim — no normalization happens here or anywhere else in
 * the resolver, so cache keys always match what the caller wrote.
 *
 * URL-like rules (any one match):
 *  1. Contains `://` (absolute)
 *  2. Starts with `//` (protocol-relative)
 *  3. Starts with `/` (root-relative)
 *  4. Starts with `./` or `../` (explicit relative)
 *  5. Starts with `data:`
 *  6. Contains `/` anywhere (path segment)
 *  7. Ends with `.ttf` / `.otf` / `.woff` / `.woff2` (after stripping
 *     `?query` / `#fragment`)
 */
export function slugFontInputIsUrlLike(input: string): boolean {
	if (!input) {
		return false;
	}

	if (input.includes('://')) {
		return true;
	}

	if (
		input.startsWith('//') ||
		input.startsWith('/') ||
		input.startsWith('./') ||
		input.startsWith('../') ||
		input.startsWith('data:')
	) {
		return true;
	}

	if (input.includes('/')) {
		return true;
	}

	const pathOnly = input.split(/[?#]/, 1)[0].toLowerCase();
	if (
		pathOnly.endsWith('.ttf') ||
		pathOnly.endsWith('.otf') ||
		pathOnly.endsWith('.woff') ||
		pathOnly.endsWith('.woff2')
	) {
		return true;
	}

	return false;
}

/** Normalized alias/URL pair after dispatching tuple/object/bare-string inputs. */
interface AliasUrl {
	alias?: string;
	url?: string;
	/** True when the tuple/object form explicitly separated alias and url. */
	explicit: boolean;
}

function isAliasUrlRef(v: unknown): v is {alias?: unknown; url?: unknown} {
	if (!v || typeof v !== 'object' || Array.isArray(v)) {
		return false;
	}

	return 'alias' in (v as object) || 'url' in (v as object);
}

/**
 * Extract the first URL from a CSS `src` descriptor like
 * `url('https://…/foo.ttf')`. Returns null when no `url(...)` form
 * is present (e.g. `local('Arial')`).
 */
function extractUrlFromSrc(src: string): string | null {
	const match = src.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
	return match ? match[1] : null;
}

/**
 * Decode a base64 `data:` URI to a `Uint8Array`. Returns null when the
 * URI is not base64-encoded (e.g. percent-encoded text).
 */
function decodeBase64DataUri(src: string): Uint8Array | null {
	const comma = src.indexOf(',');
	if (comma === -1) {
		return null;
	}

	const header = src.slice(0, comma);
	if (!/;base64$/i.test(header)) {
		return null;
	}

	const binary = atob(src.slice(comma + 1));
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}

	return bytes;
}

/**
 * Resolve the {alias?, url?} pair against the registry:
 *  - alias hit, no url OR url matches existing entry → return existing font.
 *  - alias hit, url differs → aliasCollision error case; return null so
 *    the caller uses the fallback font. Policy default is 'error'
 *    (logs, does not throw) so a scene keeps rendering.
 *  - alias miss, url given → fetch url, bind alias to the loaded entry.
 *  - alias miss, no url → aliasNotFound; fallback.
 *  - no alias, url given → bare URL path; URL doubles as its own alias
 *    via the existing byUrl cache.
 */
async function resolveAliasUrlRef(ref: AliasUrl, policy: SlugFontErrorPolicy): Promise<SlugFont | null> {
	const {alias, url} = ref;

	if (!alias && !url) {
		slugFontErrorRaise(
			policy,
			'emptyInput',
			'Font reference has neither alias nor url. Provide at least one.'
		);
		return null;
	}

	if (alias) {
		const existing = SlugFonts.get(alias);
		if (existing) {
			if (!url) {
				return existing;
			}

			const entryForUrl = SlugFonts.get(url);
			if (entryForUrl === existing) {
				return existing;
			}

			slugFontErrorRaise(
				policy,
				'aliasCollision',
				`Alias "${alias}" is already registered to a different font. Ignoring new binding to "${url}". Call SlugFonts.unregister("${alias}") to rebind, or use a different alias.`
			);
			return null;
		}

		if (!url) {
			slugFontErrorRaise(
				policy,
				'aliasNotFound',
				`Alias "${alias}" is not registered and no url was provided. Preload the font or pass a url alongside the alias.`
			);
			return null;
		}

		const cachedUrlFont = SlugFonts.get(url);
		if (cachedUrlFont) {
			SlugFonts.register(alias, cachedUrlFont);
			return cachedUrlFont;
		}

		const font = await SlugFonts.fromUrl(url);
		if (!font) {
			slugFontErrorRaise(
				policy,
				'loadFailed',
				`Failed to load font from "${url}" for alias "${alias}".`
			);
			return null;
		}

		SlugFonts.register(alias, font);
		return font;
	}

	// url-only path: URL doubles as its own alias via byUrl.
	const font = await SlugFonts.fromUrl(url as string);
	if (!font) {
		slugFontErrorRaise(policy, 'loadFailed', `Failed to load font from "${url}".`);
		return null;
	}

	return font;
}

/**
 * Resolve a user-supplied font input to a loaded `SlugFont`. Accepts
 * every shape documented on `SlugTextFontInput`. Errors are routed
 * through `policy` so callers can opt between throwing, error logging,
 * warning, or silent fallback.
 */
export async function slugResolveFontInput(
	input: unknown,
	policy: SlugFontErrorPolicy
): Promise<SlugFont | null> {
	if (input instanceof SlugFont) {
		return input;
	}

	if (typeof input === 'string') {
		return resolveAliasUrlRef(
			slugFontInputIsUrlLike(input) ? {url: input, explicit: false} : {alias: input, explicit: false},
			policy
		);
	}

	if (input instanceof ArrayBuffer || input instanceof Uint8Array) {
		const font = await SlugFonts.from(input);
		if (!font) {
			slugFontErrorRaise(policy, 'loadFailed', 'Failed to parse font bytes.');
			return null;
		}

		return font;
	}

	if (Array.isArray(input)) {
		// String tuples: [alias] (sniffed) or [alias, url] (explicit).
		if (input.length > 0 && input.every((x) => typeof x === 'string')) {
			if (input.length === 1) {
				const only = input[0] as string;
				return resolveAliasUrlRef(
					slugFontInputIsUrlLike(only)
						? {url: only, explicit: false}
						: {alias: only, explicit: false},
					policy
				);
			}

			if (input.length === 2) {
				return resolveAliasUrlRef(
					{alias: input[0] as string, url: input[1] as string, explicit: true},
					policy
				);
			}
		}

		// Otherwise the array is a FontFace[] returned by PIXI's loader.
		if (input.length === 0) {
			slugFontErrorRaise(policy, 'emptyFontFaceArray', 'Received an empty FontFace array.');
			return null;
		}

		return slugResolveFontInput(input[0], policy);
	}

	if (isFontFaceLike(input)) {
		const rawSrc = (input as unknown as {src?: unknown}).src;
		const src = typeof rawSrc === 'string' ? rawSrc : '';
		if (!src) {
			slugFontErrorRaise(
				policy,
				'fontFaceNoUrl',
				`FontFace "${input.family}" has no usable src. Pass the font URL or raw bytes to SlugText instead.`
			);
			return null;
		}

		if (src.startsWith('data:')) {
			const bytes = decodeBase64DataUri(src);
			if (!bytes) {
				slugFontErrorRaise(
					policy,
					'unsupportedFormat',
					`FontFace "${input.family}" uses a non-base64 data URI which cannot be decoded.`
				);
				return null;
			}

			const font = await SlugFonts.from(bytes);
			if (!font) {
				slugFontErrorRaise(policy, 'loadFailed', `Failed to parse FontFace "${input.family}" bytes.`);
				return null;
			}

			return font;
		}

		const url = extractUrlFromSrc(src);
		if (!url) {
			slugFontErrorRaise(
				policy,
				'fontFaceNoUrl',
				`FontFace "${input.family}" src "${src}" has no url(...) reference (local() fonts are not supported — pass the font file directly).`
			);
			return null;
		}

		const font = await SlugFonts.fromUrl(url);
		if (!font) {
			slugFontErrorRaise(policy, 'loadFailed', `Failed to fetch FontFace source "${url}".`);
			return null;
		}

		return font;
	}

	if (isAliasUrlRef(input)) {
		const alias = typeof input.alias === 'string' ? input.alias : undefined;
		const url = typeof input.url === 'string' ? input.url : undefined;
		return resolveAliasUrlRef({alias, url, explicit: true}, policy);
	}

	slugFontErrorRaise(
		policy,
		'unknownInput',
		`Unsupported font input (${Object.prototype.toString.call(input)}). Expected SlugFont, URL string, ArrayBuffer, Uint8Array, FontFace, [alias] / [alias, url] tuple, or {alias?, url?} object.`
	);
	return null;
}

/**
 * Synchronous fast path: returns a `SlugFont` only when resolving the
 * input requires no I/O (direct instance, registered alias, or
 * already-cached URL). Any other input returns null and the caller
 * should fall back to `slugResolveFontInput`.
 */
export function slugTryResolveFontInputSync(input: unknown): SlugFont | null {
	if (input instanceof SlugFont) {
		return input;
	}

	if (typeof input === 'string') {
		return SlugFonts.get(input);
	}

	if (Array.isArray(input) && input.length > 0 && input.every((x) => typeof x === 'string')) {
		const key = input[0] as string;
		const hit = SlugFonts.get(key);
		if (hit) {
			return hit;
		}

		return null;
	}

	if (isAliasUrlRef(input)) {
		const alias = typeof input.alias === 'string' ? input.alias : undefined;
		const url = typeof input.url === 'string' ? input.url : undefined;
		if (alias) {
			const hit = SlugFonts.get(alias);
			if (hit) {
				return hit;
			}
		}

		if (url) {
			const hit = SlugFonts.get(url);
			if (hit) {
				return hit;
			}
		}

		return null;
	}

	return null;
}
