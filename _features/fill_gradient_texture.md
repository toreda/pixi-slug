# SlugText fill: gradient & texture support

Spec for the in-progress feature adding linear gradient, radial gradient, and texture fill modes to `SlugText`. Solid color (the existing fill mode) is preserved unchanged.

This document is the load-bearing context for any future session continuing the work. Read it end-to-end before touching code. The TODO checklist at the top reflects current state — check items off as you complete them, do not silently delete.

---

## TODO

- [x] Add `SlugFillGradient` / `SlugFillTexture` / `SlugFillGradientStop` / `SlugTextFill` / `SlugFillResolved` types under `src/shared/slug/text/style/fill/`
- [x] Extend `slugTextColorToRgba` with sibling `slugTextColorParse` returning `{rgba, rgbProvided, alphaProvided}` (legacy callers untouched)
- [x] Add `slugResolveFill` resolver + `slugFillRepresentativeColor` helper (`src/shared/slug/text/style/fill/resolve.ts`)
- [x] Replace `_color` in `base.ts` with `_fill: SlugFillResolved`; preserve `_color` as derived field from `slugFillRepresentativeColor(_fill)` for legacy readers; add `fill` getter/setter; widen `SlugTextStyleOptions.fill` type
- [x] Decoration resolver rewrite: per-channel stickiness (`colorRgb` / `colorAlpha` sticky) on the resolved decoration. Added `slugApplyFillToDecoration` helper called from `base._applyFillToDecorations` in the fill / color setters. `slugResolveDrawDecoration` now folds per-channel inheritance from the fill representative color
- [x] ~~Compute glyph-only fill bbox in shared layout~~ **Computed at rebuild time in v8 text.ts**, before the fill mesh is built (was previously after). bbox is a `Rectangle` in pixel space, used both for `boundsArea` and as `uFillBoundsPx` uniform for the vertex shader
- [x] ~~Add `aFillUV` per-vertex attribute to glyph quads.~~ **Replaced by `uFillBoundsPx` vertex-shader uniform** — see the "Decision: bbox UV via vertex-shader uniform" entry below. Quad layout stays at 20 floats; `src/constants.ts` and `src/shared/slug/glyph/quad.ts` are not modified
- [x] Bake gradient LUT (256×1 RGBA8 `Uint8Array`) from resolved gradient stops. New file: `src/shared/slug/text/style/fill/lut.ts`. Caller wraps into a per-version PIXI Texture.
- [x] Update vertex shader: added `uFillBoundsPx` uniform (vec4 `[minX, minY, width, height]`); compute `vFillUV = (p - minXY) / max(sizeXY, vec2(1.0))` from the post-dilation object/model-space position and forward to fragment. File: `src/shared/shader/slug/vert.glsl`
- [x] Update fragment shader: added `vFillUV` input + uniforms (`uFillMode`, `uFillParams0`, `uFillGradient`, `uFillTexture`, `uFillTextureXform`); helper `slugFillColor()` branches the fill site. File: `src/shared/shader/slug/frag.glsl`
- [x] Wire fill uniforms in v8: `src/v8/slug/shader.ts` (uniforms + sampler resources, `slugShader` accepts a `fallbackWhite` Texture), `src/v8/slug/font/gpu.ts` (1×1 white fallback texture cached in the font GPU cache), `src/v8/slug/text.ts` (bbox computed from fill quads before mesh creation, `_fillGpu` lifecycle managed across rebuilds and destroy). New helper: `src/v8/slug/fill/gpu.ts`
- [x] v8 decoration parity: `slugBuildDecorationFill` constructs PIXI v8 `FillGradient` / `FillPattern` sized to the decoration rect; `Graphics.fill({fill, alpha})` applies it whenever the resolved fill is non-solid AND the decoration's `colorRgb` is null (RGB inherits). New helper: `src/v8/slug/decoration/fill.ts`
- [x] Tests: `tests/shared/slug/text/style/fill/resolve.spec.ts`, `lut.spec.ts`, `decoration_sticky.spec.ts`. 703 total tests pass (was 661 before the feature)
- [ ] **Checkpoint** — verify v8 visually before porting. User will do this manually
- [ ] Wire fill uniforms in v7 (mirror v8). v7 has its own copy of `vert.glsl` at `src/v7/shader/slug/vert.glsl` that needs the same `uFillBoundsPx` + `vFillUV` patch. Refactor may be required if v7's uniform model can't accept the same shape; document any divergence here
- [ ] Wire fill uniforms in v6 (mirror v8). v6 uses the shared shaders so no GLSL change needed beyond what's already in `src/shared/shader/slug/`. Same caveat as v7 for the uniform model
- [ ] Async texture loading: URL strings, base64 data URIs, and ImageBitmap sources for `SlugFillTexture.source`. The shared resolver currently accepts these but the v8 GPU helper duck-types only PIXI Texture instances; non-Texture sources fall back to solid. Follow-up after the v6/v7 ports — pattern mirrors font async loading in `base.ts:151-168`

