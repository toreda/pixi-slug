import type {SlugGlyphData} from '../glyph/data';
import {slugTextureFloat16Encode} from './float16/encode';

/**
 * Result of packing all glyph data into GPU-ready textures.
 *
 * @deprecated For new code, use {@link SlugTexturePackState} +
 * {@link slugTextureAppendGlyphs}, which support incremental glyph
 * additions. {@link slugTexturePack} remains as a one-shot wrapper for
 * eager preload paths and backward compatibility.
 */
export interface SlugTexturePack {
	/** Half-float RGBA curve texture data (4 components per texel, IEEE 754 binary16 bit patterns). */
	curveData: Uint16Array;
	/** Packed uint32 band texture data (1 component per texel, two uint16 fields). */
	bandData: Uint32Array;
}

/**
 * Persistent packing state that tracks the curve and band texture
 * buffers across multiple {@link slugTextureAppendGlyphs} calls. Callers
 * (typically `SlugFont`) hold one of these per font and append glyphs as
 * the text class encounters new codepoints.
 *
 * The `*TexelIdx` fields are the next free texel slot. The `*Data`
 * buffers may be larger than the texel count — the trailing area is
 * pre-allocated headroom that future appends consume in place. When an
 * append would overflow the headroom, the buffer is reallocated to a
 * larger size and the `*Data` reference is replaced.
 *
 * Texture layouts:
 *
 *  - **Curve texture** — `rgba16float`, 4 half floats per texel
 *    (`CURVE_COMPONENTS`). Texel k holds `[p1x, p1y, p2x, p2y]` of one
 *    curve; its `p3` is the first two channels of texel k+1 (the next
 *    curve's `p1` within a contour, or a sentinel after the last curve).
 *  - **Band texture** — `r32float`, one 32-bit value per texel whose bit
 *    pattern packs two uint16 fields: `(hi << 16) | lo`. The shader
 *    recovers them with `floatBitsToUint`. Band headers store
 *    `hi = curve count`, `lo = curve-list offset relative to the glyph's
 *    band origin`. Curve references store `hi = curve texel column`,
 *    `lo = curve texel row`. Keeping the small-range field in the high
 *    half guarantees the float32 exponent bits are never all ones, so no
 *    packed value can be a NaN that the GPU might canonicalize.
 */
export interface SlugTexturePackState {
	/**
	 * Texture width in texels. Fixed for the lifetime of the state — must
	 * always equal {@link BAND_TEXTURE_WIDTH} so the shader's
	 * `kLogBandTextureWidth` arithmetic stays valid.
	 */
	textureWidth: number;
	/** Half-float RGBA curve texture data. May be larger than `curveTexelIdx` worth of texels. */
	curveData: Uint16Array;
	/** Packed uint32 band texture data. May be larger than `bandTexelIdx` worth of texels. */
	bandData: Uint32Array;
	/** Next free texel index in `curveData`. */
	curveTexelIdx: number;
	/** Next free texel index in `bandData`. */
	bandTexelIdx: number;
}

/**
 * Result of an {@link slugTextureAppendGlyphs} call. Tells the GPU layer
 * what changed so it can decide between a reallocate-and-reupload (when
 * a buffer grew) and an incremental `texSubImage2D` for the new tail.
 */
export interface SlugTextureAppendResult {
	/**
	 * True when the curve buffer was reallocated to a larger size during
	 * this append. Callers must reupload the entire curve texture.
	 */
	curveBufferGrew: boolean;
	/**
	 * True when the band buffer was reallocated to a larger size during
	 * this append. Callers must reupload the entire band texture.
	 */
	bandBufferGrew: boolean;
	/** First texel index written by this append in the curve buffer. */
	curveTexelStart: number;
	/** One past the last texel index written by this append in the curve buffer. */
	curveTexelEnd: number;
	/** First texel index written by this append in the band buffer. */
	bandTexelStart: number;
	/** One past the last texel index written by this append in the band buffer. */
	bandTexelEnd: number;
}

/**
 * Band texture width required by the fragment shader.
 * Must match kLogBandTextureWidth = 12 in frag.glsl, which hardcodes
 * the wrap-and-shift arithmetic in CalcBandLoc to a 4096-wide texture.
 */
const BAND_TEXTURE_WIDTH = 1 << 12; // 4096

/** Components (half floats) per curve texel. */
const CURVE_COMPONENTS = 4;

/** Largest value either uint16 field of a packed band texel can hold. */
const BAND_FIELD_MAX = 0xffff;

/**
 * Initial number of texel rows allocated in each buffer when a state is
 * created with no preloaded glyphs. Sized to cover ~one row of headroom
 * so the very first glyph append does not trigger a grow.
 */
const INITIAL_ROWS = 1;

