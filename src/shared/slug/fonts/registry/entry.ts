import {SlugFont} from '../../font';

/**
 * Reference-counted wrapper around a registry-managed `SlugFont`. The
 * registry stores entries (not raw fonts) in its maps so each cached
 * font can track live references and grace-period state without
 * coupling that state to `SlugFont` itself.
 */
export class SlugFontsRegistryEntry {
	public readonly font: SlugFont;
	/** Live reference count from `SlugText` instances. */
	public refs: number;
	/** True once refs hit 0 and the registry is waiting out the grace period. */
	public markedForDestroy: boolean;
	/** `performance.now()` timestamp when the font was marked, 0 otherwise. */
	public markedAt: number;
	/** `performance.now()` timestamp when this entry was created. */
	public readonly createdAt: number;
	/** Source buffer size in bytes. 0 when unknown (e.g. `register(name, font)`). */
	public readonly fileSize: number;

	constructor(font: SlugFont, fileSize: number) {
		this.font = font;
		this.refs = 0;
		this.markedForDestroy = false;
		this.markedAt = 0;
		this.createdAt = typeof performance !== 'undefined' ? performance.now() : 0;
		this.fileSize = fileSize;
	}
}