---

## Goals

1. Add gradient and texture fill modes to `SlugText`, callable through the same `fill` option that already accepts solid colors. PIXI v8's `TextStyle.fill` shape is the spiritual model — we accept similar input but resolve through our own pipeline (no PIXI render-graph coupling).
2. Existing solid-color callers must keep working with no behavior change.
3. Decorations (underline / strikethrough / overline) inherit the fill — including gradients and textures — unless the user explicitly sets a decoration color. Per-channel stickiness on decorations: setting `underline.alpha = 0.5` then later setting `fill = '#FF0000'` (no alpha) keeps the decoration alpha at 0.5; setting `fill = [255,0,0,0.9]` (explicit alpha) overrides decoration alpha to 0.9.
4. Land v8 first (per project policy in `CLAUDE.md`); v6/v7 ports follow only after v8 is verified working.

---

## Decisions

### API: discriminated union on `fill`, mutually exclusive modes

Single `fill` field accepts `SlugTextColor | SlugFillGradient | SlugFillTexture`. The user picks one of solid / gradient / texture per text instance — they do not combine.

**Why mutually exclusive:**
- Single fragment shader pass with one `uFillMode` branch — no compositing, no multi-pass, no perf regression vs. today.
- Combinable fills (color × gradient × texture) would require either shader compositing (per-pixel cost for unused modes) or multiple draw passes. Multi-pass is especially bad here because Slug's per-pixel work (band lookup, curve iteration, root finding) is the expensive part — running it 2× for compositing would roughly double GPU cost.
- Matches PIXI.Text mental model: `fill` is one thing.
- Gradient stops carry their own colors; layering a "base color" underneath is redundant.

**Why a single `fill` field over separate `fill` / `fillGradient` / `fillTexture`:**
- TypeScript narrows discriminated unions cleanly.
- Eliminates "what if user sets two of them?" ambiguity at the type level.
- Matches PIXI.Text exactly.

### Texture sources

