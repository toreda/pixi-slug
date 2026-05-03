import type {SlugGlyphData} from '../glyph/data';

/**
 * Result of packing all glyph data into GPU-ready textures.
 *
 * @deprecated For new code, use {@link SlugTexturePackState} +
 * {@link slugTextureAppendGlyphs}, which support incremental glyph
 * additions. {@link slugTexturePack} remains as a one-shot wrapper for
 * eager preload paths and backward compatibility.
 */
export interface SlugTexturePack {
	/** Float32 RGBA curve texture data (4 components per texel). */
	curveData: Float32Array;
	/** Uint32 RGBA band texture data (4 components per texel). */
	bandData: Uint32Array;
}

/**
 * Persistent packing state that tracks the curve and band texture
 * buffers across multiple {@link slugTextureAppendGlyphs} calls. Callers
 * (typically `SlugFont`) hold one of these per font and append glyphs as
 * the text class encounters new codepoints.
 *
 * The `*TexelIdx` fields are the next free texel slot. The `*Data`
 * buffers may be larger than `*TexelIdx * 4` — the trailing area is
 * pre-allocated headroom that future appends consume in place. When an
 * append would overflow the headroom, the buffer is reallocated to a
 * larger size and the `*Data` reference is replaced.
 */
export interface SlugTexturePackState {
	/**
	 * Texture width in texels. Fixed for the lifetime of the state — must
	 * always equal {@link BAND_TEXTURE_WIDTH} so the shader's
	 * `kLogBandTextureWidth` arithmetic stays valid.
	 */
	textureWidth: number;
	/** Float32 RGBA curve texture data. May be larger than `curveTexelIdx` worth of texels. */
	curveData: Float32Array;
	/** Uint32 RGBA band texture data. May be larger than `bandTexelIdx` worth of texels. */
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

/**
 * Initial number of texel rows allocated in each buffer when a state is
 * created with no preloaded glyphs. Sized to cover ~one row of headroom
 * so the very first glyph append does not trigger a grow.
 */
const INITIAL_ROWS = 1;

/**
 * Compute the number of curve texels needed per contour using the
 * shared-endpoint layout. Within a contour of N curves, each curve
 * gets 1 texel [p1x,p1y,p2x,p2y], plus 1 sentinel texel at the end
 * holding the last curve's p3 as [p3x,p3y,0,0]. The shader reads p3
 * via curveLoc.x+1, which naturally hits the next curve's p1 (== current
 * curve's p3) or the sentinel for the last curve.
 *
 * Row alignment: each curve's texel and the texel at +1 must share
 * a row. If a texel would land on the last column, skip to the next row.
 */
function countContourTexels(contourSize: number, startIdx: number, textureWidth: number): number {
	let idx = startIdx;
	// N curve texels + 1 sentinel, each needing its +1 neighbor on the same row
	const totalTexels = contourSize + 1;
	for (let i = 0; i < totalTexels; i++) {
		if ((idx & (textureWidth - 1)) === textureWidth - 1) {
			idx++; // skip last column to keep pair on same row
		}
		idx++;
	}
	return idx - startIdx;
}

/**
 * Compute the number of band texels a single glyph will consume. Mirrors
 * the row-alignment logic in {@link slugTextureAppendGlyphs} so callers
 * can pre-size buffers when they know the full glyph set up-front.
 */
function countGlyphBandTexels(glyph: SlugGlyphData, startIdx: number, textureWidth: number): number {
	const widthMask = textureWidth - 1;
	let idx = startIdx;

	const headerCount = glyph.hBandCount + glyph.vBandCount;
	const headerCol = idx & widthMask;
	if (headerCol + headerCount > textureWidth) {
		idx += textureWidth - headerCol;
	}
	idx += headerCount;

	for (const band of glyph.hBands) {
		if (band.length > 0) {
			const col = idx & widthMask;
			if (col + band.length > textureWidth) {
				idx += textureWidth - col;
			}
		}
		idx += band.length;
	}

	for (const band of glyph.vBands) {
		if (band.length > 0) {
			const col = idx & widthMask;
			if (col + band.length > textureWidth) {
				idx += textureWidth - col;
			}
		}
		idx += band.length;
	}

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
 * Reallocate `data` to hold at least `requiredTexels * 4` floats (or
 * uint32s), rounded up to a whole row. Doubles the current capacity at
 * minimum so the amortized cost of repeated grows stays O(N).
 */
function growFloat32(data: Float32Array, requiredTexels: number, textureWidth: number): Float32Array {
	const requiredFloats = requiredTexels * 4;
	if (data.length >= requiredFloats) {
		return data;
	}

	const currentFloats = data.length;
	const doubledFloats = currentFloats * 2;
	const targetFloats = Math.max(doubledFloats, requiredFloats);
	const targetTexels = Math.ceil(targetFloats / 4);
	const targetRows = Math.ceil(targetTexels / textureWidth);
	const next = new Float32Array(targetRows * textureWidth * 4);
	next.set(data);
	return next;
}

function growUint32(data: Uint32Array, requiredTexels: number, textureWidth: number): Uint32Array {
	const requiredU32s = requiredTexels * 4;
	if (data.length >= requiredU32s) {
		return data;
	}

	const currentU32s = data.length;
	const doubledU32s = currentU32s * 2;
	const targetU32s = Math.max(doubledU32s, requiredU32s);
	const targetTexels = Math.ceil(targetU32s / 4);
	const targetRows = Math.ceil(targetTexels / textureWidth);
	const next = new Uint32Array(targetRows * textureWidth * 4);
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
		curveData: new Float32Array(INITIAL_ROWS * textureWidth * 4),
		bandData: new Uint32Array(INITIAL_ROWS * textureWidth * 4),
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
	// buffers exactly once per append. Mirrors the row-alignment logic
	// in the write pass — must stay in lock-step.
	let curveCursor = state.curveTexelIdx;
	let bandCursor = state.bandTexelIdx;

	for (const glyph of glyphs) {
		curveCursor += countGlyphCurveTexels(glyph, curveCursor, textureWidth);
		bandCursor += countGlyphBandTexels(glyph, bandCursor, textureWidth);
	}

	const prevCurveLength = state.curveData.length;
	const prevBandLength = state.bandData.length;
	state.curveData = growFloat32(state.curveData, curveCursor, textureWidth);
	state.bandData = growUint32(state.bandData, bandCursor, textureWidth);
	const curveBufferGrew = state.curveData.length !== prevCurveLength;
	const bandBufferGrew = state.bandData.length !== prevBandLength;

	const curveData = state.curveData;
	const bandData = state.bandData;

	// Write pass: identical layout to the eager `slugTexturePack`. Run
	// glyph-by-glyph so prior glyphs already packed in the buffer are
	// untouched and their assigned offsets remain valid.
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
					curveTexelIdx++; // skip last column
				}

				curveTexels[i] = curveTexelIdx;
				const curve = glyph.curves[i];

				const base = curveTexelIdx * 4;
				curveData[base] = curve.p1x;
				curveData[base + 1] = curve.p1y;
				curveData[base + 2] = curve.p2x;
				curveData[base + 3] = curve.p2y;
				curveTexelIdx++;
			}

