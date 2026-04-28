import {Defaults} from '../../../defaults';
import {SlugFont} from '../font';
import {SlugFontErrorPolicy} from '../font/error/policy';
import {SlugFonts} from '../fonts';

import {slugResolveFontInput, slugTryResolveFontInputSync} from '../fonts/resolve';
import type {SlugDropShadow, SlugDropShadowResolved, SlugStroke, SlugTextInit} from './init';
import type {SlugTextStyleAlign} from './style/align';
import {slugTextColorToRgba, type SlugTextColor} from './style/color';
import type {SlugTextJustify} from './style/justify';
import {
	decorationsEqual,
	slugDrawDecorationDisabled,
	slugResolveDecoration,
	slugResolveDrawDecoration,
	type SlugTextDecorationDraw,
	type SlugTextDecorationInput,
	type SlugTextDecorationResolved
} from './style/decoration';
import type {SlugTextDirection} from './style/direction';
import type {SlugStrokeAlphaMode} from './style/stroke/alpha/mode';
import {booleanValue, numberValue, stringValue} from '@toreda/strong-types';

/**
 * Minimal Container shape — the subset of PixiJS Container that
 * SlugTextBase needs. Avoids importing from any specific PixiJS package.
 */
interface ContainerLike {
	addChild(child: any): any;
	removeChild(child: any): void;
	destroy(...args: any[]): void;
}

type Constructor<T = ContainerLike> = new (...args: any[]) => T;

/**
 * Coerce a user-supplied `align` value into a known `SlugTextStyleAlign`.
 * Anything outside the union (including `null`/`undefined`) falls back
 * to the configured default — typically `'start'`.
 */
function resolveAlignInput(value: SlugTextStyleAlign | null | undefined): SlugTextStyleAlign {
	switch (value) {
		case 'start':
		case 'end':
		case 'left':
		case 'center':
		case 'right':
		case 'justify':
			return value;
		default:
			return Defaults.SlugText.Align;
	}
}

/**
 * Coerce a user-supplied `textJustify` value into a known
 * `SlugTextJustify`. Anything outside the union (including `null` /
 * `undefined`) falls back to the configured default — typically
 * `'inter-word'`.
 */
function resolveTextJustifyInput(value: SlugTextJustify | null | undefined): SlugTextJustify {
	switch (value) {
		case 'inter-word':
		case 'inter-character':
			return value;
		default:
			return Defaults.SlugText.TextJustify;
	}
}

/**
 * Mixin that adds shared SlugText state and property accessors to a
 * Container base class. Each PixiJS version passes its own Container:
 *
 * ```typescript
 * // v8
 * import {Container} from 'pixi.js';
 * class SlugText extends SlugTextMixin(Container) { ... }
 *
 * // v6/v7
 * import {Container} from '@pixi/display';
 * class SlugText extends SlugTextMixin(Container) { ... }
 * ```
 *
 * The returned class manages text, font, fontSize, color, wordWrap,
 * supersampling, memory tracking, and rebuild lifecycle. Subclasses
 * implement `rebuild()` with version-specific GPU APIs.
 *
 * Fields use public `_` prefix instead of `protected` to avoid TS4094
 * ("Property of exported anonymous class type may not be private or
 * protected"). The `_` convention signals internal use.
 */
