import type {RgbaReadonly} from '../../../../../rgba';
import type {SlugTextFill} from '../fill';
import type {SlugFillGradient} from './gradient';
import type {SlugFillTexture} from './texture';
import type {SlugFillResolved, SlugFillResolvedGradientStop} from './resolved';
import {slugTextColorParse, slugTextColorToRgba, type SlugTextColorRgba} from '../color';

const PREFIX = '[SlugText:fill]';

function reportFillError(message: string): void {
	console.error(`${PREFIX} ${message}`);
}

/**
 * Detect whether an input is a discriminated fill object (gradient or
 * texture) versus a solid-color form. Solid colors are strings, numbers,
 * or numeric arrays; gradient/texture inputs are objects with a `type`
 * field.
 */
function isFillObject(input: unknown): input is SlugFillGradient | SlugFillTexture {
	if (input === null || typeof input !== 'object') return false;
	if (Array.isArray(input)) return false;
	const t = (input as {type?: unknown}).type;
	return t === 'linear-gradient' || t === 'radial-gradient' || t === 'texture';
}

function clamp01(n: number): number {
	if (!Number.isFinite(n)) return 0;
	if (n < 0) return 0;
	if (n > 1) return 1;
	return n;
}

function resolveStops(
	raw: readonly {offset: number; color: unknown}[]
): SlugFillResolvedGradientStop[] | null {
	if (!Array.isArray(raw) || raw.length < 2) {
		return null;
	}
	const out: SlugFillResolvedGradientStop[] = [];
	for (let i = 0; i < raw.length; i++) {
		const stop = raw[i];
		if (!stop || typeof stop !== 'object') return null;
		const offset = clamp01(stop.offset);
		const color = slugTextColorToRgba(stop.color as never, [1, 1, 1, 1]);
		out.push({offset, color});
	}
	out.sort((a, b) => a.offset - b.offset);
	return out;
}

function resolveLinearGradient(
	input: Extract<SlugFillGradient, {type: 'linear-gradient'}>
): SlugFillResolved | null {
	const stops = resolveStops(input.stops as readonly {offset: number; color: unknown}[]);
	if (!stops) {
		reportFillError(
			`Linear gradient requires at least 2 stops, each with {offset: number, color: SlugTextColor}.`
		);
		return null;
	}
	const start: [number, number] = input.start
		? [Number(input.start[0]) || 0, Number(input.start[1]) || 0]
		: [0, 0];
	const end: [number, number] = input.end
		? [Number(input.end[0]) || 0, Number(input.end[1]) || 0]
		: [1, 0];
	if (start[0] === end[0] && start[1] === end[1]) {
		reportFillError(`Linear gradient start and end points are identical — gradient direction is undefined.`);
		return null;
	}
	return {
		kind: 'linear-gradient',
		stops,
		start,
		end,
		coordinateSpace: input.coordinateSpace === 'local' ? 'local' : 'normalized',
		rgbProvided: true,
		alphaProvided: true
	};
}

function resolveRadialGradient(
	input: Extract<SlugFillGradient, {type: 'radial-gradient'}>
): SlugFillResolved | null {
	const stops = resolveStops(input.stops as readonly {offset: number; color: unknown}[]);
	if (!stops) {
		reportFillError(
			`Radial gradient requires at least 2 stops, each with {offset: number, color: SlugTextColor}.`
		);
		return null;
	}
	const center: [number, number] = input.center
		? [Number(input.center[0]) || 0, Number(input.center[1]) || 0]
		: [0.5, 0.5];
	const innerRadius = Number.isFinite(input.innerRadius as number) ? Number(input.innerRadius) : 0;
	const outerRadius = Number.isFinite(input.outerRadius as number) ? Number(input.outerRadius) : 0.5;
	if (outerRadius <= innerRadius) {
		reportFillError(
			`Radial gradient outerRadius (${outerRadius}) must be greater than innerRadius (${innerRadius}).`
		);
		return null;
	}
	return {
		kind: 'radial-gradient',
		stops,
		center,
		innerRadius,
		outerRadius,
		coordinateSpace: input.coordinateSpace === 'local' ? 'local' : 'normalized',
		rgbProvided: true,
		alphaProvided: true
	};
}

