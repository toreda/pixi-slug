import {Defaults} from '../../../defaults';
import {SlugFont} from '../font';
import {SlugFonts} from '../fonts';
import type {SlugDropShadow, SlugStroke, SlugTextInit} from './init';
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
		_underline!: boolean;
		_strikethrough!: boolean;
		_vertexBytes!: number;
		_indexBytes!: number;
		_rebuildCount!: number;

		// Stroke state (enabled when _strokeWidth > 0)
		_strokeWidth!: number;
		_strokeColor!: [number, number, number, number];
		_strokeAlphaMode!: SlugStrokeAlphaMode;
		_strokeAlphaStart!: number;
		_strokeAlphaRate!: number;

		// Drop shadow state (enabled when _dropShadow is not null)
		_dropShadow!: SlugDropShadow | null;

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

			if (typeof init.slugFont === 'string') {
				const key = init.slugFont;
				const ready = SlugFonts.get(key);
				if (ready) {
					this._font = ready;
				} else {
					const fallback = fallbackWhileLoading ? SlugFonts.fallback() : null;
					this._font = fallback ?? new SlugFont();
					SlugFonts.from(key).then((resolved) => {
						if (resolved && this._font !== resolved) {
							this._font = resolved;
							this._fontRef = new WeakRef(resolved);
							this.rebuild();
						}
					});
				}
			} else {
				this._font = init.slugFont;
			}
			this._fontRef = new WeakRef(this._font);
			this._fontSize = numberValue(init.options?.fontSize, Defaults.SlugText.FontSize);
			const fill = init.options?.fill;
			this._color = fill
				? [fill[0], fill[1], fill[2], fill[3]]
				: [...Defaults.SlugText.FillColor] as [number, number, number, number];
			this._supersampling = booleanValue(init.supersampling, Defaults.SlugText.Supersampling);
			this._supersampleCount = numberValue(init.supersampleCount, Defaults.SlugText.SupersampleCount);
			this._wordWrap = booleanValue(init.options?.wordWrap, Defaults.SlugText.WordWrap);
			this._wordWrapWidth = numberValue(init.options?.wordWrapWidth, Defaults.SlugText.WordWrapwidth);
			this._breakWords = booleanValue(init.options?.breakWords, false);
			this._underline = booleanValue(init.options?.underline, false);
			this._strikethrough = booleanValue(init.options?.strikethrough, false);
			this._vertexBytes = 0;
			this._indexBytes = 0;
			this._rebuildCount = 0;

			// Stroke
			const stroke = init.options?.stroke;
			this._strokeWidth = numberValue(stroke?.width, Defaults.SlugText.StrokeWidth);
			this._strokeColor = stroke?.color
				? [stroke.color[0], stroke.color[1], stroke.color[2], stroke.color[3]]
				: [...Defaults.SlugText.StrokeColor] as [number, number, number, number];
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
					color: ds.color
						? [ds.color[0], ds.color[1], ds.color[2], ds.color[3]]
						: [...Defaults.SlugText.DropShadowColor] as [number, number, number, number],
					distance: numberValue(ds.distance, Defaults.SlugText.DropShadowDistance)
				};
			} else {
				this._dropShadow = null;
			}
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
			this._font = value;
			this._fontRef = new WeakRef(value);
			this.rebuild();
		}

		public get fontSize(): number {
			return this._fontSize;
		}

		public set fontSize(value: number) {
			if (this._fontSize === value) return;
			this._fontSize = value;
			this.rebuild();
		}

		public get color(): [number, number, number, number] {
			return this._color;
		}

		public set color(value: [number, number, number, number]) {
			if (this._color[0] === value[0] && this._color[1] === value[1] &&
				this._color[2] === value[2] && this._color[3] === value[3]) return;
			this._color = value;
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

		public get underline(): boolean {
			return this._underline;
		}

		public set underline(value: boolean) {
			if (this._underline === value) return;
			this._underline = value;
			this.rebuild();
		}

		public get strikethrough(): boolean {
			return this._strikethrough;
		}

		public set strikethrough(value: boolean) {
			if (this._strikethrough === value) return;
			this._strikethrough = value;
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

		public set strokeColor(value: [number, number, number, number]) {
			this._strokeColor = value;
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
			const newColor: [number, number, number, number] = value?.color
				? [value.color[0], value.color[1], value.color[2], value.color[3]]
				: [...Defaults.SlugText.StrokeColor] as [number, number, number, number];
			const newAlphaMode = value?.alphaMode ?? Defaults.SlugText.StrokeAlphaMode;
			const newAlphaStart = numberValue(value?.alphaStart, Defaults.SlugText.StrokeAlphaStart);
			const newAlphaRate = numberValue(value?.alphaRate, Defaults.SlugText.StrokeAlphaRate);
			const changed = this._strokeWidth !== newWidth ||
				this._strokeColor[0] !== newColor[0] || this._strokeColor[1] !== newColor[1] ||
				this._strokeColor[2] !== newColor[2] || this._strokeColor[3] !== newColor[3] ||
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
		public get dropShadow(): SlugDropShadow | null {
			return this._dropShadow;
		}

		public set dropShadow(value: SlugDropShadow | null) {
			if (value === null) {
				if (this._dropShadow === null) return;
				this._dropShadow = null;
			} else {
				this._dropShadow = {
					alpha: numberValue(value.alpha, Defaults.SlugText.DropShadowAlpha),
					angle: numberValue(value.angle, Defaults.SlugText.DropShadowAngle),
					blur: numberValue(value.blur, Defaults.SlugText.DropShadowBlur),
					color: value.color
						? [value.color[0], value.color[1], value.color[2], value.color[3]]
						: [...Defaults.SlugText.DropShadowColor] as [number, number, number, number],
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
