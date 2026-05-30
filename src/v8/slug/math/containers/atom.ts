import {SlugText} from '../../text';
import type {Rgba} from '../../../../rgba';
import type {SlugFont} from '../../../../shared/slug/font';
import {MathContainer} from './base';

/**
 * Native SlugText sub/superscript options carried by an
 * {@link AtomContainer}. Empty strings disable the respective script;
 * `null` font sizes derive from the base size. Forwarded verbatim to the
 * wrapped {@link SlugText} so the script glyphs ride on the same run as
 * the base, using SlugText's built-in trailing-script layout rather than
 * the math engine's `SubsupContainer`. See `m.slug` / `MathNode.slugScript`.
 */
export interface AtomScriptOptions {
	superscript: string;
	subscript: string;
	supFontSize: number | null;
	subFontSize: number | null;
}

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
 *
 * When the atom carries native sub/superscript (see {@link AtomScriptOptions}),
 * the trailing script glyphs are part of the SAME SlugText. Their extra
 * width and raised/dropped extent are not visible to the advance-width or
 * main-glyph-bounds math used for a plain run, so in that case the
 * container measures itself from the SlugText's published bounding box
 * (which already accounts for the scripts) instead.
 */
export class AtomContainer extends MathContainer {
	private _text: SlugText;
	private _font: SlugFont;
	/** True when the wrapped SlugText carries a native sub/superscript. */
	private _hasScripts: boolean;

	constructor(
		text: string,
		font: SlugFont,
		fontSize: number,
		fill: Rgba,
		scripts?: AtomScriptOptions
	) {
		super();
		this._font = font;
		this.mathFontSize = fontSize;
		this._hasScripts =
			!!scripts && (scripts.superscript.length > 0 || scripts.subscript.length > 0);
		this._text = new SlugText({
			text,
			font,
			fallbackWhileLoading: false,
			options: {
				fontSize,
				fill,
				superscript: scripts?.superscript,
				subscript: scripts?.subscript,
				supFontSize: scripts?.supFontSize,
				subFontSize: scripts?.subFontSize
			}
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
		let minY = 0;
		let found = false;
		for (let i = 0; i < text.length; i++) {
			const g = font.glyphs.get(text.charCodeAt(i));
			if (!g) continue;
			if (!found) {
				maxY = g.bounds.maxY;
				minY = g.bounds.minY;
				found = true;
			} else {
				if (g.bounds.maxY > maxY) maxY = g.bounds.maxY;
				if (g.bounds.minY < minY) minY = g.bounds.minY;
			}
		}
		const runAscent = found ? maxY * scale : font.ascender * scale;
		this._text.y = -runAscent;
		this._text.x = 0;

		this._ascent = runAscent;
		this._descent = -font.descender * scale;

		// INK extent: the run's ACTUAL glyph bounds. A run with no
		// descenders (e.g. `b²−4ac`) has `minY >= 0`, so its ink descent is
		// 0 even though the layout-box descent reports the font descender.
		// Parents that wrap content tightly (the sqrt radical) read these.
		this._inkAscent = found ? maxY * scale : font.ascender * scale;
		this._inkDescent = found ? Math.max(0, -minY * scale) : 0;

		// Native sub/superscript widens the run and raises/drops its ink
		// beyond what the BASE glyphs (measured above) cover. The SlugText
		// publishes a bounding box that already includes the script quads,
		// so fold it in. The bbox is in SlugText-local space, where y=0 is
		// the top of the tallest MAIN glyph — i.e. `runAscent` above the
		// container baseline. `_text.y` already shifts that frame down so
		// the baseline sits at the container's y=0; the bbox edges, offset
		// by `_text.y`, are therefore directly in container space.
		if (this._hasScripts) {
			const bbox = this._text.boundsArea;
			if (bbox && bbox.width > 0) {
				// Right edge of the script run from the container's x origin.
				this._width = Math.max(this._width, bbox.x + bbox.width);
				const bboxTop = this._text.y + bbox.y; // container space, +y down
				const bboxBottom = bboxTop + bbox.height;
				// Ascent grows when the superscript rises above the main
				// glyph top (bboxTop goes negative). The layout box and the
				// ink extent both follow the visible bbox here.
				const inkAscent = Math.max(this._inkAscent, -bboxTop);
				this._ascent = Math.max(this._ascent, inkAscent);
				this._inkAscent = inkAscent;
				// Descent grows when the subscript drops below the baseline.
				const inkDescent = Math.max(this._inkDescent, bboxBottom);
				this._descent = Math.max(this._descent, inkDescent);
				this._inkDescent = inkDescent;
			}
		}
	}
}
