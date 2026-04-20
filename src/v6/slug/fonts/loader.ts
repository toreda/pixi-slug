const FONT_URL_RE = /\.(ttf|otf|woff2?)(\?|#|$)/i;

/**
 * Fetch a font file as a raw `ArrayBuffer` suitable for `SlugText`'s
 * `font` property. PIXI v6's resource-loader (`PIXI.Loader`) does not
 * retain the raw bytes when it processes TTF/OTF URLs — it installs a
 * `FontFace` in the document and discards the buffer — so there is no
 * way to plug an ArrayBuffer path into the default v6 loader pipeline
 * without replacing the entire font resource handling.
 *
 * This helper is the v6 equivalent of `slugFontsInstallLoaderV{7,8}`:
 * call it instead of `loader.add(url)` when the font is destined for a
 * `SlugText`. The result is cached by the `SlugFonts` registry on the
 * first resolve, so subsequent `SlugText` instances sharing the URL
 * skip the fetch.
 *
 * Throws on non-2xx responses and on unsupported file extensions.
 */
export async function slugFontsFetchV6(url: string): Promise<ArrayBuffer> {
	if (!FONT_URL_RE.test(url)) {
		throw new Error(`slugFontsFetchV6: "${url}" does not look like a font file (expected .ttf, .otf, .woff, .woff2).`);
	}

	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`slugFontsFetchV6: fetch ${url} failed with ${res.status}`);
	}

	return res.arrayBuffer();
}
