import {type SlugFontErrorCase} from './case';
import {type SlugFontErrorMode} from './mode';

/**
 * Per-case error policy. Users pass a partial override via
 * `SlugTextInit.errorPolicy`; missing cases fall back to
 * `Defaults.SlugText.ErrorPolicy`.
 */
export type SlugFontErrorPolicy = Record<SlugFontErrorCase, SlugFontErrorMode>;
