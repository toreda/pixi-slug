# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-05-13

### Added
* Incremental mesh rebuilding which significantly improves performance when only some of the characters in a `SlugText` string change, e.g. `12:01` -> `12:02`. The mesh is now only rebuilt for the changed characters instead of the full text object on change. Mesh rebuild behavior is unchanged when all characters change, e.g. `AAAA` -> `BBBB`.
  The interactive examples now have a live JS snippet that shows the actual code properties of the canvas text on screen.
* The demo pages now show a live code snippet preview that contains all the settings needed to recreate the text shown on screen including all styles. 

### Changed
* Reduced output bundle size from ~1200kb to ~900kb by removing `@toreda/strong-types` and `@toreda/verify`. Functions from both packages were either inlined or simple versions of used helpers were added to this project to eliminate the imports.
* Added `"fast-uri": ">=3.1.2"` to pnpm `overrides` to resolve `CVE-2026-6322`. `fast-uri` version `3.1.0` was pulled in as a transitive dependency by dev dependencies, butnever included in the output bundle and never used at runtime. 
* Refactored renderer `prewarm` init flow for `v8`. 

### Fixed
* Refactored several version specific files that were incorrectly shared between `v6` and `v7`, causing mixed version files in both `v6` and `v7` output bundles. Files importing version-specific PIXI code can't go in `shared` without those imports leaking into other version bundles. Some of the shared code which was imported between `v6` and `v7` was duplicated to maintain version isolation.

## [0.3.4] - 2026-05-07

### Fixed
* Published TypeScript declarations no longer fail to resolve `Rgba` / `RgbaReadonly` for consumers. The version index files (`dist/v{6,7,8}/index.d.ts`) shipped a broken `from '../rgba'` re-export — after the post-build flatten step moved the index up one directory, the path needed to be `'./rgba'` but the rewriter only handled `'../shared/'` and `'../defaults'`. The flatten script now rewrites all top-level `src/` siblings (`defaults`, `rgba`, `constants`).

## [0.3.3] -2026-05-06

### Fixed 
* `build:docs` no longer wipes out TS declaration files in `dist` when run after build steps. Doc build now calls the main build script unless the `--no-build` flag is provided, and it will use the existing `dist` content. 
* Added missing types that were wiped out due to `build:docs` issue.

## [0.3.2] - 2026-05-06

### Fixed
* v8: `SlugText` no longer flickers blank for one frame on every property mutation (`text`, `color`, `fontSize`, etc.), and no longer goes blank for several frames on the parallel-shader-compile slow path. The 0.3.0 split-phase rebuild tore down the previous frame's meshes synchronously inside `rebuild()` and re-attached new meshes on the next `onRender` tick, leaving a one-frame gap with zero rendered children. The previous attach state is now held over and flushed atomically only after the new meshes are added to the display list, so UIs that mutate text frequently (Y-axis tick labels during scale drag, FPS counters, render-stat overlays, tooltips) render without visible flicker.

### Performance
* Peak v8 SlugText GPU resource usage briefly doubles between `rebuild()` and the next attach — old meshes and new meshes coexist for one frame on the fast path, or for the duration of the parallel-compile wait on the slow path. A few KB of vertex data per SlugText at typical sizes; not a real concern but worth flagging for callers with very large text or hundreds of simultaneous mutations.

## [0.3.1] - 2026-05-06

### Fixed
* v8: `SlugText.width` and `SlugText.height` are now valid synchronously after `new SlugText(...)` and after every property setter that triggers a rebuild, matching v6/v7 and 0.2.0. The 0.3.0 split-phase rebuild deferred the `boundsArea` assignment to the first `onRender` tick, which broke the standard PIXI pattern of measuring a text node synchronously to size its parent (button widths, menu layout, tooltip sizing). The bounds rectangle is computed CPU-side during the plan phase, so exposing it does not interact with the parallel-compile path.

## [0.3.0] - 2026-05-06

### Added
* Configurable 'prewarm' feature that starts shader init as soon as possible. Defaults to `true` (active). The GPU needs to compile shaders on the first load or after changes to the project shaders, which causes the window to freeze while its doing that.
* Configurable parallel compilation for shader to reduce shader compilation time. Defaults to `true` (active), but gracefully falls back to non-parallel compilation when the required WebGL extension isnt available.

### Fixed
* Rendering artifacts appearing on specific characters like 'A', 'Z', and '#' at large font sizes. The bug was related to shader math where the epsilon value used by the quadratic solver. Artifacts did not appear on all glyphs and did not appear at font sizes below 90ish depending on screen resolution. 
* v8: `SlugText` no longer leaves orphaned mesh references after text changing its text content. This behavior was only in `v8` and didn't affect `v7`/`v6`. The impact was small but was effectively a memory leak that caused JS heap usage to grow slightly every time the content of a `SlugText` changed.
* The examples benchmark script used the wrong listener for GPU rendering causing the entire benchmark run to be 1 sample. 

