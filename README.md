[![Toreda](https://content.toreda.com/logo/toreda-logo.png)](https://www.toreda.com)

[![GitHub package.json version (branch)](https://img.shields.io/github/package-json/v/toreda/pixi-slug/master?style=for-the-badge)](https://github.com/toreda/pixi-slug/releases/latest) [![GitHub Release Date](https://img.shields.io/github/release-date/toreda/pixi-slug?style=for-the-badge)](https://github.com/toreda/pixi-slug/releases/latest) [![GitHub issues](https://img.shields.io/github/issues/toreda/pixi-slug?style=for-the-badge)](https://github.com/toreda/pixi-slug/issues)

[![license](https://img.shields.io/github/license/toreda/pixi-slug?style=for-the-badge)](https://github.com/toreda/pixi-slug/blob/master/LICENSE)

# [`pixi-slug`](https://www.npmjs.com/package/pixi-slug)

GPU-based font rendering for [pixi.js](https://pixijs.com/) using Bézier curves.

Read more about Slug at [sluglibrary.com](https://sluglibrary.com/).

## Supported Versions

Default import targets PixiJS v8. PixiJS v7 and v6 are available as separate import paths.

# Examples

## `Pixi` `v8`

```typescript
import {SlugText} from 'pixi-slug'; // v8 (default)
```

```javascript
const {SlugText} = require('pixi-slug'); // v8 (default)
```

## `Pixi` `v7`

```typescript
import {SlugText} from 'pixi-slug/v7'; // v7
```

```javascript
const {SlugText} = require('pixi-slug/v7'); // v7
```

## `Pixi` `v6`

```typescript
import {SlugText} from 'pixi-slug/v6'; // v6
```

```javascript
const {SlugText} = require('pixi-slug/v6'); // v6
```

# Slug Reference Code

[Eric Lengyel](https://github.com/EricLengyel) created and patented the Slug algorithm. He published [reference code on Github](https://github.com/EricLengyel/Slug/tree/main).

# Testing

# Legal

Eric Lengyel created the patented slug algorithm in 2016. He graciously released it into the public domain for free in 2026. [`pixi-slug`](https://www.npmjs.com/package/pixi-slug) is a TypeScript port of his work to add gpu-based font rendering to [pixi.js](https://pixijs.com/).

[`pixi-slug`](https://www.npmjs.com/package/pixi-slug) is not affiliated with, or endorsed by Eric Lengyel.

## License

[MIT](LICENSE) &copy; Toreda, Inc.

## Copyright

Copyright &copy; 2026 Toreda, Inc. All Rights Reserved.

## Website

Toreda's website can be found at [toreda.com](https://www.toreda.com)

Explore other open source packages by [toreda.com](https://www.toreda.com) designed to support generics and no runtime dependencies:

| Package                                                          | npm                                                                        | Description                                                                                                  |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [`@toreda/build-tools`](https://github.com/toreda/build-tools)   | [@toreda/build-tools](https://www.npmjs.com/package/@toreda/build-tools)   | Reusable helpers to simplify webpack and esbuild build pipelines.                                            |
| [`@toreda/cache`](https://github.com/toreda/cache)               | [@toreda/cache](https://www.npmjs.com/package/@toreda/cache)               | Generic TTL-based object caching.                                                                            |
| [`@toreda/fate`](https://github.com/toreda/fate)                 | [@toreda/fate](https://www.npmjs.com/package/@toreda/fate)                 | Typed result wrapper with built-in success, failure, and status context                                      |
| [`@toreda/lifecycle`](https://github.com/toreda/lifecycle)       | [@toreda/lifecycle](https://www.npmjs.com/package/@toreda/lifecycle)       | Phased async hooks for multi-step object flows                                                               |
| [`@toreda/log`](https://github.com/toreda/log)                   | [@toreda/log](https://www.npmjs.com/package/@toreda/log)                   | Zero-dependency logger for browser, Node, and Web Workers with pluggable transports and granular filtering.  |
| [`@toreda/strong-types`](https://github.com/toreda/strong-types) | [@toreda/strong-types](https://www.npmjs.com/package/@toreda/strong-types) | Self-validating types that eliminate boilerplate validation code                                             |
| [`@toreda/time`](https://github.com/toreda/time)                 | [@toreda/time](https://www.npmjs.com/package/@toreda/time)                 | Type-safe time units with built-in conversion, math operations, and input validation.                        |
| [`@toreda/types`](https://github.com/toreda/types)               | [@toreda/types](https://www.npmjs.com/package/@toreda/types)               | Expressive aliases & helpers that clarify code intent.                                                       |
| [`@toreda/verify`](https://github.com/toreda/verify)             | [@toreda/verify](https://www.npmjs.com/package/@toreda/verify)             | Runtime schema and type validation with recursive definitions, custom types, and detailed validation output. |
