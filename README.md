
[![Toreda](https://content.toreda.com/logo/toreda-logo.png)](https://www.toreda.com)

[![GitHub package.json version (branch)](https://img.shields.io/github/package-json/v/toreda/pixi-slug/master?style=for-the-badge)](https://github.com/toreda/pixi-slug/releases/latest) [![GitHub Release Date](https://img.shields.io/github/release-date/toreda/pixi-slug?style=for-the-badge)](https://github.com/toreda/pixi-slug/releases/latest) [![GitHub issues](https://img.shields.io/github/issues/toreda/pixi-slug?style=for-the-badge)](https://github.com/toreda/pixi-slug/issues)

 [![license](https://img.shields.io/github/license/toreda/pixi-slug?style=for-the-badge)](https://github.com/toreda/pixi-slug/blob/master/LICENSE)

# pixi-slug
GPU-based font rendering for [pixi.js](https://pixijs.com/) using Bézier curves.

Read more about Slug at [sluglibrary.com](https://sluglibrary.com/).

## Supported Versions

Default import targets PixiJS v8. PixiJS v7 and v6 are available as separate import paths.

**TypeScript**
```typescript
import { SlugText } from 'pixi-slug';      // v8 (default)
import { SlugText } from 'pixi-slug/v7';   // v7
import { SlugText } from 'pixi-slug/v6';   // v6
```

**JavaScript**
```javascript
const { SlugText } = require('pixi-slug');      // v8 (default)
const { SlugText } = require('pixi-slug/v7');   // v7
const { SlugText } = require('pixi-slug/v6');   // v6
```

#  Examples

## `Pixi` `v8`

## `Pixi` `v7`

## `Pixi` `v6`

# Slug Reference Code

[Eric Lengyel](https://github.com/EricLengyel) is the author of the Slug algorithm. He has published algorithm [reference code](https://github.com/EricLengyel/Slug/tree/main) via Github. 

# Testing

# Legal

Eric Lengyel created the patented slug algorithm in 2016. He graciously released it into the public domain for free in 2026. [`pixi-slug`](https://www.npmjs.com/package/pixi-slug) is a TypeScript port of his work to add gpu-based font rendering to [pixi.js](https://pixijs.com/).

 
`pixi-slug` is not affiliated with, or endorsed by Eric Lengyel.

## License
[MIT](LICENSE) &copy; Toreda, Inc.


## Copyright
Copyright &copy; 2026 Toreda, Inc. All Rights Reserved.


## Website
Toreda's website can be found at [toreda.com](https://www.toreda.com)