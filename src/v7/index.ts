import './slug/fonts/ticker';
import './slug/fonts/prewarm-install';
export {SlugFont} from '../shared/slug/font';
export {SlugFonts} from '../shared/slug/fonts';
export {SlugText} from './slug/text';
export {slugShader} from './slug/shader';
export {slugFontGpuV7} from './slug/font/gpu';
export type {SlugFontGpuV7} from './slug/font/gpu';
export {slugFontsAttachTickerV7} from './slug/fonts/ticker';
export {slugFontsInstallLoaderV7} from './slug/fonts/loader';
export {SlugApplicationPluginV7} from './slug/plugin';
export {isSlugFontErrorMode, SLUG_FONT_ERROR_MODES} from '../shared/slug/fonts/error';

export {slugFontErrorRaise} from '../shared/slug/font/error/raise';
export type {SlugFontErrorPolicy} from '../shared/slug/font/error/policy';
export type {SlugFontErrorCase} from '../shared/slug/font/error/case';
export type {SlugFontErrorMode} from '../shared/slug/font/error/mode';
export type {Rgba, RgbaReadonly} from '../rgba';
export type {SlugFontsRemoveResult} from '../shared/slug/fonts/remove';
export type {SlugFontEnsureResult, SlugSyntheticOutline, SlugSyntheticResult} from '../shared/slug/font';
export type {SlugGlyphData, SlugGlyphCurve} from '../shared/slug/glyph/data';
export type {SlugTextureAppendResult} from '../shared/slug/texture/pack';
export type {SlugFontLoadOptions, SlugFontsAttachTickerOptions} from '../shared/slug/fonts';
export type {SlugFontPreload, SlugFontPreloadOptions} from '../shared/slug/fonts/preload';
export {SlugFontsRegistry} from '../shared/slug/fonts/registry';
export {SlugFontsRegistryEntry} from '../shared/slug/fonts/registry/entry';
export type {SlugFontsRegistryOptions} from '../shared/slug/fonts/registry/options';
export type {SlugFontsRegistryStat} from '../shared/slug/fonts/registry/stat';
export {slugWoff2Decompress} from '../shared/slug/woff2/decompress';
export {slugFontSnap} from '../shared/slug/font/snap';
export {slugFontCapHeight} from '../shared/slug/font/cap/height';
export {slugTextureFloat16Encode} from '../shared/slug/texture/float16/encode';
export {slugTextureFloat16Decode} from '../shared/slug/texture/float16/decode';
export {slugTextureFloat16Round} from '../shared/slug/texture/float16/round';
export type {
	SlugTextInit,
	SlugTextFontInput,
	SlugTextFontRef,
	SlugTextStyleOptions,
	SlugStroke,
	SlugDropShadow,
	SlugDropShadowResolved
} from '../shared/slug/text/init';
export type {SlugTextColor} from '../shared/slug/text/style/color';
export type {SlugTextFill} from '../shared/slug/text/style/fill';
export type {SlugFillGradient} from '../shared/slug/text/style/fill/gradient';
export type {SlugFillGradientStop} from '../shared/slug/text/style/fill/gradient/stop';
export type {SlugFillTexture, SlugFillTextureSource} from '../shared/slug/text/style/fill/texture';
export type {SlugFillResolved, SlugFillResolvedGradientStop} from '../shared/slug/text/style/fill/resolved';
export type {
	SlugTextDecoration,
	SlugTextDecorationInput,
	SlugTextDecorationAlign,
	SlugTextDecorationResolved
} from '../shared/slug/text/style/decoration';
export type {SlugTextStyleAlign} from '../shared/slug/text/style/align';
export type {SlugTextJustify} from '../shared/slug/text/style/justify';
export type {SlugTextDirection} from '../shared/slug/text/style/direction';
export type {SlugStrokeAlphaMode} from '../shared/slug/text/style/stroke/alpha/mode';
