import type { SlugGlyphData } from './data';

/**
 * Number of floats per vertex for each attribute.
 * All 5 attributes are vec4 (4 floats each), totaling 20 floats per vertex.
 */
const FLOATS_PER_VERTEX = 20;

/** Number of vertices per glyph quad. */
const VERTICES_PER_QUAD = 4;

/** Number of indices per glyph quad (2 triangles). */
const INDICES_PER_QUAD = 6;

/** Shared buffer for uint32↔float32 bit reinterpretation (avoids per-call allocation). */
const _packBuf = new ArrayBuffer(4);
const _packU32 = new Uint32Array(_packBuf);
const _packF32 = new Float32Array(_packBuf);

/** Shared buffer for float32 round-trips (band scale/offset precision matching). */
const _f32 = new Float32Array(4);

/**
 * Packed vertex data for rendering glyph quads with the Slug shaders.
 * Contains interleaved attribute buffers and an index buffer.
 */
export interface SlugGlyphQuads {
	/** Interleaved vertex data: 5 vec4 attributes per vertex, 4 vertices per glyph. */
	vertices: Float32Array;
	/** Triangle index buffer (2 triangles per glyph quad). */
	indices: Uint32Array;
	/** Number of glyph quads built. */
	quadCount: number;
}

/**
 * Pack a float into a uint32 bit pattern, stored as a float.
 * Used to pass packed integer data through float vertex attributes.
 */
function packUint16Pair(low: number, high: number): number {
	_packU32[0] = ((high & 0xFFFF) << 16) | (low & 0xFFFF);
	return _packF32[0];
}

/**
 * Pack band max indices into a single float via uint32 reinterpretation.
 * low16 becomes glyphData.z (bandMax.x) in the shader → clamps vertical bandIndex.x.
 * high16 becomes glyphData.w (bandMax.y) in the shader → clamps horizontal bandIndex.y.
 */
function packBandMax(low16_vBandMax: number, high16_hBandMax: number): number {
	return packUint16Pair(low16_vBandMax, high16_hBandMax);
}

/**
 * Build per-glyph quads with the 5 vertex attributes required by the Slug shaders.
 *
 * For each character in the text string, looks up the glyph data from the font
 * and emits a quad (4 vertices, 6 indices) with:
 *   - aPositionNormal (vec4): position xy + normal zw
 *   - aTexcoord (vec4): em-space uv + packed glyph location + packed band data
 *   - aJacobian (vec4): inverse Jacobian entries (identity for axis-aligned)
 *   - aBanding (vec4): band scale/offset
 *   - aColor (vec4): vertex color RGBA
 *
 * @param text			Text string to build quads for.
 * @param glyphs		Glyph data map from SlugFont (keyed by char code).
 * @param advances		Advance width map for all glyphs (including empty ones like space).
 * @param unitsPerEm	Font units per em for coordinate normalization.
 * @param fontSize		Desired font size in pixels.
 * @param textureWidth	Width of the curve/band textures (must match font).
 * @param color			Text color as [r, g, b, a] in 0-1 range.
 * @param extraExpand	Extra outward expansion in pixels per side (e.g. stroke width). Default 0.
 */
