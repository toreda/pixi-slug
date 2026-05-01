/**
 * Discriminated result for the `SlugFonts.removeRegistered*` family.
 * Success is the absence of additional context — the caller only
 * needs `ok` to gate the happy path. Failures carry a `reason` that
 * tells the caller exactly which precondition rejected the input or
 * which lookup missed.
 *
 * Reason vocabulary:
 *  - `'invalid-input'` — the argument was structurally wrong: empty
 *    string, non-string where a string was required, a non-URL passed
 *    to a URL-only helper, or `null` to the dispatcher.
 *  - `'not-found'` — the input was structurally valid but no matching
 *    entry exists in the relevant registry store.
 *  - `'refs-active'` — the entry exists, its refcount is greater than
 *    zero, and the caller did not pass `force: true`.
 *  - `'forbidden-fallback'` — the input resolved to the registry
 *    fallback. Use `setFallback(null)` to drop the fallback instead.
 *  - `'forbidden-manual'` — the input resolved to a manually anchored
 *    `SlugFont`. Use `removeManual` instead.
 */
export type SlugFontsRemoveResult =
	| {ok: true}
	| {
			ok: false;
			reason:
				| 'invalid-input'
				| 'not-found'
				| 'refs-active'
				| 'forbidden-fallback'
				| 'forbidden-manual';
	  };
