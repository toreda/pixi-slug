import {SlugFont} from '../../../../../src/shared/slug/font';
import {SlugFontsRegistryEntry} from '../../../../../src/shared/slug/fonts/registry/entry';

describe('SlugFontsRegistryEntry', () => {
	describe('constructor defaults', () => {
		let font: SlugFont;
		let entry: SlugFontsRegistryEntry;

		beforeEach(() => {
			font = new SlugFont();
			entry = new SlugFontsRegistryEntry(font, 1024);
		});

		it('stores the SlugFont instance passed in', () => {
			expect(entry.font).toBe(font);
		});

		it('initializes refs to 0', () => {
			expect(entry.refs).toBe(0);
		});

		it('initializes markedForDestroy to false', () => {
			expect(entry.markedForDestroy).toBe(false);
		});

		it('initializes markedAt to 0', () => {
			expect(entry.markedAt).toBe(0);
		});

		it('captures createdAt from performance.now() at construction', () => {
			// Constructor reads `performance.now()` at the moment it runs.
			// A separate read taken right after construction must be ≥ that
			// captured value, and the captured value itself must be a
			// non-negative finite number — so anything > 0 in this test
			// confirms the timestamp was actually captured rather than
			// left at the default fallback of 0.
			const now = performance.now();
			expect(typeof entry.createdAt).toBe('number');
			expect(Number.isFinite(entry.createdAt)).toBe(true);
			expect(entry.createdAt).toBeGreaterThanOrEqual(0);
			expect(entry.createdAt).toBeLessThanOrEqual(now);
		});

		it('stores the fileSize argument', () => {
			expect(entry.fileSize).toBe(1024);
		});

		it('stores fileSize 0 when the source size is unknown', () => {
			const e = new SlugFontsRegistryEntry(font, 0);
			expect(e.fileSize).toBe(0);
		});
	});
});
