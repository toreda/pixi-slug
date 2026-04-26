[![Toreda](https://content.toreda.com/logo/toreda-logo.png)](https://www.toreda.com)

[![GitHub package.json version (branch)](https://img.shields.io/github/package-json/v/toreda/pixi-slug/master?style=for-the-badge)](https://github.com/toreda/pixi-slug/releases/latest) [![GitHub Release Date](https://img.shields.io/github/release-date/toreda/pixi-slug?style=for-the-badge)](https://github.com/toreda/pixi-slug/releases/latest) [![GitHub issues](https://img.shields.io/github/issues/toreda/pixi-slug?style=for-the-badge)](https://github.com/toreda/pixi-slug/issues)

[![GitHub](https://img.shields.io/github/stars/toreda/pixi-slug?style=for-the-badge&logo=github&label=GitHub)](https://github.com/toreda/pixi-slug) [![NPM Downloads](https://img.shields.io/npm/dm/pixi-slug?style=for-the-badge&logo=npm&label=NPM)](https://www.npmjs.com/package/pixi-slug) [![license](https://img.shields.io/github/license/toreda/pixi-slug?style=for-the-badge&t=11)](https://github.com/toreda/pixi-slug/blob/master/LICENSE?t=122)

# `pixi-slug`

Fast GPU-accelerated vector text for PixiJS. Crisp at any size, rotation, or 3D transform.

* No atlases or SDFs. Just Béziers on the GPU.
* Perspective-correct antialiasing via dynamic dilation.
* Supports TrueType (`.ttf`), OpenType (`.otf`), and WOFF/WOFF2 fonts — including cubic-outline (CFF) fonts.
* Word wrap, newlines, underline, strikethrough, and overline.
* Works with PixiJS `v8`, `v7`, and `v6`.


&nbsp;
## FAQ

<blockquote><p align="left">Q: What does pixi-slug do?</p></blockquote>

**A**: It renders text using shaders.

<p align="center">· · ·</p>

<blockquote><p align="left">Q: Does pixi-slug replace PIXI.Text?</p></blockquote>

**A**: No, it doesn't replace or affect `PIXI.Text`. `pixi-slug` is a standalone plugin that uses its own `SlugText`.

<p align="center">· · ·</p>

<blockquote><p align="left">Q: Is pixi-slug a drop-in replacement for PIXI.Text?</p></blockquote>

**A**: Unfortunately no, it's not a drop-in replacement where you can just replace `new Text(...)` with `new SlugText(...)`. It's close but not identical.

<p align="center">· · ·</p>


<blockquote><p align="left">Q: What are the advantages of using pixi-slug instead of PIXI.Text?</p></blockquote>

**A:**
* Text is crisp & clear at any size.
* Changing font size or text scale after instantiation does not affect render quality.
* The same `SlugText` can be used on multiple resolutions.
* `SlugText` content changes have only a minimal impact on performance. Replacing text content several times per second (or more) doesn't create intense GC pressure the way `PIXI.Text` does.


Do these advantages matter for you? It depends on your use case. This package probably won't benefit you if:
* Your PIXI scenes have a small number of Text objects.
* Text rarely (or never) changes size or content.
* Your scene can afford to render text at a large base size & scale the text down to the target font size to guarantee clear rendering.

<p align="center">· · ·</p>

<blockquote><p align="left">Q: Can it render emojis?</p></blockquote>

**A**: Yes. Drawing emojis as text requires a font with emoji characters. Find one online, make one, or try one of these Google fonts:
* [Noto Sans Symbols 1](https://fonts.google.com/noto/specimen/Noto+Sans+Symbols?preview.script=Latn)
* [Noto Sans Symbols 2](https://fonts.google.com/noto/specimen/Noto+Sans+Symbols+2)

<p align="center">· · ·</p>

<blockquote><p align="left">Q: Does pixi-slug support CFF (cubic Bézier) fonts?</p></blockquote>

**A**: Yes — cubic outlines are approximated as two quadratics per cubic segment, since the Slug algorithm operates on quadratic Béziers. Quality is indistinguishable at typical sizes; extreme zooms on cubic-heavy fonts may reveal the approximation.

<p align="center">· · ·</p>

<blockquote><p align="left">Q: What font formats does it support?</p></blockquote>


**A**: `pixi-slug` supports stand web font formats: `ttf`, `otf`, `woff`, and `woff2`.


<p align="center">· · ·</p>

<blockquote><p align="left">Q: Are SVG fonts supported?</p></blockquote>


**A**: No, not currently. `pixi-slug` supports some of the same features as SVG while using standard web fonts, rather than SVG fonts specifically. There are no plans to add SVG support right now. If there's enough demand that may change.

<p align="center">· · ·</p>

<blockquote><p align="left">Q: Can I use both pixi-slug and PIXI.Text together?</p></blockquote>


**A**: Yes they can be used together. `pixi-slug` doesn't replace or change `PIXI.Text`. You can use both together or just one. It's up to you.

<p align="center">· · ·</p>

<blockquote><p align="left">Q: Why is it called pixi-slug?</p></blockquote>

**A**: `pixi-slug` is a plugin for the [PIXI.js](https://pixijs.com/) game engine which draws text using the slug algorithm. Read more about Slug at [sluglibrary.com](https://sluglibrary.com/).



## Features

| Feature                              |  v8  |  v7  |  v6  |
| ------------------------------------ | :--: | :--: | :--: |
| TTF (`.ttf`) fonts                    |  ✅  |  ✅  |  ✅  |
| OTF (`.otf`) (CFF) fonts              |  ✅  |  ✅  |  ✅  |
| WOFF (`.woff`) fonts                  |  ✅  |  ✅  |  ✅  |
| WOFF2 (`.woff2`) fonts                |  ✅  |  ✅  |  ✅  |
| URL string font loading (cached)     |  ✅  |  ✅  |  ✅  |
| Raw bytes (`ArrayBuffer`/`Uint8Array`) |  ✅  |  ✅  |  ✅  |
| `FontFace` input (PIXI asset loader) |  ✅  |  ✅  |  ✅  |
| Fallback font on load failure        |  ✅  |  ✅  |  ✅  |
| Hex color input (`#rrggbb[aa]`)      |  ✅  |  ✅  |  ✅  |
| Word wrap + newlines                 |  ✅  |  ✅  |  ✅  |
| Font ref counting + autoDestroy      |  ✅  |  ✅  |  ✅  |
| PIXI Ticker auto-hook                |  ✅  |  ✅  |  ✅  |
| Application plugin                   |  ✅  |  ✅  |  ✅  |
| Text decoration: `underline`           |  ✅  |  ✅  |  ✅  |
| Text decoration: `strikethrough`       |  ✅  |  ✅  |  ✅  |
| Text decoration: `overline`            |  ✅  |  ✅  |  ✅  |
| `text-align`                           |  ❌  |  ❌  |  ❌  |
| `text-justify`                         |  ❌  |  ❌  |  ❌  |
| `superscript`                          |  ❌  |  ❌  |  ❌  |
| `subscript`                            |  ❌  |  ❌  |  ❌  |
| `RTL` glyph support                    |  ❌  |  ❌  |  ❌  |

&nbsp;

# Examples

`pixi-slug` supports multiple versions by building & bundling a separate package for each of the three supported PIXI version (`v8`, `v7`, `v6`). PIXI's imports and API vary by version. All packages share core functionality but import paths and scaffolding differs by version. 

## Creating `SlugText`

`font` accepts a URL string, a registered name, a pre-built `SlugFont`, raw `ArrayBuffer` / `Uint8Array` bytes, or a `FontFace` returned by PIXI's asset loader. Strings that look like URLs are fetched and cached automatically.

### `Pixi` `v8`

```typescript
const {Application} = require('pixi.js');
const {SlugText} = require('pixi-slug');

const app = new Application();
await app.init({width: 800, height: 600});

const text = new SlugText({
    text: 'Hello Slug',
    font: 'https://cdn.example.com/roboto.ttf',
    options: {
        fontSize: 48,
        fill: [1, 1, 1, 1]
    }
});

app.stage.addChild(text);
```

### `Pixi` `v7`

```typescript
const {Application} = require('pixi.js');
const {SlugText} = require('pixi-slug/v7');

const app = new Application({width: 800, height: 600});

const text = new SlugText({
    text: 'Hello Slug',
    font: 'https://cdn.example.com/roboto.ttf',
    options: {
        fontSize: 48,
        fill: [1, 1, 1, 1]
    }
});

app.stage.addChild(text);
```

### `Pixi` `v6`

```typescript
const {Application} = require('pixi.js');
const {SlugText} = require('pixi-slug/v6');

const app = new Application({width: 800, height: 600});

const text = new SlugText({
    text: 'Hello Slug',
    font: 'https://cdn.example.com/roboto.ttf',
    options: {
        fontSize: 48,
        fill: [1, 1, 1, 1]
    }
});

app.stage.addChild(text);
```

## Updating a `SlugText`

Mutate properties directly — `SlugText` rebuilds its geometry on change. This pattern is identical across v6, v7, and v8.

```typescript
text.text = 'Updated!';
text.fontSize = 72;
text.color = [1, 0.2, 0.2, 1];
text.wordWrap = true;
text.wordWrapWidth = 300;
text.font = await SlugFonts.from('https://cdn.example.com/inter.ttf');
```


## Colors

Every `SlugText` color field — `fill`, stroke color, drop shadow color, and the setter equivalents (`text.color`, `text.strokeColor`) — accepts the same flexible input set: hex strings, hex numbers, or numeric arrays.

```typescript
text.color = '#FF0000';           // 6-digit hex, preserves existing alpha
text.color = '0xFF0000AA';        // 8-digit hex string, alpha 0xAA
text.color = '#F00';              // 3-digit shorthand, preserves alpha
text.color = '#F00F';             // 4-digit shorthand with alpha
text.color = '#80';               // 2-digit grayscale, preserves alpha
text.color = 0xFF0000;            // hex number ≤ 0xFFFFFF, preserves alpha
text.color = 0xFF0000CC;          // hex number > 0xFFFFFF, alpha from input
text.color = [1, 0, 0];           // 3-elem 0..1, preserves alpha
text.color = [1, 0, 0, 0.5];      // 4-elem 0..1
text.color = [255, 0, 0];         // 3-elem 0..255 (any element > 1 triggers 0..255 scale)
text.color = [255, 0, 0, 128];    // 4-elem 0..255
```

**Alpha-preservation rules:**
- Forms without an alpha component (2/3/6-digit hex, hex numbers ≤ `0xFFFFFF`, 3-element arrays) **preserve the existing alpha**.
- Forms with an alpha component (4/8-digit hex, hex numbers > `0xFFFFFF`, 4-element arrays) **set alpha from the input**.

**Array scale detection:** arrays are scanned before parsing. If every element is `≤ 1` the array is treated as already normalized (0..1). If any element is `> 1` the whole array is treated as 0..255. You cannot mix scales within a single array.

**Invalid input:** malformed hex strings, numbers out of range, or arrays with bad shapes log `console.error` and leave the existing color unchanged — `SlugText` never throws on a color parse failure.

Full specification: [_features/color_input.md](_features/color_input.md).

## Aliases

Bind a short name to a font URL inline at the `SlugText` construction site — no separate preload step. The first `SlugText` that references a given URL fetches and caches the font; subsequent references (by alias or URL) share the cached entry.

```typescript
// Tuple: [alias, url]
const title = new SlugText({
    text: 'Title',
    font: ['roboto', 'https://cdn.example.com/roboto.ttf'],
    options: {fontSize: 64}
});

// Equivalent object form
const body = new SlugText({
    text: 'Body text',
    font: {alias: 'roboto', url: 'https://cdn.example.com/roboto.ttf'}
});

// Once the alias is registered, later sites can reference it by name alone
const caption = new SlugText({
    text: 'Caption',
    font: 'roboto'  // alias lookup (string without URL characters)
});
```

**Alias resolution rules:**
- `font: 'roboto'` (bare string, no URL characters) → alias lookup. Miss is a `console.error` and the `SlugText` renders with the bundled fallback font.
- `font: 'roboto.ttf'` or `font: 'https://…'` → URL-sniffed and fetched. `.ttf`/`.otf`/`.woff`/`.woff2` extensions, `/`, `./`, `../`, `//`, `data:`, and `://` all trigger URL mode.
- `font: {alias}` / `font: [alias]` → pure alias lookup, same as the bare string form.
- `font: {url}` / `font: [url]` (URL-sniffed) → URL fetch; the URL itself doubles as the alias.
- `font: {alias, url}` / `font: [alias, url]` → fetch `url`, bind `alias` to the loaded font.

**Alias collision:** if `alias` is already registered to a different URL, the new binding is ignored — `console.error` is logged and the `SlugText` falls back. Call `SlugFonts.unregister('roboto')` before rebinding to a different URL.

### Preload pattern — register once, reference everywhere by alias

For apps that want fonts ready before any `SlugText` renders — e.g. a splash/loading screen or predictable typography across every view — call `SlugFonts` directly at startup. Every later `SlugText` can use the bare alias and resolves synchronously, with no fallback flash while a URL fetches.

```typescript
const {SlugFonts, SlugText} = require('pixi-slug'); // or '/v7' / '/v6'

// Preload at app startup — typically inside an async bootstrap function.
async function preloadFonts() {
    const roboto = await SlugFonts.fromUrl('https://cdn.example.com/roboto.ttf');
    const inter  = await SlugFonts.fromUrl('https://cdn.example.com/inter.ttf');

    SlugFonts.register('roboto', roboto);
    SlugFonts.register('inter',  inter);
}

await preloadFonts();

// Every SlugText created afterwards hits the registry synchronously.
// No URL fetch, no fallback font flash.
const title    = new SlugText({text: 'Dashboard', font: 'roboto', options: {fontSize: 64}});
const subtitle = new SlugText({text: 'Welcome back',           font: 'inter'});
const footer   = new SlugText({text: '© 2026 Acme Corp',       font: 'roboto'});
```

**Why this pattern?** The inline tuple/object forms (`['roboto', 'https://…']`) work fine, but the first `SlugText` that references a new URL fetches asynchronously — it renders with the fallback font until the real font loads, then swaps. Preloading sidesteps the flash entirely and keeps construction sites terse (`font: 'roboto'`).

If an alias is referenced before it's registered, the `SlugText` falls back to the bundled font and a `console.error` surfaces — so this pattern also acts as a startup sanity check.

## Loading fonts through PIXI's asset loader

`PIXI.Assets.load()` (v7/v8) returns a browser `FontFace`, which `SlugText` accepts directly. For more efficient loading — skip the intermediate `FontFace` and receive raw bytes — call the version-specific installer once at app startup:

```typescript
// v8
const {Assets} = require('pixi.js');
const {SlugText, slugFontsInstallLoaderV8} = require('pixi-slug');

slugFontsInstallLoaderV8();
const bytes = await Assets.load('roboto.ttf'); // now returns ArrayBuffer
const text = new SlugText({text: 'Hi', font: bytes});
```

```typescript
// v7
const {Assets} = require('pixi.js');
const {SlugText, slugFontsInstallLoaderV7} = require('pixi-slug/v7');

slugFontsInstallLoaderV7();
const bytes = await Assets.load('roboto.ttf');
const text = new SlugText({text: 'Hi', font: bytes});
```

```typescript
// v6 — PIXI.Loader can't be extended to return raw bytes; use the
// helper instead of `loader.add(url)` when the font is destined for SlugText.
const {SlugText, slugFontsFetchV6} = require('pixi-slug/v6');

const bytes = await slugFontsFetchV6('roboto.ttf');
const text = new SlugText({text: 'Hi', font: bytes});
```

## Integrating with `PIXI.Application`

The `SlugFonts` registry needs a ticker to run its auto-destroy sweep. Two ways to wire it up — pick whichever fits your app.

### Quick path — shared ticker

One call. Uses `Ticker.shared` in the background. Works even if you don't use `PIXI.Application` at all.

```typescript
const {slugFontsAttachTickerV8} = require('pixi-slug');
slugFontsAttachTickerV8();
```

Per-version exports: `slugFontsAttachTickerV6`, `slugFontsAttachTickerV7`, `slugFontsAttachTickerV8`.

### Plugin path — app lifecycle

Register a plugin so the registry follows one specific `Application`'s ticker and tears down cleanly on `app.destroy()`.

```typescript
// v8
const {Application, extensions} = require('pixi.js');
const {SlugApplicationPluginV8} = require('pixi-slug');

extensions.add(SlugApplicationPluginV8);
const app = new Application();
await app.init({width: 800, height: 600});
// ... later
app.destroy(); // ticker detaches, unused fonts freed immediately
```

v7 is identical with imports from `@pixi/core` and `pixi-slug/v7`:

```typescript
const {extensions} = require('@pixi/core');
const {SlugApplicationPluginV7} = require('pixi-slug/v7');
extensions.add(SlugApplicationPluginV7);
```

v6 uses the older registration surface:

```typescript
const {Application} = require('@pixi/app');
const {SlugApplicationPluginV6} = require('pixi-slug/v6');
Application.registerPlugin(SlugApplicationPluginV6);
```

**Conflict behavior:** both paths call `SlugFonts.attachTicker` under the hood. If one is already active and another tries to attach, `SlugFonts.reattachPolicy` decides what happens — `'throw'` by default, or `'error'` / `'warn'` / `'silent'`. Change it with `SlugFonts.setReattachPolicy('warn')` (validated — invalid modes are rejected and logged). Pass `{force: true}` as the second arg to `attachTicker` to replace silently. Full details in [_features/application_plugin.md](_features/application_plugin.md).

## Changelog

Release history and unreleased changes are tracked in [CHANGELOG.md](CHANGELOG.md).

## Slug Reference Code

[Eric Lengyel](https://github.com/EricLengyel) created and patented the Slug algorithm. He published [reference code on Github](https://github.com/EricLengyel/Slug/tree/main).


## Legal

Eric Lengyel created the patented slug algorithm in 2016. He graciously released it into the public domain for free in 2026. [`pixi-slug`](https://www.npmjs.com/package/pixi-slug) is a TypeScript port of his work to add gpu-based font rendering to [pixi.js](https://pixijs.com/).

[`pixi-slug`](https://www.npmjs.com/package/pixi-slug) is not affiliated with, or endorsed by Eric Lengyel.

## License

[MIT](LICENSE) &copy; Toreda, Inc.

Bundled third-party components (currently the Roboto fallback font, Apache-2.0) are attributed in [NOTICES](NOTICES).

## Website

Toreda's website can be found at [toreda.com](https://www.toreda.com)



## Toreda Open Source Packages
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
