import opentype, {type Font as OpentypeFont, type Glyph as OpentypeGlyph} from 'opentype.js';
import {Defaults} from '../../defaults';
import type {SlugGlyphData} from './glyph/data';
import {slugGlyphCurves} from './glyph/curves';
import {slugGlyphBands} from './glyph/bands';
import {
	slugTextureAppendGlyphs,
	slugTexturePackStateCreate,
	type SlugTextureAppendResult,
	type SlugTexturePackState
} from './texture/pack';
import {slugWoff2Decompress} from './woff2/decompress';

/**
 * Result returned by {@link SlugFont.ensureGlyphs} so the GPU layer
 * knows whether the underlying texture buffers grew (full reupload
 * required) or only the tail changed (incremental `texSubImage2D`).
 *
 * `addedAny` is the high-level signal callers usually need: if false,
 * every codepoint requested was already cached and no GPU work is
 * required at all. When true, the remaining fields describe the change.
 *
 * `appended` is the raw texel ranges from {@link slugTextureAppendGlyphs}
 * — it is null when `addedAny` is false (no append happened).
 */
export interface SlugFontEnsureResult {
	addedAny: boolean;
	appended: SlugTextureAppendResult | null;
}

/**
 * Preprocesses font glyph outlines into GPU-ready curve and band textures
 * for the Slug rendering algorithm.
 *
 * Glyphs are processed lazily — {@link load} / {@link loadSync} parse
 * the font file and capture metrics + advance widths, but no glyph
 * outlines are processed until the first call to {@link ensureGlyphs}
 * (which the text class invokes per render). Callers that want eager
 * processing for known UI text or for a full character-set warmup can
 * use the `preload` option on `SlugFonts.fromUrl` / `SlugFonts.from`,
 * or invoke {@link ensureGlyphs} directly after load.
 */
export class SlugFont {
	/**
	 * Curve texture data: quadratic Bezier control points (float RGBA).
	 *
	 * @remarks
	 * Tracks the internal pack state's curve buffer. Replaced (not
	 * mutated in-place) when {@link ensureGlyphs} grows the buffer to
	 * fit new glyphs. GPU-layer code reading this field must re-read on
	 * every {@link ensureGlyphs} call that reports `curveBufferGrew`.
	 *
	 * Length is rounded up to a multiple of `textureWidth × 4` so the
	 * value can be uploaded as a whole-row texture without truncation
	 * or padding logic in the GPU layer.
	 */
	public curveData: Float32Array;
	/**
	 * Band texture data: hierarchical band index (uint RGBA, uploaded
	 * as rgba32uint or via uint→float bit reinterpretation depending on
	 * the version-specific GPU layer).
	 *
	 * Same lifecycle as {@link curveData} — replaced on grow, not
	 * mutated in place.
	 */
	public bandData: Uint32Array;
	/** Texture width (must be power of 2). Smaller fonts can use smaller textures to save memory. */
	public readonly textureWidth: number;
	/**
	 * Preprocessed glyph data indexed by Unicode code point. Populated
	 * lazily by {@link ensureGlyphs} as text references each codepoint;
	 * an entry exists only after the corresponding glyph has been
	 * processed and packed into the curve/band textures.
	 */
	public readonly glyphs: Map<number, SlugGlyphData>;
	/**
	 * Advance widths for ALL glyphs (including empty ones like space),
	 * indexed by char code. Populated eagerly during {@link loadSync} /
	 * {@link load}: advance widths are tiny (one number per codepoint),
	 * the text class needs them for layout regardless of whether the
	 * codepoint has a renderable outline (e.g. spaces, control chars),
	 * and storing them up front avoids forcing a full glyph processing
	 * pass just to lay out a line of text.
	 */
	public readonly advances: Map<number, number>;
	/** Font units per em (used to normalize coordinates). */
	public unitsPerEm: number;
	/** Typographic ascender in font units (positive, above baseline). */
	public ascender: number;
	/** Typographic descender in font units (negative, below baseline). */
	public descender: number;
	/** Underline position in font units (negative = below baseline). */
	public underlinePosition: number;
	/** Underline thickness in font units. */
	public underlineThickness: number;
	/** Strikethrough position in font units (positive = above baseline). */
	public strikethroughPosition: number;
	/** Strikethrough thickness in font units. */
	public strikethroughSize: number;

	/**
	 * Version-specific GPU resources (textures, shader program) cached for sharing
	 * across all SlugText instances. Populated lazily by version-specific code
	 * (e.g. slugFontGpuV8). SlugFont itself never imports or knows about PixiJS.
	 */
	public gpuCache: unknown;

	/** Cleanup function for gpuCache, set by the version-specific factory. */
	private _gpuDestroy: (() => void) | null;

