import {SlugFont} from '../../../../src/shared/slug/font';
import {SlugFonts} from '../../../../src/shared/slug/fonts';
import type {SlugFontErrorPolicy} from '../../../../src/shared/slug/fonts/error';
import {
	slugResolveFontInput,
	slugTryResolveFontInputSync
} from '../../../../src/shared/slug/fonts/resolve';

/** All cases set to 'throw' so we can assert the exact case with `.toThrow()`. */
const throwingPolicy: SlugFontErrorPolicy = {
	unknownInput: 'throw',
	fontFaceNoUrl: 'throw',
	emptyFontFaceArray: 'throw',
	emptyInput: 'throw',
	loadFailed: 'throw',
	unsupportedFormat: 'throw',
	aliasNotFound: 'throw',
	aliasCollision: 'throw'
};

/** All cases set to 'silent' so the resolver returns null without throwing. */
const silentPolicy: SlugFontErrorPolicy = {
	unknownInput: 'silent',
	fontFaceNoUrl: 'silent',
	emptyFontFaceArray: 'silent',
	emptyInput: 'silent',
	loadFailed: 'silent',
	unsupportedFormat: 'silent',
	aliasNotFound: 'silent',
	aliasCollision: 'silent'
};

/** Policy where everything warns instead of throwing; we spy on console.warn. */
const warningPolicy: SlugFontErrorPolicy = {
	unknownInput: 'warn',
	fontFaceNoUrl: 'warn',
	emptyFontFaceArray: 'warn',
	emptyInput: 'warn',
	loadFailed: 'warn',
	unsupportedFormat: 'warn',
	aliasNotFound: 'warn',
	aliasCollision: 'warn'
};

/**
 * Build a minimal FontFace-like object that passes `isFontFaceLike`.
 * Overrides let each test customize `family`, `src`, etc.
 */
function makeFakeFontFace(overrides: Partial<{family: string; src: string; status: string}> = {}): FontFace {
	return {
		family: overrides.family ?? 'Test',
		status: overrides.status ?? 'loaded',
		loaded: Promise.resolve({} as FontFace),
		src: overrides.src ?? `url('https://example.com/test.ttf')`
	} as unknown as FontFace;
}