/** Pack two uint16 fields into one uint32 band texel: `(hi << 16) | lo`. */
function packBandTexel(hi: number, lo: number): number {
	return ((hi << 16) | lo) >>> 0;
}

/**
 * Compute the number of curve texels needed per contour using the
 * shared-endpoint layout. Within a contour of N curves, each curve
 * gets 1 texel [p1x,p1y,p2x,p2y], plus 1 sentinel texel at the end
 * holding the last curve's p3 as [p3x,p3y,0,0]. The shader reads p3
 * via curveLoc.x+1, which naturally hits the next curve's p1 (== current
 * curve's p3) or the sentinel for the last curve.
 *
 * Row alignment: each curve's texel and the texel at +1 must share
 * a row. If a curve texel would land on the last column, it moves to the
 * next row and the last-column texel holds the previous curve's p3. The
 * sentinel is only read as a +1 neighbor, so it may use the last column.
 */
function countContourTexels(contourSize: number, startIdx: number, textureWidth: number): number {
	let idx = startIdx;
	for (let i = 0; i < contourSize; i++) {
		if ((idx & (textureWidth - 1)) === textureWidth - 1) {
			idx++; // skip last column to keep pair on same row
		}
		idx++;
	}
	// Sentinel
	idx++;
	return idx - startIdx;
}

/**
 * Compute the number of curve texels a single glyph will consume.
 */
function countGlyphCurveTexels(glyph: SlugGlyphData, startIdx: number, textureWidth: number): number {
	const starts = glyph.contourStarts;
	let total = 0;
	let idx = startIdx;

	for (let c = 0; c < starts.length; c++) {
		const contourBegin = starts[c];
		const contourEnd = c + 1 < starts.length ? starts[c + 1] : glyph.curves.length;
		const contourSize = contourEnd - contourBegin;
		if (contourSize === 0) continue;
		const used = countContourTexels(contourSize, idx, textureWidth);
		total += used;
		idx += used;
	}

	return total;
}

/**
 * Find `needle` as a contiguous run inside `haystack`. Returns the start
 * index of the first occurrence, or -1. Both are curve-index lists sorted
 * by the same comparator, so an identical or subset band shows up as an
 * exact contiguous match.
 */
function findContiguousRun(haystack: number[], needle: number[]): number {
	const n = needle.length;
	const last = haystack.length - n;
	const first = needle[0];
	outer: for (let i = 0; i <= last; i++) {
		if (haystack[i] !== first) continue;
		for (let j = 1; j < n; j++) {
			if (haystack[i + j] !== needle[j]) continue outer;
		}
		return i;
	}
	return -1;
}

/** A band curve list already written for the current glyph. */
interface WrittenBand {
	list: number[];
	/** Texel offset of the list, relative to the glyph's band origin. */
	rel: number;
}

/**
 * Lay out (and optionally write) the band data for one glyph starting at
 * `startIdx`. Returns the texel index one past the glyph's band data.
 *
 * When `bandData` is null this is a pure count pass — the same code path
 * is used for both so the pre-size and the write can never disagree.
 *
 * Layout per glyph: `hBandCount + vBandCount` header texels (kept within
 * one row so the shader's `glyphLoc.x + bandIndex` addressing is valid),
 * followed by curve-reference lists. A list is kept within one row for
 * the same reason (`hbandLoc.x + curveIndex`). Two reference-sharing
 * rules from the reference implementation shrink the data:
 *
 *  - A band whose list is identical to one already written points at the
 *    existing list.
 *  - A band whose list is a contiguous run inside an already-written list
 *    points into that list. Lists are sorted by descending max
 *    coordinate, so a band covering a subset of a neighbour's curves is
 *    usually a contiguous run of the neighbour's list.
 *
 * Sets `glyph.bandOffset` when writing.
 */
