import {extensions, ExtensionType} from 'pixi.js';

const FONT_URL_RE = /\.(ttf|otf|woff2?)(\?|#|$)/i;

/**
 * Registered once `slugFontsInstallLoaderV8` is called. Kept at module
 * scope so double-install is a no-op.
 */
let installed = false;

/**
 * Register a PIXI v8 loader parser that fetches font files as raw
 * `ArrayBuffer` instead of wrapping them in a `FontFace`. After calling
 * this once at app startup, `Assets.load('foo.ttf')` returns an
 * `ArrayBuffer` that `SlugText` accepts directly.
 *
 * Priority `High` overrides PIXI's default `loadWebFont` parser
 * (priority `Low`). Matches extensions `.ttf`, `.otf`, `.woff`, `.woff2`.
 *
 * Callers who still want the browser `FontFace` behavior for some files
 * should avoid this helper or add their own higher-priority parser.
 */
export function slugFontsInstallLoaderV8(): void {
	if (installed) {
		return;
	}

	installed = true;
	extensions.add({
		extension: {
			type: ExtensionType.LoadParser,
			priority: 2
		},
		name: 'slug-font-binary',
		test(url: string): boolean {
			return FONT_URL_RE.test(url);
		},
		async load(url: string): Promise<ArrayBuffer> {
			const res = await fetch(url);
			if (!res.ok) {
				throw new Error(`slugFontsInstallLoaderV8: fetch ${url} failed with ${res.status}`);
			}

			return res.arrayBuffer();
		}
	});
}
