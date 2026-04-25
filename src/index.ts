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
export {
	slugFontErrorRaise,
	SlugFontErrorPolicy,
	SlugFontErrorCase,
	isSlugFontErrorMode,
	SLUG_FONT_ERROR_MODES,
	SlugFontErrorMode
} from './shared/slug/fonts/error';
export {SlugTextStyleAlign} from './shared/slug/text/style/align';
export type {SlugStrokeAlphaMode} from './shared/slug/text/style/stroke/alpha/mode';