`SlugFillTexture.source` accepts:
- **PIXI `Texture` instance** — primary case for shared/reused textures across the scene. Detected by duck-typing at the version-specific layer (presence of `source`/`baseTexture` + `width`/`height`). Shared code keeps the field as `unknown` and lets the version layer narrow.
- **URL string** (`http://`, `https://`, `/path`, `./path`) — async fetch + `createImageBitmap` → wrapped in PIXI Texture.
- **Base64 data URI** (`data:image/...;base64,...`) — same pipeline as URL but no fetch.
- **`ImageBitmap`** — wrapped directly (free addition since it's the intermediate form).

Skipping `HTMLImageElement` and `HTMLCanvasElement` — agreed they're rare for text fill and add type surface for no real benefit.

**Async loading model:** mirrors font loading (`base.ts:151-168`). URL/base64 sources kick off a load, render with a fallback during loading, rebuild when ready.

**Version coupling:** the version-specific `Texture` shape forces `SlugFillTexture` to be loosely typed in shared code (`unknown`). Version layer narrows.

### Decoration parity: PIXI Graphics fill, not Slug-shader quads

**Critical finding:** decorations are currently rendered as a PIXI `Graphics` object, not as Slug-shader meshes. They share the scene graph but not the GPU pipeline (`src/v8/slug/text.ts:295-356`).

**Implication:** decorations cannot sample the same gradient/texture uniforms as glyph fill — they're not on the Slug fragment shader.

**Decision:** for this PR, decorations inherit the fill by building a parallel PIXI fill object (`FillGradient` / `FillPattern` / solid color) from the resolved `_fill` state and passing it to `Graphics.fill({fill: pixiFill})`. This produces visually equivalent (but not pixel-identical) gradients on decorations vs. glyphs — PIXI's gradient renderer interpolates differently than our LUT.

**Deferred:** if visual divergence is unacceptable, a follow-up PR rewrites decoration rendering as Slug-shader quads (with their own `aFillUV` against the text bbox). That's a larger refactor (touches `Graphics` ownership, decoration draw geometry generation, all three PIXI versions) and is **explicitly out of scope** for this PR. User will decide after seeing v8 working.

### Per-channel decoration stickiness

Each decoration tracks two independent sticky bits: `rgbSticky` and `alphaSticky`. Set when the user explicitly provides RGB or alpha for that decoration.

Each fill update tracks the same two bits at parse time (`slugTextColorParse` returns `rgbProvided`, `alphaProvided`).

**Resolution rule on every fill change:**
- If fill explicitly provides RGB → clear all decorations' `rgbSticky`.
- If fill explicitly provides alpha → clear all decorations' `alphaSticky`.
- On re-resolve: each channel uses the decoration's sticky value if set, otherwise inherits from fill.

**Walkthrough:**

| Scenario | Sequence | Result |
| --- | --- | --- |
| 1 | `underline.alpha = 0.5`, then `fill = '#FF0000'` (RGB only) | RGB inherits `[1,0,0]`; alpha sticky stays `0.5` → underline `[1,0,0,0.5]` |
| 2 | `underline.alpha = 0.5`, then `fill = [255,0,0,0.9]` (RGB + alpha) | Fill clears alpha sticky; both inherit → underline `[1,0,0,0.9]` |

**Provenance flag mapping:**
- 6-digit hex / 3-element array → `rgbProvided=true, alphaProvided=false`
- 8-digit hex / 4-element array / 8-digit-number → `rgbProvided=true, alphaProvided=true`
- Gradient input → both `true` (gradient stops define both rgb and alpha)
- Texture input → both `true` (texture pixels define both)
- `null` / `undefined` / invalid → both `false`

### Gradient LUT (1D color lookup table)

Gradient stops are baked CPU-side into a 256×1 RGBA8 typed array, wrapped as a PIXI Texture, and sampled per-fragment in the shader.

**Why LUT over per-stops shader loop:**
- Unlimited stops at zero shader cost (one texture sample).
- ~1 KB memory per gradient.
- Predictable ALU cost regardless of stop count.

**Linear interpolation:** between adjacent stops, RGB interpolated in straight (not premultiplied) RGBA. This is sRGB-naive — fine for the sRGB → display path PIXI uses by default. If gamma-correct gradient interpolation is needed later, that's a follow-up.

**Stop sorting:** the resolver sorts stops by `offset` ascending and clamps to `0..1`. At least 2 stops required.

### Coordinate space for gradients

Default: `'normalized'` — `start` / `end` / `center` coordinates are 0..1 across the text bbox. `[0,0]` = top-left, `[1,1]` = bottom-right.

Alternative: `'local'` — pixels relative to bbox top-left. Useful when the gradient should stay fixed regardless of text length.

### Fill bbox

Computed in shared layout from `boxWidth` (post-wrap, post-justify) and `lines.length * lineHeight`. Glyph quads only — decorations are out of scope per the "decoration parity via PIXI fills" decision (decorations apply their own PIXI fill against their own Graphics geometry).

v8 already computes a similar bbox post-fact for `boundsArea` (`src/v8/slug/text.ts:267-278`); refactor so the bbox is computed once in shared layout and reused for both `boundsArea` and `aFillUV`.

### Per-vertex attribute layout: unchanged at 20 floats

**Reverted from earlier draft.** Initial plan was to add `aFillUV` (vec2) raising stride to 22 floats. Replaced by a vertex-shader uniform — see the next decision.

### Decision: bbox UV via vertex-shader uniform

Compute the bbox-relative UV in the **vertex shader** from the per-vertex screen position, using a `uFillBoundsPx` uniform supplied per-pass:

```glsl
uniform vec4 uFillBoundsPx;  // [minX, minY, width, height] in pixel space
out   vec2 vFillUV;

// in main(), after computing gl_Position:
vec2 pxPos = /* per-vertex pixel-space position, already in scope */;
vFillUV = (pxPos - uFillBoundsPx.xy) / max(uFillBoundsPx.zw, vec2(1.0));
```

**Why this beats the per-vertex attribute:**
- Quad layout, stride, geometry descriptors, and quad builder all stay untouched.
- One CPU-side bbox computation instead of writing UV into 4 vertices × N glyphs.
- Bbox can be updated independently of the geometry — useful if we ever want to animate the gradient sweep (change start/end without rebuilding).
- Smaller GPU memory footprint per text instance (no extra 8 bytes × vertex count).

**Cost:** the vertex shader does one subtract + one divide per vertex. Negligible.

**Bbox computation site:** v8 already computes a bbox post-fact ([src/v8/slug/text.ts:267-278](src/v8/slug/text.ts#L267-L278)) by walking fill vertex positions. The plan moves this *before* mesh construction so the bbox is available as a uniform when `_buildMesh` is called. The same bbox feeds both `this.boundsArea` and `uFillBoundsPx`.

For non-fill passes (stroke, shadow), `uFillMode = 0` makes the bbox irrelevant — but we still set it to a sensible value so debugging output is consistent.

### Stroke and shadow passes still use vertex color

Stroke and shadow passes set `uFillMode = 0` (solid). Their per-vertex `aColor` carries the stroke color or shadow color, and the shader uses `vColor` as today. This means stroke and shadow are never gradient/textured — they're always flat. If a future request asks for gradient strokes, that's additive work but doesn't break this design.

### Backward compatibility

- `color` getter preserved — returns the representative color from the resolved fill (gradient first stop, texture white, solid the actual color).
- `color` setter preserved — installs a solid fill.
- Old `_color` field still populated and read by the quad builder, stroke pass, and decoration inheritance. New `_fill` field carries the full resolved state.
- All existing callers of `slugTextColorToRgba` untouched.

---

## Architecture map

### Files added

```
src/shared/slug/text/style/fill.ts                    SlugTextFill umbrella union
src/shared/slug/text/style/fill/gradient.ts           SlugFillGradient (linear + radial)
src/shared/slug/text/style/fill/gradient/stop.ts      SlugFillGradientStop
src/shared/slug/text/style/fill/texture.ts            SlugFillTexture + SlugFillTextureSource
src/shared/slug/text/style/fill/resolved.ts           SlugFillResolved (internal state) + SlugFillResolvedGradientStop
src/shared/slug/text/style/fill/resolve.ts            slugResolveFill, slugFillRepresentativeColor
src/shared/slug/text/style/fill/lut.ts                [PENDING] gradient LUT baking
src/v8/slug/decoration/fill.ts                        [PENDING] PIXI fill object construction for decorations
_specs/fill_gradient_texture.md                       this document
```

### Files modified (so far)

```
src/shared/slug/text/style/color.ts   added SlugTextColorParse type and slugTextColorParse function; slugTextColorToRgba is now a thin wrapper
src/shared/slug/text/base.ts          added _fill field, fill getter/setter, threaded through initBase and color setter; _color now derived from _fill
src/shared/slug/text/init.ts          widened SlugTextStyleOptions.fill type from SlugTextColor to SlugTextFill
```

### Files needing modification (pending)

```
src/constants.ts                                stride 80 → 88, FLOATS_PER_VERTEX 20 → 22
src/shared/slug/glyph/quad.ts                   write aFillUV alongside other per-vertex attrs; needs fill bbox passed in
src/shared/shader/slug/vert.glsl                add aFillUV input, vFillUV output
src/shared/shader/slug/frag.glsl                add fill uniforms; branch fill site on uFillMode
src/v8/slug/shader.ts                           add uniforms to UniformGroup
src/v8/slug/font/gpu.ts                         add fill texture bindings to shader resources
src/v8/slug/text.ts                             add aFillUV to Geometry attributes; set fill uniforms per pass
src/v7/shader/slug/vert.glsl                    [check if exists; mirror shared changes if so]
src/v7/slug/shader.ts, font/gpu.ts, text.ts     mirror v8 — after v8 checkpoint
src/v6/slug/shader.ts, font/gpu.ts, text.ts     mirror v8 — after v8 checkpoint
src/shared/slug/text/style/decoration.ts        per-channel stickiness rewrite
```

### Folder convention

Per the project's folder structure rule (PascalCase split into nested lowercase folders, last word as filename, one export per file matching path):

- `SlugFillGradient` → `style/fill/gradient.ts` ✓
- `SlugFillGradientStop` → `style/fill/gradient/stop.ts` ✓
- `SlugFillTexture` → `style/fill/texture.ts` ✓
- `SlugTextFill` (the umbrella) → `style/fill.ts` (peer to `style/color.ts`) — exception precedent: `style/stroke/` exists but `SlugStroke` lives in `init.ts`, so the codebase already mixes patterns. Putting the umbrella as a peer file is the cleaner choice here.
- `SlugFillResolved` → `style/fill/resolved.ts` ✓ (internal type, not a public export)

---

## Shader plumbing detail

### New uniforms (fragment shader)

```glsl
uniform int       uFillMode;          // 0=solid (use vColor), 1=linear, 2=radial, 3=texture
uniform vec4      uFillBounds;        // text bbox: minX, minY, maxX, maxY (em-space)
uniform vec4      uFillParams0;       // linear: start.xy, end.xy
                                       // radial: center.xy, innerR, outerR
uniform sampler2D uFillGradient;      // 256x1 RGBA8 LUT, sampled by t in [0,1]
uniform sampler2D uFillTexture;       // user texture for kind=texture
uniform mat3      uFillTextureXform;  // texture coord transform (translate/scale/rotate)
```

### New varying (vertex → fragment)

```glsl
in vec2 aFillUV;     // vertex shader input
out vec2 vFillUV;    // → fragment shader; bbox-relative UV in 0..1
```

### Fragment shader fill site (replacing `vColor * coverage * alpha`)

```glsl
vec4 baseColor;
if (uFillMode == 0) {
    baseColor = vColor;
} else if (uFillMode == 1) {
    // linear: project vFillUV onto (uFillParams0.zw - uFillParams0.xy), normalize to t
    vec2 axis = uFillParams0.zw - uFillParams0.xy;
    float t = clamp(dot(vFillUV - uFillParams0.xy, axis) / dot(axis, axis), 0.0, 1.0);
    baseColor = texture(uFillGradient, vec2(t, 0.5));
} else if (uFillMode == 2) {
    // radial: distance from center, normalize between inner and outer radius
    float r = length(vFillUV - uFillParams0.xy);
    float t = clamp((r - uFillParams0.z) / max(uFillParams0.w - uFillParams0.z, 1e-6), 0.0, 1.0);
    baseColor = texture(uFillGradient, vec2(t, 0.5));
} else {
    vec2 uv = (uFillTextureXform * vec3(vFillUV, 1.0)).xy;
    baseColor = texture(uFillTexture, uv);
}
fragColor = baseColor * coverage * alpha;
```

### Pass-by-pass uniform setting (v8 fill pass)

```ts
// fill pass
uniforms.uFillMode = fill.kind === 'solid' ? 0
                  : fill.kind === 'linear-gradient' ? 1
                  : fill.kind === 'radial-gradient' ? 2 : 3;
uniforms.uFillBounds = [bbox.minX, bbox.minY, bbox.maxX, bbox.maxY];
// ... per-mode params + LUT/texture binding

// stroke and shadow passes
uniforms.uFillMode = 0;  // always solid for stroke/shadow
```

---

## Open questions for the next session

1. **Sampler binding in v8 UniformGroup.** I haven't confirmed whether v8's `UniformGroup` accepts dynamically-swappable samplers (different gradient LUTs per text instance) or whether each sampler must be bound at shader construction. Investigate before starting v8 wiring.
2. **Gradient LUT lifecycle.** Each text instance with a gradient produces its own 256-byte LUT. When does it get destroyed? On `fill` change → old LUT garbage. On `text.destroy()` → all LUTs garbage. Need a cleanup hook.
3. **v6/v7 fragment shader divergence.** The shared `frag.glsl` is used across all three versions. v7 has a separate `vert.glsl` (per the agent report). Confirm whether the fragment shader is truly shared or whether each version compiles its own. Affects how shader changes propagate.
4. **Decoration sticky state representation.** The current `SlugTextDecorationResolved.color: SlugTextColorRgba | null` doesn't track separate RGB / alpha provenance. Two implementation options:
   - Replace `color` with `colorRgb: [r,g,b] | null` + `colorAlpha: number | null` — cleanest semantic match.
   - Keep `color` but add side flags `rgbSticky` / `alphaSticky`. Easier mechanical change, harder to reason about.
   Pick one and document.

---

## Out of scope (explicit)

- Decoration rendering as Slug-shader quads (Option (a) from the API discussion) — deferred to a follow-up PR pending visual review of the PIXI Graphics fill approach.
- Gamma-correct gradient interpolation — current LUT is straight RGBA.
- Gradient strokes / textured strokes — stroke pass stays flat-color.
- HTMLImageElement / HTMLCanvasElement texture sources — deemed unnecessary.
- Conic gradients, mesh gradients, or any non-linear/non-radial geometry.
