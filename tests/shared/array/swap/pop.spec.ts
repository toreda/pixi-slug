import {swapPop} from '../../../../src/shared/array/swap/pop';

describe('swapPop', () => {
	it('returns null when the array is empty', () => {
		const arr: number[] = [];
		expect(swapPop(arr, 0)).toBeNull();
		expect(arr).toEqual([]);
	});

	it('returns null when ndx is negative (including -1 from indexOf)', () => {
		const arr = [1, 2, 3];
		expect(swapPop(arr, -1)).toBeNull();
		expect(arr).toEqual([1, 2, 3]);
	});

	it('returns null when ndx is past the end of the array', () => {
		const arr = [1, 2, 3];
		expect(swapPop(arr, 3)).toBeNull();
		expect(swapPop(arr, 99)).toBeNull();
		expect(arr).toEqual([1, 2, 3]);
	});

	it('pops the only element from a length-1 array', () => {
		const arr = ['only'];
		expect(swapPop(arr, 0)).toBe('only');
		expect(arr).toEqual([]);
	});

	it('pops the tail element without swapping', () => {
		const arr = ['a', 'b', 'c'];
		expect(swapPop(arr, 2)).toBe('c');
		expect(arr).toEqual(['a', 'b']);
	});

	it('removes a middle element by swapping the tail into its slot', () => {
		const arr = ['a', 'b', 'c', 'd'];
		expect(swapPop(arr, 1)).toBe('b');
		expect(arr).toEqual(['a', 'd', 'c']);
	});

	it('removes the head element by swapping the tail into slot 0', () => {
		const arr = [10, 20, 30];
		expect(swapPop(arr, 0)).toBe(10);
		expect(arr).toEqual([30, 20]);
	});

	it('handles object references by identity', () => {
		const a = {id: 'a'};
		const b = {id: 'b'};
		const c = {id: 'c'};
		const arr = [a, b, c];
		const removed = swapPop(arr, 1);
		expect(removed).toBe(b);
		expect(arr).toHaveLength(2);
		expect(arr[0]).toBe(a);
		expect(arr[1]).toBe(c);
	});

	it('preserves an explicit undefined element rather than returning null', () => {
		const arr: (string | undefined)[] = ['a', undefined, 'c'];
		expect(swapPop(arr, 1)).toBeUndefined();
		expect(arr).toEqual(['a', 'c']);
	});

	it('preserves an explicit undefined tail element', () => {
		const arr: (string | undefined)[] = ['a', 'b', undefined];
		expect(swapPop(arr, 2)).toBeUndefined();
		expect(arr).toEqual(['a', 'b']);
	});

	it('integrates with indexOf for the common removal idiom', () => {
		const arr = ['x', 'y', 'z'];
		const removed = swapPop(arr, arr.indexOf('y'));
		expect(removed).toBe('y');
		expect(arr).toEqual(['x', 'z']);
	});

	it('is a no-op when indexOf returns -1 for a missing item', () => {
		const arr = ['x', 'y', 'z'];
		const removed = swapPop(arr, arr.indexOf('missing'));
		expect(removed).toBeNull();
		expect(arr).toEqual(['x', 'y', 'z']);
	});

	it('repeated removals successfully drain the array', () => {
		const arr = [1, 2, 3, 4, 5];
		while (arr.length > 0) {
			swapPop(arr, 0);
		}
		expect(arr).toEqual([]);
	});
});
