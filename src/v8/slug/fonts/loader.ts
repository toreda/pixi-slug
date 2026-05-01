import {extensions, ExtensionType} from 'pixi.js';
import {Constants} from '../../../constants';

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
 * @remarks
 * Callers who still want the browser `FontFace` behavior for some files
 * should avoid this helper or add their own higher-priority parser.
 *
 * Returns `true` when this call performed the registration, `false`
 * when it was a no-op (already installed) or when the underlying
 * `extensions.add` threw. The thrown error is logged via
 * `console.error` rather than re-thrown so a misbehaving extension
 * registration cannot bring down app startup.
 *
 * Failure is not sticky. If `extensions.add` throws the install flag
 * stays `false` and a later call will retry. Deciding whether to retry
 * — and how aggressively — is up to the caller. Realistic failures
 * (extension manager misconfiguration, duplicate registration) tend
 * not to recover on their own, so callers that retry should rate-limit
 * or bound the attempts to avoid filling the console with the same
 * error.
 */
export function slugFontsInstallLoaderV8(): boolean {
	if (installed) {
		return false;
	}

	try {
		extensions.add({
			extension: {
				type: ExtensionType.LoadParser,
				priority: 2
			},
			name: 'slug-font-binary',
			test(url: string): boolean {
				return Constants.FONT_URL_REGEX.test(url);
			},
			async load(url: string): Promise<ArrayBuffer> {
				const res = await fetch(url);
				if (!res.ok) {
					throw new Error(`slugFontsInstallLoaderV8: fetch ${url} failed with ${res.status}`);
				}

				return res.arrayBuffer();
			}
		});
		installed = true;
	} catch (err) {
		console.error('slugFontsInstallLoaderV8: failed to register loader extension', err);
	}

	return installed;
}