export function slugGlyphQuads(
	text: string,
	glyphs: Map<number, SlugGlyphData>,
	advances: Map<number, number>,
	unitsPerEm: number,
	fontSize: number,
	textureWidth: number,
	color: [number, number, number, number] = [1, 1, 1, 1],
	extraExpand: number = 0
): SlugGlyphQuads {
	const scale = fontSize / unitsPerEm;
	const invScale = 1 / scale;
	const negInvScale = -invScale;
	const cr = color[0];
	const cg = color[1];
	const cb = color[2];
	const ca = color[3];

	// Count renderable glyphs and find the tallest glyph's top in em-space.
	// We use the actual max bounds.maxY (not the font's typographic ascender)
	// so that position(0,0) aligns the top of the tallest rendered glyph to y=0,
	// matching PixiJS Text behavior. The typographic ascender from the OS/2 table
	// includes extra line-gap space that would produce a visible offset.
	let quadCount = 0;
	let maxGlyphTop = 0;
	for (let i = 0; i < text.length; i++) {
		const g = glyphs.get(text.charCodeAt(i));
		if (g) {
			quadCount++;
			if (g.bounds.maxY > maxGlyphTop) {
				maxGlyphTop = g.bounds.maxY;
			}
		}
	}
	const baselineY = maxGlyphTop * scale;

	const vertices = new Float32Array(quadCount * VERTICES_PER_QUAD * FLOATS_PER_VERTEX);
	const indices = new Uint32Array(quadCount * INDICES_PER_QUAD);

	let cursorX = 0;
	let quadIdx = 0;

	for (let i = 0; i < text.length; i++) {
		const charCode = text.charCodeAt(i);
		const glyph = glyphs.get(charCode);
		if (!glyph) {
			// No curves for this char (e.g. space) — advance cursor using advance width
			const adv = advances.get(charCode);
			if (adv) {
				cursorX += adv * scale;
			}
			continue;
		}

		const { bounds, hBandCount, vBandCount, bandOffset } = glyph;

		// Glyph quad corners in pixel space.
		// Font Y is up (ascenders positive), screen Y is down.
		// Negate Y to flip, then add baselineY so that position(0,0)
		// places the ascender line at screen y=0.
		// extraExpand pushes each edge outward by N pixels (for stroke).
		const x0 = cursorX + bounds.minX * scale - extraExpand;
		const y0 = -bounds.maxY * scale + baselineY - extraExpand;
		const x1 = cursorX + bounds.maxX * scale + extraExpand;
		const y1 = -bounds.minY * scale + baselineY + extraExpand;

		// Em-space texcoords (used by fragment shader for curve evaluation).
		// These stay in font coordinate space (Y-up). Expand to match
		// the pixel-space expansion so the shader samples the wider area.
		// extraExpand is in pixels; convert to em-space via invScale.
		const emExpand = extraExpand * invScale;
		const u0 = bounds.minX - emExpand;
		const v0 = bounds.minY - emExpand;
		const u1 = bounds.maxX + emExpand;
		const v1 = bounds.maxY + emExpand;

		// Band transform: maps em-space coord to band index.
		// Use module-level _f32 for float32 round-trip to match GPU precision exactly —
		// the shader receives these as float32 vertex attributes, so the band
		// boundary arithmetic must agree with the CPU-side band assignment in bands.ts.
		//
		// Single shared scale for both axes (square band grid), matching the
		// reference. The scale uses the larger dimension so both axes fit.
		const glyphWidth = bounds.maxX - bounds.minX;
		const glyphHeight = bounds.maxY - bounds.minY;
		const maxDim = Math.max(glyphWidth, glyphHeight);
		const bandCount = Math.max(hBandCount, vBandCount);
		_f32[0] = maxDim > 0 ? bandCount / maxDim : 0;  // shared scale
		const bandScale = _f32[0];
		_f32[1] = -bounds.minX * bandScale;              // vBandOffset (X → vertical band)
		_f32[2] = -bounds.minY * bandScale;              // hBandOffset (Y → horizontal band)
		const bandScaleX  = bandScale;
		const bandScaleY  = bandScale;
		const bandOffsetX = _f32[1];
		const bandOffsetY = _f32[2];

		// Pack glyph band texture location (band offset x/y as 16-bit pair)
		const glyphLocX = bandOffset % textureWidth;
		const glyphLocY = Math.floor(bandOffset / textureWidth);
		const packedLocation = packUint16Pair(glyphLocX, glyphLocY);

		// Pack band max: frag.glsl reads low-16 as bandMax.x (clamps vertical bandIndex.x → needs vBandMax)
		// and high-16 as bandMax.y (clamps horizontal bandIndex.y + header offset → needs hBandMax).
		const packedBands = packBandMax(vBandCount - 1, hBandCount - 1);

		// Write 4 vertices directly — inlined to avoid per-glyph corner object allocation.
		// Layout per corner:
		//   Screen: y0 = top (font maxY), y1 = bottom (font minY)
		//   Font:   v0 = minY (bottom), v1 = maxY (top)
		const baseVertex = quadIdx * VERTICES_PER_QUAD;

		// Corner 0: screen top-left = font (minX, maxY)
		let off = baseVertex * FLOATS_PER_VERTEX;
		vertices[off]      = x0;          // posX
		vertices[off + 1]  = y0;          // posY
		vertices[off + 2]  = -1;          // normalX
		vertices[off + 3]  = -1;          // normalY
		vertices[off + 4]  = u0;          // emU
		vertices[off + 5]  = v1;          // emV
		vertices[off + 6]  = packedLocation;
		vertices[off + 7]  = packedBands;
		vertices[off + 8]  = invScale;    // jac.x
		vertices[off + 9]  = 0;           // jac.y
		vertices[off + 10] = 0;           // jac.z
		vertices[off + 11] = negInvScale; // jac.w
		vertices[off + 12] = bandScaleX;
		vertices[off + 13] = bandScaleY;
		vertices[off + 14] = bandOffsetX;
		vertices[off + 15] = bandOffsetY;
		vertices[off + 16] = cr;
		vertices[off + 17] = cg;
		vertices[off + 18] = cb;
		vertices[off + 19] = ca;

		// Corner 1: screen top-right = font (maxX, maxY)
		off += FLOATS_PER_VERTEX;
		vertices[off]      = x1;
		vertices[off + 1]  = y0;
		vertices[off + 2]  = 1;
		vertices[off + 3]  = -1;
		vertices[off + 4]  = u1;
		vertices[off + 5]  = v1;
		vertices[off + 6]  = packedLocation;
		vertices[off + 7]  = packedBands;
		vertices[off + 8]  = invScale;
		vertices[off + 9]  = 0;
		vertices[off + 10] = 0;
		vertices[off + 11] = negInvScale;
		vertices[off + 12] = bandScaleX;
		vertices[off + 13] = bandScaleY;
		vertices[off + 14] = bandOffsetX;
		vertices[off + 15] = bandOffsetY;
		vertices[off + 16] = cr;
		vertices[off + 17] = cg;
		vertices[off + 18] = cb;
		vertices[off + 19] = ca;

		// Corner 2: screen bottom-right = font (maxX, minY)
		off += FLOATS_PER_VERTEX;
		vertices[off]      = x1;
		vertices[off + 1]  = y1;
		vertices[off + 2]  = 1;
		vertices[off + 3]  = 1;
		vertices[off + 4]  = u1;
		vertices[off + 5]  = v0;
		vertices[off + 6]  = packedLocation;
		vertices[off + 7]  = packedBands;
		vertices[off + 8]  = invScale;
		vertices[off + 9]  = 0;
		vertices[off + 10] = 0;
		vertices[off + 11] = negInvScale;
		vertices[off + 12] = bandScaleX;
		vertices[off + 13] = bandScaleY;
		vertices[off + 14] = bandOffsetX;
		vertices[off + 15] = bandOffsetY;
		vertices[off + 16] = cr;
		vertices[off + 17] = cg;
		vertices[off + 18] = cb;
		vertices[off + 19] = ca;

		// Corner 3: screen bottom-left = font (minX, minY)
		off += FLOATS_PER_VERTEX;
		vertices[off]      = x0;
		vertices[off + 1]  = y1;
		vertices[off + 2]  = -1;
		vertices[off + 3]  = 1;
		vertices[off + 4]  = u0;
		vertices[off + 5]  = v0;
		vertices[off + 6]  = packedLocation;
		vertices[off + 7]  = packedBands;
		vertices[off + 8]  = invScale;
		vertices[off + 9]  = 0;
		vertices[off + 10] = 0;
		vertices[off + 11] = negInvScale;
		vertices[off + 12] = bandScaleX;
		vertices[off + 13] = bandScaleY;
		vertices[off + 14] = bandOffsetX;
		vertices[off + 15] = bandOffsetY;
		vertices[off + 16] = cr;
		vertices[off + 17] = cg;
		vertices[off + 18] = cb;
		vertices[off + 19] = ca;

		// Two triangles: [0,1,2] and [0,2,3]
		const idxOffset = quadIdx * INDICES_PER_QUAD;
		indices[idxOffset] = baseVertex;
		indices[idxOffset + 1] = baseVertex + 1;
		indices[idxOffset + 2] = baseVertex + 2;
		indices[idxOffset + 3] = baseVertex;
		indices[idxOffset + 4] = baseVertex + 2;
		indices[idxOffset + 5] = baseVertex + 3;

		cursorX += glyph.advanceWidth * scale;
		quadIdx++;
	}

	return { vertices, indices, quadCount };
}
