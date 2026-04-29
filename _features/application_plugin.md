# Application Plugin — Specification

This document is the canonical specification for how pixi-slug integrates with PIXI's `Application` lifecycle. The plugin handles the `SlugFonts` registry's ticker (two parallel paths users can take, see below) and observes the application's resize target so the canvas backbuffer stays in sync with its CSS display size across all layout changes, not just window resizes. Use it as the source of truth when verifying or modifying the integration code.

Implementation:
- v8 plugin: [src/v8/slug/plugin.ts](../src/v8/slug/plugin.ts)
- v7 plugin: [src/v7/slug/plugin.ts](../src/v7/slug/plugin.ts)
- v6 plugin: [src/v6/slug/plugin.ts](../src/v6/slug/plugin.ts)
- Registry ticker APIs: [src/shared/slug/fonts.ts](../src/shared/slug/fonts.ts)
- Tests: [tests/shared/slug/fonts/attach-ticker.spec.ts](../tests/shared/slug/fonts/attach-ticker.spec.ts)

---

## 1. Why a ticker is needed

`SlugFonts` tracks live references to every registry-managed font. When refs hit zero a font is marked unused. After `Defaults.Registry.AutoDestroyDelay` seconds the font's GPU resources are freed by a sweep. The sweep only runs when the registry's `onUpdate(deltaMs)` is called — so some tick source must drive it. Two supported paths.

## 2. Path A — standalone helper (`slugFontsAttachTicker*`)

Hooks the **shared** PIXI ticker. Good for:
- Simple scenes.
- Apps that don't use `PIXI.Application` at all (raw renderer + custom loop).
- Pages where the shared ticker already runs and auto-cleanup on a specific app's destroy isn't relevant.

```typescript
import {slugFontsAttachTickerV8} from 'pixi-slug';
slugFontsAttachTickerV8();
```

Per-version exports:
- `slugFontsAttachTickerV8()` — imports `Ticker` from `pixi.js`
- `slugFontsAttachTickerV7()` — imports `Ticker` from `@pixi/ticker`
- `slugFontsAttachTickerV6()` — imports `Ticker` from `@pixi/ticker`

Teardown: `SlugFonts.detachTicker()`.

## 3. Path B — Application plugin

Hooks the **app's own** ticker, with clean lifecycle tied to `app.destroy()`. Good for:
- Single- or multi-app pages with proper teardown.
- Tests/hot-reload where every `new Application()` should start fresh.
- Any code that already registers PIXI plugins.

### 3.1 v8 / v7 (`extensions.add`)

```typescript
import {extensions} from 'pixi.js';                // v8
import {SlugApplicationPluginV8} from 'pixi-slug';

extensions.add(SlugApplicationPluginV8);

const app = new Application();
await app.init({...});                             // plugin.init runs
// ...
app.destroy();                                     // plugin.destroy runs
```

v7 is identical with `extensions` imported from `@pixi/core`:

```typescript
import {extensions} from '@pixi/core';
import {SlugApplicationPluginV7} from 'pixi-slug/v7';
extensions.add(SlugApplicationPluginV7);
```

Both use `ExtensionType.Application` and `name: 'slug'`.

### 3.2 v6 (`Application.registerPlugin`)

v6 predates the unified extensions system for `Application`. Use `Application.registerPlugin` directly:

```typescript
import {Application} from '@pixi/app';
import {SlugApplicationPluginV6} from 'pixi-slug/v6';
Application.registerPlugin(SlugApplicationPluginV6);

const app = new Application({...});
app.destroy();
```

`SlugApplicationPluginV6` is a class with `static init(this: Application)` / `static destroy(this: Application)` methods — v6's plugin interface. All three plugins share identical bodies (attach ticker on init; detach + sweep on destroy), only the surface differs.

## 4. Plugin behavior contract

Every plugin variant (`SlugApplicationPluginV6`, `V7`, `V8`) runs:

### 4.1 `init(this: Application, options)`

