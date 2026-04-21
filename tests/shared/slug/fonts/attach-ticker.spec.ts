import {SlugFonts} from '../../../../src/shared/slug/fonts';

describe('SlugFonts.attachTicker', () => {
	beforeEach(() => {
		// Start each test from a clean detached state.
		SlugFonts.detachTicker();
		SlugFonts.setReattachPolicy('throw');
	});

	afterEach(() => {
		SlugFonts.detachTicker();
	});

	describe('first attach', () => {
		it('invokes subscribe and stores the detach handle', () => {
			let detached = false;
			let receivedCb: ((dt: number) => void) | null = null;
			const subscribe = (cb: (dt: number) => void): (() => void) => {
				receivedCb = cb;
				return () => {
					detached = true;
				};
			};

			SlugFonts.attachTicker(subscribe);

			expect(SlugFonts.tickerAttached).toBe(true);
			expect(receivedCb).toBeInstanceOf(Function);

			SlugFonts.detachTicker();
			expect(detached).toBe(true);
			expect(SlugFonts.tickerAttached).toBe(false);
		});
	});

	describe('idempotent re-attach (same subscribe function)', () => {
		it('returns silently without detaching or re-attaching', () => {
			let attachCount = 0;
			let detachCount = 0;
			const subscribe = (_cb: (dt: number) => void): (() => void) => {
				attachCount++;
				return () => {
					detachCount++;
				};
			};

			SlugFonts.attachTicker(subscribe);
			SlugFonts.attachTicker(subscribe); // same reference
			SlugFonts.attachTicker(subscribe); // still same

			expect(attachCount).toBe(1);
			expect(detachCount).toBe(0);
		});
	});

	describe('different subscribe under throw policy', () => {
		it('throws and leaves the original attachment in place', () => {
			let firstDetached = false;
			const first = (_cb: (dt: number) => void): (() => void) => () => {
				firstDetached = true;
			};
			const second = (_cb: (dt: number) => void): (() => void) => () => {};

			SlugFonts.attachTicker(first);
			expect(() => SlugFonts.attachTicker(second)).toThrow(/reattach/);
			expect(firstDetached).toBe(false);
			expect(SlugFonts.tickerAttached).toBe(true);
		});
	});

	describe('different subscribe under error policy', () => {
		it('logs console.error and leaves the original in place', () => {
			SlugFonts.setReattachPolicy('error');
			const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
			let firstDetached = false;
			const first = (_cb: (dt: number) => void): (() => void) => () => {
				firstDetached = true;
			};
			const second = (_cb: (dt: number) => void): (() => void) => () => {};

			SlugFonts.attachTicker(first);
			SlugFonts.attachTicker(second);

			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0][0]).toMatch(/reattach/);
			expect(firstDetached).toBe(false);
			spy.mockRestore();
		});
	});

	describe('different subscribe under warn policy', () => {
		it('logs console.warn and leaves the original in place', () => {
			SlugFonts.setReattachPolicy('warn');
			const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
			const first = (_cb: (dt: number) => void): (() => void) => () => {};
			const second = (_cb: (dt: number) => void): (() => void) => () => {};

			SlugFonts.attachTicker(first);
			SlugFonts.attachTicker(second);

			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0][0]).toMatch(/reattach/);
			spy.mockRestore();
		});
	});

	describe('different subscribe under silent policy', () => {
		it('does nothing and logs nothing', () => {
			SlugFonts.setReattachPolicy('silent');
			const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
			const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
			const first = (_cb: (dt: number) => void): (() => void) => () => {};
			const second = (_cb: (dt: number) => void): (() => void) => () => {};

			SlugFonts.attachTicker(first);
			SlugFonts.attachTicker(second);

			expect(errSpy).not.toHaveBeenCalled();
			expect(warnSpy).not.toHaveBeenCalled();
			errSpy.mockRestore();
			warnSpy.mockRestore();
		});
	});

	describe('force: true', () => {
		it('replaces the existing attachment silently, regardless of policy', () => {
			SlugFonts.setReattachPolicy('throw');

			let firstDetached = false;
			let secondAttached = false;
			const first = (_cb: (dt: number) => void): (() => void) => () => {
				firstDetached = true;
			};
			const second = (_cb: (dt: number) => void): (() => void) => {
				secondAttached = true;
				return () => {};
			};

			SlugFonts.attachTicker(first);
			expect(() => SlugFonts.attachTicker(second, {force: true})).not.toThrow();

			expect(firstDetached).toBe(true);
			expect(secondAttached).toBe(true);
		});

		it('treats force: null the same as omitted (throws on conflict)', () => {
			const first = (_cb: (dt: number) => void): (() => void) => () => {};
			const second = (_cb: (dt: number) => void): (() => void) => () => {};
			SlugFonts.attachTicker(first);
			expect(() => SlugFonts.attachTicker(second, {force: null})).toThrow(/reattach/);
		});

		it('treats force: false the same as omitted', () => {
			const first = (_cb: (dt: number) => void): (() => void) => () => {};
			const second = (_cb: (dt: number) => void): (() => void) => () => {};
			SlugFonts.attachTicker(first);
			expect(() => SlugFonts.attachTicker(second, {force: false})).toThrow(/reattach/);
		});
	});

	describe('reattachPolicy getter + setReattachPolicy', () => {
		it('round-trips valid modes and reports success', () => {
			expect(SlugFonts.setReattachPolicy('warn')).toBe(true);
			expect(SlugFonts.reattachPolicy).toBe('warn');

			expect(SlugFonts.setReattachPolicy('silent')).toBe(true);
			expect(SlugFonts.reattachPolicy).toBe('silent');

			expect(SlugFonts.setReattachPolicy('throw')).toBe(true);
			expect(SlugFonts.reattachPolicy).toBe('throw');

			expect(SlugFonts.setReattachPolicy('error')).toBe(true);
			expect(SlugFonts.reattachPolicy).toBe('error');
		});

		it('rejects invalid modes, logs, and leaves the current policy unchanged', () => {
			const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
			SlugFonts.setReattachPolicy('warn');

			expect(SlugFonts.setReattachPolicy('noisy' as unknown as never)).toBe(false);
			expect(SlugFonts.reattachPolicy).toBe('warn');
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0][0]).toMatch(/reattachPolicy/);

			expect(SlugFonts.setReattachPolicy(42 as unknown as never)).toBe(false);
			expect(SlugFonts.reattachPolicy).toBe('warn');
			expect(spy).toHaveBeenCalledTimes(2);

			expect(SlugFonts.setReattachPolicy(null as unknown as never)).toBe(false);
			expect(SlugFonts.reattachPolicy).toBe('warn');
			expect(SlugFonts.setReattachPolicy(undefined as unknown as never)).toBe(false);
			expect(SlugFonts.reattachPolicy).toBe('warn');

			spy.mockRestore();
		});
	});
});

describe('SlugFonts.sweepImmediate', () => {
	afterEach(() => {
		SlugFonts.clear();
	});

	it('is a no-op when nothing is marked', () => {
		expect(() => SlugFonts.sweepImmediate()).not.toThrow();
	});
});