function resolveTexture(input: SlugFillTexture): SlugFillResolved | null {
	if (input.source === null || input.source === undefined) {
		reportFillError(`Texture fill requires a source (PIXI.Texture, URL string, base64 data URI, or ImageBitmap).`);
		return null;
	}
	const fit: 'stretch' | 'repeat' | 'clamp' =
		input.fit === 'repeat' || input.fit === 'clamp' ? input.fit : 'stretch';
	// Replace zero scale with 1 — the shader divides by scale, and a 0
	// would silently produce NaN/Inf UVs across every fragment. Negative
	// values are kept (they flip the texture along that axis).
	const sx = Number.isFinite(input.scaleX as number) ? Number(input.scaleX) : 1;
	const sy = Number.isFinite(input.scaleY as number) ? Number(input.scaleY) : 1;
	const ox = Number.isFinite(input.offsetX as number) ? Number(input.offsetX) : 0;
	const oy = Number.isFinite(input.offsetY as number) ? Number(input.offsetY) : 0;
	return {
		kind: 'texture',
		source: input.source,
		fit,
		scale: [sx === 0 ? 1 : sx, sy === 0 ? 1 : sy],
		offset: [ox, oy],
		filter: input.filter === 'nearest' ? 'nearest' : 'linear',
		rgbProvided: true,
		alphaProvided: true
	};
}

/**
 * Resolve a `fill` input into the internal `SlugFillResolved` state.
 *
 * Solid-color inputs (string / number / array) parse via the existing
 * color pipeline and produce `kind: 'solid'` with provenance flags.
 * Discriminated objects (`{type: 'linear-gradient' | 'radial-gradient'
 * | 'texture'}`) parse via the gradient/texture branches.
 *
 * On invalid input, logs an error and returns a `'solid'` fallback
 * built from `currentColor` — preserving prior behavior of
 * `slugTextColorToRgba` which never throws.
 */
export function slugResolveFill(
	input: SlugTextFill | null | undefined,
	currentColor: RgbaReadonly
): SlugFillResolved {
	if (isFillObject(input)) {
		const fill = input as SlugFillGradient | SlugFillTexture;
		let resolved: SlugFillResolved | null = null;
		if (fill.type === 'linear-gradient') {
			resolved = resolveLinearGradient(fill);
		} else if (fill.type === 'radial-gradient') {
			resolved = resolveRadialGradient(fill);
		} else if (fill.type === 'texture') {
			resolved = resolveTexture(fill);
		}
		if (resolved) return resolved;
		// Invalid gradient/texture — fall through to solid fallback below.
	}

	const parse = slugTextColorParse(input as never, currentColor);
	const fallback: SlugTextColorRgba = [
		parse.rgba[0],
		parse.rgba[1],
		parse.rgba[2],
		parse.rgba[3]
	];
	return {
		kind: 'solid',
		color: fallback,
		rgbProvided: parse.rgbProvided,
		alphaProvided: parse.alphaProvided
	};
}

/**
 * Extract a representative RGBA color from any resolved fill — used by
 * decoration inheritance when the decoration needs a flat color (e.g.,
 * a fill change updates a decoration whose own color is unset). For
 * gradient fills the first stop is used; for texture fills we fall
 * back to opaque white (the texture itself is what the decoration will
 * actually render against). Solid fills return their color directly.
 */
export function slugFillRepresentativeColor(fill: SlugFillResolved): SlugTextColorRgba {
	switch (fill.kind) {
		case 'solid':
			return [fill.color[0], fill.color[1], fill.color[2], fill.color[3]];
		case 'linear-gradient':
		case 'radial-gradient': {
			const stop = fill.stops[0];
			return [stop.color[0], stop.color[1], stop.color[2], stop.color[3]];
		}
		case 'texture':
			return [1, 1, 1, 1];
	}
}
