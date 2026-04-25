import {isInt, isIntNeg, isIntPos, isNumberFinite} from '@toreda/verify';
import {Defaults} from '../src/defaults';

type DefaultEntryType =
	| 'string'
	| 'int'
	| 'number'
	| 'boolean'
	| 'intPos'
	| 'intNeg'
	| 'alpha'
	| 'colorRGBA'
	| 'powerOfTwo';

interface DefaultKeyTest<T> {
	value: T;
	key: string;
	units?: 'ms' | 's' | 'h' | 'm' | null;
	min?: number | null;
	max?: number | null;
	minLength?: number | null;
	maxLength?: number | null;
	nonZero?: boolean | null;
	type: DefaultEntryType;
	nonEmptyString?: boolean | null;
	validValues?: readonly string[] | null;
	startsWith?: string | null;
	endsWith?: string | null;
}

const DEFAULT_ENTRIES: DefaultKeyTest<number | boolean | string | readonly number[]>[] = [
	{
		value: Defaults.GLOBAL_KEY,
		key: 'Defaults.GLOBAL_KEY',
		type: 'string',
		nonEmptyString: true,
		startsWith: '__',
		endsWith: '__'
	},
	{value: Defaults.TEXTURE_SIZE, key: 'Defaults.TEXTURE_SIZE', type: 'powerOfTwo', min: 1},
	{value: Defaults.BAND_COUNT, key: 'Defaults.BAND_COUNT', type: 'intPos'},
	{value: Defaults.FONT_SIZE, key: 'Defaults.FONT_SIZE', type: 'intPos'},
	{
		value: Defaults.MAX_SUPERSAMPLE_COUNT,
		key: 'Defaults.MAX_SUPERSAMPLE_COUNT',
		type: 'intPos',
		min: 1,
		max: 16
	},
	{
		value: Defaults.Registry.AutoDestroyUnused,
		key: 'Defaults.Registry.AutoDestroyUnused',
		type: 'boolean'
	},
	{
		value: Defaults.Registry.AutoDestroyDelay,
		key: 'Defaults.Registry.AutoDestroyDelay',
		units: 's',
		type: 'int',
		min: 0
	},
	{
		value: Defaults.Registry.AutoAttachTicker,
		key: 'Defaults.Registry.AutoAttachTicker',
		type: 'boolean'
	},
	{value: Defaults.Registry.UpdateRate, key: 'Defaults.Registry.UpdateRate', units: 'ms', type: 'int'},
	{
		value: Defaults.Registry.ReattachPolicy,
		key: 'Defaults.Registry.ReattachPolicy',
		type: 'string',
		nonEmptyString: true,
		validValues: ['throw', 'error', 'warn', 'silent']
	},
	{value: Defaults.SlugText.FontSize, key: 'Defaults.SlugText.FontSize', type: 'int'},
	{value: Defaults.SlugText.Text, key: 'Defaults.SlugText.Text', type: 'string'},
	{value: Defaults.SlugText.WordWrap, key: 'Defaults.SlugText.WordWrap', type: 'boolean'},
	{value: Defaults.SlugText.WordWrapwidth, key: 'Defaults.SlugText.WordWrapwidth', type: 'intPos'},
	{
		value: Defaults.SlugText.FallbackWhileLoading,
		key: 'Defaults.SlugText.FallbackWhileLoading',
		type: 'boolean'
	},
	{value: Defaults.SlugText.Supersampling, key: 'Defaults.SlugText.Supersampling', type: 'boolean'},
	{
		value: Defaults.SlugText.SupersampleCount,
		key: 'Defaults.SlugText.SupersampleCount',
		type: 'intPos',
		max: 16
	},
	{value: Defaults.SlugText.FillColor, key: 'Defaults.SlugText.FillColor', type: 'colorRGBA'},
	{value: Defaults.SlugText.StrokeWidth, key: 'Defaults.SlugText.StrokeWidth', type: 'intPos', min: 0},
	{value: Defaults.SlugText.StrokeColor, key: 'Defaults.SlugText.StrokeColor', type: 'colorRGBA'},
	{
		value: Defaults.SlugText.StrokeAlphaMode,
		key: 'Defaults.SlugText.StrokeAlphaMode',
		type: 'string',
		nonEmptyString: true,
		validValues: ['uniform']
	},
	{
		value: Defaults.SlugText.StrokeAlphaStart,
		key: 'Defaults.SlugText.StrokeAlphaStart',
		type: 'alpha'
	},
	{
		value: Defaults.SlugText.StrokeAlphaRate,
		key: 'Defaults.SlugText.StrokeAlphaRate',
		type: 'alpha'
	},
	{
		value: Defaults.SlugText.DropShadowAlpha,
		key: 'Defaults.SlugText.DropShadowAlpha',
		type: 'alpha'
	},
	{
		value: Defaults.SlugText.DropShadowAngle,
		key: 'Defaults.SlugText.DropShadowAngle',
		type: 'number',
		min: 0,
		max: 2 * Math.PI
	},
	{
		value: Defaults.SlugText.DropShadowBlur,
		key: 'Defaults.SlugText.DropShadowBlur',
		type: 'intPos',
		min: 0
	},
	{
		value: Defaults.SlugText.DropShadowColor,
		key: 'Defaults.SlugText.DropShadowColor',
		type: 'colorRGBA'
	},
	{
		value: Defaults.SlugText.DropShadowDistance,
		key: 'Defaults.SlugText.DropShadowDistance',
		type: 'intPos',
		min: 0
	},
	{
		value: Defaults.SlugText.ErrorPolicy.unknownInput,
		key: 'Defaults.SlugText.ErrorPolicy.unknownInput',
		type: 'string',
		nonEmptyString: true,
		validValues: ['throw', 'error', 'warn', 'silent']
	},
	{
		value: Defaults.SlugText.ErrorPolicy.fontFaceNoUrl,
		key: 'Defaults.SlugText.ErrorPolicy.fontFaceNoUrl',
		type: 'string',
		nonEmptyString: true,
		validValues: ['throw', 'error', 'warn', 'silent']
	},
	{
		value: Defaults.SlugText.ErrorPolicy.emptyFontFaceArray,
		key: 'Defaults.SlugText.ErrorPolicy.emptyFontFaceArray',
		type: 'string',
		nonEmptyString: true,
		validValues: ['throw', 'error', 'warn', 'silent']
	},
	{
		value: Defaults.SlugText.ErrorPolicy.emptyInput,
		key: 'Defaults.SlugText.ErrorPolicy.emptyInput',
		type: 'string',
		nonEmptyString: true,
		validValues: ['throw', 'error', 'warn', 'silent']
	},
	{
		value: Defaults.SlugText.ErrorPolicy.loadFailed,
		key: 'Defaults.SlugText.ErrorPolicy.loadFailed',
		type: 'string',
		nonEmptyString: true,
		validValues: ['throw', 'error', 'warn', 'silent']
	},
	{
		value: Defaults.SlugText.ErrorPolicy.unsupportedFormat,
		key: 'Defaults.SlugText.ErrorPolicy.unsupportedFormat',
		type: 'string',
		nonEmptyString: true,
		validValues: ['throw', 'error', 'warn', 'silent']
	},
	{
		value: Defaults.SlugText.ErrorPolicy.aliasNotFound,
		key: 'Defaults.SlugText.ErrorPolicy.aliasNotFound',
		type: 'string',
		nonEmptyString: true,
		validValues: ['throw', 'error', 'warn', 'silent']
	},
	{
		value: Defaults.SlugText.ErrorPolicy.aliasCollision,
		key: 'Defaults.SlugText.ErrorPolicy.aliasCollision',
		type: 'string',
		nonEmptyString: true,
		validValues: ['throw', 'error', 'warn', 'silent']
	}
];

