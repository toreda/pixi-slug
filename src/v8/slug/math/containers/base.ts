import {Container} from 'pixi.js';

/**
 * Base class for every math-layout container. Each subclass models one
 * `MathNode` kind (fraction, sqrt, bigop, row, …) as a self-contained
 * PIXI `Container` that lays out its own children and decorations in
 * its own local coordinate space.
 *
 * Coordinate convention (LOCAL to the container):
 *  - `(0, 0)` is the container's baseline-left.
 *  - Positive `y` is DOWN (PIXI default).
 *  - The container's vertical extent is `[-ascent, +descent]` relative
 *    to that baseline.
 *
 * Parents NEVER reach inside a child container's layout — they only
 * read `width`, `ascent`, `descent` and place the child at a chosen
 * `(x, y)`. This is the entire reason the container model exists: a
 * subscript's vertical drop is captured inside its own container and
 * cannot leak upward to mis-position a fraction rule or sibling.
 *
 * Subclasses MUST:
 *  1. Override `layout()` to position their own children + emit any
 *     decoration `Graphics`/`SlugText` children.
 *  2. Set `_width`, `_ascent`, `_descent` inside `layout()`.
 *
 * The `layout()` method is called by the compiler after slot setters
 * have populated the container's children; it can be called again to
 * re-flow when child metrics change.
 */
export abstract class MathContainer extends Container {
	/**
	 * Width of the container's visible content, in local pixels. Set by
	 * `layout()`. Parents read this to place sibling containers.
	 */
	protected _width: number = 0;
	/** Distance from local baseline (y=0) to the top of content. */
	protected _ascent: number = 0;
	/** Distance from local baseline (y=0) DOWN to the bottom of content. */
	protected _descent: number = 0;

	/**
	 * Effective font size of THIS container's level — used to scale
	 * accents, fence glyphs, fraction rule thickness, etc. Children may
	 * use different sizes (e.g. scripts shrink); they read their own
	 * `fontSize` from their context. Parent sets this before `layout()`.
	 */
	public mathFontSize: number = 24;

	/** Read width / ascent / descent set by the most recent `layout()`. */
	public get mathWidth(): number {
		return this._width;
	}
	public get mathAscent(): number {
		return this._ascent;
	}
	public get mathDescent(): number {
		return this._descent;
	}

	/**
	 * Re-flow the container. Subclasses override to position their
	 * children + draw their decorations, then set `_width`/`_ascent`/
	 * `_descent`. Must be idempotent: calling `layout()` twice in a row
	 * with the same children/state must produce the same result.
	 */
	public abstract layout(): void;
}
