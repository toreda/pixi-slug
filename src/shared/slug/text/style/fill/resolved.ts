import type {Rgba} from '../../../../../rgba';

/**
 * Resolved gradient stop after parsing. `color` is a concrete RGBA tuple
 * (0..1), `offset` is sorted-and-clamped to 0..1.
 */
export interface SlugFillResolvedGradientStop {
	offset: number;
	color: Rgba;
}

/**
 * Internal fill state. The discriminator `kind` is set by
 * `slugResolveFill` from the user input. Render code branches on `kind`
 * to select the shader path; `'solid'` is the fast path identical to
 * the previous flat-color rendering.
 *
 * ## Provenance flags
 *
 * `rgbProvided` and `alphaProvided` track whether the user explicitly
 * specified each channel in the most recent fill update. Decorations
 * use these to maintain per-channel sticky overrides — a fill update
 * only invalidates a decoration's sticky channel if the fill itself
 * explicitly set that channel.
 *
 *  - 6-digit hex / 3-element array → `rgbProvided=true, alphaProvided=false`
 *  - 8-digit hex / 4-element array → `rgbProvided=true, alphaProvided=true`
 *  - Gradient → both true (gradient stops define both rgb and alpha)
 *  - Texture → both true (texture pixels define both)
 */
export type SlugFillResolved =
	| {
			kind: 'solid';
			color: Rgba;
			rgbProvided: boolean;
			alphaProvided: boolean;
	  }
	| {
			kind: 'linear-gradient';
			stops: SlugFillResolvedGradientStop[];
			start: [number, number];
			end: [number, number];
			coordinateSpace: 'normalized' | 'local';
			rgbProvided: true;
			alphaProvided: true;
	  }
	| {
			kind: 'radial-gradient';
			stops: SlugFillResolvedGradientStop[];
			center: [number, number];
			innerRadius: number;
			outerRadius: number;
			coordinateSpace: 'normalized' | 'local';
			rgbProvided: true;
			alphaProvided: true;
	  }
	| {
			kind: 'texture';
			source: unknown;
			fit: 'stretch' | 'repeat' | 'clamp';
			scale: [number, number];
			offset: [number, number];
			filter: 'linear' | 'nearest';
			rgbProvided: true;
			alphaProvided: true;
	  };
