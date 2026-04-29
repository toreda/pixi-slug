/**
 * Source for a fill texture. Accepted forms are duck-typed at the
 * version-specific layer because PixiJS's `Texture` shape differs across
 * v6/v7/v8 — shared code keeps the field as `unknown` and lets the
 * version layer narrow.
 *
 * Forms:
 *  - **PIXI Texture instance** — passed straight through to the GPU
 *    binding. Detected by duck-typing (presence of `source`/`baseTexture`
 *    + `width`/`height`).
 *  - **URL string** (`'http://...'`, `'/path.png'`, `'./path.png'`) —
 *    fetched, decoded via `createImageBitmap`, wrapped in a PIXI Texture.
 *  - **base64 data URI** (`'data:image/png;base64,...'`) — decoded
 *    inline; no network fetch.
 *  - **`ImageBitmap`** — wrapped in a PIXI Texture directly.
 */
export type SlugFillTextureSource = unknown;

/**
 * Texture-mapped fill applied across the full text bounding box. The
 * bounding box is the union of all glyph quads and decoration quads.
 *
 * ## Wrap mode
 *
 * - `'clamp'` (default): pixels outside 0..1 use the nearest edge.
 * - `'repeat'`: pixels tile.
 *
 * ## Filtering
 *
 * - `'linear'` (default): bilinear sampling.
 * - `'nearest'`: point sampling for pixel-art textures.
 *
 * ## Transform
 *
 * Optional 2D transform applied to the texture coordinates before
 * sampling: scale, then rotate (radians, around bbox center), then
 * translate (in normalized bbox space). Defaults are identity.
 */
export interface SlugFillTexture {
	type: 'texture';
	source: SlugFillTextureSource;
	wrap?: 'clamp' | 'repeat' | null;
	filter?: 'linear' | 'nearest' | null;
	scale?: readonly [number, number] | null;
	rotation?: number | null;
	translation?: readonly [number, number] | null;
}