describe('slugResolveFontInput', () => {
	let fromSpy: jest.SpyInstance;
	let fromUrlSpy: jest.SpyInstance;
	let sentinelFont: SlugFont;

	beforeEach(() => {
		// A reusable SlugFont instance the stubs return so equality checks work.
		sentinelFont = new SlugFont();
		fromSpy = jest.spyOn(SlugFonts, 'from').mockResolvedValue(sentinelFont);
		fromUrlSpy = jest.spyOn(SlugFonts, 'fromUrl').mockResolvedValue(sentinelFont);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('happy paths (no errors raised)', () => {
		it('returns a SlugFont instance as-is', async () => {
			const existing = new SlugFont();
			const out = await slugResolveFontInput(existing, throwingPolicy);
			expect(out).toBe(existing);
			expect(fromSpy).not.toHaveBeenCalled();
			expect(fromUrlSpy).not.toHaveBeenCalled();
		});

		it('resolves a URL-like string through SlugFonts.fromUrl', async () => {
			const out = await slugResolveFontInput('https://example.com/font.ttf', throwingPolicy);
			expect(out).toBe(sentinelFont);
			expect(fromUrlSpy).toHaveBeenCalledWith('https://example.com/font.ttf');
		});

		it('resolves an ArrayBuffer input through SlugFonts.from', async () => {
			const buf = new ArrayBuffer(8);
			const out = await slugResolveFontInput(buf, throwingPolicy);
			expect(out).toBe(sentinelFont);
			expect(fromSpy).toHaveBeenCalledWith(buf);
		});

		it('resolves a Uint8Array input through SlugFonts.from', async () => {
			const bytes = new Uint8Array([1, 2, 3]);
			const out = await slugResolveFontInput(bytes, throwingPolicy);
			expect(out).toBe(sentinelFont);
			expect(fromSpy).toHaveBeenCalledWith(bytes);
		});

		it('extracts the URL from a FontFace.src and fetches via fromUrl', async () => {
			const face = makeFakeFontFace({src: `url('https://cdn.example.com/roboto.ttf')`});
			const out = await slugResolveFontInput(face, throwingPolicy);
			expect(out).toBe(sentinelFont);
			expect(fromUrlSpy).toHaveBeenCalledWith('https://cdn.example.com/roboto.ttf');
		});

		it('handles FontFace src with double quotes', async () => {
			const face = makeFakeFontFace({src: `url("https://cdn.example.com/bold.woff2")`});
			const out = await slugResolveFontInput(face, throwingPolicy);
			expect(out).toBe(sentinelFont);
			expect(fromUrlSpy).toHaveBeenCalledWith('https://cdn.example.com/bold.woff2');
		});

		it('handles FontFace src with no quotes', async () => {
			const face = makeFakeFontFace({src: `url(https://cdn.example.com/plain.ttf)`});
			const out = await slugResolveFontInput(face, throwingPolicy);
			expect(out).toBe(sentinelFont);
			expect(fromUrlSpy).toHaveBeenCalledWith('https://cdn.example.com/plain.ttf');
		});

		it('takes the first FontFace from an array', async () => {
			const first = makeFakeFontFace({family: 'First', src: `url('https://example.com/a.ttf')`});
			const second = makeFakeFontFace({family: 'Second', src: `url('https://example.com/b.ttf')`});
			const out = await slugResolveFontInput([first, second], throwingPolicy);
			expect(out).toBe(sentinelFont);
			expect(fromUrlSpy).toHaveBeenCalledWith('https://example.com/a.ttf');
			expect(fromUrlSpy).toHaveBeenCalledTimes(1);
		});

		it('decodes base64 data: URIs inline', async () => {
			// "hello" base64-encoded.
			const face = makeFakeFontFace({src: 'data:font/ttf;base64,aGVsbG8='});
			const out = await slugResolveFontInput(face, throwingPolicy);
			expect(out).toBe(sentinelFont);
			expect(fromSpy).toHaveBeenCalledTimes(1);
			const arg = fromSpy.mock.calls[0][0] as Uint8Array;
			expect(arg).toBeInstanceOf(Uint8Array);
			expect(Array.from(arg)).toEqual([104, 101, 108, 108, 111]); // 'hello'
		});
	});

	describe('error cases under throw policy', () => {
		it('throws unknownInput for null', async () => {
			await expect(slugResolveFontInput(null, throwingPolicy)).rejects.toThrow(/unknownInput/);
		});

		it('throws unknownInput for a plain object with none of the expected shapes', async () => {
			await expect(slugResolveFontInput({foo: 'bar'}, throwingPolicy)).rejects.toThrow(/unknownInput/);
		});

		it('throws unknownInput for a number', async () => {
			await expect(slugResolveFontInput(42, throwingPolicy)).rejects.toThrow(/unknownInput/);
		});

		it('throws emptyFontFaceArray for []', async () => {
			await expect(slugResolveFontInput([], throwingPolicy)).rejects.toThrow(/emptyFontFaceArray/);
		});

		it('throws fontFaceNoUrl when FontFace.src is empty', async () => {
			const face = makeFakeFontFace({src: ''});
			await expect(slugResolveFontInput(face, throwingPolicy)).rejects.toThrow(/fontFaceNoUrl/);
		});

		it('throws fontFaceNoUrl when FontFace.src is local() only', async () => {
			const face = makeFakeFontFace({src: `local('Arial')`});
			await expect(slugResolveFontInput(face, throwingPolicy)).rejects.toThrow(/fontFaceNoUrl/);
		});

		it('throws unsupportedFormat for non-base64 data: URIs', async () => {
			const face = makeFakeFontFace({src: 'data:text/plain,not-base64'});
			await expect(slugResolveFontInput(face, throwingPolicy)).rejects.toThrow(/unsupportedFormat/);
		});

		it('throws loadFailed when SlugFonts.fromUrl returns null for a string', async () => {
			fromUrlSpy.mockResolvedValue(null);
			await expect(slugResolveFontInput('https://example.com/broken.ttf', throwingPolicy)).rejects.toThrow(/loadFailed/);
		});

		it('throws loadFailed when SlugFonts.from returns null for ArrayBuffer', async () => {
			fromSpy.mockResolvedValue(null);
			await expect(slugResolveFontInput(new ArrayBuffer(4), throwingPolicy)).rejects.toThrow(/loadFailed/);
		});

		it('throws loadFailed when SlugFonts.fromUrl returns null for an extracted FontFace URL', async () => {
			fromUrlSpy.mockResolvedValue(null);
			const face = makeFakeFontFace({src: `url('https://example.com/404.ttf')`});
			await expect(slugResolveFontInput(face, throwingPolicy)).rejects.toThrow(/loadFailed/);
		});
	});

	describe('error cases under silent policy', () => {
		it('returns null for unknown input and does not throw', async () => {
			await expect(slugResolveFontInput({}, silentPolicy)).resolves.toBeNull();
		});

		it('returns null for empty FontFace array', async () => {
			await expect(slugResolveFontInput([], silentPolicy)).resolves.toBeNull();
		});

		it('returns null for FontFace with no URL', async () => {
			const face = makeFakeFontFace({src: `local('Arial')`});
			await expect(slugResolveFontInput(face, silentPolicy)).resolves.toBeNull();
		});

		it('returns null when SlugFonts.from fails on bytes', async () => {
			fromSpy.mockResolvedValue(null);
			await expect(slugResolveFontInput(new Uint8Array(4), silentPolicy)).resolves.toBeNull();
		});

		it('returns null for non-base64 data URI', async () => {
			const face = makeFakeFontFace({src: 'data:text/plain,nope'});
			await expect(slugResolveFontInput(face, silentPolicy)).resolves.toBeNull();
		});
	});

	describe('error cases under warn policy', () => {
		let warnSpy: jest.SpyInstance;

		beforeEach(() => {
			warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
		});

		it('warns and returns null for unknown input', async () => {
			const out = await slugResolveFontInput({arbitrary: 'value'}, warningPolicy);
			expect(out).toBeNull();
			expect(warnSpy).toHaveBeenCalledTimes(1);
			expect(warnSpy.mock.calls[0][0]).toMatch(/unknownInput/);
		});

		it('warns with the specific case name for a FontFace without URL', async () => {
			const face = makeFakeFontFace({src: `local('SomeLocal')`});
			await slugResolveFontInput(face, warningPolicy);
			expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('fontFaceNoUrl'));
		});

		it('warns for empty FontFace array', async () => {
			await slugResolveFontInput([], warningPolicy);
			expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('emptyFontFaceArray'));
		});

		it('warns for loadFailed when stub returns null', async () => {
			fromUrlSpy.mockResolvedValue(null);
			const face = makeFakeFontFace({src: `url('https://example.com/x.ttf')`});
			await slugResolveFontInput(face, warningPolicy);
			expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('loadFailed'));
		});
	});

	describe('per-case policy override', () => {
		it('can throw on one case while silent on another', async () => {
			const mixed: SlugFontErrorPolicy = {
				...silentPolicy,
				unknownInput: 'throw'
			};
			// unknownInput still throws.
			await expect(slugResolveFontInput({}, mixed)).rejects.toThrow(/unknownInput/);
			// emptyFontFaceArray stays silent.
			await expect(slugResolveFontInput([], mixed)).resolves.toBeNull();
		});
	});

	describe('URL sniffing for bare strings', () => {
		let getSpy: jest.SpyInstance;
		beforeEach(() => {
			getSpy = jest.spyOn(SlugFonts, 'get').mockReturnValue(null);
		});

		it('routes an absolute URL to fromUrl', async () => {
			await slugResolveFontInput('https://cdn.example.com/roboto.ttf', throwingPolicy);
			expect(fromUrlSpy).toHaveBeenCalledWith('https://cdn.example.com/roboto.ttf');
		});

		it('routes a protocol-relative URL to fromUrl', async () => {
			await slugResolveFontInput('//cdn.example.com/roboto.ttf', throwingPolicy);
			expect(fromUrlSpy).toHaveBeenCalledWith('//cdn.example.com/roboto.ttf');
		});

		it('routes a root-relative path to fromUrl', async () => {
			await slugResolveFontInput('/assets/roboto.ttf', throwingPolicy);
			expect(fromUrlSpy).toHaveBeenCalledWith('/assets/roboto.ttf');
		});

		it('routes a ./ relative path to fromUrl', async () => {
			await slugResolveFontInput('./roboto.ttf', throwingPolicy);
			expect(fromUrlSpy).toHaveBeenCalledWith('./roboto.ttf');
		});

		it('routes a bare filename ending in .ttf to fromUrl', async () => {
			await slugResolveFontInput('roboto.ttf', throwingPolicy);
			expect(fromUrlSpy).toHaveBeenCalledWith('roboto.ttf');
		});

		it('routes a path containing / to fromUrl', async () => {
			await slugResolveFontInput('fonts/roboto', throwingPolicy);
			expect(fromUrlSpy).toHaveBeenCalledWith('fonts/roboto');
		});

		it('routes a non-URL-like bare string to the alias branch', async () => {
			getSpy.mockReturnValue(sentinelFont);
			const out = await slugResolveFontInput('RobotoAlias', throwingPolicy);
			expect(out).toBe(sentinelFont);
			expect(getSpy).toHaveBeenCalledWith('RobotoAlias');
			expect(fromUrlSpy).not.toHaveBeenCalled();
		});

		it('raises aliasNotFound when a bare non-URL string is not registered', async () => {
			await expect(slugResolveFontInput('UnknownAlias', throwingPolicy)).rejects.toThrow(/aliasNotFound/);
			expect(fromUrlSpy).not.toHaveBeenCalled();
		});
	});

	describe('alias + url tuples and objects', () => {
		let getSpy: jest.SpyInstance;
		let registerSpy: jest.SpyInstance;

		beforeEach(() => {
			getSpy = jest.spyOn(SlugFonts, 'get').mockReturnValue(null);
			registerSpy = jest.spyOn(SlugFonts, 'register').mockImplementation(() => {});
		});

		it('tuple [alias, url] fetches then binds alias', async () => {
			const out = await slugResolveFontInput(['roboto', 'https://example.com/roboto.ttf'], throwingPolicy);
			expect(out).toBe(sentinelFont);
			expect(fromUrlSpy).toHaveBeenCalledWith('https://example.com/roboto.ttf');
			expect(registerSpy).toHaveBeenCalledWith('roboto', sentinelFont);
		});

		it('object {alias, url} fetches then binds alias', async () => {
			const out = await slugResolveFontInput({alias: 'roboto', url: 'https://example.com/roboto.ttf'}, throwingPolicy);
			expect(out).toBe(sentinelFont);
			expect(fromUrlSpy).toHaveBeenCalledWith('https://example.com/roboto.ttf');
			expect(registerSpy).toHaveBeenCalledWith('roboto', sentinelFont);
		});

		it('object {url} only fetches the url without explicit register call', async () => {
			const out = await slugResolveFontInput({url: 'https://example.com/roboto.ttf'}, throwingPolicy);
			expect(out).toBe(sentinelFont);
			expect(fromUrlSpy).toHaveBeenCalledWith('https://example.com/roboto.ttf');
			// URL doubles as its own alias via the existing byUrl cache — no explicit register.
			expect(registerSpy).not.toHaveBeenCalled();
		});

		it('object {alias} with alias not registered raises aliasNotFound', async () => {
			await expect(slugResolveFontInput({alias: 'missing'}, throwingPolicy)).rejects.toThrow(/aliasNotFound/);
		});

		it('object {} with no alias or url raises emptyInput', async () => {
			await expect(slugResolveFontInput({alias: undefined, url: undefined}, throwingPolicy)).rejects.toThrow(/emptyInput/);
		});

		it('single-element tuple ["something.ttf"] is URL-sniffed and fetches', async () => {
			await slugResolveFontInput(['roboto.ttf'], throwingPolicy);
			expect(fromUrlSpy).toHaveBeenCalledWith('roboto.ttf');
		});

		it('single-element tuple ["name"] with no registration raises aliasNotFound', async () => {
			await expect(slugResolveFontInput(['unregistered'], throwingPolicy)).rejects.toThrow(/aliasNotFound/);
		});

		describe('case 1: silent when alias already maps to the same font', () => {
			it('returns the existing font when alias is already registered and no url is given', async () => {
				const existingFont = new SlugFont();
				getSpy.mockImplementation((key: string) => (key === 'roboto' ? existingFont : null));

				const out = await slugResolveFontInput({alias: 'roboto'}, throwingPolicy);
				expect(out).toBe(existingFont);
				expect(fromUrlSpy).not.toHaveBeenCalled();
				expect(registerSpy).not.toHaveBeenCalled();
			});

			it('returns the existing font when alias and url both resolve to the same entry', async () => {
				const existingFont = new SlugFont();
				getSpy.mockImplementation((key: string) => {
					if (key === 'roboto') return existingFont;
					if (key === 'https://example.com/roboto.ttf') return existingFont;
					return null;
				});

				const out = await slugResolveFontInput(
					['roboto', 'https://example.com/roboto.ttf'],
					throwingPolicy
				);
				expect(out).toBe(existingFont);
				expect(fromUrlSpy).not.toHaveBeenCalled();
			});
		});

		describe('case 2: aliasCollision when alias maps to a different URL', () => {
			it('raises aliasCollision under throw policy', async () => {
				const existingFont = new SlugFont();
				getSpy.mockImplementation((key: string) => (key === 'roboto' ? existingFont : null));

				await expect(
					slugResolveFontInput(['roboto', 'https://example.com/different.ttf'], throwingPolicy)
				).rejects.toThrow(/aliasCollision/);
			});

			it('logs via console.error and returns null under default error policy', async () => {
				const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
				const existingFont = new SlugFont();
				getSpy.mockImplementation((key: string) => (key === 'roboto' ? existingFont : null));

				const out = await slugResolveFontInput(
					['roboto', 'https://example.com/different.ttf'],
					{...throwingPolicy, aliasCollision: 'error'}
				);
				expect(out).toBeNull();
				expect(errorSpy).toHaveBeenCalledTimes(1);
				expect(errorSpy.mock.calls[0][0]).toMatch(/aliasCollision/);
				errorSpy.mockRestore();
			});
		});
	});
});

