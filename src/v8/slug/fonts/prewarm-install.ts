import {SlugFonts} from '../../../shared/slug/fonts';
import {slugPrewarmContext, slugPrewarmShader} from '../font/prewarm';

/**
 * Install the v8 shader prewarm hooks on the shared registry. Runs
 * once at module load (the v8 entry point imports this for its side
 * effect).
 *
 * Two hooks are installed in tandem:
 *  - `prewarmHook` — renderer-driven path, fired by
 *    `SlugFonts.attachRenderer` and `SlugFonts.warmup`.
 *  - `contextPrewarmHook` — context-first path, fired by
 *    `SlugFonts.prewarmContext`.
 *
 * The shared `SlugFontsRegistry` lives in version-agnostic code and
 * holds both hooks as typed slots; v6/v7 leave them null because
 * Part B is v8-only per spec §8. Wiring here keeps the dependency
 * direction correct: shared → v8, never v8 → shared.
 */
SlugFonts._installPrewarmHook(slugPrewarmShader);
SlugFonts._installContextPrewarmHook(slugPrewarmContext);
