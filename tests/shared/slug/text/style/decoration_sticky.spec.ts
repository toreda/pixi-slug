import {
	slugApplyFillToDecoration,
	slugResolveDecoration,
	slugResolveDrawDecoration,
	type SlugTextDecorationResolved
} from '../../../../../src/shared/slug/text/style/decoration';

describe('decoration per-channel stickiness', () => {
	describe('slugResolveDecoration provenance', () => {
		it('sets neither sticky channel for true', () => {
			const dec = slugResolveDecoration(true);
			expect(dec.colorRgb).toBeNull();
			expect(dec.colorAlpha).toBeNull();
		});

		it('sets only colorRgb for a 6-digit hex', () => {
			const dec = slugResolveDecoration({color: '#ff0000'});
			expect(dec.colorRgb).not.toBeNull();
			expect(dec.colorAlpha).toBeNull();
		});

		it('sets both for an 8-digit hex', () => {
			const dec = slugResolveDecoration({color: '#ff000080'});
			expect(dec.colorRgb).not.toBeNull();
			expect(dec.colorAlpha).toBeCloseTo(128 / 255, 4);
		});

		it('sets only colorRgb for a 3-element array', () => {
			const dec = slugResolveDecoration({color: [1, 0, 0]});
			expect(dec.colorRgb).toEqual([1, 0, 0]);
			expect(dec.colorAlpha).toBeNull();
		});

		it('sets both for a 4-element array', () => {
			const dec = slugResolveDecoration({color: [1, 0, 0, 0.5]});
			expect(dec.colorRgb).toEqual([1, 0, 0]);
			expect(dec.colorAlpha).toBeCloseTo(0.5, 5);
		});
	});

	describe('slugResolveDrawDecoration inheritance', () => {
		const fillRgba: [number, number, number, number] = [0, 1, 0, 0.7];

		it('inherits both channels when neither sticky', () => {
			const draw = slugResolveDrawDecoration(
				slugResolveDecoration(true),
				fillRgba,
				4,
				'ltr'
			);
			expect(draw.color).toEqual([0, 1, 0, 0.7]);
		});

		it('uses sticky RGB and inherits alpha', () => {
			const draw = slugResolveDrawDecoration(
				slugResolveDecoration({color: '#ff0000'}),
				fillRgba,
				4,
				'ltr'
			);
			expect(draw.color[0]).toBeCloseTo(1, 5);
			expect(draw.color[1]).toBeCloseTo(0, 5);
			expect(draw.color[2]).toBeCloseTo(0, 5);
			expect(draw.color[3]).toBeCloseTo(0.7, 5); // inherited from fill
		});

		it('uses sticky alpha and inherits RGB', () => {
			// Build a decoration with alpha-only sticky by hand.
			const dec: SlugTextDecorationResolved = {
				enabled: true,
				colorRgb: null,
				colorAlpha: 0.5,
				thickness: null,
				length: 1,
				align: 'start'
			};
			const draw = slugResolveDrawDecoration(dec, fillRgba, 4, 'ltr');
			expect(draw.color[0]).toBeCloseTo(0, 5); // inherited
			expect(draw.color[1]).toBeCloseTo(1, 5); // inherited
			expect(draw.color[2]).toBeCloseTo(0, 5); // inherited
			expect(draw.color[3]).toBeCloseTo(0.5, 5); // sticky
		});

		it('uses both sticky values when both set', () => {
			const draw = slugResolveDrawDecoration(
				slugResolveDecoration({color: '#ff0000aa'}),
				fillRgba,
				4,
				'ltr'
			);
			expect(draw.color[0]).toBeCloseTo(1, 5);
			expect(draw.color[3]).toBeCloseTo(0xaa / 255, 4);
		});
	});

	describe('slugApplyFillToDecoration', () => {
		const stickyAlpha: SlugTextDecorationResolved = {
			enabled: true,
			colorRgb: null,
			colorAlpha: 0.5,
			thickness: null,
			length: 1,
			align: 'start'
		};

		const stickyRgb: SlugTextDecorationResolved = {
			enabled: true,
			colorRgb: [1, 0, 0],
			colorAlpha: null,
			thickness: null,
			length: 1,
			align: 'start'
		};

		it('preserves sticky alpha when fill is RGB-only', () => {
			const next = slugApplyFillToDecoration(stickyAlpha, true, false);
			expect(next.colorAlpha).toBe(0.5);
		});

		it('clears sticky alpha when fill carries alpha', () => {
			const next = slugApplyFillToDecoration(stickyAlpha, true, true);
			expect(next.colorAlpha).toBeNull();
		});

		it('preserves sticky RGB when fill is alpha-only', () => {
			const next = slugApplyFillToDecoration(stickyRgb, false, true);
			expect(next.colorRgb).toEqual([1, 0, 0]);
		});

		it('clears sticky RGB when fill carries RGB', () => {
			const next = slugApplyFillToDecoration(stickyRgb, true, false);
			expect(next.colorRgb).toBeNull();
		});

		it('returns the same object when nothing changes (no-op fill update)', () => {
			const next = slugApplyFillToDecoration(stickyAlpha, false, false);
			expect(next).toBe(stickyAlpha);
		});

		it('does not modify a disabled decoration', () => {
			const disabled: SlugTextDecorationResolved = {
				enabled: false,
				colorRgb: null,
				colorAlpha: null,
				thickness: null,
				length: 1,
				align: 'start'
			};
			const next = slugApplyFillToDecoration(disabled, true, true);
			expect(next).toBe(disabled);
		});
	});

	describe('end-to-end scenario from feature spec', () => {
		// Both scenarios from the feature decisions section.
		// Case 1: alpha set, then RGB-only fill update — alpha sticky persists.
		// Case 2: alpha set, then RGBA fill update — alpha sticky cleared.

		const fillRgbOnly: [number, number, number, number] = [1, 0, 0, 1]; // FF0000

		it('case 1: decoration alpha 0.5 + fill #FF0000 → underline [1,0,0,0.5]', () => {
			let dec: SlugTextDecorationResolved = {
				enabled: true,
				colorRgb: null,
				colorAlpha: 0.5,
				thickness: null,
				length: 1,
				align: 'start'
			};
			// Fill update: 6-digit hex → rgbProvided=true, alphaProvided=false
			dec = slugApplyFillToDecoration(dec, true, false);
			expect(dec.colorAlpha).toBe(0.5);
			const draw = slugResolveDrawDecoration(dec, fillRgbOnly, 4, 'ltr');
			expect(draw.color).toEqual([1, 0, 0, 0.5]);
		});

		it('case 2: decoration alpha 0.5 + fill [255,0,0,0.9] → underline [1,0,0,0.9]', () => {
			let dec: SlugTextDecorationResolved = {
				enabled: true,
				colorRgb: null,
				colorAlpha: 0.5,
				thickness: null,
				length: 1,
				align: 'start'
			};
			// Fill update: 4-element array → rgbProvided=true, alphaProvided=true
			dec = slugApplyFillToDecoration(dec, true, true);
			expect(dec.colorAlpha).toBeNull();
			const fillWithAlpha: [number, number, number, number] = [1, 0, 0, 0.9];
			const draw = slugResolveDrawDecoration(dec, fillWithAlpha, 4, 'ltr');
			expect(draw.color[0]).toBeCloseTo(1, 5);
			expect(draw.color[3]).toBeCloseTo(0.9, 5);
		});
	});
});