function layoutGlyphBands(
	glyph: SlugGlyphData,
	startIdx: number,
	textureWidth: number,
	bandData: Uint32Array | null,
	curveTexels: Uint32Array | null
): number {
	const widthMask = textureWidth - 1;
	let idx = startIdx;

	const headerCount = glyph.hBandCount + glyph.vBandCount;
	const headerCol = idx & widthMask;
	if (headerCol + headerCount > textureWidth) {
		idx += textureWidth - headerCol;
	}

	const bandOrigin = idx;
	const headerStart = idx;
	idx += headerCount;

	if (bandData !== null) {
		glyph.bandOffset = bandOrigin;
	}

	const written: WrittenBand[] = [];
	const writing = bandData !== null && curveTexels !== null;

	for (let b = 0; b < headerCount; b++) {
		const band = b < glyph.hBandCount ? glyph.hBands[b] : glyph.vBands[b - glyph.hBandCount];
		const len = band.length;
		let rel = 0;

		if (len > 0) {
			let reused = false;
			for (let w = 0; w < written.length; w++) {
				const prior = written[w];
				if (prior.list.length < len) continue;
				const at = findContiguousRun(prior.list, band);
				if (at >= 0) {
					rel = prior.rel + at;
					reused = true;
					break;
				}
			}

			if (!reused) {
				const col = idx & widthMask;
				if (col + len > textureWidth) {
					idx += textureWidth - col;
				}
				rel = idx - bandOrigin;
				if (rel > BAND_FIELD_MAX) {
					throw new Error(
						`Band data for glyph ${glyph.charCode} exceeds the 16-bit relative offset range (${rel} texels)`
					);
				}

				if (writing) {
					for (let k = 0; k < len; k++) {
						const absCurveTexel = (curveTexels as Uint32Array)[band[k]];
						(bandData as Uint32Array)[idx + k] = packBandTexel(
							absCurveTexel & widthMask,
							absCurveTexel >>> 12
						);
					}
				}

				written.push({list: band, rel});
				idx += len;
			}
		}

		if (writing) {
			(bandData as Uint32Array)[headerStart + b] = packBandTexel(len, rel);
		}
	}

	return idx;
}

/**
 * Reallocate `data` to hold at least `requiredTexels * CURVE_COMPONENTS`
 * half floats, rounded up to a whole row. Doubles the current capacity at
 * minimum so the amortized cost of repeated grows stays O(N).
 */
function growCurveBuffer(data: Uint16Array, requiredTexels: number, textureWidth: number): Uint16Array {
	const required = requiredTexels * CURVE_COMPONENTS;
	if (data.length >= required) {
		return data;
	}

	const target = Math.max(data.length * 2, required);
	const targetTexels = Math.ceil(target / CURVE_COMPONENTS);
	const targetRows = Math.ceil(targetTexels / textureWidth);
	const next = new Uint16Array(targetRows * textureWidth * CURVE_COMPONENTS);
	next.set(data);
	return next;
}

/**
 * Reallocate `data` to hold at least `requiredTexels` packed band values,
 * rounded up to a whole row.
 */
function growBandBuffer(data: Uint32Array, requiredTexels: number, textureWidth: number): Uint32Array {
	if (data.length >= requiredTexels) {
		return data;
	}

	const target = Math.max(data.length * 2, requiredTexels);
	const targetRows = Math.ceil(target / textureWidth);
	const next = new Uint32Array(targetRows * textureWidth);
	next.set(data);
	return next;
}

/**
 * Create a fresh packing state with empty curve and band buffers sized
 * to a single row of headroom. The first append will only trigger a
 * grow when the incoming glyphs exceed that initial allocation.
 */
export function slugTexturePackStateCreate(textureWidth: number): SlugTexturePackState {
	if (textureWidth !== BAND_TEXTURE_WIDTH) {
		throw new Error(
			`textureWidth must be ${BAND_TEXTURE_WIDTH} to match kLogBandTextureWidth=12 in frag.glsl, got ${textureWidth}`
		);
	}

	return {
		textureWidth,
		curveData: new Uint16Array(INITIAL_ROWS * textureWidth * CURVE_COMPONENTS),
		bandData: new Uint32Array(INITIAL_ROWS * textureWidth),
		curveTexelIdx: 0,
		bandTexelIdx: 0
	};
}

/**
 * Append a batch of glyphs to the packing state, writing curve and band
 * data into the existing buffers (growing them if needed) and assigning
 * `curveOffset` / `bandOffset` on each glyph. After this call returns,
 * `state.curveData` / `state.bandData` may be replaced (when a grow was
 * required); callers that hold prior references must read the fields
 * back from the state.
 *
 * Glyphs already packed (those with `curveOffset` and `bandOffset`
 * already written by a prior append) MUST NOT be passed in again — they
 * would be re-packed at a new offset and the prior offset would become
 * stale, corrupting the texture for any vertex buffer that captured the
 * old values.
 */
