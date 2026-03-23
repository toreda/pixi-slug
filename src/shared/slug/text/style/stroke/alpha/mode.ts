/**
 * Controls how alpha is applied across the stroke width.
 *
 * - `'uniform'`: Same alpha across the entire stroke width.
 * - `'gradient'`: Alpha changes per pixel from the inner edge outward,
 *    starting at `alphaStart` and changing by `alphaRate` per pixel.
 */
export type SlugStrokeAlphaMode = 'uniform' | 'gradient';
