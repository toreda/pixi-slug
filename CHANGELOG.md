# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Text `justify` support added when when `align === 'justify'`, supporting `interword` and `inter-character`. `underline` and `overline` are drawn on above/below glyphs and spaces, but not empty space. Line offsets and max length applied to lines after positioning from justify & alignment. (`v6`, `v7`, `v8`).
- Text decoration: `underline` and `strikethrough` ported from `v8` to `v6` and `v7`. (`v6`, `v7`)
- Text decoration: `overline` on `SlugText`. (`v6`, `v7`, `v8`)
- Per-decoration `color`, `thickness`, `length`, and `align` overrides on `underline` / `strikethrough` / `overline`. Each accepts a boolean shorthand or an object with optional fields; omitted fields inherit from the text fill and the font metric.  (`v6`, `v7`, `v8`)
- `direction` text option on `SlugTextStyleOptions` (`'ltr'` / `'rtl'`, default `'ltr'`). Today only affects how decoration `start` / `end` alignment resolves; full RTL glyph layout (BiDi reordering, shaping, line fill direction) is planned as a separate feature. (`v6`, `v7`, `v8`)
- Shared example sidebar at `examples/_shared/` consumed by all three per-version demo pages. Adds collapsible sections, per-decoration controls, and direction selector. (examples for `v6`, `v7`, `v8`)

### Changed
- `package.json` `license` field simplified from `(MIT AND Apache-2.0)` to `MIT`. The bundled Apache-2.0 Roboto fallback font remains attributed in `NOTICES`. Resolves a "license can't be determined" rendering on the shields.io license badge.
- README badges: added GitHub stars and NPM monthly downloads badges. Removed the self-referential npm link on the `pixi-slug` title.

## [0.1.1] - 2026-04-25

Initial release.

[Unreleased]: https://github.com/toreda/pixi-slug/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/toreda/pixi-slug/releases/tag/v0.1.1