export function slugTextureAppendGlyphs(
	state: SlugTexturePackState,
	glyphs: SlugGlyphData[]
): SlugTextureAppendResult {
	const textureWidth = state.textureWidth;
	const widthMask = textureWidth - 1;

	const curveTexelStart = state.curveTexelIdx;
	const bandTexelStart = state.bandTexelIdx;

	// Pre-pass: compute the final texel cursors so we can grow the
	// buffers exactly once per append. Uses the same layout code as the
	// write pass so the two can never drift apart.
	let curveCursor = state.curveTexelIdx;
	let bandCursor = state.bandTexelIdx;

	for (const glyph of glyphs) {
		curveCursor += countGlyphCurveTexels(glyph, curveCursor, textureWidth);
		bandCursor = layoutGlyphBands(glyph, bandCursor, textureWidth, null, null);
	}

	const prevCurveLength = state.curveData.length;
	const prevBandLength = state.bandData.length;
	state.curveData = growCurveBuffer(state.curveData, curveCursor, textureWidth);
	state.bandData = growBandBuffer(state.bandData, bandCursor, textureWidth);
	const curveBufferGrew = state.curveData.length !== prevCurveLength;
	const bandBufferGrew = state.bandData.length !== prevBandLength;

	const curveData = state.curveData;
	const bandData = state.bandData;

	// Write pass. Run glyph-by-glyph so prior glyphs already packed in
	// the buffer are untouched and their assigned offsets remain valid.
	let curveTexelIdx = state.curveTexelIdx;
	let bandTexelIdx = state.bandTexelIdx;

	for (const glyph of glyphs) {
		glyph.curveOffset = curveTexelIdx;

		const curveTexels = new Uint32Array(glyph.curves.length);
		const starts = glyph.contourStarts;

		for (let c = 0; c < starts.length; c++) {
			const contourBegin = starts[c];
			const contourEnd = c + 1 < starts.length ? starts[c + 1] : glyph.curves.length;
			const contourSize = contourEnd - contourBegin;
			if (contourSize === 0) continue;

			for (let i = contourBegin; i < contourEnd; i++) {
				if ((curveTexelIdx & widthMask) === widthMask) {
					// Skip the last column, but fill it with the previous
					// curve's p3: that curve reads its p3 from this texel.
					if (i > contourBegin) {
						const prevCurve = glyph.curves[i - 1];
						const bridgeBase = curveTexelIdx * CURVE_COMPONENTS;
						curveData[bridgeBase] = slugTextureFloat16Encode(prevCurve.p3x);
						curveData[bridgeBase + 1] = slugTextureFloat16Encode(prevCurve.p3y);
						curveData[bridgeBase + 2] = 0;
						curveData[bridgeBase + 3] = 0;
					}
					curveTexelIdx++;
				}

				curveTexels[i] = curveTexelIdx;
				const curve = glyph.curves[i];

				const base = curveTexelIdx * CURVE_COMPONENTS;
				curveData[base] = slugTextureFloat16Encode(curve.p1x);
				curveData[base + 1] = slugTextureFloat16Encode(curve.p1y);
				curveData[base + 2] = slugTextureFloat16Encode(curve.p2x);
				curveData[base + 3] = slugTextureFloat16Encode(curve.p2y);
				curveTexelIdx++;
			}

			const lastCurve = glyph.curves[contourEnd - 1];
			const sentBase = curveTexelIdx * CURVE_COMPONENTS;
			curveData[sentBase] = slugTextureFloat16Encode(lastCurve.p3x);
			curveData[sentBase + 1] = slugTextureFloat16Encode(lastCurve.p3y);
			curveData[sentBase + 2] = 0;
			curveData[sentBase + 3] = 0;
			curveTexelIdx++;
		}

		bandTexelIdx = layoutGlyphBands(glyph, bandTexelIdx, textureWidth, bandData, curveTexels);
	}

	state.curveTexelIdx = curveTexelIdx;
	state.bandTexelIdx = bandTexelIdx;

	return {
		curveBufferGrew,
		bandBufferGrew,
		curveTexelStart,
		curveTexelEnd: curveTexelIdx,
		bandTexelStart,
		bandTexelEnd: bandTexelIdx
	};
}

/**
 * One-shot pack: takes a complete glyph set, allocates buffers sized
 * exactly to the packed data, and writes everything in a single pass.
 * Equivalent to `slugTexturePackStateCreate` + a single
 * `slugTextureAppendGlyphs`, with the trailing buffer slack trimmed off.
 *
 * Retained as a convenience for fully-eager preload paths and tests
 * that compare against the legacy packing output. New code that
 * processes glyphs incrementally should use the state-based API
 * directly.
 */
export function slugTexturePack(glyphs: SlugGlyphData[], textureWidth: number): SlugTexturePack {
	const state = slugTexturePackStateCreate(textureWidth);
	slugTextureAppendGlyphs(state, glyphs);

	// Trim trailing slack so the returned buffers match the legacy
	// "exactly N rows" layout. Round up to a whole row — partial rows
	// would break the GPU upload's row-pitch assumptions.
	const curveRows = Math.ceil(state.curveTexelIdx / textureWidth) || 1;
	const bandRows = Math.ceil(state.bandTexelIdx / textureWidth) || 1;
	const curveLength = curveRows * textureWidth * CURVE_COMPONENTS;
	const bandLength = bandRows * textureWidth;

	const curveData =
		state.curveData.length === curveLength
			? state.curveData
			: state.curveData.subarray(0, curveLength).slice();
	const bandData =
		state.bandData.length === bandLength
			? state.bandData
			: state.bandData.subarray(0, bandLength).slice();

	return {curveData, bandData};
}
