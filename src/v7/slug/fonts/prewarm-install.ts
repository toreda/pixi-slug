import {SlugFonts} from '../../../shared/slug/fonts';
import {slugPrewarmShader} from '../font/prewarm';

/**
 * Install the v7 shader prewarm hook on the shared registry. Runs once
 * at module load (the v7 entry point imports this for its side effect).
 *
 * The shared `SlugFontsRegistry` lives in version-agnostic code and
 * holds the hook as a `(renderer: unknown) => Promise<boolean>` slot.
 * v6 leaves the hook null; this install + the v8 install are mutually
 * exclusive in practice because end users only import one version
 * entry per bundle.
 */
SlugFonts._installPrewarmHook(slugPrewarmShader);
