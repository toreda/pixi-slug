import {slugTextColorToRgba, type SlugTextColor} from '../../../../../src/shared/slug/text/style/color';

const CURRENT: [number, number, number, number] = [0.1, 0.2, 0.3, 0.5];

/** Pair each test value with its expected tuple. Small helper keeps the body tight. */
function expectColor(
	input: SlugTextColor | null | undefined,
	expected: [number, number, number, number],
	current: [number, number, number, number] = [...CURRENT] as [number, number, number, number]
) {
	const out = slugTextColorToRgba(input, current);
	for (let i = 0; i < 4; i++) {
		expect(out[i]).toBeCloseTo(expected[i], 5);
	}
}

describe('slugTextColorToRgba', () => {
	describe('null / undefined (unset)', () => {
		it('returns a copy of current for null', () => {
			const out = slugTextColorToRgba(null, CURRENT);
			expect(out).toEqual(CURRENT);
			expect(out).not.toBe(CURRENT);
		});

		it('returns a copy of current for undefined', () => {
			const out = slugTextColorToRgba(undefined, CURRENT);
			expect(out).toEqual(CURRENT);
			expect(out).not.toBe(CURRENT);
		});

		it('does not log console.error for null / undefined', () => {
			const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
			slugTextColorToRgba(null, CURRENT);
			slugTextColorToRgba(undefined, CURRENT);
			expect(spy).not.toHaveBeenCalled();
			spy.mockRestore();
		});
	});

	describe('hex string — prefixes', () => {
		it('accepts # prefix', () => {
			expectColor('#FF0000', [1, 0, 0, CURRENT[3]]);
		});
		it('accepts 0x prefix', () => {
			expectColor('0xFF0000', [1, 0, 0, CURRENT[3]]);
		});
		it('accepts no prefix', () => {
			expectColor('FF0000', [1, 0, 0, CURRENT[3]]);
		});
		it('is case-insensitive', () => {
			expectColor('#ff00aa', [1, 0, 170 / 255, CURRENT[3]]);
		});
		it('trims whitespace', () => {
			expectColor('  #FF0000  ', [1, 0, 0, CURRENT[3]]);
		});
	});

	describe('hex string — 2-digit grayscale (preserve alpha)', () => {
		it('expands #80 to mid-gray', () => {
			expectColor('#80', [128 / 255, 128 / 255, 128 / 255, CURRENT[3]]);
		});
		it('expands #FF to white', () => {
			expectColor('#FF', [1, 1, 1, CURRENT[3]]);
		});
		it('expands 00 to black', () => {
			expectColor('00', [0, 0, 0, CURRENT[3]]);
		});
	});

	describe('hex string — 3-digit (preserve alpha)', () => {
		it('expands #F00 to red', () => {
			expectColor('#F00', [1, 0, 0, CURRENT[3]]);
		});
		it('expands #0F0 to green', () => {
			expectColor('#0F0', [0, 1, 0, CURRENT[3]]);
		});
		it('expands #ABC correctly', () => {
			expectColor('#ABC', [0xaa / 255, 0xbb / 255, 0xcc / 255, CURRENT[3]]);
		});
	});

	describe('hex string — 4-digit (alpha from input)', () => {
		it('expands #F00F to red + full alpha', () => {
			expectColor('#F00F', [1, 0, 0, 1]);
		});
		it('expands #F000 to red + zero alpha', () => {
			expectColor('#F000', [1, 0, 0, 0]);
		});
		it('sets alpha to the 4th digit', () => {
			expectColor('#0000AA', [0, 0, 170 / 255, CURRENT[3]]); // sanity: no coincidental match
			expectColor('#000A', [0, 0, 0, 0xaa / 255]);
		});
	});

	describe('hex string — 6-digit (preserve alpha)', () => {
		it('parses #FF0000 as red, preserving alpha', () => {
			expectColor('#FF0000', [1, 0, 0, CURRENT[3]]);
		});
		it('parses 0x00FF00 as green, preserving alpha', () => {
			expectColor('0x00FF00', [0, 1, 0, CURRENT[3]]);
		});
		it('parses 123456 correctly', () => {
			expectColor('123456', [0x12 / 255, 0x34 / 255, 0x56 / 255, CURRENT[3]]);
		});
	});

	describe('hex string — 8-digit (alpha from input)', () => {
		it('parses #FF0000FF as fully opaque red', () => {
			expectColor('#FF0000FF', [1, 0, 0, 1]);
		});
		it('parses #FF000000 as fully transparent red', () => {
			expectColor('#FF000000', [1, 0, 0, 0]);
		});
		it('parses 0xFFFFFFFF as opaque white', () => {
			expectColor('0xFFFFFFFF', [1, 1, 1, 1]);
		});
	});

	describe('hex string — invalid', () => {
		let spy: jest.SpyInstance;
		beforeEach(() => {
			spy = jest.spyOn(console, 'error').mockImplementation(() => {});
		});
		afterEach(() => {
			spy.mockRestore();
		});

		it('rejects empty string', () => {
			expectColor('', CURRENT);
			expect(spy).toHaveBeenCalledTimes(1);
		});

		it('rejects 1-digit', () => {
			expectColor('#F', CURRENT);
			expect(spy).toHaveBeenCalled();
		});

		it('rejects 5-digit', () => {
			expectColor('#FFFFF', CURRENT);
			expect(spy).toHaveBeenCalled();
		});

		it('rejects 7-digit', () => {
			expectColor('#FFFFFFF', CURRENT);
			expect(spy).toHaveBeenCalled();
		});

		it('rejects 9-digit', () => {
			expectColor('#FFFFFFFFF', CURRENT);
			expect(spy).toHaveBeenCalled();
		});

		it('rejects non-hex characters', () => {
			expectColor('#GGGGGG', CURRENT);
			expect(spy).toHaveBeenCalled();
		});

		it('rejects mixed non-hex', () => {
			expectColor('#FF00ZZ', CURRENT);
			expect(spy).toHaveBeenCalled();
		});

		it('rejects bare prefix', () => {
			expectColor('#', CURRENT);
			expect(spy).toHaveBeenCalled();
		});

		it('rejects bare 0x prefix', () => {
			expectColor('0x', CURRENT);
			expect(spy).toHaveBeenCalled();
		});

		it('rejects arbitrary text', () => {
			expectColor('not a color', CURRENT);
			expect(spy).toHaveBeenCalled();
		});
	});

	describe('hex number — valid', () => {
		it('treats 0 as black, preserve alpha', () => {
			expectColor(0, [0, 0, 0, CURRENT[3]]);
		});
		it('treats 0xFFFFFF as white, preserve alpha', () => {
			expectColor(0xffffff, [1, 1, 1, CURRENT[3]]);
		});
		it('treats 0xFF0000 as red, preserve alpha', () => {
			expectColor(0xff0000, [1, 0, 0, CURRENT[3]]);
		});
		it('treats 0x01000000 as 8-digit with alpha from input', () => {
			expectColor(0x01000000, [1 / 255, 0, 0, 0]);
		});
		it('treats 0xFFFFFFFF as opaque white', () => {
			expectColor(0xffffffff, [1, 1, 1, 1]);
		});
		it('treats 0xFF000080 as red with half alpha', () => {
			expectColor(0xff000080, [1, 0, 0, 0x80 / 255]);
		});
	});

	describe('hex number — invalid', () => {
		let spy: jest.SpyInstance;
		beforeEach(() => {
			spy = jest.spyOn(console, 'error').mockImplementation(() => {});
		});
		afterEach(() => {
			spy.mockRestore();
		});

		it('rejects negative', () => {
			expectColor(-1, CURRENT);
			expect(spy).toHaveBeenCalled();
		});

		it('rejects > 0xFFFFFFFF', () => {
			expectColor(0x100000000, CURRENT);
			expect(spy).toHaveBeenCalled();
		});

		it('rejects non-integer', () => {
			expectColor(1.5, CURRENT);
			expect(spy).toHaveBeenCalled();
		});

		it('rejects NaN', () => {
			expectColor(NaN, CURRENT);
			expect(spy).toHaveBeenCalled();
		});

		it('rejects Infinity', () => {
			expectColor(Infinity, CURRENT);
			expect(spy).toHaveBeenCalled();
		});
	});

	describe('array — normalized (0..1)', () => {
		it('3-element all ≤ 1 treated as normalized, preserve alpha', () => {
			expectColor([1, 0, 0.5], [1, 0, 0.5, CURRENT[3]]);
		});
		it('4-element all ≤ 1 treated as normalized, alpha from input', () => {
			expectColor([0.25, 0.5, 0.75, 1], [0.25, 0.5, 0.75, 1]);
		});
		it('all zeros', () => {
			expectColor([0, 0, 0], [0, 0, 0, CURRENT[3]]);
		});
		it('all ones treated as fully saturated normalized', () => {
			expectColor([1, 1, 1], [1, 1, 1, CURRENT[3]]);
		});
	});

	describe('array — 0..255 scale', () => {
		it('triggers 0..255 when any element > 1', () => {
			expectColor([255, 128, 0], [1, 128 / 255, 0, CURRENT[3]]);
		});
		it('treats 1 as 0..255 value when sibling > 1', () => {
			expectColor([1, 128, 255], [1 / 255, 128 / 255, 1, CURRENT[3]]);
		});
		it('4-element 0..255 with alpha', () => {
			expectColor([255, 0, 0, 128], [1, 0, 0, 128 / 255]);
		});
	});

	describe('array — invalid', () => {
		let spy: jest.SpyInstance;
		beforeEach(() => {
			spy = jest.spyOn(console, 'error').mockImplementation(() => {});
		});
		afterEach(() => {
			spy.mockRestore();
		});

		it('rejects empty array', () => {
			expectColor([] as unknown as [number, number, number], CURRENT);
			expect(spy).toHaveBeenCalled();
		});

		it('rejects 1-element', () => {
			expectColor([1] as unknown as [number, number, number], CURRENT);
			expect(spy).toHaveBeenCalled();
		});

		it('rejects 2-element', () => {
			expectColor([1, 0] as unknown as [number, number, number], CURRENT);
			expect(spy).toHaveBeenCalled();
		});

		it('rejects 5+ element', () => {
			expectColor([1, 0, 0, 1, 0] as unknown as [number, number, number], CURRENT);
			expect(spy).toHaveBeenCalled();
		});

		it('rejects negative element', () => {
			expectColor([1, -0.5, 0], CURRENT);
			expect(spy).toHaveBeenCalled();
		});

		it('rejects element > 255', () => {
			expectColor([1, 256, 0], CURRENT);
			expect(spy).toHaveBeenCalled();
		});

		it('rejects NaN element', () => {
			expectColor([NaN, 0, 0], CURRENT);
			expect(spy).toHaveBeenCalled();
		});

		it('rejects Infinity element', () => {
			expectColor([Infinity, 0, 0], CURRENT);
			expect(spy).toHaveBeenCalled();
		});
	});

	describe('unsupported types', () => {
		let spy: jest.SpyInstance;
		beforeEach(() => {
			spy = jest.spyOn(console, 'error').mockImplementation(() => {});
		});
		afterEach(() => {
			spy.mockRestore();
		});

		it('rejects boolean', () => {
			expectColor(true as unknown as SlugTextColor, CURRENT);
			expect(spy).toHaveBeenCalled();
		});

		it('rejects plain object', () => {
			expectColor({} as unknown as SlugTextColor, CURRENT);
			expect(spy).toHaveBeenCalled();
		});

		it('rejects function', () => {
			expectColor((() => 0) as unknown as SlugTextColor, CURRENT);
			expect(spy).toHaveBeenCalled();
		});
	});

	describe('alpha-preservation round trip', () => {
		it('preserves alpha across 6-digit swap', () => {
			const a: [number, number, number, number] = [1, 0, 0, 0.333];
			const next = slugTextColorToRgba('#00FF00', a);
			expect(next[3]).toBeCloseTo(0.333);
		});

		it('preserves alpha across 3-element swap', () => {
			const a: [number, number, number, number] = [1, 0, 0, 0.666];
			const next = slugTextColorToRgba([0, 1, 0], a);
			expect(next[3]).toBeCloseTo(0.666);
		});

		it('overrides alpha with 8-digit hex', () => {
			const a: [number, number, number, number] = [1, 0, 0, 0.1];
			const next = slugTextColorToRgba('#00FF00AA', a);
			expect(next[3]).toBeCloseTo(0xaa / 255);
		});

		it('overrides alpha with 4-element array', () => {
			const a: [number, number, number, number] = [1, 0, 0, 0.1];
			const next = slugTextColorToRgba([0, 1, 0, 0.75], a);
			expect(next[3]).toBeCloseTo(0.75);
		});
	});
});
