/**
 * Normalized RGBA color tuple. Each component is a number in `0..1`
 * (not `0..255`), matching the form used throughout pixi-slug after
 * user input has been parsed by `slugTextColorToRgba`.
 *
 * Use `RgbaReadonly` for parameter and field types where the callee
 * must not mutate the tuple (defaults, getters, parser inputs).
 */
export type Rgba = [number, number, number, number];

/** Read-only view of {@link Rgba}. */
export type RgbaReadonly = readonly [number, number, number, number];