const EMPTY_STRING = '';

describe('Defaults', () => {
	for (const defaultEntry of DEFAULT_ENTRIES) {
		describe(`Entry: ${defaultEntry.key}`, () => {
			it(`should have key '${defaultEntry.key}'`, () => {
				expect(defaultEntry.value).not.toBeUndefined();
			});

			it(`should have defined value for '${defaultEntry.key}'`, () => {
				expect(defaultEntry.value).not.toBeUndefined();
			});

			if (defaultEntry.nonZero) {
				it(`should have non-zero value`, () => {
					expect(defaultEntry.value).not.toBe(0);
				});
			}

			const min = defaultEntry.min;
			if (typeof min === 'number' && typeof defaultEntry.value === 'number') {
				it(`should be >= '${min}'`, () => {
					expect(defaultEntry.value).toBeGreaterThanOrEqual(min);
				});
			}

			const max = defaultEntry.max;
			if (typeof max === 'number' && typeof defaultEntry.value === 'number') {
				it(`should be <= '${max}'`, () => {
					expect(defaultEntry.value).toBeLessThanOrEqual(max);
				});
			}

			const validValues = defaultEntry.validValues;
			if (Array.isArray(validValues)) {
				it(`should be one of [${validValues.map((v) => `'${v}'`).join(', ')}]`, () => {
					expect(validValues).toContain(defaultEntry.value);
				});
			}

			if (defaultEntry.nonEmptyString === true) {
				it(`should not be an empty string`, () => {
					expect(defaultEntry.value).not.toBe(EMPTY_STRING);
				});
			}

			const maxLength = defaultEntry.maxLength;
			if (typeof defaultEntry.value === 'string' && typeof maxLength === 'number') {
				it(`should have value.length <= '${maxLength}'`, () => {
					expect((defaultEntry.value as string).length).toBeLessThanOrEqual(maxLength);
				});
			}

			const minLength = defaultEntry.minLength;
			if (typeof defaultEntry.value === 'string' && typeof minLength === 'number') {
				it(`should have value.length >= '${minLength}'`, () => {
					expect((defaultEntry.value as string).length).toBeLessThanOrEqual(minLength);
				});
			}

			if (defaultEntry.nonEmptyString === true) {
				it(`should not be an empty string`, () => {
					expect(defaultEntry.value).not.toBe(EMPTY_STRING);
				});
			}

			const startsWith = defaultEntry.startsWith;
			if (typeof defaultEntry.value === 'string' && typeof startsWith === 'string') {
				it(`should start with '${startsWith}'`, () => {
					expect((defaultEntry.value as string).startsWith(startsWith)).toBe(true);
				});
			}

			const endsWith = defaultEntry.endsWith;
			if (typeof defaultEntry.value === 'string' && typeof endsWith === 'string') {
				it(`should end with '${endsWith}'`, () => {
					expect((defaultEntry.value as string).endsWith(endsWith)).toBe(true);
				});
			}

			it(`should have ${defaultEntry.type} value`, () => {
				switch (defaultEntry.type) {
					case 'boolean':
						expect(typeof defaultEntry.value === 'boolean').toBe(true);
						break;
					case 'string':
						expect(typeof defaultEntry.value).toBe('string');
						break;
					case 'int':
						expect(isInt(defaultEntry.value)).toBe(true);
						break;
					case 'intPos':
						expect(isIntPos(defaultEntry.value)).toBe(true);
						break;
					case 'intNeg':
						expect(isIntNeg(defaultEntry.value)).toBe(true);
						break;
					case 'alpha':
						expect(isNumberFinite(defaultEntry.value)).toBe(true);
						expect(defaultEntry.value).toBeGreaterThanOrEqual(0);
						expect(defaultEntry.value).toBeLessThanOrEqual(1);
						break;
					case 'number':
						expect(isNumberFinite(defaultEntry.value)).toBe(true);
						break;
					case 'powerOfTwo':
						expect(isIntPos(defaultEntry.value)).toBe(true);
						expect((defaultEntry.value as number) & ((defaultEntry.value as number) - 1)).toBe(0);
						break;
					case 'colorRGBA':
						expect(Array.isArray(defaultEntry.value)).toBe(true);
						expect((defaultEntry.value as readonly number[]).length).toBe(4);
						for (const channel of defaultEntry.value as readonly number[]) {
							expect(isNumberFinite(channel)).toBe(true);
							expect(channel).toBeGreaterThanOrEqual(0);
							expect(channel).toBeLessThanOrEqual(1);
						}
						break;
					default:
						throw new Error(
							`'${defaultEntry.key}' has unsupported default entry type: ${defaultEntry.type}`
						);
				}
			});
		});
	}

});
