import {SlugFonts} from '../../../shared/slug/fonts';
import {slugPrewarmShader} from '../font/prewarm';

/**
 * Install the v8 shader prewarm hook on the shared registry. Runs once
 * at module load (the v8 entry point imports this for its side effect).
 *
 * The shared `SlugFontsRegistry` lives in version-agnostic code and
 * holds the hook as a `(renderer: unknown) => Promise<boolean>` slot;
 * v6/v7 leave it null because Part B is v8-only per spec §8. Wiring
 * here keeps the dependency direction correct: shared → v8, never v8
 * → shared.
 */
SlugFonts._installPrewarmHook(slugPrewarmShader);
