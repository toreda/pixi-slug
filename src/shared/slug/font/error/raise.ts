import {type SlugFontErrorCase} from './case';
import {type SlugFontErrorPolicy} from './policy';

/**
 * React to a resolver failure according to `policy[which]`. Throws,
 * warns, or silently no-ops. Messages are formatted here so every call
 * site produces the same `[SlugText:<case>] …` prefix.
 */
export function slugFontErrorRaise(
	policy: SlugFontErrorPolicy,
	which: SlugFontErrorCase,
	message: string
): void {
	const mode = policy[which];
	const formatted = `[SlugText:${which}] ${message}`;
	if (mode === 'throw') {
		throw new Error(formatted);
	}

	if (mode === 'error') {
		console.error(formatted);
		return;
	}

	if (mode === 'warn') {
		console.warn(formatted);
		return;
	}
}