export function SlugTextMixin<TBase extends Constructor>(Base: TBase) {
	abstract class SlugTextBase extends Base {
		_text!: string;
		_font!: SlugFont;
		_fontRef!: WeakRef<SlugFont>;
		_fontSize!: number;
		_color!: [number, number, number, number];
		_supersampling!: boolean;
		_supersampleCount!: number;
		_wordWrap!: boolean;
		_wordWrapWidth!: number;
		_breakWords!: boolean;
		_direction!: SlugTextDirection;
		_align!: SlugTextStyleAlign;
		_textJustify!: SlugTextJustify;
		_underline!: SlugTextDecorationResolved;
		_strikethrough!: SlugTextDecorationResolved;
		_overline!: SlugTextDecorationResolved;
		// Concrete draw records — recomputed eagerly by `_resolveDecorations`
		// whenever any input that feeds them changes (decoration setters,
		// color, font, fontSize). Render code reads ONLY these.
		_underlineDraw!: SlugTextDecorationDraw;
		_strikethroughDraw!: SlugTextDecorationDraw;
		_overlineDraw!: SlugTextDecorationDraw;
		_vertexBytes!: number;
		_indexBytes!: number;
		_rebuildCount!: number;

		// Stroke state (enabled when _strokeWidth > 0)
		_strokeWidth!: number;
		_strokeColor!: [number, number, number, number];
		_strokeAlphaMode!: SlugStrokeAlphaMode;
		_strokeAlphaStart!: number;
		_strokeAlphaRate!: number;

		// Drop shadow state (enabled when _dropShadow is not null).
		// Stored in resolved form: all fields concrete, color is an RGBA
		// tuple — never the wider `SlugTextColor` user-input union.
		_dropShadow!: SlugDropShadowResolved | null;

		/**
		 * Initialize shared fields from a SlugTextInit object.
		 * Called by the subclass constructor after super().
		 * Subclass must call rebuild() separately after version-specific init.
		 */
		public initBase(init: SlugTextInit): void {
			this._text = stringValue(init.text, Defaults.SlugText.Text);

			const fallbackWhileLoading = booleanValue(
				init.fallbackWhileLoading,
				Defaults.SlugText.FallbackWhileLoading
			);

			const policy: SlugFontErrorPolicy = {
				...Defaults.SlugText.ErrorPolicy,
				...(init.errorPolicy ?? {})
			};

			const fontInput = init.font;
			const syncFont = slugTryResolveFontInputSync(fontInput);
			if (syncFont) {
				this._font = syncFont;
			} else {
				const fallback = fallbackWhileLoading ? SlugFonts.fallback() : null;
				this._font = fallback ?? new SlugFont();
				slugResolveFontInput(fontInput, policy).then((resolved) => {
					if (resolved && this._font !== resolved) {
						SlugFonts.release(this._font);
						this._font = resolved;
						this._fontRef = new WeakRef(resolved);
						SlugFonts.retain(resolved);
						this._resolveDecorations();
						this.rebuild();
					}
				});
			}

			this._fontRef = new WeakRef(this._font);
			SlugFonts.retain(this._font);
			this._fontSize = numberValue(init.options?.fontSize, Defaults.SlugText.FontSize);
			this._color = slugTextColorToRgba(init.options?.fill, Defaults.SlugText.FillColor);
			this._supersampling = booleanValue(init.supersampling, Defaults.SlugText.Supersampling);
			this._supersampleCount = numberValue(init.supersampleCount, Defaults.SlugText.SupersampleCount);
			this._wordWrap = booleanValue(init.options?.wordWrap, Defaults.SlugText.WordWrap);
			this._wordWrapWidth = numberValue(init.options?.wordWrapWidth, Defaults.SlugText.WordWrapWidth);
			this._breakWords = booleanValue(init.options?.breakWords, false);
			this._direction = init.options?.direction === 'rtl' ? 'rtl' : Defaults.SlugText.Direction;
			this._align = resolveAlignInput(init.options?.align);
			this._textJustify = resolveTextJustifyInput(init.options?.textJustify);
			this._underline = slugResolveDecoration(init.options?.underline);
			this._strikethrough = slugResolveDecoration(init.options?.strikethrough);
			this._overline = slugResolveDecoration(init.options?.overline);
			this._underlineDraw = slugDrawDecorationDisabled();
			this._strikethroughDraw = slugDrawDecorationDisabled();
			this._overlineDraw = slugDrawDecorationDisabled();
			this._vertexBytes = 0;
			this._indexBytes = 0;
			this._rebuildCount = 0;

			// Stroke
			const stroke = init.options?.stroke;
			this._strokeWidth = numberValue(stroke?.width, Defaults.SlugText.StrokeWidth);
			this._strokeColor = slugTextColorToRgba(stroke?.color, Defaults.SlugText.StrokeColor);
			this._strokeAlphaMode = stroke?.alphaMode ?? Defaults.SlugText.StrokeAlphaMode;
			this._strokeAlphaStart = numberValue(stroke?.alphaStart, Defaults.SlugText.StrokeAlphaStart);
			this._strokeAlphaRate = numberValue(stroke?.alphaRate, Defaults.SlugText.StrokeAlphaRate);

			// Drop shadow — presence of the object enables it
			const ds = init.options?.dropShadow;
			if (ds) {
				this._dropShadow = {
					alpha: numberValue(ds.alpha, Defaults.SlugText.DropShadowAlpha),
					angle: numberValue(ds.angle, Defaults.SlugText.DropShadowAngle),
					blur: numberValue(ds.blur, Defaults.SlugText.DropShadowBlur),
					color: slugTextColorToRgba(ds.color, Defaults.SlugText.DropShadowColor),
					distance: numberValue(ds.distance, Defaults.SlugText.DropShadowDistance)
				};
			} else {
				this._dropShadow = null;
			}

			this._resolveDecorations();
		}

		/**
		 * Recompute the concrete decoration draw records from the user
		 * inputs (`_underline`/`_strikethrough`/`_overline`), the current
		 * fill color, and the current font metrics. Called by every
		 * setter that affects any of those inputs — never from the
		 * render path. Render code reads only the resulting `*Draw`
		 * fields and never re-runs inheritance per draw.
		 */
		public _resolveDecorations(): void {
			const font = this._fontRef?.deref();
			const scale = font && font.unitsPerEm > 0 ? this._fontSize / font.unitsPerEm : 0;
			const ulDefault = font ? font.underlineThickness * scale : 1;
			const stDefault = font ? font.strikethroughSize * scale : 1;
			const dir = this._direction;
			this._underlineDraw = slugResolveDrawDecoration(this._underline, this._color, ulDefault, dir);
			this._strikethroughDraw = slugResolveDrawDecoration(
				this._strikethrough,
				this._color,
				stDefault,
				dir
			);
			this._overlineDraw = slugResolveDrawDecoration(this._overline, this._color, ulDefault, dir);
		}

		/** Version-specific rebuild. Subclasses implement with their PixiJS APIs. */
		public abstract rebuild(): void;

		/**
		 * Called when supersampling is toggled. Override to update shader
		 * uniforms without a full rebuild.
		 */
		public onSupersamplingChanged(): void {}

		/**
		 * Called when supersample count changes. Override to update shader
		 * uniforms without a full rebuild.
		 */
		public onSupersampleCountChanged(): void {}

		// --- Property accessors ---

		public get text(): string {
			return this._text;
		}

		public set text(value: string) {
			if (this._text === value) return;
			this._text = value;
			this.rebuild();
		}

		public get font(): SlugFont | null {
			return this._fontRef?.deref() ?? null;
		}

		public set font(value: SlugFont) {
			if (this._font === value) return;
			SlugFonts.release(this._font);
			this._font = value;
			this._fontRef = new WeakRef(value);
			SlugFonts.retain(value);
			this._resolveDecorations();
			this.rebuild();
		}

		/**
		 * Release the live font reference held by this text instance.
		 * Version-specific subclasses must call this from their `destroy()`
		 * override so the registry's ref counter can mark the font for
		 * auto-destroy when no other text instances hold it.
		 */
		public _releaseFontOnDestroy(): void {
			SlugFonts.release(this._font);
		}

		public get fontSize(): number {
			return this._fontSize;
		}

		public set fontSize(value: number) {
			if (this._fontSize === value) return;
			this._fontSize = value;
			this._resolveDecorations();
			this.rebuild();
		}

		public get color(): [number, number, number, number] {
			return this._color;
		}

		public set color(value: SlugTextColor) {
			const next = slugTextColorToRgba(value, this._color);
			if (
				this._color[0] === next[0] &&
				this._color[1] === next[1] &&
				this._color[2] === next[2] &&
				this._color[3] === next[3]
			)
				return;
			this._color = next;
			this._resolveDecorations();
			this.rebuild();
		}

		public get wordWrap(): boolean {
			return this._wordWrap;
		}

		public set wordWrap(value: boolean) {
			if (this._wordWrap === value) return;
			this._wordWrap = value;
			this.rebuild();
		}

		public get wordWrapWidth(): number {
			return this._wordWrapWidth;
		}

		public set wordWrapWidth(value: number) {
			if (this._wordWrapWidth === value) return;
			this._wordWrapWidth = value;
			this.rebuild();
		}

		public get breakWords(): boolean {
			return this._breakWords;
		}

		public set breakWords(value: boolean) {
			if (this._breakWords === value) return;
			this._breakWords = value;
			if (this._wordWrap) this.rebuild();
		}

		public get direction(): SlugTextDirection {
			return this._direction;
		}

		public set direction(value: SlugTextDirection) {
			const next: SlugTextDirection = value === 'rtl' ? 'rtl' : 'ltr';
			if (this._direction === next) return;
			this._direction = next;
			this._resolveDecorations();
			this.rebuild();
		}

		/**
		 * Block-level text alignment. Stored in logical form — the
		 * physical resolution (folding in `direction`) happens in the
		 * version-specific `rebuild()`.
		 */
		public get align(): SlugTextStyleAlign {
			return this._align;
		}

		public set align(value: SlugTextStyleAlign) {
			const next = resolveAlignInput(value);
			if (this._align === next) return;
			this._align = next;
			this.rebuild();
		}

		/**
		 * Justify strategy used when `align === 'justify'`. Stored even
		 * when `align` is not `'justify'` so toggling `align` doesn't
		 * lose the user's preference.
		 */
		public get textJustify(): SlugTextJustify {
			return this._textJustify;
		}

		public set textJustify(value: SlugTextJustify) {
			const next = resolveTextJustifyInput(value);
			if (this._textJustify === next) return;
			this._textJustify = next;
			// No effect when align !== 'justify'; rebuild() is cheap
			// enough to skip the conditional.
			if (this._align === 'justify') this.rebuild();
		}

		public get underline(): SlugTextDecorationResolved {
			return this._underline;
		}

		public set underline(value: SlugTextDecorationInput) {
			const next = slugResolveDecoration(value);
			if (decorationsEqual(this._underline, next)) return;
			this._underline = next;
			this._resolveDecorations();
			this.rebuild();
		}

		public get strikethrough(): SlugTextDecorationResolved {
			return this._strikethrough;
		}

		public set strikethrough(value: SlugTextDecorationInput) {
			const next = slugResolveDecoration(value);
			if (decorationsEqual(this._strikethrough, next)) return;
			this._strikethrough = next;
			this._resolveDecorations();
			this.rebuild();
		}

		public get overline(): SlugTextDecorationResolved {
			return this._overline;
		}

		public set overline(value: SlugTextDecorationInput) {
			const next = slugResolveDecoration(value);
			if (decorationsEqual(this._overline, next)) return;
			this._overline = next;
			this._resolveDecorations();
			this.rebuild();
		}

		// --- Stroke ---

		/** Stroke width in pixels. 0 = no stroke. */
		public get strokeWidth(): number {
			return this._strokeWidth;
		}

		public set strokeWidth(value: number) {
			if (this._strokeWidth === value) return;
			this._strokeWidth = value;
			this.rebuild();
		}

		/** Stroke color as [r, g, b, a] in 0-1 range. */
		public get strokeColor(): [number, number, number, number] {
			return this._strokeColor;
		}

		public set strokeColor(value: SlugTextColor) {
			this._strokeColor = slugTextColorToRgba(value, this._strokeColor);
			if (this._strokeWidth > 0) this.rebuild();
		}

		/** Stroke alpha mode: 'uniform' for uniform, 'gradient' for per-pixel fade. */
		public get strokeAlphaMode(): SlugStrokeAlphaMode {
			return this._strokeAlphaMode;
		}

		public set strokeAlphaMode(value: SlugStrokeAlphaMode) {
			if (this._strokeAlphaMode === value) return;
			this._strokeAlphaMode = value;
			if (this._strokeWidth > 0) this.rebuild();
		}

		/** Starting alpha for gradient mode (innermost stroke pixel). */
		public get strokeAlphaStart(): number {
			return this._strokeAlphaStart;
		}

		public set strokeAlphaStart(value: number) {
			if (this._strokeAlphaStart === value) return;
			this._strokeAlphaStart = value;
			if (this._strokeWidth > 0 && this._strokeAlphaMode === 'gradient') this.rebuild();
		}

		/** Alpha change per pixel outward in gradient mode. */
		public get strokeAlphaRate(): number {
			return this._strokeAlphaRate;
		}

		public set strokeAlphaRate(value: number) {
			if (this._strokeAlphaRate === value) return;
			this._strokeAlphaRate = value;
			if (this._strokeWidth > 0 && this._strokeAlphaMode === 'gradient') this.rebuild();
		}

		/** Stroke configuration object, or null if disabled. */
		public get stroke(): SlugStroke | null {
			if (this._strokeWidth <= 0) return null;
			return {
				color: this._strokeColor,
				width: this._strokeWidth,
				alphaMode: this._strokeAlphaMode,
				alphaStart: this._strokeAlphaStart,
				alphaRate: this._strokeAlphaRate
			};
		}

		public set stroke(value: SlugStroke | null) {
			const newWidth = numberValue(value?.width, 0);
			// Color defaults to the static stroke default when stroke itself is
			// being disabled/unset; otherwise preserves the current _strokeColor
			// so 3-element / 6-digit hex inputs keep the existing alpha.
			const colorBase = value
				? this._strokeColor
				: (Defaults.SlugText.StrokeColor as readonly [number, number, number, number]);
			const newColor = slugTextColorToRgba(value?.color, colorBase);
			const newAlphaMode = value?.alphaMode ?? Defaults.SlugText.StrokeAlphaMode;
			const newAlphaStart = numberValue(value?.alphaStart, Defaults.SlugText.StrokeAlphaStart);
			const newAlphaRate = numberValue(value?.alphaRate, Defaults.SlugText.StrokeAlphaRate);
			const changed =
				this._strokeWidth !== newWidth ||
				this._strokeColor[0] !== newColor[0] ||
				this._strokeColor[1] !== newColor[1] ||
				this._strokeColor[2] !== newColor[2] ||
				this._strokeColor[3] !== newColor[3] ||
				this._strokeAlphaMode !== newAlphaMode ||
				this._strokeAlphaStart !== newAlphaStart ||
				this._strokeAlphaRate !== newAlphaRate;
			this._strokeWidth = newWidth;
			this._strokeColor = newColor;
			this._strokeAlphaMode = newAlphaMode;
			this._strokeAlphaStart = newAlphaStart;
			this._strokeAlphaRate = newAlphaRate;
			if (changed) this.rebuild();
		}

		// --- Drop shadow ---

		/**
		 * Drop shadow configuration, or null if disabled.
		 * Setting to a partial object fills missing fields with defaults.
		 * Setting to null disables the shadow.
		 */
		public get dropShadow(): SlugDropShadowResolved | null {
			return this._dropShadow;
		}

		public set dropShadow(value: SlugDropShadow | null) {
			if (value === null) {
				if (this._dropShadow === null) return;
				this._dropShadow = null;
			} else {
				// `_dropShadow.color` is already a concrete RGBA tuple, so
				// we can feed it back in as colorBase directly — the new
				// value keeps the current alpha when the input omits color
				// or uses a 6-digit / 3-element form.
				const colorBase = this._dropShadow
					? this._dropShadow.color
					: (Defaults.SlugText.DropShadowColor as readonly [number, number, number, number]);
				this._dropShadow = {
					alpha: numberValue(value.alpha, Defaults.SlugText.DropShadowAlpha),
					angle: numberValue(value.angle, Defaults.SlugText.DropShadowAngle),
					blur: numberValue(value.blur, Defaults.SlugText.DropShadowBlur),
					color: slugTextColorToRgba(value.color, colorBase),
					distance: numberValue(value.distance, Defaults.SlugText.DropShadowDistance)
				};
			}
			this.rebuild();
		}

		// --- Supersampling ---

		public get supersampling(): boolean {
			return this._supersampling;
		}

		public set supersampling(value: boolean) {
			if (this._supersampling === value) return;
			this._supersampling = value;
			this.onSupersamplingChanged();
		}

		public get supersampleCount(): number {
			return this._supersampleCount;
		}

		public set supersampleCount(value: number) {
			const clamped = Math.min(Math.max(value, 1), Defaults.MAX_SUPERSAMPLE_COUNT);
			if (this._supersampleCount === clamped) return;
			this._supersampleCount = clamped;
			this.onSupersampleCountChanged();
		}

		public get rebuildCount(): number {
			return this._rebuildCount;
		}

		public meshMemoryBytes(): number {
			return this._vertexBytes + this._indexBytes;
		}

		public totalMemoryBytes(): number {
			const font = this._fontRef?.deref();
			return this.meshMemoryBytes() + (font ? font.memoryBytes() : 0);
		}
	}

	return SlugTextBase;
}
