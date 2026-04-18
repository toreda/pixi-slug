import {slugTextWrap} from '../../../../src/shared/slug/text/wrap';

describe('slugTextWrap', () => {
	// Uniform 10 em-space advance per character, scale 1.0 → 10px per char.
	const advances = new Map<number, number>();
	for (let i = 0; i < 128; i++) {
		advances.set(i, 10);
	}
	// Newline (10) has zero advance in practice; set explicitly for safety.
	advances.set(10, 0);
	const scale = 1.0;

	describe('newline handling with no width limit (maxWidth = 0)', () => {
		it('splits on \\n when maxWidth is 0', () => {
			const {lines} = slugTextWrap('foo\nbar', advances, scale, 0, false);
			expect(lines).toEqual(['foo', 'bar']);
		});

		it('splits on \\n when maxWidth is negative', () => {
			const {lines} = slugTextWrap('foo\nbar', advances, scale, -1, false);
			expect(lines).toEqual(['foo', 'bar']);
		});

		it('returns a single line for text with no \\n and no width limit', () => {
			const {lines} = slugTextWrap('foobar', advances, scale, 0, false);
			expect(lines).toEqual(['foobar']);
		});

		it('handles empty string', () => {
			const {lines} = slugTextWrap('', advances, scale, 0, false);
			expect(lines).toEqual([]);
		});

		it('handles single \\n as two empty lines', () => {
			const {lines} = slugTextWrap('\n', advances, scale, 0, false);
			expect(lines).toEqual(['', '']);
		});

		it('handles leading \\n', () => {
			const {lines} = slugTextWrap('\nfoo', advances, scale, 0, false);
			expect(lines).toEqual(['', 'foo']);
		});

		it('handles trailing \\n with empty final line', () => {
			const {lines} = slugTextWrap('foo\n', advances, scale, 0, false);
			expect(lines).toEqual(['foo', '']);
		});

		it('handles consecutive \\n characters', () => {
			const {lines} = slugTextWrap('foo\n\nbar', advances, scale, 0, false);
			expect(lines).toEqual(['foo', '', 'bar']);
		});

		it('does not width-wrap long text when maxWidth is 0', () => {
			// 'abcdefghij' = 10 chars × 10px = 100px. Would wrap at maxWidth=50,
			// but with maxWidth=0 must stay on one line.
			const {lines} = slugTextWrap('abcdefghij', advances, scale, 0, false);
			expect(lines).toEqual(['abcdefghij']);
		});
	});

	describe('width-based wrapping (existing behavior)', () => {
		it('wraps on space when line exceeds maxWidth', () => {
			// 'foo bar baz' with 10px each = 110px total. maxWidth=60:
			// 'foo ' = 40px, 'foo bar' = 70px > 60 → break at space, push 'foo'
			// Then 'bar ' = 40px, 'bar baz' = 70px > 60 → break at space, push 'bar'
			// Then push remaining 'baz'
			const {lines} = slugTextWrap('foo bar baz', advances, scale, 60, false);
			expect(lines).toEqual(['foo', 'bar', 'baz']);
		});

		it('does not break mid-word when breakWords is false', () => {
			const {lines} = slugTextWrap('abcdefghij', advances, scale, 50, false);
			expect(lines).toEqual(['abcdefghij']);
		});

		it('breaks mid-word when breakWords is true', () => {
			const {lines} = slugTextWrap('abcdefghij', advances, scale, 50, true);
			// 5 chars × 10px = 50px; adding 6th char overflows to 60 > 50 → break before 6th.
			expect(lines).toEqual(['abcde', 'fghij']);
		});
	});

	describe('newline + width-based wrapping combined', () => {
		it('resets line-width counter at \\n so each segment wraps independently', () => {
			// 'foo bar\nbaz qux quux' with maxWidth=60:
			//   segment 1: 'foo bar' → break at space → 'foo', then 'bar'
			//   segment 2: 'baz qux quux' → break at space → 'baz', then 'qux', then 'quux'
			const {lines} = slugTextWrap('foo bar\nbaz qux quux', advances, scale, 60, false);
			expect(lines).toEqual(['foo', 'bar', 'baz', 'qux', 'quux']);
		});

		it('breaks on \\n even when the segment would fit within maxWidth', () => {
			// Each segment is 30px, maxWidth=100 — width-wise both fit on one line,
			// but \n must still force a break.
			const {lines} = slugTextWrap('foo\nbar', advances, scale, 100, false);
			expect(lines).toEqual(['foo', 'bar']);
		});
	});
});
