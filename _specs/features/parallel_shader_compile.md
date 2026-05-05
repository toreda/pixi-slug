# Parallel Shader Compile + Prewarming — Specification

This document is the canonical specification for eliminating the ~500ms main-thread freeze that occurs when the Slug GLSL shader is compiled and linked on first SlugText render. It defines the runtime toggle, the async-compile path that uses `KHR_parallel_shader_compile`, the optional prewarm path, and the test surface that locks in the contract. Use it as the source of truth when verifying or modifying the implementation.

**Status:** partially implemented (toggle plumbed; async compile and prewarm pending).

Implementation:
- Defaults flag: [src/defaults.ts](../../src/defaults.ts) — `Defaults.Registry.ParallelShaderCompile`
- Registry option: [src/shared/slug/fonts/registry/options.ts](../../src/shared/slug/fonts/registry/options.ts)
- Registry field (read-only): [src/shared/slug/fonts/registry.ts](../../src/shared/slug/fonts/registry.ts)
- Public getter: [src/shared/slug/fonts.ts](../../src/shared/slug/fonts.ts) — `SlugFonts.parallelShaderCompile`
- v8 GPU layer (pending): [src/v8/slug/font/gpu.ts](../../src/v8/slug/font/gpu.ts)
- v8 SlugText (pending refactor): [src/v8/slug/text.ts](../../src/v8/slug/text.ts)
- Tests: [tests/defaults.spec.ts](../../tests/defaults.spec.ts), [tests/shared/slug/fonts/registry.spec.ts](../../tests/shared/slug/fonts/registry.spec.ts), [tests/shared/slug/fonts.spec.ts](../../tests/shared/slug/fonts.spec.ts)

---

## 1. Problem

The Slug fragment shader is ~764 lines of GLSL with branching, loops, and integer arithmetic for the equivalence-class root-eligibility table and the band sort. On first SlugText render, the GPU driver compiles and links this shader — typically 300–700ms of synchronous work on the main thread. Symptoms reported in the field:

1. The browser tab freezes for the duration of the compile.
2. `[Violation] requestAnimationFrame handler took 500ms+` warning fires.
3. **Other browser tabs/windows also stutter** because the main thread is genuinely blocked, not just stuck inside PIXI's render path.
4. Shader source edits trigger the same freeze on the next reload (no driver-side cache hit when source bytes change).

Investigation in 2026-05-05 confirmed the bottleneck is GLSL compile/link, not font parsing or glyph processing — see "Investigation" appendix.

## 2. Goal & success criteria

**Goal:** Eliminate the main-thread freeze on first SlugText render, optionally combined with prewarming so the first visible render is also fast.

**Success criteria:**
1. The `[Violation] requestAnimationFrame handler took 500ms+` warning does not fire on first font load.
2. Other browser tabs/windows remain responsive throughout font load and first render.
3. When prewarm is enabled and the user awaits font load, the first SlugText render completes in <16ms.
4. Behavior with toggle off: identical to current PIXI synchronous compile path (no regression).
5. Implementation falls back transparently to the synchronous path on any of: extension unavailable, PIXI internal API drift, GLSL compile error.

## 3. Two-part design

The work splits into two independent parts. Either may ship without the other.

### 3.1 Part A — Async compile via `KHR_parallel_shader_compile`

Bypass PIXI's `generateProgram` for the Slug shader. Compile + link manually, poll `COMPLETION_STATUS_KHR` from a `setTimeout`-driven loop without blocking the main thread, then inject the result into PIXI's program cache so subsequent draws find a cache hit and skip PIXI's own (blocking) compile.

