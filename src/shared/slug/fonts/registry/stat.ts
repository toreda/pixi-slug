/** Per-entry diagnostic snapshot returned by `SlugFontsRegistry.stats()`. */
export interface SlugFontsRegistryStat {
    key: string;
    source: 'url' | 'name';
    refs: number;
    markedForDestroy: boolean;
    fileSize: number;
    createdAt: number;
}
