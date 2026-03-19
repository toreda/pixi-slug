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
	const uint32 = ((high & 0xFFFF) << 16) | (low & 0xFFFF);

	// Reinterpret uint32 bits as float32
	const buf = new ArrayBuffer(4);
	new Uint32Array(buf)[0] = uint32;
	return new Float32Array(buf)[0];
}

/**
 * Pack band max indices and flags into a single float via uint32 reinterpretation.
 */
function packBandMax(hBandMax: number, vBandMax: number): number {
	return packUint16Pair(hBandMax, vBandMax);
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
 */
export function slugGlyphQuads(
	text: string,
	glyphs: Map<number, SlugGlyphData>,
	advances: Map<number, number>,
	unitsPerEm: number,
	fontSize: number,
	textureWidth: number,
	color: [number, number, number, number] = [1, 1, 1, 1]
): SlugGlyphQuads {
	const scale = fontSize / unitsPerEm;

	// Count renderable glyphs
	let quadCount = 0;
	for (let i = 0; i < text.length; i++) {
		if (glyphs.has(text.charCodeAt(i))) {
			quadCount++;
		}
	}

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

		const { bounds, hBandCount, vBandCount, bandOffset, curveOffset } = glyph;

		// Glyph quad corners in pixel space.
		// Font Y is up (ascenders positive), screen Y is down.
		// Negate Y so ascenders go upward on screen. Position will be offset
		// by the container's y position to place the baseline.
		const x0 = cursorX + bounds.minX * scale;
		const y0 = -bounds.maxY * scale;
		const x1 = cursorX + bounds.maxX * scale;
		const y1 = -bounds.minY * scale;

		// Em-space texcoords (used by fragment shader for curve evaluation).
		// These stay in font coordinate space (Y-up).
		const u0 = bounds.minX;
		const v0 = bounds.minY;
		const u1 = bounds.maxX;
		const v1 = bounds.maxY;

		// Band transform: maps em-space coord to band index
		const glyphWidth = bounds.maxX - bounds.minX;
		const glyphHeight = bounds.maxY - bounds.minY;
		const bandScaleX = glyphWidth > 0 ? vBandCount / glyphWidth : 0;
		const bandScaleY = glyphHeight > 0 ? hBandCount / glyphHeight : 0;
		const bandOffsetX = -bounds.minX * bandScaleX;
		const bandOffsetY = -bounds.minY * bandScaleY;

		// Pack glyph band texture location (band offset x/y as 16-bit pair)
		const glyphLocX = bandOffset % textureWidth;
		const glyphLocY = Math.floor(bandOffset / textureWidth);
		const packedLocation = packUint16Pair(glyphLocX, glyphLocY);

		// Pack band max + flags
		const packedBands = packBandMax(hBandCount - 1, vBandCount - 1);

		// Quad corners with screen-space positions and font-space texcoords.
		// Screen: y0 = top (font maxY), y1 = bottom (font minY).
		// Font: v0 = minY (bottom), v1 = maxY (top).
		const corners = [
			{ px: x0, py: y0, nx: -1, ny: -1, eu: u0, ev: v1 },  // screen top-left = font (minX, maxY)
			{ px: x1, py: y0, nx: 1, ny: -1, eu: u1, ev: v1 },   // screen top-right = font (maxX, maxY)
			{ px: x1, py: y1, nx: 1, ny: 1, eu: u1, ev: v0 },    // screen bottom-right = font (maxX, minY)
			{ px: x0, py: y1, nx: -1, ny: 1, eu: u0, ev: v0 }
		];

		const baseVertex = quadIdx * VERTICES_PER_QUAD;

		for (let c = 0; c < 4; c++) {
			const corner = corners[c];
			const offset = (baseVertex + c) * FLOATS_PER_VERTEX;

			// aPositionNormal (vec4): position xy + normal zw
			vertices[offset] = corner.px;
			vertices[offset + 1] = corner.py;
			vertices[offset + 2] = corner.nx;
			vertices[offset + 3] = corner.ny;

			// aTexcoord (vec4): em-space uv + packed glyph location + packed bands
			vertices[offset + 4] = corner.eu;
			vertices[offset + 5] = corner.ev;
			vertices[offset + 6] = packedLocation;
			vertices[offset + 7] = packedBands;

			// aJacobian (vec4): inverse Jacobian (identity for axis-aligned rendering)
			vertices[offset + 8] = 1 / scale;
			vertices[offset + 9] = 0;
			vertices[offset + 10] = 0;
			vertices[offset + 11] = 1 / scale;

			// aBanding (vec4): band scale xy + band offset xy
			vertices[offset + 12] = bandScaleX;
			vertices[offset + 13] = bandScaleY;
			vertices[offset + 14] = bandOffsetX;
			vertices[offset + 15] = bandOffsetY;

			// aColor (vec4): vertex color RGBA
			vertices[offset + 16] = color[0];
			vertices[offset + 17] = color[1];
			vertices[offset + 18] = color[2];
			vertices[offset + 19] = color[3];
		}

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
