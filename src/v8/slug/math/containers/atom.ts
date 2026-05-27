import {SlugText} from '../../text';
import type {Rgba} from '../../../../rgba';
import type {SlugFont} from '../../../../shared/slug/font';
import {MathContainer} from './base';

/**
 * Leaf container: a single text run rendered by one `SlugText`.
 *
 * The wrapped `SlugText` is positioned so its glyph baseline aligns
 * with this container's local `y = 0`. `SlugText` itself places its
 * `(0, 0)` at the top of the tallest glyph in the run (see
 * `slugGlyphQuads`), not at the baseline — so we offset the wrapped
 * text down by the run's actual `maxY * scale` to put the baseline
 * where the container's coord system expects it.
 *
 * `_width` is the run's pixel width (sum of advance widths).
 * `_ascent` is the run's actual max-glyph-top.
 * `_descent` is the font's natural descender depth (NOT the run's
 * actual min-glyph-bottom — using the natural descender lets row
 * neighbours align to a consistent baseline regardless of which run
 * happens to contain descenders).
 */
export class AtomContainer extends MathContainer {
	private _text: SlugText;
	private _font: SlugFont;

	constructor(text: string, font: SlugFont, fontSize: number, fill: Rgba) {
		super();
		this._font = font;
		this.mathFontSize = fontSize;
		this._text = new SlugText({
			text,
			font,
			fallbackWhileLoading: false,
			options: {fontSize, fill}
		});
		this.addChild(this._text);
	}

	/** Replace the text content without recreating the SlugText. */
	public setText(text: string): void {
		if (this._text.text === text) return;
		this._text.text = text;
	}

	/** Replace the font reference. Triggers a full SlugText rebuild. */
	public setFont(font: SlugFont): void {
		if (this._font === font) return;
		this._font = font;
		this._text.font = font;
	}

	public setFontSize(fontSize: number): void {
		if (this.mathFontSize === fontSize) return;
		this.mathFontSize = fontSize;
		this._text.fontSize = fontSize;
	}

	public setFill(fill: Rgba): void {
		this._text.fill = fill;
	}

	public override layout(): void {
		const font = this._font;
		const fontSize = this.mathFontSize;
		const scale = fontSize / (font.unitsPerEm || 1);

		// Width = sum of advance widths for the current text run.
		let width = 0;
		const text = this._text.text;
		for (let i = 0; i < text.length; i++) {
			width += (font.advances.get(text.charCodeAt(i)) ?? 0) * scale;
		}
		this._width = width;

		// SlugText positions its (0,0) at the top of the tallest glyph
		// in THIS run (see `slugGlyphQuads`: `baselineY = maxGlyphTop *
		// scale`). To put the run's baseline at this container's y=0 we
		// shift the SlugText DOWN by -maxGlyphTop * scale, so that the
		// renderer's "top" lands at -maxGlyphTop*scale and its baseline
		// lands at 0. Force glyph processing so the bounds are valid
		// before we read them.
		font.ensureGlyphs(text);
		let maxY = 0;
		let found = false;
		for (let i = 0; i < text.length; i++) {
			const g = font.glyphs.get(text.charCodeAt(i));
			if (g && g.bounds.maxY > maxY) {
				maxY = g.bounds.maxY;
				found = true;
			}
		}
		const runAscent = found ? maxY * scale : font.ascender * scale;
		this._text.y = -runAscent;
		this._text.x = 0;

		this._ascent = runAscent;
		this._descent = -font.descender * scale;
	}
}