describe('slugTryResolveFontInputSync', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('returns a SlugFont instance as-is', () => {
		const existing = new SlugFont();
		expect(slugTryResolveFontInputSync(existing)).toBe(existing);
	});

	it('returns the cached font when SlugFonts.get resolves synchronously', () => {
		const cached = new SlugFont();
		jest.spyOn(SlugFonts, 'get').mockReturnValue(cached);
		expect(slugTryResolveFontInputSync('Roboto')).toBe(cached);
	});

	it('returns null when SlugFonts.get has no hit', () => {
		jest.spyOn(SlugFonts, 'get').mockReturnValue(null);
		expect(slugTryResolveFontInputSync('unknown-key')).toBeNull();
	});

	it('returns null for ArrayBuffer / Uint8Array inputs (always async)', () => {
		expect(slugTryResolveFontInputSync(new ArrayBuffer(4))).toBeNull();
		expect(slugTryResolveFontInputSync(new Uint8Array(4))).toBeNull();
	});

	it('returns null for FontFace inputs (always async)', () => {
		const face = {family: 'F', status: 'loaded', loaded: Promise.resolve({})} as unknown as FontFace;
		expect(slugTryResolveFontInputSync(face)).toBeNull();
	});

	it('returns null for arbitrary objects', () => {
		expect(slugTryResolveFontInputSync({})).toBeNull();
		expect(slugTryResolveFontInputSync(null)).toBeNull();
		expect(slugTryResolveFontInputSync(undefined)).toBeNull();
	});
});