- Calls `SlugFonts.attachTicker(subscribe)` where `subscribe` wraps `this.ticker.add(handler)` and returns `() => this.ticker.remove(handler)`.
- Uses the **Application's own** ticker (`this.ticker`), not `Ticker.shared`.
- Per tick: calls `SlugFonts.onUpdate(app.ticker.deltaMS)`.
- No-op from the user's perspective — nothing further to wire.

### 4.2 `destroy(this: Application)`

- Calls `SlugFonts.detachTicker()` — drops the ticker binding.
- Calls `SlugFonts.sweepImmediate()` — force-destroys every marked-unused font right now, ignoring the `AutoDestroyDelay` grace period.
- Fonts with live refs (`refs > 0`) are left alone, so multi-app pages where another `Application` still uses the same font are not broken by one app tearing down.
- Disconnects the resize observer attached during `init` (if any) and removes it from the app instance.

### 4.3 Resize observer

PIXI's built-in `ResizePlugin` only listens for `window` resize events. When `app.resizeTo` is a DOM element rather than the window, layout changes that don't fire a window resize (sidebar markup injection, font load reflow, flexbox re-measure, programmatic style changes) leave the canvas backbuffer (`canvas.width/height`) out of sync with the canvas's CSS display size. With `autoDensity: false` (PIXI's default), the browser non-uniformly stretches the canvas pixel buffer to fit its CSS box, distorting all rendered output — most visibly text glyphs.

To prevent this, the plugin attaches a `ResizeObserver` to `app.resizeTo` during `init`:

- Activated only when **all** of: `app.resizeTo` is set, is not `globalThis.window`, `globalThis.ResizeObserver` is defined, and `app.resize` is a function. Any miss is a silent skip — never an error.
- The observer callback calls `app.resize()` — nothing else. The plugin reads only `resizeTo` / `resize`. It does not set host properties, mutate styles, or modify rendering state.
- `app.resize()` is idempotent for unchanged dimensions, so an unnecessary observer firing is a redundant measurement, never a feedback loop with the host's own resize logic.
- The observer instance is stored on the application under a private symbol (`SLUG_RESIZE_OBSERVER`) so it can be located and disconnected during `destroy`. The symbol is local to the plugin file; nothing outside the plugin references it.

When `resizeTo === window` the plugin skips installing an observer because PIXI's own listener already covers that case. When `resizeTo` is unset (custom resize loop), the plugin defers entirely to the host and does nothing.

### 4.4 Multi-app behavior

If two Applications both register the plugin:
- App 1's `init` → attaches App 1's ticker. Success.
- App 2's `init` → **second `attachTicker` call fails per `SlugFonts.reattachPolicy`** (default `'throw'`). App 2's ticker is not wired.
- App 1's `destroy` → detaches, sweeps.
- App 2 now has no ticker source either. Registry sweep stops running.

This is deliberate: two ticker sources to one registry is wasteful and ambiguous. If you genuinely need this pattern, the consumer chooses:
- Use `SlugFonts.attachTicker(subscribe, {force: true})` in one of the apps (replaces the first silently).
- Or accept `Ticker.shared` for both apps via Path A.
- Or call `SlugFonts.setReattachPolicy('silent')` and accept that only one app's ticker is bound.

Multi-app is a niche scenario; the safer default is the loud failure.

## 5. `SlugFonts.attachTicker` semantics

```typescript
interface SlugFontsAttachTickerOptions {
    force?: boolean | null;
}

SlugFonts.attachTicker(
    subscribe: (cb: (deltaMs: number) => void) => () => void,
    options?: SlugFontsAttachTickerOptions
): void;
```

### 5.1 `force` flag

- Optional, accepts `boolean | null | undefined`.
- Normalized via `booleanValue(options?.force, false)` so omission/null both default to `false`.
- Checked as `forceFlag === true` (the normalized value), never `options?.force` directly.
- When `forceFlag === true` and a ticker is already attached: the old binding is detached and the new one takes its place silently. No policy fires.
- When `forceFlag === false` and a ticker is already attached: the `reattachPolicy` fires.

