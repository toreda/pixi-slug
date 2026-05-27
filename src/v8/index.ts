import './slug/fonts/ticker';
import './slug/fonts/prewarm-install';
export {Defaults} from '../defaults';
export {SlugFont} from '../shared/slug/font';
export {SlugFonts} from '../shared/slug/fonts';
export {SlugText} from './slug/text';
export {MathText} from './slug/math';
export {mathBuilder} from '../shared/slug/math';
export type {
	MathNode,
	MathNodeKind,
	MathNodeStyle,
	MathBuilder,
	MathInput,
	MathTextInit,
	MathTextStyleOptions
} from '../shared/slug/math';
export {SlugPipe} from './slug/pipe';
export {slugShader} from './slug/shader';
export {slugFontGpuV8} from './slug/font/gpu';
export type {SlugFontGpuV8} from './slug/font/gpu';
export {slugFontsAttachTickerV8} from './slug/fonts/ticker';
export {slugFontsInstallLoaderV8} from './slug/fonts/loader';
export {SlugApplicationPluginV8} from './slug/plugin';
export type {Rgba, RgbaReadonly} from '../rgba';
export type {SlugFontsRemoveResult} from '../shared/slug/fonts/remove';
