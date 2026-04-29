import type {SlugFillGradientStop} from './gradient/stop';

/**
 * Linear or radial color gradient applied across the full text bounding
 * box. The bounding box is the union of all glyph quads and decoration
 * quads — gradients span the entire visible artwork, not per-glyph.
 *
 * ## Coordinate spaces
 *
 * - `'normalized'` (default): start/end/center coordinates are 0..1 across
 *   the text bbox. `[0,0]` = top-left, `[1,1]` = bottom-right. Robust to
 *   text content changes — the gradient stretches with the text.
 * - `'local'`: coordinates are in pixels relative to the bbox top-left.
 *   Useful when gradient geometry should stay fixed regardless of text
 *   length.
 *
 * ## Linear gradient
 *
 * Color interpolates along the line from `start` to `end`. Pixels project
 * onto that line; the projection parameter t (clamped to 0..1) selects
 * the gradient color. Defaults: `start = [0, 0]`, `end = [1, 0]` (left
 * to right horizontal sweep across the text).
 *
 * ## Radial gradient
 *
 * Color interpolates from `innerRadius` (t=0) to `outerRadius` (t=1)
 * around `center`. Pixels inside `innerRadius` get the first stop;
 * pixels outside `outerRadius` get the last stop. Defaults:
 * `center = [0.5, 0.5]`, `innerRadius = 0`, `outerRadius = 0.5`.
 *
 * ## Stops
 *
 * At least 2 stops required. Stops do not need to be pre-sorted; the
 * resolver sorts by `offset` ascending and clamps offsets to 0..1.
 */
export type SlugFillGradient =
	| {
			type: 'linear-gradient';
			stops: readonly SlugFillGradientStop[];
			start?: readonly [number, number] | null;
			end?: readonly [number, number] | null;
			coordinateSpace?: 'normalized' | 'local' | null;
	  }
	| {
			type: 'radial-gradient';
			stops: readonly SlugFillGradientStop[];
			center?: readonly [number, number] | null;
			innerRadius?: number | null;
			outerRadius?: number | null;
			coordinateSpace?: 'normalized' | 'local' | null;
	  };
