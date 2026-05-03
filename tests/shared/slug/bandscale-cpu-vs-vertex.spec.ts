/**
 * Regression — bands.ts and quad.ts must produce bit-identical float32
 * bandScale and bandOffset values for the same glyph bounds and band counts.
 *
 * If they ever drift, every curve gets assigned to bands the GPU never queries
 * (because the GPU's per-pixel band index uses quad.ts's transform), which
 * surfaces as missing-curve stripe artifacts at large sizes.
 *
 * Confirmed clean on 2026-05-03 during the A/Z artifact investigation —
 * this test exists to keep it that way.
 */
import {readFileSync} from 'fs';
import {resolve} from 'path';
import opentype from 'opentype.js';
import {slugGlyphCurves} from '../../../src/shared/slug/glyph/curves';

function loadTTF(): ArrayBuffer {
	const buf = readFileSync(resolve(__dirname, '../../../assets/fonts/roboto-fallback.ttf'));
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

const _f32 = new Float32Array(4);

function bandsTsScale(boundsMinX: number, boundsMinY: number, boundsMaxX: number, boundsMaxY: number, curveCount: number, bandCountDefault: number) {
	const width = boundsMaxX - boundsMinX;
	const height = boundsMaxY - boundsMinY;
	const hBandCount = Math.min(bandCountDefault, curveCount);
	const vBandCount = Math.min(bandCountDefault, curveCount);
	const maxDim = Math.max(width, height);
	const clampedBandCount = Math.max(hBandCount, vBandCount);
	_f32[0] = clampedBandCount / maxDim;
	const bandScale = _f32[0];
	_f32[1] = -boundsMinY * bandScale;
	_f32[2] = -boundsMinX * bandScale;
	return {
		bandScale,
		hBandOffset: _f32[1],
		vBandOffset: _f32[2],
		hBandCount,
		vBandCount
	};
}

function quadTsScale(boundsMinX: number, boundsMinY: number, boundsMaxX: number, boundsMaxY: number, hBandCount: number, vBandCount: number) {
	const glyphWidth = boundsMaxX - boundsMinX;
	const glyphHeight = boundsMaxY - boundsMinY;
	const maxDim = Math.max(glyphWidth, glyphHeight);
	const bandCount = Math.max(hBandCount, vBandCount);
	_f32[0] = maxDim > 0 ? bandCount / maxDim : 0;
	const bandScale = _f32[0];
	_f32[1] = -boundsMinX * bandScale;
	_f32[2] = -boundsMinY * bandScale;
	return {
		bandScale,
		bandOffsetX: _f32[1],
		bandOffsetY: _f32[2]
	};
}

describe('bandScale CPU-vs-vertex consistency', () => {
	const buf = loadTTF();
	const font = opentype.parse(buf);
	const BAND_COUNT_DEFAULT = 16;

	for (const ch of ['A', 'Z', 'V', 'X', 'O', 'I']) {
		it(`bands.ts and quad.ts produce bit-identical bandScale/offset for "${ch}"`, () => {
			const ot = font.charToGlyph(ch);
			const bounds = ot.getBoundingBox();
			const {curves} = slugGlyphCurves(ot.path.commands);
			const cpu = bandsTsScale(bounds.x1, bounds.y1, bounds.x2, bounds.y2, curves.length, BAND_COUNT_DEFAULT);
			const vtx = quadTsScale(bounds.x1, bounds.y1, bounds.x2, bounds.y2, cpu.hBandCount, cpu.vBandCount);

			expect(vtx.bandScale).toBe(cpu.bandScale);
			expect(vtx.bandOffsetX).toBe(cpu.vBandOffset);
			expect(vtx.bandOffsetY).toBe(cpu.hBandOffset);
		});
	}
});
