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
 *    *(Not yet supported by the synchronous v8 GPU helper — pre-load via
 *    `PIXI.Assets.load` and pass the resulting Texture for now.)*
 *  - **base64 data URI** (`'data:image/png;base64,...'`) — same caveat.
 *  - **`ImageBitmap`** — wrapped in a PIXI Texture.
 */
export type SlugFillTextureSource = unknown;

/**
 * Texture-mapped fill applied across the text bounding box.
 *
 * ## `fit` — how the texture maps onto the bbox
 *
 * - `'stretch'` (default): one copy stretched to fill the bbox. The
 *   texture's aspect ratio is *not* preserved; useful when you want the
 *   texture to span exactly the visible glyphs regardless of shape.
 * - `'repeat'`: the texture is rendered at its native pixel size
 *   (multiplied by `scaleX` / `scaleY`) and tiled in both axes from the
 *   bbox origin + offset. The natural choice for seamless materials.
 * - `'clamp'`: drawn once at native size × scale, anchored at the bbox
 *   origin + offset. Pixels outside the texture rect are transparent
 *   (text outside the texture's footprint shows nothing).
 *
 * ## `scaleX` / `scaleY`
 *
 * Independent X and Y scaling factors, in the texture's own pixel space.
 * `1` = native size; `2` = the texture appears 2× larger before tiling
 * (so 1 native copy now spans 2× the area); `0.5` = texture appears half
 * size (covers half the area / tiles twice as densely in `repeat` mode).
 * Default `1` for both.
 *
 * Negative values flip the texture along that axis. Zero is replaced
 * with 1 by the resolver to avoid division by zero in the shader.
 *
 * ## `offsetX` / `offsetY`
 *
 * X / Y offset in pixels, applied in texture-space *before* the wrap.
 * Positive `offsetX` shifts the texture right (so what was at x=10 now
 * appears at the bbox origin). Default `0` for both.
 *
 * ## `filter`
 *
 * Texture sampling filter:
 *  - `'linear'` (default) — bilinear interpolation, smooth.
 *  - `'nearest'` — point sampling, useful for pixel-art textures.
 */
export interface SlugFillTexture {
	type: 'texture';
	source: SlugFillTextureSource;
	fit?: 'stretch' | 'repeat' | 'clamp' | null;
	scaleX?: number | null;
	scaleY?: number | null;
	offsetX?: number | null;
	offsetY?: number | null;
	filter?: 'linear' | 'nearest' | null;
}