	/**
	 * Parsed opentype.js font, retained after load so {@link ensureGlyphs}
	 * can resolve unprocessed codepoints on demand. Null until a
	 * successful load completes; reset to null on a failed reload.
	 */
	private _otFont: OpentypeFont | null;

	/**
	 * Persistent texture pack state. Created on first successful load
	 * (when `textureWidth === 4096`). Stays null when no font has been
	 * loaded yet — `curveData` / `bandData` remain empty in that case so
	 * the legacy "freshly constructed font" contract holds.
	 */
	private _pack: SlugTexturePackState | null;

	constructor(textureWidth: number = Defaults.TEXTURE_SIZE) {
		if (textureWidth <= 0 || (textureWidth & (textureWidth - 1)) !== 0) {
			throw new Error(`textureWidth must be a power of 2, got ${textureWidth}`);
		}

		this.textureWidth = textureWidth;
		this.curveData = new Float32Array(0);
		this.bandData = new Uint32Array(0);
		this.glyphs = new Map();
		this.advances = new Map();
		this.unitsPerEm = 0;
		this.ascender = 0;
		this.descender = 0;
		this.underlinePosition = 0;
		this.underlineThickness = 0;
		this.strikethroughPosition = 0;
		this.strikethroughSize = 0;
		this.gpuCache = null;
		this._gpuDestroy = null;
		this._otFont = null;
		this._pack = null;
	}

	/**
	 * Set the GPU cache cleanup function. Called by version-specific factories
	 * (e.g. slugFontGpuV8) when they populate gpuCache.
	 */
	public setGpuDestroy(fn: () => void): boolean {
		if (typeof fn !== 'function') {
			return false;
		}

		this._gpuDestroy = fn;
		return true;
	}

	/**
	 * Destroy GPU resources (textures, etc.) owned by this font.
	 * Call only after all SlugText instances using this font are destroyed.
	 */
	public destroyGpu(): void {
		if (typeof this._gpuDestroy === 'function') {
			this._gpuDestroy();
		}
		// `null` it after fn check, so its always cleared even when it's not
		// a valid function.
		this._gpuDestroy = null;
		this.gpuCache = null;
	}

	/**
	 * GPU memory consumed by this font's curve and band textures, in bytes.
	 * Both textures use rgba32float (4 channels × 4 bytes per texel).
	 * Band data is uint32 reinterpreted as float32 bit patterns on upload.
	 * This is shared across all SlugText instances that use this font.
	 */
	public memoryBytes(): number {
		const bytesPerTexel = 4 * 4; // rgba32float
		const textureWidth = this.textureWidth;
		const curveRows = Math.ceil(this.curveData.length / 4 / textureWidth) || 1;
		const bandRows = Math.ceil(this.bandData.length / 4 / textureWidth) || 1;
		return (curveRows + bandRows) * textureWidth * bytesPerTexel;
	}

	public async load(fontData: ArrayBuffer): Promise<void> {
		// WOFF2 files start with the signature "wOF2" (0x77 0x4F 0x46 0x32).
		// opentype.js cannot decode brotli-compressed WOFF2, so decompress
		// to a plain sfnt buffer first. The wasm decompressor is inlined
		// base64 in the woff2-encoder package — bundled at build time, no
		// runtime asset fetch needed.
		const bytes = new Uint8Array(fontData);
		if (bytes.length >= 4 && bytes[0] === 0x77 && bytes[1] === 0x4f && bytes[2] === 0x46 && bytes[3] === 0x32) {
			const sfnt = await slugWoff2Decompress(bytes);
			const copy = new Uint8Array(sfnt.byteLength);
			copy.set(sfnt);
			this.loadSync(copy.buffer);
			return;
		}
		this.loadSync(fontData);
	}

