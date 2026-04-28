import type {SlugGlyphQuads} from './quad';
import {Constants} from '../../../constants';

/**
 * Shift the X coordinate of every vertex in a quad buffer by a
 * per-line offset, plus an optional per-glyph offset (used by
 * text-align justify to expand inter-word gaps).
 *
 * Mutates `quads.vertices` in place. The buffer's per-glyph emission
 * order matches `slugGlyphQuadsMultiline`'s line-major order, so
 * `lineQuadCounts[l]` quads on line `l` are consumed before line
 * `l + 1`.
 *
 * O(n) over total vertex count — one extra pass per quad buffer.
 *
 * @param quads				Quad buffer to mutate.
 * @param lineQuadCounts	Number of quads emitted on each line, in
 *							order. Sum must equal `quads.quadCount`.
 * @param lineOffsetX		Per-line whole-line X offset (length matches
 *							`lineQuadCounts`).
 * @param perGlyphShiftX	Optional per-glyph cumulative X shift (used
 *							for justify). Length equals total renderable
 *							glyphs across all lines, in line-major
 *							order. Pass `null` when no justify is in
 *							effect — saves the per-glyph add.
 */
export function slugApplyLineLayoutX(
	quads: SlugGlyphQuads,
	lineQuadCounts: ArrayLike<number>,
	lineOffsetX: ArrayLike<number>,
	perGlyphShiftX: Float32Array | null
): void {
	const verts = quads.vertices;
	const fpv = Constants.FLOATS_PER_VERTEX;
	const vpq = Constants.VERTICES_PER_QUAD;
	const lineCount = lineQuadCounts.length;
	const floatsPerQuad = vpq * fpv;
	let quadCursor = 0;

	for (let l = 0; l < lineCount; l++) {
		const count = lineQuadCounts[l];
		if (count === 0) continue;
		const offset = lineOffsetX[l];
		const base = quadCursor * floatsPerQuad;

		if (perGlyphShiftX !== null) {
			for (let q = 0; q < count; q++) {
				const total = offset + perGlyphShiftX[quadCursor + q];
				if (total === 0) continue;
				const quadStart = base + q * floatsPerQuad;
				for (let v = 0; v < vpq; v++) {
					verts[quadStart + v * fpv] += total;
				}
			}
		} else if (offset !== 0) {
			const end = base + count * floatsPerQuad;
			for (let off = base; off < end; off += fpv) {
				verts[off] += offset;
			}
		}

		quadCursor += count;
	}
}
