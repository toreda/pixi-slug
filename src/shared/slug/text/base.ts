import {Defaults} from '../../../defaults';
import type {Rgba, RgbaReadonly} from '../../../rgba';
import {SlugFont} from '../font';
import {SlugFontErrorPolicy} from '../font/error/policy';
import {SlugFonts} from '../fonts';

import {slugResolveFontInput, slugTryResolveFontInputSync} from '../fonts/resolve';
import type {SlugDropShadow, SlugDropShadowResolved, SlugStroke, SlugTextInit} from './init';
import type {SlugTextRebuildKind} from './rebuild/kind';
import type {SlugTextStyleAlign} from './style/align';
import {slugTextColorToRgba, type SlugTextColor} from './style/color';
import type {SlugTextFill} from './style/fill';
import type {SlugFillResolved} from './style/fill/resolved';
import {slugFillRepresentativeColor, slugResolveFill} from './style/fill/resolve';
import type {SlugTextJustify} from './style/justify';
import {
	decorationsEqual,
	slugApplyFillToDecoration,
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
		_fontRef!: WeakRef<SlugFont>;
		_fontSize!: number;
		// Resolved fill — discriminated union of solid / linear-gradient /
		// radial-gradient / texture. `_color` mirrors the representative
		// flat color for legacy callers (quad builder vertex color, stroke
		// pass, decoration inheritance) and is recomputed whenever `_fill`
		// changes.
		_fill!: SlugFillResolved;
		_color!: Rgba;
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

		/**
		 * Rebuild-kind hint recorded by `_requestRebuild` and consumed by
		 * the version-specific `rebuild()` via `_consumePendingKind()`.
		 *
		 * Strict-kind merge contract: once set to `'full'` for the
		 * current pending rebuild, it cannot be narrowed by a later
		 * setter in the same frame. Setters that can statically prove a
		 * narrower kind is safe call `_requestRebuild(kind)`; setters
		 * that cannot, or pre-incremental setters that still call
		 * `this.rebuild()` directly, leave the field at `'full'`. The
		 * field is reset to `'full'` every time `_consumePendingKind()`
		 * is called so the next batch starts clean.
		 *
		 * v6 / v7 ignore this field entirely — their `rebuild()`
		 * implementations always take the full path.
		 *
		 * See `_specs/features/incremental-mesh-rebuild.md` §4.2.
		 */
		_pendingKind!: SlugTextRebuildKind;

		// Stroke state (enabled when _strokeWidth > 0)
		_strokeWidth!: number;
		_strokeColor!: Rgba;
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
				this._setFontRef(syncFont);
			} else {
				const fallback = fallbackWhileLoading ? SlugFonts.fallback() : null;
				this._setFontRef(fallback ?? new SlugFont());
				slugResolveFontInput(fontInput, policy).then((resolved) => {
					if (resolved && this._fontRef?.deref() !== resolved) {
						this._setFontRef(resolved);
						this._resolveDecorations();
						this.rebuild();
					}
				});
			}
			this._fontSize = numberValue(init.options?.fontSize, Defaults.SlugText.FontSize);
			// `init.options.fill` is widened to `SlugTextFill` (color | gradient
			// | texture). The resolver folds invalid input back to the default
			// solid color and emits provenance flags consumed by decoration
			// inheritance.
			this._fill = slugResolveFill(
				init.options?.fill as SlugTextFill | null | undefined,
				Defaults.SlugText.FillColor
			);
			this._color = slugFillRepresentativeColor(this._fill);
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
			this._pendingKind = 'full';

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

		/**
		 * Apply a fill change to the stored sticky state of every
		 * decoration. RGB-only fill updates leave decoration sticky alpha
		 * intact; RGBA fill updates clear decoration sticky alpha (and
		 * vice versa for RGB). Channels not invalidated keep their prior
		 * sticky values.
		 *
		 * Called from the `fill` and `color` setters AFTER `_fill` is
		 * assigned but BEFORE `_resolveDecorations`, so the inheritance
		 * fold sees the post-invalidation sticky state.
		 */
		_applyFillToDecorations(rgbProvided: boolean, alphaProvided: boolean): void {
			if (!rgbProvided && !alphaProvided) return;
			this._underline = slugApplyFillToDecoration(this._underline, rgbProvided, alphaProvided);
			this._strikethrough = slugApplyFillToDecoration(
				this._strikethrough,
				rgbProvided,
				alphaProvided
			);
			this._overline = slugApplyFillToDecoration(this._overline, rgbProvided, alphaProvided);
		}

		/** Version-specific rebuild. Subclasses implement with their PixiJS APIs. */
		public abstract rebuild(): void;

		/**
		 * Setter-facing entry point: record the rebuild kind requested
		 * for the change being applied, then trigger `rebuild()`. The
		 * version-specific implementation reads the kind via
		 * `_consumePendingKind()` and decides whether to take an
		 * incremental path or fall through to a full rebuild.
		 *
		 * Strict-kind merge: if multiple setters fire within the same
		 * frame (before `rebuild()` consumes the kind), the strictest
		 * kind among them wins. `'full'` is the strictest. The current
		 * implementation only narrows from `'full'` to a more specific
		 * kind when a setter explicitly opts in — any setter that calls
		 * this with `'full'` (or any setter that still calls
		 * `this.rebuild()` directly without going through this method)
		 * forces the batched rebuild to the full path.
		 *
		 * Setters that have not yet been audited still call
		 * `this.rebuild()` directly. That path leaves `_pendingKind`
		 * untouched at its initial `'full'` value, so behavior is
		 * unchanged until each setter is migrated.
		 */
		public _requestRebuild(kind: SlugTextRebuildKind): void {
			if (kind !== 'full' && this._pendingKind !== 'full') {
				// Both are narrower than 'full'. If they disagree, upgrade to
				// 'full' — combining e.g. fillVisual + shadowVisual in the
				// same frame is not currently a supported incremental path,
				// so the safe combine is the full path. This is the place to
				// loosen later if we add a multi-pass incremental.
				if (this._pendingKind !== kind) {
					this._pendingKind = 'full';
				}
			} else if (kind === 'full') {
				this._pendingKind = 'full';
			} else {
				// _pendingKind was 'full' (initial / post-consume state) and
				// the caller is opting in to a narrower kind. Adopt it.
				this._pendingKind = kind;
			}
			this.rebuild();
		}

		/**
		 * Version-specific `rebuild()` implementations call this once at
		 * the top of their body to read the current pending kind and
		 * reset the field to `'full'` for the next batch. Returns `'full'`
		 * for any rebuild not driven through `_requestRebuild` — which
		 * preserves today's behavior for setters that haven't been
		 * migrated yet, and for the constructor's initial rebuild.
		 */
		public _consumePendingKind(): SlugTextRebuildKind {
			const kind = this._pendingKind;
			this._pendingKind = 'full';
			return kind;
		}

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
			// Text content can always go through the incremental path
			// in v8 — the slot's `_updateSlot` covers both capacity-fit
			// (steady state) and capacity-grow (one-time buffer
			// replacement keeping geometry/shader/mesh). No pass shape
			// changes from text content alone.
			this._requestRebuild('content');
		}

		/**
		 * Mutate the current text to uppercase and rebuild glyphs.
		 * Does NOT return a new string.
		 * @remarks
		 * Named `transformToUpperCase` rather than `toUpperCase` to avoid
		 * implying the JS string convention of returning a new value
		 * without mutation.
		 */
		public transformToUpperCase(): void {
			this.text = this._text.toUpperCase();
		}

		/**
		 * Mutate the current text to lowercase and rebuild glyphs.
		 * Does NOT return a new string.
		 * @remarks
		 * Named `transformToLowerCase` rather than `toLowerCase` to avoid
		 * implying the JS string convention of returning a new value
		 * without mutation.
		 */
		public transformToLowerCase(): void {
			this.text = this._text.toLowerCase();
		}

		/**
		 * Deference and return the font used or return `null` when the
		 * ref has been cleared or target font no longer exists.
		 */
		public get font(): SlugFont | null {
			return this._fontRef?.deref() ?? null;
		}

		public set font(value: SlugFont) {
			if (this._fontRef?.deref() === value) {
				return;
			}

			this._setFontRef(value);
			this._resolveDecorations();
			// Font swap changes glyph maps and GPU bindings — must take
			// the full path. `_requestRebuild('full')` mirrors today's
			// plain `this.rebuild()`, but routes through the strict-kind
			// merge so a same-frame setter combination still resolves
			// correctly.
			this._requestRebuild('full');
		}

		/**
		 * Release the live font reference held by this text instance.
		 * Version-specific subclasses must call this from their `destroy()`
		 * override so the registry's ref counter can mark the font for
		 * auto-destroy when no other text instances hold it.
		 *
		 * Caller-supplied (manual) fonts are NOT auto-removed here — the
		 * caller owns the manual lifecycle and must call
		 * {@link SlugFonts.removeManual} explicitly when they want the
		 * GPU memory back.
		 */
		public _releaseFontOnDestroy(): void {
			SlugFonts.release(this._fontRef?.deref() ?? null);
		}

		/**
		 * Centralized font-handle assignment. Releases the current font
		 * (refcount drops; no-op for manual fonts and the fallback),
		 * anchors `next` as a manual font when it isn't already
		 * registry-owned (so the `WeakRef` has a strong-ref backstop),
		 * stores the new `WeakRef`, and retains the new font.
		 *
		 * Every code path that swaps the active font must go through
		 * this method — the registry's strong-ref invariants depend on
		 * it.
		 */
		public _setFontRef(next: SlugFont): void {
			const prev = this._fontRef?.deref() ?? null;
			if (prev === next) {
				return;
			}

			SlugFonts.release(prev);

			// Anchor caller-supplied fonts so the WeakRef cannot drop
			// while this SlugText is alive. `addManual` no-ops when the
			// font is registry-owned or is the fallback, so the cost
			// here is one Set membership check on the common path.
			SlugFonts.addManual(next);

			this._fontRef = new WeakRef(next);
			SlugFonts.retain(next);
		}

		public get fontSize(): number {
			return this._fontSize;
		}

		public set fontSize(value: number) {
			if (this._fontSize === value) return;
			this._fontSize = value;
			this._resolveDecorations();
			// fontSize changes every glyph's scale, line height, advance
			// width — full geometry regen required.
			this._requestRebuild('full');
		}

		public get color(): Rgba {
			return this._color;
		}

		public set color(value: SlugTextColor) {
			const prevFillKind = this._fill.kind;
			const next = slugTextColorToRgba(value, this._color);
			const sameAsCurrent =
				prevFillKind === 'solid' &&
				this._color[0] === next[0] &&
				this._color[1] === next[1] &&
				this._color[2] === next[2] &&
				this._color[3] === next[3];
			if (sameAsCurrent) return;
			// `color` setter always installs a solid fill. If the previous
			// fill was a gradient/texture, this replaces it.
			const resolved = slugResolveFill(value, this._color);
			this._fill = resolved;
			this._color = slugFillRepresentativeColor(resolved);
			this._applyFillToDecorations(resolved.rgbProvided, resolved.alphaProvided);
			this._resolveDecorations();
			// Solid→solid color swap can ride the incremental fill path
			// (re-resolve glyph quads with the new color into the same
			// slot). Crossing solid↔non-solid requires the fill sampler
			// bindings to flip, which `_writeFillSamplers` handles
			// in-place — still incremental. The shadow / stroke vertex
			// colors are unrelated, so a fill-only color change is
			// always `'fillVisual'`.
			this._requestRebuild('fillVisual');
		}

		/**
		 * Full fill input: solid color, linear/radial gradient, or texture.
		 * Setting via `color` is preserved for backward compatibility and
		 * is equivalent to setting `fill` with a color form.
		 */
		public get fill(): SlugFillResolved {
			return this._fill;
		}

		public set fill(value: SlugTextFill | null | undefined) {
			const resolved = slugResolveFill(value, this._color);
			this._fill = resolved;
			this._color = slugFillRepresentativeColor(resolved);
			this._applyFillToDecorations(resolved.rgbProvided, resolved.alphaProvided);
			this._resolveDecorations();
			// Fill swap (any direction) is incremental — `_writeFillSamplers`
			// rebinds the gradient/texture sampler on the existing shader
			// (A7-A9) and disposes the previous fill GPU record.
			this._requestRebuild('fillVisual');
		}

		public get wordWrap(): boolean {
			return this._wordWrap;
		}

		public set wordWrap(value: boolean) {
			if (this._wordWrap === value) return;
			this._wordWrap = value;
			// Wrap toggle can flip line count → vertex positions change
			// across every line → full rebuild.
			this._requestRebuild('full');
		}

		public get wordWrapWidth(): number {
			return this._wordWrapWidth;
		}

		public set wordWrapWidth(value: number) {
			if (this._wordWrapWidth === value) return;
			this._wordWrapWidth = value;
			this._requestRebuild('full');
		}

		public get breakWords(): boolean {
			return this._breakWords;
		}

		public set breakWords(value: boolean) {
			if (this._breakWords === value) return;
			this._breakWords = value;
			if (this._wordWrap) this._requestRebuild('full');
		}

		public get direction(): SlugTextDirection {
			return this._direction;
		}

		public set direction(value: SlugTextDirection) {
			const next: SlugTextDirection = value === 'rtl' ? 'rtl' : 'ltr';
			if (this._direction === next) return;
			this._direction = next;
			this._resolveDecorations();
			// LTR↔RTL flip changes per-line physical alignment and
			// decoration positioning across the whole geometry.
			this._requestRebuild('full');
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
			// Per-line offset changes → vertex X positions change.
			this._requestRebuild('full');
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
			if (this._align === 'justify') this._requestRebuild('full');
		}

		public get underline(): SlugTextDecorationResolved {
			return this._underline;
		}

		public set underline(value: SlugTextDecorationInput) {
			const next = slugResolveDecoration(value);
			if (decorationsEqual(this._underline, next)) return;
			const prevEnabled = this._underline.enabled;
			const prevLength = this._underline.length;
			this._underline = next;
			this._resolveDecorations();
			// Enabling / disabling the decoration changes child count
			// on the display list (add / remove Graphics) — that's not
			// a clean incremental swap, route through full. A length
			// change shifts decoration rect width, also full. Pure
			// color / thickness / alpha changes can take the decoration
			// incremental path — v8's `_buildDecorations` uses
			// `Graphics.clear() + re-issue` regardless of kind, so the
			// only thing the kind controls today is whether old slots
			// are parked. Glyph passes are untouched either way, so
			// `'decorationVisual'` is safe for any case that doesn't
			// flip enabled or length.
			if (prevEnabled !== next.enabled || prevLength !== next.length) {
				this._requestRebuild('full');
			} else {
				this._requestRebuild('decorationVisual');
			}
		}

		public get strikethrough(): SlugTextDecorationResolved {
			return this._strikethrough;
		}

		public set strikethrough(value: SlugTextDecorationInput) {
			const next = slugResolveDecoration(value);
			if (decorationsEqual(this._strikethrough, next)) return;
			const prevEnabled = this._strikethrough.enabled;
			const prevLength = this._strikethrough.length;
			this._strikethrough = next;
			this._resolveDecorations();
			if (prevEnabled !== next.enabled || prevLength !== next.length) {
				this._requestRebuild('full');
			} else {
				this._requestRebuild('decorationVisual');
			}
		}

		public get overline(): SlugTextDecorationResolved {
			return this._overline;
		}

		public set overline(value: SlugTextDecorationInput) {
			const next = slugResolveDecoration(value);
			if (decorationsEqual(this._overline, next)) return;
			const prevEnabled = this._overline.enabled;
			const prevLength = this._overline.length;
			this._overline = next;
			this._resolveDecorations();
			if (prevEnabled !== next.enabled || prevLength !== next.length) {
				this._requestRebuild('full');
			} else {
				this._requestRebuild('decorationVisual');
			}
		}

		// --- Stroke ---

		/** Stroke width in pixels. 0 = no stroke. */
		public get strokeWidth(): number {
			return this._strokeWidth;
		}

		public set strokeWidth(value: number) {
			if (this._strokeWidth === value) return;
			this._strokeWidth = value;
			// Width affects per-vertex normal expansion (dilation);
			// every stroke vertex moves. Crossing zero also changes
			// whether the stroke pass exists at all — both cases need
			// the full path.
			this._requestRebuild('full');
		}

		/** Stroke color as [r, g, b, a] in 0-1 range. */
		public get strokeColor(): Rgba {
			return this._strokeColor;
		}

		public set strokeColor(value: SlugTextColor) {
			this._strokeColor = slugTextColorToRgba(value, this._strokeColor);
			// Stroke pass uses solid fill mode; only `aColor` per-vertex
			// changes when the color updates. The planner regenerates
			// the stroke quads with the new color and `_updateSlot`
			// rewrites the buffer in place.
			if (this._strokeWidth > 0) this._requestRebuild('fillVisual');
		}

		/** Stroke alpha mode: 'uniform' for uniform, 'gradient' for per-pixel fade. */
		public get strokeAlphaMode(): SlugStrokeAlphaMode {
			return this._strokeAlphaMode;
		}

		public set strokeAlphaMode(value: SlugStrokeAlphaMode) {
			if (this._strokeAlphaMode === value) return;
			this._strokeAlphaMode = value;
			// Alpha mode only flips the uniform write rule (uniform=0
			// for 'uniform', actual rate for 'gradient'). Geometry
			// unchanged.
			if (this._strokeWidth > 0) this._requestRebuild('strokeAlphaVisual');
		}

		/** Starting alpha for gradient mode (innermost stroke pixel). */
		public get strokeAlphaStart(): number {
			return this._strokeAlphaStart;
		}

		public set strokeAlphaStart(value: number) {
			if (this._strokeAlphaStart === value) return;
			this._strokeAlphaStart = value;
			if (this._strokeWidth > 0 && this._strokeAlphaMode === 'gradient') {
				this._requestRebuild('strokeAlphaVisual');
			}
		}

		/** Alpha change per pixel outward in gradient mode. */
		public get strokeAlphaRate(): number {
			return this._strokeAlphaRate;
		}

		public set strokeAlphaRate(value: number) {
			if (this._strokeAlphaRate === value) return;
			this._strokeAlphaRate = value;
			if (this._strokeWidth > 0 && this._strokeAlphaMode === 'gradient') {
				this._requestRebuild('strokeAlphaVisual');
			}
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
				: (Defaults.SlugText.StrokeColor as RgbaReadonly);
			const newColor = slugTextColorToRgba(value?.color, colorBase);
			const newAlphaMode = value?.alphaMode ?? Defaults.SlugText.StrokeAlphaMode;
			const newAlphaStart = numberValue(value?.alphaStart, Defaults.SlugText.StrokeAlphaStart);
			const newAlphaRate = numberValue(value?.alphaRate, Defaults.SlugText.StrokeAlphaRate);
			const widthChanged = this._strokeWidth !== newWidth;
			const colorChanged =
				this._strokeColor[0] !== newColor[0] ||
				this._strokeColor[1] !== newColor[1] ||
				this._strokeColor[2] !== newColor[2] ||
				this._strokeColor[3] !== newColor[3];
			const alphaChanged =
				this._strokeAlphaMode !== newAlphaMode ||
				this._strokeAlphaStart !== newAlphaStart ||
				this._strokeAlphaRate !== newAlphaRate;
			const changed = widthChanged || colorChanged || alphaChanged;
			this._strokeWidth = newWidth;
			this._strokeColor = newColor;
			this._strokeAlphaMode = newAlphaMode;
			this._strokeAlphaStart = newAlphaStart;
			this._strokeAlphaRate = newAlphaRate;
			if (!changed) return;
			// Aggregate stroke setter — degrade to the strictest sub-kind
			// among the fields that actually changed. Width crossing zero
			// (or any width change) forces full per §6; otherwise the
			// strict-kind merge in `_requestRebuild` combines color
			// (fillVisual) and alpha (strokeAlphaVisual) into 'full' if
			// both fired, which is correct — they touch different uniform
			// sets and the current incremental machinery handles only one
			// kind narrowing per batch.
			if (widthChanged) {
				this._requestRebuild('full');
			} else if (colorChanged && alphaChanged) {
				this._requestRebuild('full');
			} else if (colorChanged) {
				this._requestRebuild('fillVisual');
			} else {
				this._requestRebuild('strokeAlphaVisual');
			}
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
			const prev = this._dropShadow;
			if (value === null) {
				if (prev === null) return;
				this._dropShadow = null;
				// Disabling shadow removes the shadow pass entirely →
				// pass-shape change → full.
				this._requestRebuild('full');
				return;
			}
			// `_dropShadow.color` is already a concrete RGBA tuple, so
			// we can feed it back in as colorBase directly — the new
			// value keeps the current alpha when the input omits color
			// or uses a 6-digit / 3-element form.
			const colorBase = prev
				? prev.color
				: (Defaults.SlugText.DropShadowColor as RgbaReadonly);
			const next: SlugDropShadowResolved = {
				alpha: numberValue(value.alpha, Defaults.SlugText.DropShadowAlpha),
				angle: numberValue(value.angle, Defaults.SlugText.DropShadowAngle),
				blur: numberValue(value.blur, Defaults.SlugText.DropShadowBlur),
				color: slugTextColorToRgba(value.color, colorBase),
				distance: numberValue(value.distance, Defaults.SlugText.DropShadowDistance)
			};
			this._dropShadow = next;
			// Enabling a previously-disabled shadow → pass-shape change →
			// full. Blur / distance / angle changes alter per-vertex
			// dilation or mesh offset and need at minimum the planner
			// to regenerate shadow quads — also full. Only color / alpha
			// can ride the `'shadowVisual'` path.
			if (
				prev === null ||
				prev.blur !== next.blur ||
				prev.distance !== next.distance ||
				prev.angle !== next.angle
			) {
				this._requestRebuild('full');
			} else {
				this._requestRebuild('shadowVisual');
			}
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
