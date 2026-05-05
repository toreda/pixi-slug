import {SlugFonts} from '../../../shared/slug/fonts';
import {slugPrewarmShader} from '../font/prewarm';

/**
 * Install the v6 shader prewarm hook on the shared registry. Runs once
 * at module load (the v6 entry point imports this for its side effect).
 *
 * The shared `SlugFontsRegistry` lives in version-agnostic code and
 * holds the hook as a `(renderer: unknown) => Promise<boolean>` slot.
 * Only one version's prewarm hook is active per bundle since end users
 * import a single version entry.
 */
SlugFonts._installPrewarmHook(slugPrewarmShader);
