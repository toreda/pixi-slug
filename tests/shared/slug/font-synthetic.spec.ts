import {readFileSync} from 'fs';
import {resolve} from 'path';
import {SlugFont} from '../../../src/shared/slug/font';
import {slugRadicalOutline} from '../../../src/shared/slug/math/radical';

function loadFontFixture(filename: string): ArrayBuffer {
	const buf = readFileSync(resolve(__dirname, '../../../assets/fonts', filename));
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

const TTF = loadFontFixture('roboto-fallback.ttf');

function makeOutline() {
	const o = slugRadicalOutline({height: 100, hookWidth: 40, barRight: 200, thickness: 5});
	return {curves: o.curves, contourStarts: o.contourStarts, bounds: o.bounds};
}

describe('SlugFont.registerSynthetic', () => {
	let font: SlugFont;
	beforeEach(() => {
		font = new SlugFont();
		font.loadSync(TTF);
	});

	it('returns an id, packed glyph with offsets, and append ranges', () => {
		const res = font.registerSynthetic(makeOutline());
		expect(res).not.toBeNull();
		if (!res) throw new Error('unreachable');
		// Synthetic ids namespace into the Supplementary PUA-A.
		expect(res.id).toBeGreaterThanOrEqual(0xf0000);
		// Offsets were assigned by the appender (curveOffset can legitimately
		// be 0 for the first packed glyph; bandOffset follows curves).
		expect(res.glyph.bandOffset).toBeGreaterThanOrEqual(0);
		expect(res.glyph.curves.length).toBe(makeOutline().curves.length);
		expect(res.appended.bandTexelEnd).toBeGreaterThan(res.appended.bandTexelStart);
	});

	it('stores synthetic glyphs separately from codepoint glyphs', () => {
		const res = font.registerSynthetic(makeOutline());
		if (!res) throw new Error('unreachable');
		expect(font.syntheticGlyphs.has(res.id)).toBe(true);
		// Never leaks into the real-codepoint map.
		expect(font.glyphs.has(res.id)).toBe(false);
	});

	it('issues monotonically increasing ids that never collide', () => {
		const a = font.registerSynthetic(makeOutline());
		const b = font.registerSynthetic(makeOutline());
		if (!a || !b) throw new Error('unreachable');
		expect(b.id).toBeGreaterThan(a.id);
	});

	it('grows the shared curve/band buffers as synthetics are added', () => {
		const beforeBand = font.bandData.length;
		font.registerSynthetic(makeOutline());
		expect(font.bandData.length).toBeGreaterThanOrEqual(beforeBand);
		// Curve data holds the contour texels + a sentinel.
		expect(font.curveData.length).toBeGreaterThan(0);
	});

	it('clears synthetic glyphs on reload but keeps ids climbing', () => {
		const a = font.registerSynthetic(makeOutline());
		if (!a) throw new Error('unreachable');
		font.loadSync(TTF);
		expect(font.syntheticGlyphs.size).toBe(0);
		const b = font.registerSynthetic(makeOutline());
		if (!b) throw new Error('unreachable');
		// Id source is not reset across reload — a stale handle can't alias.
		expect(b.id).toBeGreaterThan(a.id);
	});

	it('returns null when no font is loaded (no pack state)', () => {
		const empty = new SlugFont();
		expect(empty.registerSynthetic(makeOutline())).toBeNull();
	});

	it('does not perturb already-packed font glyphs (offsets stay valid)', () => {
		font.ensureGlyphs('A');
		const glyphA = font.glyphs.get('A'.charCodeAt(0));
		expect(glyphA).toBeDefined();
		const bandOffsetBefore = glyphA!.bandOffset;
		const curveOffsetBefore = glyphA!.curveOffset;
		font.registerSynthetic(makeOutline());
		// Appending a synthetic must not move an existing glyph's data.
		expect(glyphA!.bandOffset).toBe(bandOffsetBefore);
		expect(glyphA!.curveOffset).toBe(curveOffsetBefore);
	});
});
