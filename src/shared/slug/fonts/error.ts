/** How the font resolver should react when an input can't be resolved. */
export type SlugFontErrorMode = 'throw' | 'error' | 'warn' | 'silent';

/** Distinct failure cases in the font resolver. */
export type SlugFontErrorCase =
	| 'unknownInput'
	| 'fontFaceNoUrl'
	| 'emptyFontFaceArray'
	| 'loadFailed'
	| 'unsupportedFormat'
	| 'aliasNotFound'
	| 'aliasCollision'
	| 'emptyInput';

/**
 * Per-case error policy. Users pass a partial override via
 * `SlugTextInit.errorPolicy`; missing cases fall back to
 * `Defaults.SlugText.ErrorPolicy`.
 */
export type SlugFontErrorPolicy = Record<SlugFontErrorCase, SlugFontErrorMode>;

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
