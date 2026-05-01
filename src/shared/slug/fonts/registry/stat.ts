import type {SlugFont} from '../../font';

/**
 * Per-entry diagnostic snapshot returned by `SlugFontsRegistry.stats()`.
 *
 * `source: 'manual'` entries describe caller-supplied fonts the
 * registry is anchoring but not managing: `refs` is always 0,
 * `markedForDestroy` is always false, `fileSize` is 0 (the registry
 * never saw the source bytes), and `createdAt` is 0. The `font` field
 * is populated for manual entries only so callers can correlate the
 * stat back to the `SlugFont` they supplied.
 */
export interface SlugFontsRegistryStat {
    key: string;
    source: 'url' | 'name' | 'manual';
    refs: number;
    markedForDestroy: boolean;
    fileSize: number;
    createdAt: number;
    font?: SlugFont;
}
