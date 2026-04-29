import {slugResolveFill, slugFillRepresentativeColor} from '../../../../../../src/shared/slug/text/style/fill/resolve';

const CURRENT: [number, number, number, number] = [0.1, 0.2, 0.3, 0.5];

describe('slugResolveFill', () => {
	beforeEach(() => {
		jest.spyOn(console, 'error').mockImplementation(() => {});
	});
	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('solid (color form)', () => {
		it('parses a 6-digit hex with rgbProvided=true, alphaProvided=false', () => {
			const fill = slugResolveFill('#ff0000', CURRENT);
			expect(fill.kind).toBe('solid');
			if (fill.kind !== 'solid') return;
			expect(fill.color[0]).toBeCloseTo(1, 5);
			expect(fill.color[1]).toBeCloseTo(0, 5);
			expect(fill.color[2]).toBeCloseTo(0, 5);
			expect(fill.color[3]).toBeCloseTo(0.5, 5); // preserved from current
			expect(fill.rgbProvided).toBe(true);
			expect(fill.alphaProvided).toBe(false);
		});

		it('parses an 8-digit hex with both flags true', () => {
			const fill = slugResolveFill('#ff000080', CURRENT);
			expect(fill.kind).toBe('solid');
			if (fill.kind !== 'solid') return;
			expect(fill.color[3]).toBeCloseTo(128 / 255, 5);
			expect(fill.rgbProvided).toBe(true);
			expect(fill.alphaProvided).toBe(true);
		});

		it('parses a 3-element array with alphaProvided=false', () => {
			const fill = slugResolveFill([1, 0, 0], CURRENT);
			expect(fill.kind).toBe('solid');
			if (fill.kind !== 'solid') return;
			expect(fill.alphaProvided).toBe(false);
		});

		it('parses a 4-element array with alphaProvided=true', () => {
			const fill = slugResolveFill([1, 0, 0, 0.9], CURRENT);
			expect(fill.kind).toBe('solid');
			if (fill.kind !== 'solid') return;
			expect(fill.alphaProvided).toBe(true);
			expect(fill.color[3]).toBeCloseTo(0.9, 5);
		});

		it('returns solid with both flags false for null input', () => {
			const fill = slugResolveFill(null, CURRENT);
			expect(fill.kind).toBe('solid');
			if (fill.kind !== 'solid') return;
			expect(fill.rgbProvided).toBe(false);
			expect(fill.alphaProvided).toBe(false);
		});
	});

	describe('linear gradient', () => {
		it('parses default start/end when omitted', () => {
			const fill = slugResolveFill(
				{
					type: 'linear-gradient',
					stops: [
						{offset: 0, color: '#ff0000'},
						{offset: 1, color: '#0000ff'}
					]
				},
				CURRENT
			);
			expect(fill.kind).toBe('linear-gradient');
			if (fill.kind !== 'linear-gradient') return;
			expect(fill.start).toEqual([0, 0]);
			expect(fill.end).toEqual([1, 0]);
			expect(fill.stops.length).toBe(2);
			expect(fill.coordinateSpace).toBe('normalized');
		});

		it('sorts stops by offset ascending', () => {
			const fill = slugResolveFill(
				{
					type: 'linear-gradient',
					stops: [
						{offset: 1, color: '#0000ff'},
						{offset: 0.5, color: '#00ff00'},
						{offset: 0, color: '#ff0000'}
					]
				},
				CURRENT
			);
			if (fill.kind !== 'linear-gradient') throw new Error();
			expect(fill.stops.map((s) => s.offset)).toEqual([0, 0.5, 1]);
		});

		it('clamps stop offsets to 0..1', () => {
			const fill = slugResolveFill(
				{
					type: 'linear-gradient',
					stops: [
						{offset: -2, color: '#ff0000'},
						{offset: 5, color: '#0000ff'}
					]
				},
				CURRENT
			);
			if (fill.kind !== 'linear-gradient') throw new Error();
			expect(fill.stops[0].offset).toBe(0);
			expect(fill.stops[1].offset).toBe(1);
		});

		it('rejects fewer than 2 stops with solid fallback', () => {
			const fill = slugResolveFill(
				{
					type: 'linear-gradient',
					stops: [{offset: 0, color: '#ff0000'}]
				},
				CURRENT
			);
			expect(fill.kind).toBe('solid');
		});

		it('rejects identical start and end with solid fallback', () => {
			const fill = slugResolveFill(
				{
					type: 'linear-gradient',
					stops: [
						{offset: 0, color: '#ff0000'},
						{offset: 1, color: '#0000ff'}
					],
					start: [0.5, 0.5],
					end: [0.5, 0.5]
				},
				CURRENT
			);
			expect(fill.kind).toBe('solid');
		});

		it('always reports both flags true for gradient', () => {
			const fill = slugResolveFill(
				{
					type: 'linear-gradient',
					stops: [
						{offset: 0, color: '#ff0000'},
						{offset: 1, color: '#0000ff'}
					]
				},
				CURRENT
			);
			expect(fill.rgbProvided).toBe(true);
			expect(fill.alphaProvided).toBe(true);
		});
	});

	describe('radial gradient', () => {
		it('parses defaults', () => {
			const fill = slugResolveFill(
				{
					type: 'radial-gradient',
					stops: [
						{offset: 0, color: '#ffffff'},
						{offset: 1, color: '#000000'}
					]
				},
				CURRENT
			);
			expect(fill.kind).toBe('radial-gradient');
			if (fill.kind !== 'radial-gradient') return;
			expect(fill.center).toEqual([0.5, 0.5]);
			expect(fill.innerRadius).toBe(0);
			expect(fill.outerRadius).toBe(0.5);
		});

		it('rejects when outerRadius <= innerRadius', () => {
			const fill = slugResolveFill(
				{
					type: 'radial-gradient',
					stops: [
						{offset: 0, color: '#ffffff'},
						{offset: 1, color: '#000000'}
					],
					innerRadius: 0.5,
					outerRadius: 0.3
				},
				CURRENT
			);
			expect(fill.kind).toBe('solid');
		});
	});

	describe('texture', () => {
		it('rejects null source with solid fallback', () => {
			const fill = slugResolveFill(
				{
					type: 'texture',
					source: null
				},
				CURRENT
			);
			expect(fill.kind).toBe('solid');
		});

		it('passes through valid source object', () => {
			const fakeTexture = {source: {}, width: 100, height: 50};
			const fill = slugResolveFill(
				{
					type: 'texture',
					source: fakeTexture
				},
				CURRENT
			);
			expect(fill.kind).toBe('texture');
			if (fill.kind !== 'texture') return;
			expect(fill.source).toBe(fakeTexture);
			expect(fill.wrap).toBe('clamp');
			expect(fill.filter).toBe('linear');
			expect(fill.scale).toEqual([1, 1]);
			expect(fill.rotation).toBe(0);
			expect(fill.translation).toEqual([0, 0]);
		});

		it('honors explicit wrap, filter, scale, rotation, translation', () => {
			const fakeTexture = {source: {}, width: 100, height: 50};
			const fill = slugResolveFill(
				{
					type: 'texture',
					source: fakeTexture,
					wrap: 'repeat',
					filter: 'nearest',
					scale: [2, 3],
					rotation: Math.PI / 4,
					translation: [0.1, 0.2]
				},
				CURRENT
			);
			if (fill.kind !== 'texture') throw new Error();
			expect(fill.wrap).toBe('repeat');
			expect(fill.filter).toBe('nearest');
			expect(fill.scale).toEqual([2, 3]);
			expect(fill.rotation).toBeCloseTo(Math.PI / 4, 5);
			expect(fill.translation).toEqual([0.1, 0.2]);
		});
	});
});

describe('slugFillRepresentativeColor', () => {
	it('returns the color directly for solid fills', () => {
		const color = slugFillRepresentativeColor({
			kind: 'solid',
			color: [0.7, 0.3, 0.1, 0.9],
			rgbProvided: true,
			alphaProvided: true
		});
		expect(color).toEqual([0.7, 0.3, 0.1, 0.9]);
	});

	it('returns the first stop for linear gradients', () => {
		const color = slugFillRepresentativeColor({
			kind: 'linear-gradient',
			stops: [
				{offset: 0, color: [1, 0, 0, 1]},
				{offset: 1, color: [0, 0, 1, 1]}
			],
			start: [0, 0],
			end: [1, 0],
			coordinateSpace: 'normalized',
			rgbProvided: true,
			alphaProvided: true
		});
		expect(color).toEqual([1, 0, 0, 1]);
	});

	it('returns white for textures', () => {
		const color = slugFillRepresentativeColor({
			kind: 'texture',
			source: {},
			wrap: 'clamp',
			filter: 'linear',
			scale: [1, 1],
			rotation: 0,
			translation: [0, 0],
			rgbProvided: true,
			alphaProvided: true
		});
		expect(color).toEqual([1, 1, 1, 1]);
	});
});
