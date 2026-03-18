import { ExtensionType, extensions } from 'pixi.js';
import type { RenderPipe, Renderer, Renderable } from 'pixi.js';
import { SlugText } from './text';

/**
 * PixiJS v8 render pipe for SlugText renderables.
 * Handles the rendering lifecycle for Slug-based text objects.
 */
export class SlugPipe implements RenderPipe {
	public static readonly extension = {
		type: ExtensionType.WebGLPipes,
		name: 'slug-pipe'
	} as const;

	private _renderer: Renderer;

	constructor(renderer: Renderer) {
		this._renderer = renderer;
	}

	public addRenderable(renderable: Renderable): void {
		if (!(renderable instanceof SlugText)) return;
		// TODO: Enqueue draw commands for this SlugText instance
	}

	public updateRenderable(renderable: Renderable): void {
		if (!(renderable instanceof SlugText)) return;
		// TODO: Handle changes between frames
	}

	public validateRenderable(renderable: Renderable): boolean {
		if (!(renderable instanceof SlugText)) return false;
		// TODO: Return whether instruction set needs rebuilding
		return true;
	}

	public destroyRenderable(renderable: Renderable): void {
		if (!(renderable instanceof SlugText)) return;
		// TODO: Cleanup resources for this renderable
	}
}

// Register the pipe as a PixiJS v8 extension
extensions.add(SlugPipe);