	/**
	 * Synchronous equivalent of {@link load}. Accepts TTF/OTF/WOFF bytes
	 * only — WOFF2 requires async brotli decompression via {@link load}.
	 *
	 * Parses the font and captures metrics + advance widths but does NOT
	 * process glyph outlines. Outlines are processed on demand when
	 * {@link ensureGlyphs} is called (typically by `SlugText.rebuild`).
	 * Callers that want eager processing should call {@link ensureGlyphs}
	 * directly after load, or use the `preload` option on the registry
	 * helpers (`SlugFonts.fromUrl` / `SlugFonts.from`).
	 */
	public loadSync(fontData: ArrayBuffer): void {
		const bytes = new Uint8Array(fontData);
		if (bytes.length >= 4 && bytes[0] === 0x77 && bytes[1] === 0x4f && bytes[2] === 0x46 && bytes[3] === 0x32) {
			throw new Error('WOFF2 fonts cannot be parsed synchronously; call load() instead.');
		}

		// Parse first so a malformed buffer throws BEFORE we touch any
		// existing state. The catch block has nothing to roll back.
		const font = opentype.parse(fontData);

		// Reset existing state in place — the public `glyphs` / `advances`
		// maps are `readonly`, so we clear rather than reassign.
		this.glyphs.clear();
		this.advances.clear();
		// Drop any prior pack state and GPU cache so the next ensureGlyphs
		// rebuilds against the new font's data.
		this._pack = null;
		this.curveData = new Float32Array(0);
		this.bandData = new Uint32Array(0);
		this.destroyGpu();

		this._otFont = font;
		this.unitsPerEm = font.unitsPerEm;
		this.ascender = font.ascender;
		this.descender = font.descender;

		// OS/2 table metrics for underline and strikethrough
		const post = (font as any).tables?.post;
		const os2 = (font as any).tables?.os2;
		this.underlinePosition = post?.underlinePosition ?? Math.round(-font.unitsPerEm * 0.1);
		this.underlineThickness = post?.underlineThickness ?? Math.round(font.unitsPerEm * 0.05);
		this.strikethroughPosition = os2?.yStrikeoutPosition ?? Math.round(font.ascender * 0.3);
		this.strikethroughSize = os2?.yStrikeoutSize ?? this.underlineThickness;

		// Eagerly capture advance widths only — the text class needs them
		// to lay out non-renderable codepoints (space, control chars) and
		// to compute line widths even before any glyph is processed. This
		// is the cheap part of the old eager loop; the expensive curve /
		// band processing stays lazy.
		for (let i = 0; i < font.glyphs.length; i++) {
			const glyph = font.glyphs.get(i);
			const charCode = glyph.unicode;
			if (charCode !== undefined && glyph.advanceWidth) {
				this.advances.set(charCode, glyph.advanceWidth);
			}
		}

		// Pack state is only valid for the shader-locked texture width.
		// Construction below would throw on other widths — defer creation
		// so legacy `new SlugFont(custom).memoryBytes()` paths still work.
		// `ensureGlyphs` will throw the same "textureWidth must be 4096"
		// error if a non-4096 font tries to process outlines.
		if (this.textureWidth === Defaults.TEXTURE_SIZE) {
			this._pack = slugTexturePackStateCreate(this.textureWidth);
		}
	}

	/**
	 * Process every codepoint in `text` that has not yet been processed,
	 * appending its outline data to the curve/band textures. Returns
	 * metadata the GPU layer uses to decide between a tail-only upload
	 * and a full reupload. No-op (returns `addedAny: false`) when every
	 * codepoint is already cached.
	 *
	 * Synchronous and bounded by the number of NEW codepoints, not by
	 * the total length of `text`. Safe to call from a render path —
	 * cached glyphs short-circuit at the cost of a single Map lookup
	 * per codepoint.
	 */
	public ensureGlyphs(text: string): SlugFontEnsureResult {
		if (text.length === 0) {
			return {addedAny: false, appended: null};
		}

		// Collect missing codepoints first so the underlying append is
		// batched — one grow check, one texSubImage2D on the GPU side.
		// Use a Set to dedupe within the input string (e.g. "Hello" has
		// two 'l's).
		let missing: number[] | null = null;
		for (let i = 0; i < text.length; i++) {
			const code = text.charCodeAt(i);
			if (this.glyphs.has(code)) {
				continue;
			}

			if (missing === null) {
				missing = [];
			}

			// O(n) linear scan, but `missing` stays small in practice
			// (per-text-change deltas are usually 0–10 codepoints) and
			// avoids a per-call Set allocation on the hot cache-hit path.
			if (missing.indexOf(code) === -1) {
				missing.push(code);
			}
		}

		if (missing === null) {
			return {addedAny: false, appended: null};
		}

		return this.ensureGlyphsForCodepoints(missing);
	}

