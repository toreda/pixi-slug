import type {SlugTextColor} from './color';
import type {SlugFillGradient} from './fill/gradient';
import type {SlugFillTexture} from './fill/texture';

/**
 * Public input type for `SlugText.fill`. A discriminated union: either a
 * solid color (any of the existing `SlugTextColor` forms — hex string,
 * hex number, or RGB/RGBA array), a linear/radial gradient, or a texture.
 *
 * Fill modes are mutually exclusive — a single text instance is filled
 * with exactly one of solid, gradient, or texture. Mode is determined by
 * the input shape: objects with a `type` field are gradient/texture;
 * everything else is parsed as a color.
 */
export type SlugTextFill = SlugTextColor | SlugFillGradient | SlugFillTexture;
