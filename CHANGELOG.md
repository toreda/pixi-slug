# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- v7: prod build failed with `TS2307: Cannot find module '@pixi/math'` because the alias was missing from `package.json` and `tsconfig.v7.json`. Added alongside the other v7 PIXI submodule aliases.
- v7: supersampling callback was missing in `text.ts`, so toggling `supersampling` / `supersampleCount` after construction did not propagate to the shader uniform group.
- v6/v7: matrix clone error in decoration texture fill builder.
- Decoration textures: UV transformation bug that caused incorrect scaling for the decoration rect only — glyphs sampled the texture correctly but the underline / strikethrough / overline rect was scaled differently.
- Resize handling: when the PIXI `Application` resized without a registered resize handler, viewport-dependent scaling on `SlugText` could go stale. The new application plugins install the handler.

## [0.1.1] - 2026-04-25

Initial release.

[Unreleased]: https://github.com/toreda/pixi-slug/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/toreda/pixi-slug/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/toreda/pixi-slug/releases/tag/v0.1.1
