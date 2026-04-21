[![Toreda](https://content.toreda.com/logo/toreda-logo.png)](https://www.toreda.com)

[![GitHub package.json version (branch)](https://img.shields.io/github/package-json/v/toreda/pixi-slug/master?style=for-the-badge)](https://github.com/toreda/pixi-slug/releases/latest) [![GitHub Release Date](https://img.shields.io/github/release-date/toreda/pixi-slug?style=for-the-badge)](https://github.com/toreda/pixi-slug/releases/latest) [![GitHub issues](https://img.shields.io/github/issues/toreda/pixi-slug?style=for-the-badge)](https://github.com/toreda/pixi-slug/issues)

[![license](https://img.shields.io/github/license/toreda/pixi-slug?style=for-the-badge)](https://github.com/toreda/pixi-slug/blob/master/LICENSE)

# [`pixi-slug`](https://www.npmjs.com/package/pixi-slug)

Fast GPU-accelerated vector text for PixiJS. Crisp at any size, rotation, or 3D transform.

* No atlases or SDFs. Just Béziers on the GPU.
* Perspective-correct antialiasing via dynamic dilation.
* Supports TrueType (`.ttf`), OpenType (`.otf`), and WOFF/WOFF2 fonts — including cubic-outline (CFF) fonts.
* Word wrap, newlines, underline, and strikethrough.
* Works on PixiJS `v8`, `v7`, and `v6`.


&nbsp;
## FAQ
**Q: What does `pixi-slug` do?**

A: It harnesses the power of bézier curves and their fancy maths to draw super crisp text using the GPU via shaders. 


**Q: Is `pixi-slug` better than PIXI.Text?**

A: `pixi-slug` outperforms `PIXI.Text` in several specific situations, but *better* is use case dependent. Scenes with a small number of static `Text` objects won't see improvement. 

`SlugText` produces clear, crisp text for any resolution and can be resized with no performance hit.  See the performance section for a full comparison.


**Q: Does pixi-slug support CFF (cubic Bézier) fonts?**

A: Yes — cubic outlines are approximated as two quadratics per cubic segment, since the Slug algorithm operates on quadratic Béziers. Quality is indistinguishable at typical sizes; extreme zooms on cubic-heavy fonts may reveal the approximation."


**Q: Can I use both `pixi-slug` and `PIXI.Text` together?**

Yes they can be used together. `pixi-slug` doesn't replace or change `PIXI.Text`. You can use both together or just one. It's up to you. 

**Q: Why is it called `pixi-slug`?**

A: `pixi-slug` is a plugin for the [PIXI.js](https://pixijs.com/) game engine which draws text using the slug algorithm. Read more about Slug at [sluglibrary.com](https://sluglibrary.com/).



## Performance: `SlugText` vs `PIXI.Text`

`PIXI.Text` is generally costly to create or modify, but efficient to render.




&nbsp;
## Supported Versions

Default import targets PixiJS v8. PixiJS v7 and v6 are available as separate import paths.

# Examples

Every version has the same `SlugText` / `SlugFonts` API. Only the import path and the surrounding PIXI scaffolding change between `v6`, `v7`, and `v8`.

## Creating a `SlugText`

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

# Slug Reference Code

[Eric Lengyel](https://github.com/EricLengyel) created and patented the Slug algorithm. He published [reference code on Github](https://github.com/EricLengyel/Slug/tree/main).

# Testing

# Legal

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
