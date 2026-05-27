import {SlugFonts} from '../../../src/shared/slug/fonts';

/**
 * Tests for the renderer-registration / warmup surface added by
 * `_specs/features/parallel_shader_compile.md` Part B (§6.1, §6.4).
 * These tests exercise the version-agnostic shared layer:
 *  - `attachRenderer` / `detachRenderer` / `renderer` (idempotency,
 *    swap semantics, no-op on null).
 *  - `warmup()` behavior matrix (no renderer, no hook, in-flight,
 *    completed, multiple awaiters).
 *  - Hook invocation contract (called on attach with the renderer,
 *    not called on detach, dedupes via the hook's own caching).
 */
describe('SlugFonts Part B (renderer registration + warmup)', () => {
	beforeEach(() => {
		// Reset the global registry singleton so the first prewarm-API
		// call in each test triggers fresh construction with the right
		// options (`parallelShaderCompile: true` via `attachRenderer`).
		// `_installPrewarmHook(null)` after the reset buffers a null
		// hook — it does NOT auto-construct the registry, so the hook
		// install + later attach work in either order.
		SlugFonts._resetRegistry();
		SlugFonts._installPrewarmHook(null);
	});

	afterAll(() => {
		SlugFonts._resetRegistry();
		SlugFonts._installPrewarmHook(null);
	});

	describe('attachRenderer / detachRenderer / renderer', () => {
		it('renderer is null before any attach', () => {
			expect(SlugFonts.renderer).toBeNull();
		});

		it('attachRenderer stores the renderer; renderer getter reads it back', () => {
			const r = {marker: 'r1'};
			SlugFonts.attachRenderer(r);
			expect(SlugFonts.renderer).toBe(r);
		});

		it('detachRenderer clears the slot', () => {
			SlugFonts.attachRenderer({marker: 'r'});
			SlugFonts.detachRenderer();
			expect(SlugFonts.renderer).toBeNull();
		});

		it('attachRenderer is idempotent for the same reference', () => {
			const hook = jest.fn().mockResolvedValue(true);
			SlugFonts._installPrewarmHook(hook);

			const r = {marker: 'same'};
			SlugFonts.attachRenderer(r);
			SlugFonts.attachRenderer(r);
			SlugFonts.attachRenderer(r);

			// Only one prewarm fired even though attachRenderer was
			// called three times — idempotency is per-reference.
			expect(hook).toHaveBeenCalledTimes(1);
		});

		it('attachRenderer with a different reference swaps the slot', () => {
			const r1 = {marker: 'r1'};
			const r2 = {marker: 'r2'};
			SlugFonts.attachRenderer(r1);
			expect(SlugFonts.renderer).toBe(r1);
			SlugFonts.attachRenderer(r2);
			expect(SlugFonts.renderer).toBe(r2);
		});

		it('attachRenderer ignores null/undefined inputs (reserved for detachRenderer)', () => {
			SlugFonts.attachRenderer(null);
			expect(SlugFonts.renderer).toBeNull();
			SlugFonts.attachRenderer(undefined);
			expect(SlugFonts.renderer).toBeNull();
		});

		it('detachRenderer is safe to call when no renderer is attached', () => {
			expect(() => SlugFonts.detachRenderer()).not.toThrow();
			expect(SlugFonts.renderer).toBeNull();
		});
	});

	describe('prewarm hook integration', () => {
		it('attachRenderer fires the hook with the attached renderer', () => {
			const hook = jest.fn().mockResolvedValue(true);
			SlugFonts._installPrewarmHook(hook);

			const r = {marker: 'r'};
			SlugFonts.attachRenderer(r);

			expect(hook).toHaveBeenCalledTimes(1);
			expect(hook).toHaveBeenCalledWith(r);
		});

		it('attachRenderer does not throw when the hook rejects', async () => {
			const hook = jest.fn().mockRejectedValue(new Error('boom'));
			SlugFonts._installPrewarmHook(hook);

			expect(() => SlugFonts.attachRenderer({marker: 'r'})).not.toThrow();
			// Allow the rejected promise's `.catch` to run before the
			// assertion exits the microtask queue.
			await Promise.resolve();
		});

		it('does not fire the hook when no hook is installed', () => {
			SlugFonts._installPrewarmHook(null);
			expect(() => SlugFonts.attachRenderer({marker: 'r'})).not.toThrow();
		});

		it('detachRenderer does NOT fire the hook', () => {
			const hook = jest.fn().mockResolvedValue(true);
			SlugFonts._installPrewarmHook(hook);
			SlugFonts.attachRenderer({marker: 'r'});
			hook.mockClear();
			SlugFonts.detachRenderer();
			expect(hook).not.toHaveBeenCalled();
		});
	});

	describe('warmup()', () => {
		it('resolves immediately as a no-op when no renderer is attached', async () => {
			const hook = jest.fn().mockResolvedValue(true);
			SlugFonts._installPrewarmHook(hook);

			await SlugFonts.warmup();
			// Hook is never invoked when there is no renderer to compile against.
			expect(hook).not.toHaveBeenCalled();
		});

		it('resolves immediately when no hook is installed (v6/v7 path)', async () => {
			SlugFonts._installPrewarmHook(null);
			SlugFonts.attachRenderer({marker: 'r'});
			await expect(SlugFonts.warmup()).resolves.toBeUndefined();
		});

		it('returns the in-flight hook promise so multiple awaiters share one outcome', async () => {
			let resolveHook: (value: boolean) => void = () => undefined;
			const hookPromise = new Promise<boolean>((resolve) => {
				resolveHook = resolve;
			});
			const hook = jest.fn().mockReturnValue(hookPromise);
			SlugFonts._installPrewarmHook(hook);

			const r = {marker: 'r'};
			SlugFonts.attachRenderer(r);
			// `attachRenderer` already called the hook; subsequent
			// `warmup()` calls re-call it, and the hook itself is
			// expected to dedupe internally (real implementation in
			// v8/font/prewarm.ts uses a WeakMap).
			const w1 = SlugFonts.warmup();
			const w2 = SlugFonts.warmup();

			resolveHook(true);
			await expect(w1).resolves.toBeUndefined();
			await expect(w2).resolves.toBeUndefined();
		});

		it('normalizes the hook boolean to void', async () => {
			SlugFonts._installPrewarmHook(jest.fn().mockResolvedValue(false));
			SlugFonts.attachRenderer({marker: 'r'});
			await expect(SlugFonts.warmup()).resolves.toBeUndefined();
		});
	});
});