### Changed
* Each unique glyph is now lazy loaded from font data instead of loading all glyphs at startup. Glyphs used one or more times still remain cached in memory for fast lookups until the font is unloaded. Switching from eager to lazy loading glyphs reduced startup time by loading a much smaller number of glyphs from the font at startup (depends on scene) instead of 1300+ glyphs every time the page reloads.

### Performance
* Refactored v8/slug/text.ts to reduce GC pressure by reusing several `Float32Array` arrays instead of allocating new arrays every call.

## [0.2.0] - 2026-04-30

### Added
- Text `justify` support added when when `align === 'justify'`, supporting `interword` and `inter-character`. `underline` and `overline` are drawn on above/below glyphs and spaces, but not empty space. Line offsets and max length applied to lines after positioning from justify & alignment. (`v6`, `v7`, `v8`).
- Text decoration: `underline` and `strikethrough` ported from `v8` to `v6` and `v7`. (`v6`, `v7`)
- Text decoration: `overline` on `SlugText`. (`v6`, `v7`, `v8`)
- Per-decoration `color`, `thickness`, `length`, and `align` overrides on `underline` / `strikethrough` / `overline`. Each accepts a boolean shorthand or an object with optional fields; omitted fields inherit from the text fill and the font metric.  (`v6`, `v7`, `v8`)
- `direction` text option on `SlugTextStyleOptions` (`'ltr'` / `'rtl'`, default `'ltr'`). Today only affects how decoration `start` / `end` alignment resolves; full RTL glyph layout (BiDi reordering, shaping, line fill direction) is planned as a separate feature. (`v6`, `v7`, `v8`)
- Gradient and texture fills on `SlugText.fill`: linear gradient, radial gradient, and texture (`stretch` / `repeat` / `clamp`) with configurable scale, offset, and filter. Decorations inherit the resolved fill via PIXI `FillGradient` / `FillPattern` so underlines and strikethroughs match the glyph fill when no explicit color is set. (`v6`, `v7`, `v8`)
- `SlugText.transformToUpperCase()` and `transformToLowerCase()` instance methods. Named `transform*` (not `toUpperCase` / `toLowerCase`) to distinguish from standard JS `string` API by mutating instead of returning a new string.
- `SlugApplicationPluginV6` / `SlugApplicationPluginV7` / `SlugApplicationPluginV8` — installs a resize hook on the PIXI `Application` so `SlugText` instances re-derive viewport-dependent state automatically. Resolves a class of stale-scale bugs after window resize.

### Changed
- v8 `rebuild` now reverse-iterates `_meshes` and pops each entry instead of reassigning the field to a fresh `[]`. Reduces per-rebuild GC pressure when text properties are mutated frequently.
- Drop-shadow render in v6/v7/v8 reads `alpha` / `angle` / `blur` / `distance` directly from the resolved `_dropShadow` record instead of re-applying `?? Defaults.SlugText.DropShadow*` fallbacks at the call site. Defaults are applied once in `base.ts` when the shadow is set; the render path now treats `_dropShadow` as fully resolved.
- Internal: `aliased` v6 and v7 PIXI submodules now include `@pixi/math` (`pixi-v6-math` / `pixi-v7-math`) in `package.json` `devDependencies` and the `tsconfig.v{6,7}.json` `paths` mapping. Required by the v6/v7 decoration fill helper.

### Fixed
- v8/v7/v6: SlugText `interactive` and `interactiveChildren` are now `false`. The `true` default was not intended which caused exceptions in certain specific hittest scenarios.
- v7: prod build failed with `TS2307: Cannot find module '@pixi/math'` because the alias was missing from `package.json` and `tsconfig.v7.json`. Added alongside the other v7 PIXI submodule aliases.
- v7: supersampling callback was missing in `text.ts`, so toggling `supersampling` / `supersampleCount` after construction did not propagate to the shader uniform group.
- v6/v7: matrix clone error in decoration texture fill builder.
- Decoration textures: UV transformation bug that caused incorrect scaling for the decoration rect only — glyphs sampled the texture correctly but the underline / strikethrough / overline rect was scaled differently.
- Resize handling: when the PIXI `Application` resized without a registered resize handler, viewport-dependent scaling on `SlugText` could go stale. The new application plugins install the handler.

## [0.1.1] - 2026-04-25

Initial release.

[Unreleased]: https://github.com/toreda/pixi-slug/compare/v0.3.4...HEAD
[0.3.4]: https://github.com/toreda/pixi-slug/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/toreda/pixi-slug/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/toreda/pixi-slug/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/toreda/pixi-slug/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/toreda/pixi-slug/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/toreda/pixi-slug/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/toreda/pixi-slug/releases/tag/v0.1.1