**Net effect with Part A only, no prewarm:** the thread stays responsive throughout. First SlugText render appears a few RAFs later than today (the user's app sees a blank canvas for ~500ms instead of a frozen window). Other tabs remain responsive. Solves the user's stated complaint.

### 3.2 Part B — Prewarming

Kick off the compile as early as possible — during font load when a renderer is already known. Combined with Part A, the link finishes during the user's "Loading…" state.

**Net effect with Part A + Part B:** first SlugText render is fast. The compile cost happens during a moment the user is already waiting, with no visible regression.

**Recommended ordering:** ship Part A first; layer Part B as polish.

## 4. Public API

### 4.1 Toggle (already implemented)

`SlugFontsRegistryOptions.parallelShaderCompile: boolean`. Default true. Set in the `SlugFontsRegistry` constructor:

```typescript
new SlugFontsRegistry({parallelShaderCompile: false});
```

Once a registry exists, the value is read-only on the registry instance. Surfaced via `SlugFonts.parallelShaderCompile` getter (no setter).

**Read-once contract:** the value is consulted on first compile of the Slug shader. Subsequent SlugFont/SlugText instances observe whatever path the first compile chose. The toggle has no effect after first compile fires.

To override the default, either:
1. Construct the registry with the option before any SlugFont is created, OR
2. Mutate `Defaults.Registry.ParallelShaderCompile` before the first font load.

### 4.2 Renderer registration (Part B only)

```typescript
SlugFonts.attachRenderer(renderer);   // v8: WebGLRenderer; v6/v7: Renderer
SlugFonts.detachRenderer();
SlugFonts.renderer;                    // getter — null until attached
```

The application plugin auto-calls `attachRenderer(app.renderer)` in its `init` hook. Manual users (raw `new Application()` without the plugin) call it themselves.

### 4.3 Optional explicit warmup (Part B only)

```typescript
SlugFonts.warmup(): Promise<void>
```

Resolves when the Slug shader is compiled, linked, and cached for the currently-attached renderer. Useful for callers that want to gate their loading screen on shader readiness independent of font load. Default user path doesn't need to call this — `fromUrl` triggers warmup automatically when a renderer is attached.

If no renderer is attached, `warmup()` resolves immediately as a no-op; the actual compile happens on first attach + first `slugFontGpuV8` call.

## 5. Part A implementation

### 5.1 New module: `slugBuildGlProgramAsync`

New file: `src/v8/slug/font/glprogram-async.ts`.

Exported function:

```typescript
function slugBuildGlProgramAsync(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
  sortAttributes: boolean
): {
  program: WebGLProgram;     // WebGL program; link in flight
  ready: Promise<void>;       // resolves when link is verifiably complete
}
```

Internal flow:

1. Detect `gl.getExtension('KHR_parallel_shader_compile')`. If absent, fall through to a synchronous build (still resolves the promise — uniform API for callers).
2. `compileShader(VERTEX_SHADER, vertexSource)`.
3. `compileShader(FRAGMENT_SHADER, fragmentSource)`.
4. `attachShader` × 2.
5. If `sortAttributes` is true (GLSL 1.00), bind attribute locations alphabetically — matches PIXI's `extractAttributesFromGlProgram` pre-link sort.
6. `linkProgram` — non-blocking when extension is present.
7. Return `{program, ready}` immediately.

The `ready` promise:

1. `setTimeout`-driven poll loop on `gl.getProgramParameter(program, COMPLETION_STATUS_KHR)`.
2. Backoff: first 12 ticks at 4ms, then 16ms.
3. **Hard timeout: 5000ms.** On timeout, fall through to a sync `gl.getProgramParameter(program, LINK_STATUS)` query (which will block, but at least won't hang). This guards against driver bugs where `COMPLETION_STATUS_KHR` never goes true.
4. Once `COMPLETION_STATUS_KHR === true`, query `LINK_STATUS` once (now non-blocking since compile completed). If false, reject with the program info log; otherwise resolve.

### 5.2 PIXI-compatible wrapper

Add a helper that takes the linked `WebGLProgram` and runs PIXI's post-link extraction steps to build a `GlProgramData`:

```typescript
function slugBuildGlProgramData(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  pixiGlProgram: GlProgram
): GlProgramData
```

Steps (mirroring PIXI's `generateProgram` minus the `linkProgram` call):

1. `pixiGlProgram._attributeData = extractAttributesFromGlProgram(program, gl, sortAttributes)`.
2. `pixiGlProgram._uniformData = getUniformData(program, gl)`.
3. `pixiGlProgram._uniformBlockData = getUboData(program, gl)`.
4. `gl.deleteShader` for the two attached shaders.
5. Build the `uniformData` map (`{location, value}` per uniform name) via `getUniformLocation` and `defaultValue`.
6. Construct and return `new GlProgramData(program, uniformData)`.

These PIXI helpers are exported but internal-flagged (their stability across PIXI minor versions is not guaranteed).

### 5.3 Inject into PIXI's program cache

PIXI v8's `GlShaderSystem` keeps a per-renderer hash:

```
renderer.shader._programDataHash[program._key]
```

Inject our `GlProgramData` at this key. PIXI's `_createProgramData` finds the cache hit on first draw and skips its own (blocking) `generateProgram`.

The injection key is the PIXI-managed `_key` field on the `GlProgram` instance, which is stable for a given (vertexSource, fragmentSource) pair within a process.

### 5.4 `slugFontGpuV8` integration

Today's signature:

```typescript
slugFontGpuV8(font, ensureResult)
```

Becomes:

```typescript
slugFontGpuV8(font, ensureResult, renderer?)
```

When `renderer` is provided AND `SlugFonts.parallelShaderCompile` is true AND the cache-miss path runs:

1. Read `gl = renderer.gl`.
2. Call `slugBuildGlProgramAsync(gl, vertSource, fragSource, ...)`.
3. Build the PIXI `GlProgram` instance (same `GlProgram.from(...)` call as today).
4. When the `ready` promise resolves: build the `GlProgramData` and inject into `renderer.shader._programDataHash[glProgram._key]`. Fire a "ready" callback so the SlugText can proceed with its first render.

The cache miss returns the cache record immediately. The shader is "in flight" until the ready callback fires. The `SlugText._render` override uses this flag to render-or-skip.

When `renderer` is null OR the toggle is off OR the extension is unavailable → fall through to today's behavior (PIXI compiles synchronously on first draw).

### 5.5 `SlugText.rebuild()` → `_render()` refactor

Today: `rebuild()` runs in the constructor and synchronously builds + adds meshes. The first `_render` after that hits PIXI's `generateProgram` and blocks.

Required change: split `rebuild()` into two phases:

1. **Geometry phase** — runs in constructor (or when `text`/`fontSize`/etc. change). Computes glyph quads, layout, fill bounds. Stores results on the SlugText.
2. **GPU attach phase** — runs in `_render(renderer)` on the first render. Calls `slugFontGpuV8(font, ensureResult, renderer)`, builds meshes, adds to the display list. On parallel compile path, gates the "add to display list" step on the ready callback.

Until the program is ready, `_render` is a no-op (the SlugText renders nothing). This is acceptable: the alternative is the current freeze.

This is the highest-risk piece of the refactor — it changes when meshes appear in the scene graph. Existing tests that assume synchronous mesh creation in the constructor must be updated to drive a render tick before asserting on `_meshes.length`.

### 5.6 Toggle integration

The toggle is read once on the cache-miss path inside `slugFontGpuV8`:

```typescript
const useParallel = SlugFonts.parallelShaderCompile && hasKHRExtension(gl);
```

If false, skip the parallel path and let PIXI compile synchronously (today's behavior).

### 5.7 Test surface — Part A

Unit tests in a new file `tests/v8/slug/font/glprogram-async.spec.ts`:

| Case | Setup | Assertion |
|------|-------|-----------|
| Extension absent | `gl.getExtension` returns null | Returns `{program, ready}` where `ready` resolves; sync path was taken |
| Extension present, completes after N polls | Mock `COMPLETION_STATUS_KHR` returning false twice then true | Promise resolves after the third poll |
| Extension present, link fails | `LINK_STATUS` false after completion | Promise rejects with info log content |
| Hard timeout | Mock `COMPLETION_STATUS_KHR` permanently false | Promise resolves (or rejects) within 5s, never hangs |

Integration tests in `tests/v8/slug/font/gpu.spec.ts`:

| Case | Assertion |
|------|-----------|
| Toggle off + cache miss | No `KHR_parallel_shader_compile` query; PIXI sync path used |
| Toggle on + extension absent | Falls back; identical output to toggle-off baseline |
| Toggle on + extension present + happy path | `_programDataHash` is populated by our path; PIXI's `generateProgram` is not called |
| Toggle on + extension present + injection fails (try/catch) | Falls back transparently; SlugText renders correctly |

Lock-in test: a synchronous render after `await ready` must produce byte-identical pixels to a synchronous render through the legacy path. Use the existing pixel-readback fixture if available.

## 6. Part B implementation

### 6.1 Renderer registration

Add to `SlugFontsRegistry`:

```typescript
public renderer: Renderer | null;
public attachRenderer(r: Renderer): void;
public detachRenderer(): void;
```

`attachRenderer` is idempotent for the same renderer reference. Re-attach with a different renderer: detach the old (which destroys cached `GlProgramData` for the old `gl` context — programs are not portable across contexts), then attach the new.

### 6.2 Auto-attach via application plugin

The v8 `SlugApplicationPluginV8.init` already runs `SlugFonts.attachTicker(...)`. Extend it to also call `SlugFonts.attachRenderer(app.renderer)`. The `destroy` hook calls `detachRenderer()`.

Standalone helper paths (`slugFontsAttachTickerV8` etc.) do not auto-attach a renderer — those code paths often run before any renderer exists. Manual `SlugFonts.attachRenderer(app.renderer)` is required for those users.

### 6.3 Prewarm trigger

Two trigger points:

1. **`attachRenderer(r)`** — if any SlugFont is already loaded, kick off compile immediately (one compile per process, shared across all fonts).
2. **`SlugFonts.fromUrl(url)`** — after the font parse completes, if a renderer is attached, kick off compile *before* resolving the load promise. The user's `await SlugFonts.fromUrl(...)` covers the compile time naturally.

Both fire (whichever lands second). The compile is idempotent because we cache the linked program in `_programDataHash`.

### 6.4 `SlugFonts.warmup()`

```typescript
SlugFonts.warmup(): Promise<void>
```

Behavior:

- If no renderer attached: resolves immediately (no-op). Compile triggers on next `attachRenderer`.
- If renderer attached, compile in-flight: returns the in-flight promise.
- If renderer attached, compile complete: resolves immediately.
- If renderer attached, compile not yet started: kicks it off and returns the new promise.

Useful for callers gating their loading-screen dismissal on shader readiness independent of font load.

### 6.5 Cache key per renderer

Programs are tied to a specific `gl` context. If the user destroys and recreates the renderer (rare but legal), recompile is required.

Use `WeakMap<Renderer, GlProgramData>` so destroyed renderers free their cached entries automatically. On `attachRenderer` for a renderer with an existing entry, reuse it. On `detachRenderer`, the entry stays in the WeakMap until the renderer is GC'd.

### 6.6 Test surface — Part B

| Case | Assertion |
|------|-----------|
| Construct Application, register renderer, load font | No synchronous block during the await; `__SLUG_PERF__`-style probe shows compile time absorbed by the load promise |
| Detach + re-attach with new renderer | Recompile fires for the new context; old cache entry is unused |
| `warmup()` with no renderer | Resolves as no-op |
| `warmup()` with renderer + font already loaded | Kicks off compile; resolves when ready |
| `warmup()` called twice | Returns the same in-flight promise on the second call |

## 7. Risk register

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| PIXI's `_programDataHash` renamed in a minor version | Medium | try/catch around injection; fall back to sync compile if the field is absent. Pin PIXI version range in `package.json` peer deps. |
| PIXI's `extractAttributesFromGlProgram` / `getUniformData` / `getUboData` exports renamed | Low–medium | Same try/catch fallback. Maintain a "tested PIXI versions" matrix in this spec. |
| `KHR_parallel_shader_compile` returns a stuck `COMPLETION_STATUS_KHR` | Very low (driver bug) | Hard 5s timeout; fall back to sync `LINK_STATUS` query. |
| Driver compiles in driver thread but main thread still spends time in WebGL command-queue overhead | Low | Profiling will surface this. Mitigation is to compile during prewarm where the user is already waiting. |
| Browsers without `KHR_parallel_shader_compile` (some Firefox configs, mobile Safari) | Medium | Sync fallback path is identical to today; no regression. |
| Re-architecture of `SlugText.rebuild()` to defer GPU attach to `_render` shifts visible behavior | Medium–high | Lock-in pixel-readback tests; staged rollout; existing tests updated to drive at least one render tick before asserting on mesh state. |
| WebGL2-specific: `transformFeedbackVaryings` setup must happen before `linkProgram` | Low | Slug shader doesn't use transform feedback today; if it ever does, the parallel path must replicate PIXI's pre-link `transformFeedbackVaryings` call. |

## 8. Out of scope

- v6/v7 implementations of Part A and Part B. v6/v7 use an older PIXI shader system (different cache shape); the same `KHR_parallel_shader_compile` strategy applies but plumbing differs. **Plan: ship v8 end-to-end first; port to v7, then v6, in separate sessions.**
- Browser-level shader cache (Chromium/Firefox-side disk caching). Not directly accessible from JS; users benefit transparently when present.
- WebGPU path. WebGPU has fundamentally different async-compile semantics (`createComputePipelineAsync`, `createRenderPipelineAsync`). Out of scope until WebGPU is on the project's roadmap.
- Compile-time GLSL precompilation to SPIR-V or shipped binaries. Web platforms do not support pre-linked program objects; the GPU driver must compile on the user's machine.

## 9. Estimated effort

| Phase | Estimate |
|-------|----------|
| Part A on v8 | 1 focused session. Most risk in the `rebuild()` → `_render()` refactor. |
| Part B on v8 | 0.5 sessions on top of Part A. |
| Part A on v7 | 1 session. |
| Part A on v6 | 1 session. |
| Part B on v7 + v6 | 0.5 sessions combined. |
| **Total to fully resolve across versions** | ~4 sessions. |

## 10. Suggested order

1. **Next session:** Part A on v8.
2. **Following:** Part B on v8.
3. **Then:** Part A on v7.
4. **Then:** Part A on v6.
5. **Then:** Part B on v7 + v6.

Each phase ships independently and provides observable user-visible improvement.

## 11. Acceptance checklist

When the spec is fully shipped (all phases, all versions):

- [ ] `SlugFonts.parallelShaderCompile` getter returns the configured value.
- [ ] Constructor option `parallelShaderCompile: false` opts out cleanly; behavior matches PIXI synchronous path byte-for-byte.
- [ ] `SlugFonts.attachRenderer(r)` stores the renderer; `SlugFonts.renderer` returns it.
- [ ] `SlugFonts.detachRenderer()` clears the renderer; subsequent compiles target whatever's attached next.
- [ ] `SlugFonts.warmup()` resolves on the documented states (no renderer → no-op; in-flight → shared promise; complete → immediate).
- [ ] First-render `[Violation] requestAnimationFrame handler took >50ms` warning does not fire on supported browsers.
- [ ] Other browser tabs remain responsive during the compile (verified manually with Chrome's per-tab CPU column or Performance tab).
- [ ] Toggle-off behavior is byte-identical to current behavior (lock-in pixel test).
- [ ] PIXI internal injection failure falls back to sync compile without throwing.
- [ ] All v6/v7/v8 code paths behave identically to the user.

---

## Appendix A — Investigation notes (2026-05-05)

User-reported symptom: `[Violation] requestAnimationFrame handler took 493ms` on first font load, with other browser windows also stuttering. Reproduces consistently after shader source edits.

Per-step `performance.now()` instrumentation (gated by `globalThis.__SLUG_PERF__`) captured:

```
[slug-perf] fetch: 8.10ms
[slug-perf] arrayBuffer: 6.20ms
[slug-perf] opentype.parse: 14.60ms (bytes=488584 glyphs=1326)
[slug-perf] advance-widths: 0.20ms
[slug-perf] pack-state-create: 0.10ms
[slug-perf] loadSync (total): 15.40ms
[slug-perf] font.load (incl. parse): 15.80ms
[slug-perf] fromUrl (total): 30.40ms
[slug-perf] ensureGlyphs: 7.30ms (processed=15)
[slug-perf] slugFontGpuV8: 0.70ms (cacheMiss=true)
[slug-perf] rebuild (total): 9.90ms (cacheMiss=true)
[slug-perf] first-RAF: scheduled→callback=575.60ms     ← block lives here
[Violation] 'requestAnimationFrame' handler took 574ms
[slug-perf] first-RAF: callback→nextRAF=4.60ms
```

Total tracked work in our code: ~38ms. The 575ms block lives **between** our `rebuild()` finishing and the next RAF firing — i.e. inside PIXI's render path, on the first draw call that uses the `GlProgram` returned by `GlProgram.from(...)`. PIXI's `generateProgram` calls `gl.linkProgram(...)` followed immediately by `gl.getProgramParameter(program, gl.LINK_STATUS)`, which is the synchronous block.

This pinpoints **GLSL compile + link** as the bottleneck, and is consistent with the user's observation that shader source edits trigger the same freeze on next reload (no driver-side cache hit when source bytes change).

The instrumentation has been removed from the codebase; the data is preserved here for future reference.
