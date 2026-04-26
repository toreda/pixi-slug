// Default export targets PixiJS v8
export {
	SlugFont,
	SlugText,
	SlugPipe,
	SlugFonts,
	slugFontGpuV8,
	SlugFontGpuV8,
	SlugApplicationPluginV8
} from './v8/index';
export {SlugFontsRegistry} from './shared/slug/fonts/registry';
export {slugWoff2Decompress} from './shared/slug/woff2/decompress';
export {isSlugFontErrorMode, SLUG_FONT_ERROR_MODES} from './shared/slug/fonts/error';
export {SlugTextStyleAlign} from './shared/slug/text/style/align';
export type {SlugStrokeAlphaMode} from './shared/slug/text/style/stroke/alpha/mode';
export {slugFontErrorRaise} from './shared/slug/font/error/raise';
export {SlugFontErrorPolicy} from './shared/slug/font/error/policy';
export {SlugFontErrorCase} from './shared/slug/font/error/case';
export {SlugFontErrorMode} from './shared/slug/font/error/mode';