### 5.2 Idempotent same-source check

Before either policy or force logic runs, a short-circuit:
- If the registry already has a ticker attached AND the `subscribe` function passed to this call is **`===`-equal** to the stored `tickerSubscribe`: return silently. No detach, no re-attach, no policy fire.
- Protects against benign double-init (hot-reload, plugin registered twice).

### 5.3 `reattachPolicy`

Stored on `SlugFontsRegistry.reattachPolicy`. Read via `SlugFonts.reattachPolicy` (getter only). Mutate via `SlugFonts.setReattachPolicy(mode)` — the helper enforces exact-match validation against the `SlugFontErrorMode` literals and returns `true`/`false` so callers can detect bad input. Passing any non-matching value (arbitrary string, non-string, `null`, `undefined`) logs `[SlugFonts:reattachPolicy] …` via `console.error` and leaves the current policy untouched.

Valid modes: `'throw'` (default), `'error'`, `'warn'`, `'silent'`. Mirrors the `SlugFontErrorMode` used by the font resolver.

Behavior on conflicting re-attach (different subscribe, no force):

| Mode | Effect |
|---|---|
| `'throw'` (default) | `throw new Error('[SlugFonts:reattach] …')`. First binding stays. |
| `'error'` | `console.error('[SlugFonts:reattach] …')`. Returns silently. First binding stays. |
| `'warn'` | `console.warn('[SlugFonts:reattach] …')`. Returns silently. First binding stays. |
| `'silent'` | No output. Returns silently. First binding stays. |

**Error message format (all non-throw modes use the same string):**
```
[SlugFonts:reattach] Ticker already attached. Pass {force: true} to replace, call detachTicker() first, or set SlugFonts.reattachPolicy to a non-throw mode.
```

### 5.4 Diagnostics

- `SlugFonts.tickerAttached: boolean` — true when a ticker is bound.
- `SlugFonts.reattachPolicy: SlugFontErrorMode` — read the current policy.
- `SlugFonts.setReattachPolicy(mode): boolean` — validated mutation; returns `false` on invalid input without changing state.

## 6. `SlugFonts.sweepImmediate`

```typescript
SlugFonts.sweepImmediate(): void;
```

- Iterates `reg.marked` and destroys every entry where `markedForDestroy === true && refs === 0`, regardless of `autoDestroyDelay`.
- Fonts with `refs > 0` are skipped — they're still in use.
- Convention borrowed from game-engine APIs like Unity's `Object.DestroyImmediate`. Call name is a warning: you're skipping scheduled cleanup and doing it now, with whatever performance cost that implies for large font counts.

Used by each plugin's `destroy()` to flush unused fonts before the app goes away. Also safe for tests and manual teardown.

## 7. Co-existence: Path A + Path B

Nothing prevents a user from doing both. Whichever runs second triggers the reattach policy:

- Default (`throw`): second attach throws. Usually in the plugin's `init`, which means `app.init()` rejects its promise. Clear signal.
- `'error'` / `'warn'`: second attach logs, first attach stays. The user's app continues but the "second" ticker source isn't wired.
- `'silent'`: same behavior, no log.
- `force: true` at one of the sites: that site silently wins.

Common idiomatic combinations:
- **Plugin only** (typical app code): disable the auto-attach by constructing the registry with `autoAttachTicker: false`, then register the plugin.
- **Shared ticker only** (typical quick-start): let `slugFontsAttachTickerV*` auto-run on import; don't register the plugin.
- **Both deliberately**: uncommon. If you must, pick one to be the canonical source and use `force: true` there.

## 8. `Defaults.Registry.ReattachPolicy`

Value: `'throw'` as `'throw' | 'error' | 'warn' | 'silent'`.

Location: [src/defaults.ts](../src/defaults.ts) under `Defaults.Registry`.