	/**
	 * Like {@link ensureGlyphs} but accepts a codepoint iterable
	 * directly — useful for preload paths that drive a known set
	 * (`'Loading...'`, ASCII range, the font's full cmap, etc.) without
	 * needing to materialize a string first.
	 *
	 * Codepoints already cached are skipped (cheap Map check). Codepoints
	 * the font does not contain are also skipped silently — missing
	 * glyphs are normal (e.g. CJK characters in a Latin font) and would
	 * make a per-glyph error callback noisy.
	 */
	public ensureGlyphsForCodepoints(codepoints: Iterable<number>): SlugFontEnsureResult {
		const otFont = this._otFont;
		const pack = this._pack;
		if (otFont === null || pack === null) {
			// No font loaded, or pack is unavailable for this textureWidth.
			// `loadSync` would have thrown earlier on malformed input, so
			// the only way to land here is "no load has happened yet" or
			// "non-4096 textureWidth was used" — both legitimate states.
			return {addedAny: false, appended: null};
		}

		const newGlyphs: SlugGlyphData[] = [];
		for (const code of codepoints) {
			if (this.glyphs.has(code)) {
				continue;
			}

			// Look up the cmap glyph index directly. `charToGlyph` would
			// silently fall back to glyph 0 (`.notdef`) for any codepoint
			// missing from the cmap, which would render a tofu box for
			// every unsupported character — the eager pipeline never did
			// this because it only walked glyphs whose `glyph.unicode`
			// was defined. Match that behavior by skipping codepoints
			// whose cmap lookup resolves to 0.
			const glyphIndex = otFont.charToGlyphIndex(String.fromCodePoint(code));
			if (glyphIndex === 0) {
				continue;
			}

			const glyph = otFont.glyphs.get(glyphIndex);
			if (!glyph || !glyph.path || glyph.path.commands.length === 0) {
				// Codepoint maps to a glyph index but the glyph has no
				// renderable outline (whitespace, empty contour). Don't
				// insert into the glyphs map — the quad builder treats
				// absence as "advance only" for these.
				continue;
			}

			const data = this._processGlyph(glyph, code);
			if (data === null) {
				continue;
			}

			newGlyphs.push(data);
			// Insert into the public map BEFORE pack so a future call for
			// the same codepoint sees the cache hit even if the pack
			// throws mid-flight. The offsets get assigned by
			// `slugTextureAppendGlyphs` below, mutating the same object.
			this.glyphs.set(code, data);
		}

		if (newGlyphs.length === 0) {
			return {addedAny: false, appended: null};
		}

		const appended = slugTextureAppendGlyphs(pack, newGlyphs);
		// Sync the public references with whatever `pack` now holds —
		// `slugTextureAppendGlyphs` may have replaced the underlying
		// buffers if a grow was required.
		this.curveData = pack.curveData;
		this.bandData = pack.bandData;

		return {addedAny: true, appended};
	}

	/**
	 * Run the curves + bands pipeline for a single glyph. Returns a
	 * fully populated {@link SlugGlyphData} (sans `curveOffset` /
	 * `bandOffset`, which are written by the texture-pack append).
	 *
	 * Returns null when the glyph produces no curves — typically a
	 * defensive guard for fonts whose path-command list parses to an
	 * empty curve array even though `commands.length > 0`.
	 */
	private _processGlyph(glyph: OpentypeGlyph, charCode: number): SlugGlyphData | null {
		const path = glyph.path;
		if (!path) {
			return null;
		}

		const {curves, contourStarts} = slugGlyphCurves(path.commands);
		if (curves.length === 0) {
			return null;
		}

		const bounds = glyph.getBoundingBox();
		const bandResult = slugGlyphBands(curves, bounds.x1, bounds.y1, bounds.x2, bounds.y2);

		return {
			charCode,
			curves,
			contourStarts,
			bounds: {
				minX: bounds.x1,
				minY: bounds.y1,
				maxX: bounds.x2,
				maxY: bounds.y2
			},
			advanceWidth: glyph.advanceWidth ?? 0,
			lsb: glyph.leftSideBearing ?? 0,
			hBandCount: bandResult.hBandCount,
			vBandCount: bandResult.vBandCount,
			hBands: bandResult.hBands,
			vBands: bandResult.vBands,
			curveOffset: 0,
			bandOffset: 0
		};
	}

	/**
	 * Iterate every codepoint with a renderable outline in the loaded
	 * font's cmap. Used by full-font preload paths so they don't have
	 * to duplicate cmap walking. Returns an empty iterable when no font
	 * has been loaded.
	 */
	public *cmapCodepoints(): Iterable<number> {
		const otFont = this._otFont;
		if (otFont === null) {
			return;
		}

		// opentype.js exposes the cmap as `glyphs.glyphs[idx].unicode`
		// for every glyph, plus an `unicodes` array for glyphs that map
		// to multiple codepoints. Walk every glyph and yield each unique
		// codepoint.
		const seen = new Set<number>();
		for (let i = 0; i < otFont.glyphs.length; i++) {
			const g = otFont.glyphs.get(i);
			if (g.unicode !== undefined && !seen.has(g.unicode)) {
				seen.add(g.unicode);
				yield g.unicode;
			}

			const unicodes = (g as unknown as {unicodes?: number[]}).unicodes;
			if (Array.isArray(unicodes)) {
				for (const code of unicodes) {
					if (!seen.has(code)) {
						seen.add(code);
						yield code;
					}
				}
			}
		}
	}
}
