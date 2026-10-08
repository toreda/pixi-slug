import {readFileSync} from 'fs';
import {resolve} from 'path';
import {slugFontSnap} from '../../../../src/shared/slug/font/snap';
import {SlugFont} from '../../../../src/shared/slug/font';

function loadFontFixture(filename: string): ArrayBuffer {
	const buf = readFileSync(resolve(__dirname, '../../../../assets/fonts', filename));
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

describe('slugFontSnap', () => {
	// Roboto: unitsPerEm 2048, sCapHeight 1456 → cap/em = 0.7109375
	const CAP = 1456;
	const UPM = 2048;

	it('returns a size whose cap height is a whole number of pixels', () => {
		const size = slugFontSnap(24, CAP, UPM);
		expect(Number.isInteger(Math.round((size * CAP) / UPM * 1e9) / 1e9)).toBe(true);
		// 24 × 0.7109375 = 17.0625 → 17 px cap → 23.912…
		expect(size).toBeCloseTo((17 * UPM) / CAP, 10);
	});

	it('leaves a size alone when its cap height is already whole', () => {
		const size = (17 * UPM) / CAP;
		expect(slugFontSnap(size, CAP, UPM)).toBeCloseTo(size, 10);
	});

	it('accounts for device resolution', () => {
		// At 2× resolution, cap height must be whole in device pixels.
		const size = slugFontSnap(24, CAP, UPM, 2);
		const capDevicePx = (size * CAP) / UPM * 2;
		expect(capDevicePx).toBeCloseTo(Math.round(capDevicePx), 10);
		// 17.0625 × 2 = 34.125 → 34 device px → 17 css px
		expect(capDevicePx).toBeCloseTo(34, 10);
	});

	it('never collapses below a one-pixel cap height', () => {
		const size = slugFontSnap(0.5, CAP, UPM);
		expect((size * CAP) / UPM).toBeCloseTo(1, 10);
	});

	it('returns the input unchanged when the cap height is unknown', () => {
		expect(slugFontSnap(24, 0, UPM)).toBe(24);
		expect(slugFontSnap(24, -5, UPM)).toBe(24);
		expect(slugFontSnap(24, NaN, UPM)).toBe(24);
	});

	it('returns the input unchanged for non-positive unitsPerEm, resolution or size', () => {
		expect(slugFontSnap(24, CAP, 0)).toBe(24);
		expect(slugFontSnap(24, CAP, UPM, 0)).toBe(24);
		expect(slugFontSnap(0, CAP, UPM)).toBe(0);
		expect(slugFontSnap(-3, CAP, UPM)).toBe(-3);
	});
});

describe('SlugFont cap height', () => {
	it('reads sCapHeight from the OS/2 table of Roboto', () => {
		const font = new SlugFont();
		font.loadSync(loadFontFixture('roboto-fallback.ttf'));
		expect(font.capHeight).toBe(1456);
	});

	it('is 0 before a font is loaded and snapFontSize is then a no-op', () => {
		const font = new SlugFont();
		expect(font.capHeight).toBe(0);
		expect(font.snapFontSize(24)).toBe(24);
	});

	it('snapFontSize uses the loaded cap height and unitsPerEm', () => {
		const font = new SlugFont();
		font.loadSync(loadFontFixture('roboto-fallback.ttf'));
		expect(font.snapFontSize(24)).toBeCloseTo(slugFontSnap(24, 1456, 2048), 12);
		expect(font.snapFontSize(24, 2)).toBeCloseTo(slugFontSnap(24, 1456, 2048, 2), 12);
	});
});
