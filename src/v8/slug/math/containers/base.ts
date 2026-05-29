import {Container} from 'pixi.js';

/**
 * Signature for the compiler-supplied callback that re-compiles one of
 * a container's slots when its scale field changes. The compiler
 * attaches a closure to each container after construction (capturing
 * the original `MathNode` for the slot and the `CompileCtx`); the
 * container's scale setters invoke it. Containers without recompilable
 * slots leave `_recompileSlot` undefined and their setters become
 * no-ops past mutating `mathFontSize` on existing children.
 *
 * `slot` is the field name on the container (e.g. `'upper'`, `'num'`,
 * `'sub'`). The callback replaces the slot's child with a freshly
 * compiled subtree at the new scale, then re-runs `layout()`.
 */
export type SlotRecompileFn = (slot: string) => void;

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
	 * INK ascent/descent: the actual visible-glyph extent, as opposed to
	 * the layout box (`_ascent`/`_descent`) which uses the font's natural
	 * ascender/descender so sibling baselines align consistently.
	 *
	 * Default to the layout box (`_ascent`/`_descent`) so a container that
	 * doesn't override them behaves exactly as before. A container that
	 * knows its true glyph extent (e.g. {@link AtomContainer}) overrides
	 * these in `layout()`.
	 *
	 * Used by parents that must wrap their content TIGHTLY — e.g. the
	 * square-root radical bracketing `b²−4ac` should hug the visible glyph
	 * bottoms, not drop to the font descender line where there is no ink.
	 * A value of `-Infinity` (the initial sentinel) means "not computed
	 * yet"; the getters fall back to the layout box in that case.
	 */
	protected _inkAscent: number = -Infinity;
	protected _inkDescent: number = -Infinity;

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
	 * Visible-ink ascent: distance from baseline UP to the highest glyph
	 * pixel. Falls back to the layout-box ascent when a container hasn't
	 * computed a tighter value. See {@link _inkAscent}.
	 */
	public get mathInkAscent(): number {
		return this._inkAscent === -Infinity ? this._ascent : this._inkAscent;
	}
	/**
	 * Visible-ink descent: distance from baseline DOWN to the lowest glyph
	 * pixel (0 for a run with no descenders, like `b²−4ac`). Falls back to
	 * the layout-box descent when not computed. See {@link _inkDescent}.
	 */
	public get mathInkDescent(): number {
		return this._inkDescent === -Infinity ? this._descent : this._inkDescent;
	}

	/**
	 * Re-flow the container. Subclasses override to position their
	 * children + draw their decorations, then set `_width`/`_ascent`/
	 * `_descent`. Must be idempotent: calling `layout()` twice in a row
	 * with the same children/state must produce the same result.
	 */
	public abstract layout(): void;

	/**
	 * Compiler-attached hook invoked by a container's scale setters to
	 * re-compile the affected slot at the new scale. Left undefined
	 * when the compiler had no source node to wire up (e.g. containers
	 * constructed by hand outside the compiler path). When undefined,
	 * setters fall back to re-applying `mathFontSize` to the existing
	 * child — visually wrong but doesn't throw.
	 */
	public _recompileSlot?: SlotRecompileFn;
}
