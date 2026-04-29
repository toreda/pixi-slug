import type {SlugTextColor} from '../../color';

/**
 * Single color stop in a gradient. `offset` is normalized 0..1 along the
 * gradient axis (linear) or radius (radial). `color` accepts any of the
 * standard SlugText color forms.
 *
 * Stops do not need to be pre-sorted — the resolver sorts by offset
 * before baking the gradient LUT. Out-of-range offsets are clamped to
 * 0..1.
 */
export interface SlugFillGradientStop {
	offset: number;
	color: SlugTextColor;
}