Overridable:
- Per-registry at construction time via `SlugFontsRegistryOptions.reattachPolicy`.
- Per-process at runtime via `SlugFonts.setReattachPolicy('error')` (or `'warn'`, `'silent'`, `'throw'`).

## 9. Type shapes

### 9.1 Minimal application interface (inlined per version)

Each plugin defines a local `ApplicationV{6,7,8}Like` interface to avoid adding `@pixi/app` as a dev dependency. Shape is uniform across versions:

```typescript
interface ApplicationV*Like {
    ticker: {
        deltaMS: number;
        add(fn: () => void): void;
        remove(fn: () => void): void;
    };
    resizeTo?: Window | HTMLElement | null;
    resize?: () => void;
    [SLUG_RESIZE_OBSERVER]?: ResizeObserver;
}
```

Consumer apps provide the real `Application` at runtime; structural typing lines up with the actual PIXI `Application` shape. `resizeTo` and `resize` are optional because hosts running custom resize loops may not expose them; the plugin treats their absence as "do not observe."

### 9.2 Plugin shape

- **v8 / v7:** plain object literal with `extension`, `init`, `destroy` keys. Registered via `extensions.add(plugin)`.
- **v6:** class with static `init` / `destroy`. Registered via `Application.registerPlugin(klass)`. Optional `pluginName` on the class is set by PIXI automatically on registration.

## 10. Test coverage

File: [tests/shared/slug/fonts/attach-ticker.spec.ts](../tests/shared/slug/fonts/attach-ticker.spec.ts)

- First-attach happy path (subscribe called, detach handle stored).
- Idempotent re-attach (same subscribe function).
- Conflicting re-attach under every policy: `throw` / `error` / `warn` / `silent`.
- `force: true` silently replaces regardless of policy.
- `force: null` / `force: false` are equivalent to omitted — policy fires.
- `reattachPolicy` round-trip through the static getter/setter.
- `sweepImmediate` is safe on an empty registry.

## 11. Change-validation checklist

- [ ] First-attach works.
- [ ] Idempotent re-attach is silent; no detach/reattach happens.
- [ ] Conflict without `force` fires `reattachPolicy`; first binding stays.
- [ ] `force: true` silently replaces and does not fire the policy.
- [ ] `force: null` and `force: false` route through `booleanValue` to `false` (no replace).
- [ ] `reattachPolicy` is mutable at runtime via `SlugFonts.setReattachPolicy(mode)`; invalid modes are rejected and logged without mutating state.
- [ ] Plugin `destroy` detaches AND calls `sweepImmediate`.
- [ ] `sweepImmediate` never touches fonts with `refs > 0`.
- [ ] Plugin `init` attaches a `ResizeObserver` to `app.resizeTo` when it is a non-window element and `ResizeObserver` is defined; observer fires `app.resize()` only.
- [ ] Plugin `init` is a no-op for the observer when `resizeTo` is `window`, unset, or when `ResizeObserver` is unavailable — no errors thrown.
- [ ] Plugin `destroy` disconnects the observer and removes the symbol-keyed reference from the app instance.
- [ ] `SlugFonts.clear()` resets `tickerDetach` and `tickerSubscribe`.
- [ ] v6/v7/v8 plugins all build without `@pixi/app` installed (inlined `Application*Like`).
- [ ] `_features/color_input.md`-style spec remains accurate.

## 12. Out of scope

- Automatic `SlugFonts.clear()` on plugin destroy — intentionally not called; users who want full reset call it explicitly.
- Renderer-pipe registration — `SlugPipe` in v8 is registered elsewhere via its own extension path; this plugin handles the ticker lifecycle and resize observation only.
- Mutating host state on resize — the observer calls `app.resize()` exclusively; it never sets `resizeTo`, canvas styles, application options, or any property the user controls. If a host needs different resize behavior (debouncing, custom dimensions), that belongs in the host, not the plugin.
- Async batched sweep for very large font counts — if `sweepImmediate` ever causes a visible frame hitch, the fix is to spread work across frames in a follow-up, not to skip cleanup.
