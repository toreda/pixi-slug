import {MathContainer} from './base';

/**
 * Horizontal sequence of math containers, all sharing the same
 * baseline (y = 0 in local coords). Each child's `mathWidth` advances
 * the cursor; the row's own `_ascent`/`_descent` are the max across
 * children so vertical neighbours (numerators, fence glyphs, accents
 * on a containing parent) get enough room.
 *
 * Optional `gap` is inserted between adjacent children — used for
 * function-spacing after named operators (sin _x_) and thin-spacing
 * around binary operators.
 */
export class RowContainer extends MathContainer {
	private _children: MathContainer[] = [];
	private _gap: number = 0;

	public setItems(children: MathContainer[], gap: number = 0): void {
		// Remove old children (PIXI handles destruction at MathText level).
		for (const c of this._children) {
			this.removeChild(c);
		}
		this._children = children;
		this._gap = gap;
		for (const c of children) this.addChild(c);
	}

	public override layout(): void {
		let x = 0;
		let ascent = 0;
		let descent = 0;
		let inkAscent = 0;
		let inkDescent = 0;
		for (let i = 0; i < this._children.length; i++) {
			const c = this._children[i];
			c.layout();
			c.x = x;
			c.y = 0;
			x += c.mathWidth;
			if (i < this._children.length - 1) x += this._gap;
			if (c.mathAscent > ascent) ascent = c.mathAscent;
			if (c.mathDescent > descent) descent = c.mathDescent;
			// Children all share this row's baseline (y=0), so ink extents
			// combine by max just like the layout box.
			if (c.mathInkAscent > inkAscent) inkAscent = c.mathInkAscent;
			if (c.mathInkDescent > inkDescent) inkDescent = c.mathInkDescent;
		}
		this._width = x;
		this._ascent = ascent;
		this._descent = descent;
		this._inkAscent = inkAscent;
		this._inkDescent = inkDescent;
	}
}