			const lastCurve = glyph.curves[contourEnd - 1];
			const sentBase = curveTexelIdx * 4;
			curveData[sentBase] = lastCurve.p3x;
			curveData[sentBase + 1] = lastCurve.p3y;
			curveTexelIdx++;
		}

		// --- Band texture packing ---
		const headerCount = glyph.hBandCount + glyph.vBandCount;
		const headerCol = bandTexelIdx & widthMask;
		if (headerCol + headerCount > textureWidth) {
			bandTexelIdx += textureWidth - headerCol;
		}

		glyph.bandOffset = bandTexelIdx;

		const headerStart = bandTexelIdx;
		bandTexelIdx += headerCount;

		for (let b = 0; b < glyph.hBandCount; b++) {
			const band = glyph.hBands[b];
			const headerBase = (headerStart + b) * 4;

			if (band.length > 0) {
				const col = bandTexelIdx & widthMask;
				if (col + band.length > textureWidth) {
					bandTexelIdx += textureWidth - col;
				}
			}

			bandData[headerBase] = band.length;
			bandData[headerBase + 1] = bandTexelIdx - glyph.bandOffset;

			for (const curveIdx of band) {
				const refBase = bandTexelIdx * 4;
				const absCurveTexel = curveTexels[curveIdx];
				bandData[refBase] = absCurveTexel & widthMask;
				bandData[refBase + 1] = absCurveTexel >>> 12;
				bandTexelIdx++;
			}
		}

		for (let b = 0; b < glyph.vBandCount; b++) {
			const band = glyph.vBands[b];
			const headerBase = (headerStart + glyph.hBandCount + b) * 4;

			if (band.length > 0) {
				const col = bandTexelIdx & widthMask;
				if (col + band.length > textureWidth) {
					bandTexelIdx += textureWidth - col;
				}
			}

			bandData[headerBase] = band.length;
			bandData[headerBase + 1] = bandTexelIdx - glyph.bandOffset;

			for (const curveIdx of band) {
				const refBase = bandTexelIdx * 4;
				const absCurveTexel = curveTexels[curveIdx];
				bandData[refBase] = absCurveTexel & widthMask;
				bandData[refBase + 1] = absCurveTexel >>> 12;
				bandTexelIdx++;
			}
		}
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
	const curveLength = curveRows * textureWidth * 4;
	const bandLength = bandRows * textureWidth * 4;

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
