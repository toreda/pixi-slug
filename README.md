[![Toreda](https://content.toreda.com/logo/toreda-logo.png)](https://www.toreda.com)

[![GitHub package.json version (branch)](https://img.shields.io/github/package-json/v/toreda/pixi-slug/master?style=for-the-badge)](https://github.com/toreda/pixi-slug/releases/latest) [![GitHub Release Date](https://img.shields.io/github/release-date/toreda/pixi-slug?style=for-the-badge)](https://github.com/toreda/pixi-slug/releases/latest) [![GitHub issues](https://img.shields.io/github/issues/toreda/pixi-slug?style=for-the-badge)](https://github.com/toreda/pixi-slug/issues)

[![GitHub](https://img.shields.io/github/stars/toreda/pixi-slug?style=for-the-badge&logo=github&label=GitHub)](https://github.com/toreda/pixi-slug) [![NPM Downloads](https://img.shields.io/npm/dm/pixi-slug?style=for-the-badge&logo=npm&label=NPM)](https://www.npmjs.com/package/pixi-slug) [![license](https://img.shields.io/github/license/toreda/pixi-slug?style=for-the-badge&t=11)](https://github.com/toreda/pixi-slug/blob/master/LICENSE?t=13)

# `pixi-slug`

Fast GPU-accelerated vector text for PixiJS. Crisp at any size, rotation, or 3D transform.

**[See Live demo →](https://toreda.github.io/pixi-slug/)**

* No atlases or SDFs. Just Béziers on the GPU.
* Supports TrueType (`.ttf`), OpenType (`.otf`), and WOFF/WOFF2 fonts — including cubic-outline (CFF) fonts.
* Word wrap, newlines, underline, strikethrough, overline, gradient fill, texture fill.
* Works with PixiJS `v8`, `v7`, and `v6`.

&nbsp;

# Contents
* [Features](#features)
* [FAQ](#faq)
* [Examples](#examples)
* [Troubleshooting](#troubleshooting)
* [Legal](#legal)


&nbsp;

# Features

## Core
| Feature                              |  `v8`  |  `v7`  |  `v6`  |
| ------------------------------------ | :--: | :--: | :--: |
| PIXI Ticker auto-hook                |  ✅  |  ✅  |  ✅  |
| Application plugin                   |  ✅  |  ✅  |  ✅  |
| Font auto-cleanup via ref counting & autoDestroy   |  ✅  |  ✅  |  ✅  |
| `superscript`                          |  ❌  |  ❌  |  ❌  |
| `subscript`                            |  ❌  |  ❌  |  ❌  |
| `WebGL1` support                      |  ❌  |  ❌  |  ❌  |
| `WebGL2` support                      |  ✅  |  ✅  |  ✅  |
| WebGL Prewarm & Parallel Shader Compile  |  ✅  |  ❌  |  ❌  |

&nbsp;
## Fonts
| Feature                              |  `v8`  |  `v7`  |  `v6`  |
| ------------------------------------ | :--: | :--: | :--: |
| TTF (`.ttf`) fonts                    |  ✅  |  ✅  |  ✅  |
| OTF (`.otf`) (CFF) fonts              |  ✅  |  ✅  |  ✅  |
| WOFF (`.woff`) fonts                  |  ✅  |  ✅  |  ✅  |
| WOFF2 (`.woff2`) fonts                |  ✅  |  ✅  |  ✅  |
| URL string font loading (cached)      |  ✅  |  ✅  |  ✅  |
| `RTL` fonts                           |  ❌  |  ❌  |  ❌  |
| Load font: raw bytes (`ArrayBuffer`/`Uint8Array`) |  ✅  |  ✅  |  ✅  |
| Load font: `FontFace` (PIXI asset loader) |  ✅  |  ✅  |  ✅  |
| Load font: fallback (roboto) on load failure        |  ✅  |  ✅  |  ✅  |

&nbsp;

## Style, Decorations, Formatting
| Feature                              |  `v8`  |  `v7`  |  `v6`  |
| ------------------------------------ | :--: | :--: | :--: |
| Word wrap + newlines                 |  ✅  |  ✅  |  ✅  |
| Hex color input (`#rrggbb[aa]`)      |  ✅  |  ✅  |  ✅  |
| Text decoration: `underline`         |  ✅  |  ✅  |  ✅  |
| Text decoration: `strikethrough`     |  ✅  |  ✅  |  ✅  |
| Text decoration: `overline`          |  ✅  |  ✅  |  ✅  |
| Text Fill: Directional Gradient      |  ✅  |  ✅  |  ✅  |
| Text Fill: Radial Gradient           |  ✅  |  ✅  |  ✅  |
| Text Fill: `Texture`                  |  ✅  |  ✅  |  ✅  |
| `text-align`                           |  ✅  |  ✅  |  ✅  |
| `text-justify`                         |  ✅  |  ✅  |  ✅  |
| Dropshadow                |  ✅  |  ✅  |  ✅  |

&nbsp;
# FAQ

## What does pixi-slug do?

It renders text using shaders.

<p align="center">· · ·</p>

## Does pixi-slug replace PIXI.Text?

No, it doesn't replace or affect `PIXI.Text`. `pixi-slug` is a standalone plugin that uses its own `SlugText`.

<p align="center">· · ·</p>

# Is pixi-slug a drop-in replacement for PIXI.Text?

**No**. It's not a drop-in replacement where you can just replace `new Text(...)` with `new SlugText(...)`. It's close but not identical.

<p align="center">· · ·</p>


# What are the advantages of using pixi-slug instead of PIXI.Text?

* Text is crisp & clear at any size.
* Changing font size or text scale after instantiation does not affect render quality.
* The same `SlugText` can be used on multiple resolutions.
* `SlugText` content changes have only a minimal impact on performance. Replacing text content several times per second (or more) doesn't create intense GC pressure the way `PIXI.Text` does.

&nbsp;

Advantages depend on use case. This package probably won't benefit you if:
* Your PIXI scenes have a small number of Text objects.
* Text rarely (or never) changes size or content.
* Your scene can afford to render text at a large base size & scale the text down to the target font size to guarantee clear rendering.

<p align="center">· · ·</p>

## Can it render emojis?

**A**: Yes. Drawing emojis as text requires a font with emoji characters. Find one online, make one, or try one of these Google fonts:
* [Noto Sans Symbols 1](https://fonts.google.com/noto/specimen/Noto+Sans+Symbols?preview.script=Latn)
* [Noto Sans Symbols 2](https://fonts.google.com/noto/specimen/Noto+Sans+Symbols+2)

<p align="center">· · ·</p>

## Does pixi-slug support CFF (cubic Bézier) fonts?

**Yes** — cubic outlines are approximated as two quadratics per cubic segment, since the Slug algorithm operates on quadratic Béziers. Quality is indistinguishable at typical sizes; extreme zooms on cubic-heavy fonts may reveal the approximation.

<p align="center">· · ·</p>

## What is renderer "prewarming"?

**Prewarming** starts the renderer earlier than normal so the Slug shader compiles and links on a background thread — using the `KHR_parallel_shader_compile` WebGL extension — while the rest of your app is still loading. By the time the first `SlugText` actually renders, the linked program is already cached and the draw runs immediately.

There are two ways to enable it, both v8-only:

- **Context-first** — `SlugFonts.prewarmContext(gl)`. You create the WebGL2 context yourself and pass it to both pixi-slug and PIXI. Compile starts the instant the context exists, running concurrently with `Application.init()` itself. Maximum parallelism, slightly more setup code.
- **Renderer-first** — register `SlugApplicationPluginV8` before `app.init()`. The plugin calls `SlugFonts.attachRenderer(app.renderer)` during PIXI's plugin chain init. Compile starts after PIXI's renderer setup completes, running concurrently with whatever your app does between `app.init()` resolving and first render. Less setup, slightly later start.

**Prewarming is off by default.** You opt in by calling one of the two APIs as the first `SlugFonts.*` operation in your app. When the `KHR_parallel_shader_compile` extension is unavailable, prewarm transparently falls back to PIXI's synchronous compile path — no regression vs. the no-prewarm behavior.

See [the prewarm section below](#shader-prewarm-v8) for code examples, and [_specs/features/parallel_shader_compile.md](_specs/features/parallel_shader_compile.md) for the full design.

<p align="center">· · ·</p>

## Why is renderer prewarming only support for PIXI v8?

The API for PIXI v6 and v7 don't support renderer prewarming.

<p align="center">· · ·</p>

## What font formats does it support?
`pixi-slug` supports stand web font formats: `ttf`, `otf`, `woff`, and `woff2`.


<p align="center">· · ·</p>


## What version of WebGL does pixi-slug require?

`pixi-slug` requires `WebGL2` to work. It does not work with `WebGL1`.
* [See if your browser supports `WebGL2`](https://get.webgl.org/webgl2/)

*95% of current browsers support `WebGL2` according to [caniuse.com/webgl2](https://caniuse.com/webgl2)*

<p align="center">· · ·</p>


## Q: What does pixi-slug do when loaded by a client that doesnt support `WebGL2` ?

The shaders used by `pixi-slug` to render text require `WebGL2` and don't support `WebGL1`. The shaders fail to load in `WebGL1` and will simply not be drawn on screen, along with error messages in the console describing the shader error. 

In the future, it would be nice to fall back to standard `PIXI.Text` when `WebGL2` isn't available.
<p align="center">· · ·</p>

## Are SVG fonts supported?
**No**. `pixi-slug` supports some of the same features as SVG while using standard web fonts, rather than SVG fonts specifically. There are no plans to add SVG support right now. If there's enough demand that may change.

<p align="center">· · ·</p>

## Q: Can I use both pixi-slug and PIXI.Text together?

**Yes** they can be used together. `pixi-slug` doesn't replace or change `PIXI.Text`. You can use both together or just one. It's up to you.

<p align="center">· · ·</p>

## Why is it called pixi-slug?
`pixi-slug` is a plugin for the [PIXI.js](https://pixijs.com/) game engine which draws text using the slug algorithm. Read more about Slug at [sluglibrary.com](https://sluglibrary.com/).


<p align="center">· · ·</p>

## Can I make a `SlugText` clickable / hover-able?

**By default, no — and that's intentional.** `SlugText` instances opt out of PIXI's event system in their constructor (`eventMode = 'none'` on v8, `interactive = false` on v6/v7, plus `interactiveChildren = false`). The internal meshes use a Slug-specific vertex layout (`aPositionNormal`, etc.) instead of PIXI's stock `aVertexPosition`, so PIXI's built-in `Mesh.containsPoint` crashes when the event boundary tries to hit-test them (`Cannot read properties of undefined (reading 'buffer')`).

If you need a clickable / hoverable `SlugText`, the recommended approach is to wrap it (or place a sibling) with a transparent hit-test region:

```typescript
const text = new SlugText({text: 'Click me', font: 'roboto'});

// v8
const hit = new Graphics().rect(0, 0, text.width, text.height).fill({color: 0, alpha: 0});
hit.eventMode = 'static';
hit.on('pointerdown', () => { /* ... */ });

container.addChild(text, hit);
```

Re-enabling events directly on the `SlugText` (`text.eventMode = 'static'`) will reintroduce the crash unless you also override `containsPoint` on each child mesh. Use the wrapper pattern instead.

<p align="center">· · ·</p>



# Examples

`pixi-slug` supports multiple versions by building & bundling a separate package for each of the three supported PIXI version (`v8`, `v7`, `v6`). PIXI's imports and API vary by version. All packages share core functionality but import paths and scaffolding differs by version. 

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

`SlugText` geometry is rebuilt each time properties change. 

```typescript
text.text = 'Updated!';
text.fontSize = 72;
text.color = [1, 0.2, 0.2, 1];
text.wordWrap = true;
text.wordWrapWidth = 300;
text.font = await SlugFonts.from('https://cdn.example.com/inter.ttf');
```


## Colors

All color fields support a range of value types: hex strings, hex numbers, or numeric arrays.

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

**Type aliases:** color *getters* (`text.color`, `text.strokeColor`, `text.dropShadow.color`) return a normalized `[r, g, b, a]` tuple with each component in `0..1`. Two type aliases describe this shape and are exported from each version entry point so your own helpers can reference them directly:

```typescript
import type {Rgba, RgbaReadonly} from 'pixi-slug';      // or '/v7' / '/v6'

// Mutable: the form returned by getters and stored on SlugText.
const c: Rgba = text.color;

// Read-only: use for parameters and fields that must not mutate the tuple.
function tint(color: RgbaReadonly): Rgba {
    return [color[0] * 0.5, color[1] * 0.5, color[2] * 0.5, color[3]];
}
```

Both are aliases for `[number, number, number, number]` — they exist purely so IDE hints and `.d.ts` output read as "RGBA" instead of an unnamed 4-tuple.

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

### PIXI `v8` - Loading font assets
```typescript
// v8
const {Assets} = require('pixi.js');
const {SlugText, slugFontsInstallLoaderV8} = require('pixi-slug');

slugFontsInstallLoaderV8();
const bytes = await Assets.load('roboto.ttf'); // now returns ArrayBuffer
const text = new SlugText({text: 'Hi', font: bytes});
```

### PIXI `v7` - Loading font assets
```typescript
// v7
const {Assets} = require('pixi.js');
const {SlugText, slugFontsInstallLoaderV7} = require('pixi-slug/v7');

slugFontsInstallLoaderV7();
const bytes = await Assets.load('roboto.ttf');
const text = new SlugText({text: 'Hi', font: bytes});
```

### PIXI `v6` - Loading font assets
```typescript
// v6 — PIXI.Loader can't be extended to return raw bytes; use the
// helper instead of `loader.add(url)` when the font is destined for SlugText.
const {SlugText, slugFontsFetchV6} = require('pixi-slug/v6');

const bytes = await slugFontsFetchV6('roboto.ttf');
const text = new SlugText({text: 'Hi', font: bytes});
```

&nbsp;
## Integrating with `PIXI.Application`

The `SlugFonts` registry needs a ticker to run its auto-destroy sweep. Two ways to wire it up — pick whichever fits your app.

&nbsp;
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

v6 uses the older registration method:

```typescript
const {Application} = require('@pixi/app');
const {SlugApplicationPluginV6} = require('pixi-slug/v6');
Application.registerPlugin(SlugApplicationPluginV6);
```

**Conflict behavior:** both paths call `SlugFonts.attachTicker` under the hood. If one is already active and another tries to attach, `SlugFonts.reattachPolicy` decides what happens — `'throw'` by default, or `'error'` / `'warn'` / `'silent'`. Change it with `SlugFonts.setReattachPolicy('warn')` (validated — invalid modes are rejected and logged). Pass `{force: true}` as the second arg to `attachTicker` to replace silently. Full details in [_features/application_plugin.md](_features/application_plugin.md).

&nbsp;
## Shader prewarm (v8)

Prewarm uses `KHR_parallel_shader_compile` to move the Slug shader's compile + link work off the main thread, running in parallel with the rest of your app's load. **Off by default** — opt in by calling a prewarm API as the first `SlugFonts.*` operation in your app. v8-only; see the [FAQ entry above](#what-is-renderer-prewarming) for background.

### Context-first prewarm — maximum parallelism

The earliest possible prewarm. Create the WebGL2 context yourself, fire `prewarmContext(gl)` immediately, then pass the same context into `Application.init({context: gl})`. The compile runs concurrently with `autoDetectRenderer`, plugin chain init, font loading, scene construction — everything else your app does between context creation and first render.

```typescript
const {Application, extensions} = require('pixi.js');
const {SlugFonts, SlugApplicationPluginV8, SlugText} = require('pixi-slug');

// 1. Create the canvas + WebGL2 context yourself.
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2', {antialias: true});

// 2. Fire prewarm. MUST be the first SlugFonts.* call.
SlugFonts.prewarmContext(gl);   // fire-and-forget; compile starts now

// 3. Build the Application around the same context. PIXI v8 accepts
//    `context` in ApplicationOptions and uses our context instead of
//    creating one.
SlugFonts.detachTicker();   // plugin re-attaches to app.ticker below
extensions.add(SlugApplicationPluginV8);

const app = new Application();
await app.init({context: gl, canvas, width: 800, height: 600});
// Plugin's init runs SlugFonts.attachRenderer(app.renderer), which
// finds the prewarmed gl on renderer.gl and adopts the linked program
// into PIXI's cache — no recompile.

document.body.appendChild(app.canvas);
app.stage.addChild(new SlugText({text: 'Hello', font: '...'}));
```

### Renderer-first prewarm — minimal code change

Simpler but starts later. Skip the manual canvas creation and just register the plugin; the plugin's `init` hook calls `attachRenderer(app.renderer)` after PIXI's renderer setup completes. The compile runs concurrently with whatever your app does between `app.init()` resolving and first render.

```typescript
const {Application, extensions} = require('pixi.js');
const {SlugFonts, SlugApplicationPluginV8, SlugText} = require('pixi-slug');

SlugFonts.detachTicker();   // plugin re-attaches to app.ticker
extensions.add(SlugApplicationPluginV8);

const app = new Application();
await app.init({width: 800, height: 600});
// Plugin's init calls SlugFonts.attachRenderer(app.renderer) → prewarm kicks off here.
```

### Call-order contract

Prewarm-mode opt-in **must happen before any other `SlugFonts.*` operation**. The first call wins: whichever API touches the registry first locks its mode in for the registry's lifetime. If `prewarmContext` or `attachRenderer` is called after the registry was already constructed in non-prewarm mode (e.g. a font was loaded first), the library logs a one-time `console.warn` and the call has no effect — the registry cannot be hot-swapped into prewarm mode.

### Fallback behavior

When `KHR_parallel_shader_compile` is unavailable, prewarm gracefully falls back to PIXI's synchronous compile on first draw — identical to today's no-prewarm behavior. No regression. Full design in [_specs/features/parallel_shader_compile.md](_specs/features/parallel_shader_compile.md).

### v6 / v7

Prewarm is v8-only. `SlugFonts.prewarmContext` is callable in v6/v7 too but resolves to `false` immediately — safe to leave in code that targets multiple versions.

&nbsp;
# Troubleshooting

## Console error: `[pixi-slug] DUPLICATE pixi.js DETECTED`

**What it means:** Your app has loaded **two separate copies of `pixi.js`** into the same bundle. `pixi-slug` builds its meshes with the `pixi.js` it imports, but your renderer comes from the *other* copy. PIXI's renderer recognizes drawable objects with an `instanceof` / constructor-identity check, and that check fails across two different copies — so every `SlugText` mesh is **silently skipped**. The result is the confusing symptom this error exists to explain: **text doesn't render even though there are no other errors, the `SlugText` is in the scene, and all of its GPU resources are valid.**

`pixi-slug` runs this check automatically the first time it builds a mesh and logs the error **once**.

**Important:** This error fires **only** on a genuine duplicate (two different `Mesh` constructors in memory). It does **not** fire merely because your installed `pixi.js` version differs from what `pixi-slug` lists in its peer range — a single `pixi.js` copy at any compatible version renders fine and stays silent.

**Cause:** Two copies of `pixi.js` end up in the bundle even when `package.json` lists only one. Common reasons:

- A transitive dependency pulls in its own `pixi.js` at a different version.
- A non-deduplicated `node_modules` tree (mixed lockfiles, hoisting differences).
- Importing `pixi-slug` (or another pixi plugin) **from a local source folder** rather than the published package — the bundler resolves *that* package's `pixi.js` import relative to its own directory, which can land on a different physical copy than your app's.

**Fix:** Force every `pixi.js` import to resolve to a single physical copy.

- **webpack** — add an exact-match alias (the `$` matches only the bare `pixi.js` specifier, not subpaths):

  ```js
  // your app's webpack.config.js
  const path = require('path');

  module.exports = {
      resolve: {
          alias: {
              'pixi.js$': path.resolve(__dirname, 'node_modules/pixi.js')
          }
      }
  };
  ```

- **Vite / esbuild / Rollup** — add the equivalent `resolve.alias` entry mapping `pixi.js` to one path.
- **Package manager** — run `pnpm dedupe` (or add an `overrides` / `resolutions` entry pinning `pixi.js` to one version) so only one copy is installed.

To locate the second copy, run `pnpm why pixi.js` or `npm ls pixi.js`.

> **If you see *any* pixi version-mismatch warning** (from PIXI itself, another pixi plugin, or your package manager) **and your app uses a bundler such as webpack, Vite, or esbuild:** verify that every `pixi.js` import/`require` across your whole bundle resolves to the **same** version and physical path. A bundler can include two different `pixi.js` copies even when your `package.json` lists only one — each `import 'pixi.js'` is resolved relative to the importing file, so a dependency (or a locally-linked package) can pull in its own copy. The same single-copy `resolve.alias` / dedupe fix above resolves it. Note that `pixi-slug` itself does **not** warn on a version mismatch — it only errors on a genuine duplicate — so a version warning you see comes from elsewhere, but the bundler check is the same.

**Confirm the diagnosis programmatically (v8):** call `slugAssertPixiSingleton(slugText, renderer)` for a full report. Pass it a `SlugText` *after* at least one render frame (so its mesh exists) for the decisive constructor-identity check:

```typescript
const {slugAssertPixiSingleton} = require('pixi-slug');

// after the first render tick
const report = slugAssertPixiSingleton(text, app.renderer);
console.log(report.ok, report.problems);
```

&nbsp;
## `SlugText` renders nothing, but there is **no** duplicate-pixi error

If the duplicate-pixi check is clean and text still doesn't appear, two read-only diagnostics (v8) help isolate the cause:

- `slugDebugDump(slugText)` — reports each render pass's GPU state: whether the mesh is on the display list, whether the curve/band textures and buffers are valid (vs. destroyed/zero-size), and the resolved fill mode. Catches the case where something released or detached `pixi-slug`'s GPU resources.
- `slugAssertGlState(renderer)` — reads the live WebGL state and flags conditions that silently suppress a draw (color-write mask off, a no-op blend func, a leftover depth/stencil/scissor test, a collapsed viewport, or a pending GL error). Catches the case where your app's own raw-GL rendering left shared context state in a configuration that discards `pixi-slug`'s draw.

```typescript
const {slugDebugDump, slugAssertGlState} = require('pixi-slug');

slugDebugDump(text);              // per-pass resource / scene / uniform state
slugAssertGlState(app.renderer);  // live GL-state leak check
```

Recommended order when chasing a blank `SlugText`: **`slugAssertPixiSingleton` → `slugDebugDump` → `slugAssertGlState`** — most-likely-and-otherwise-invisible cause first.

&nbsp;
## Changelog

Release history and unreleased changes are tracked in [CHANGELOG.md](CHANGELOG.md).

&nbsp;
## Slug Reference Code

[Eric Lengyel](https://github.com/EricLengyel) created and patented the Slug algorithm. He published [reference code on Github](https://github.com/EricLengyel/Slug/tree/main).

&nbsp;
## Legal

Eric Lengyel created the patented slug algorithm in 2016. He graciously released it into the public domain in 2026. [`pixi-slug`](https://www.npmjs.com/package/pixi-slug) is a TypeScript port of his work to add gpu-based font rendering to [pixi.js](https://pixijs.com/).

*[`pixi-slug`](https://www.npmjs.com/package/pixi-slug) is not affiliated with, or endorsed by Eric Lengyel.*

&nbsp;
## License

[MIT](LICENSE) &copy; 2026 Toreda, Inc.

Bundled third-party components (currently the Roboto fallback font, Apache-2.0) are attributed in [NOTICES](NOTICES).

&nbsp;
## Website

Toreda's website can be found at [toreda.com](https://www.toreda.com)

&nbsp;
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
