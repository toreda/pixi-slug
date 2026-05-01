/**
 * Structural invariants of the package — values that are NOT configurable
 * because they are dictated by the shader contract or fixed geometry.
 *
 * Unlike `Defaults`, these are not meant to be edited. Each constant exists
 * here only so that magic numbers don't appear inline at call sites and so
 * that any code that needs the value reads from a single source of truth.
 */
export class Constants {
	/**
	 * Number of floats per vertex in the Slug glyph vertex layout.
	 * Five vec4 attributes (aPositionNormal, aTexcoord, aJacobian,
	 * aBanding, aColor) × 4 floats each = 20. Tied 1:1 to the shader's
	 * input declarations.
	 */
	public static readonly FLOATS_PER_VERTEX = 20 as const;

	/** Number of vertices per glyph quad (one quad = 4 corners). */
	public static readonly VERTICES_PER_QUAD = 4 as const;

	/** Number of indices per glyph quad (two triangles × 3 indices). */
	public static readonly INDICES_PER_QUAD = 6 as const;

	/**
	 * Bytes per float in the vertex buffer. The Slug vertex layout is
	 * exclusively `float32`, so this is also the byte size of one
	 * vertex-attribute scalar. Used to convert between float-indexed
	 * and byte-indexed offsets when describing the geometry layout.
	 */
	public static readonly BYTES_PER_FLOAT = 4 as const;

	/**
	 * Floats per vec4 vertex attribute. Every Slug vertex attribute
	 * (`aPositionNormal`, `aTexcoord`, `aJacobian`, `aBanding`,
	 * `aColor`) is a `float32x4`, so each one steps the buffer cursor
	 * forward by this many floats.
	 */
	public static readonly FLOATS_PER_VEC4 = 4 as const;

	/**
	 * URL test for the font formats `pixi-slug` accepts: `.ttf`, `.otf`,
	 * `.woff`, `.woff2`. The trailing group requires the extension to be
	 * followed by a query string (`?`), fragment (`#`), or end of input
	 * — preventing false positives like `.ttfx` or `something-otf-foo`.
	 *
	 * Used by every version's loader (`slugFontsInstallLoaderV7/V8`,
	 * `slugFontsFetchV6`) to decide whether a URL is a font file PIXI
	 * should hand off as raw bytes rather than wrapping in a `FontFace`.
	 */
	public static readonly FONT_URL_REGEX = /\.(ttf|otf|woff2?)(\?|#|$)/i;
}
