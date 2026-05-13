/**
 * Remove an element from an unordered array in O(1) time by swapping it
 * with the last element and popping. Returns the removed element, or
 * `null` if `ndx` is out of range (including the common `-1` returned by
 * `Array.prototype.indexOf` when an item is absent).
 *
 * Callers must accept that the surviving element at `ndx` (if any) is
 * whatever used to live at the tail — order is not preserved.
 */
export function swapPop<T>(array: T[], ndx: number): T | null {
	const len = array.length;
	if (len === 0 || ndx < 0 || ndx >= len) {
		return null;
	}
	const last = len - 1;
	const element = array[ndx];
	if (ndx !== last) {
		array[ndx] = array[last];
	}
	array.pop();
	return element;
}
