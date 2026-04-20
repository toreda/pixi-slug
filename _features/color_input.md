# Color Input — Specification

This document is the **canonical specification** for how `SlugText` accepts color inputs. It covers every supported form, every invalid case, how invalid input is reported, and the internal contracts that must hold for correct rendering. Implementation lives in [src/shared/slug/text/style/color.ts](../src/shared/slug/text/style/color.ts); tests live in [tests/shared/slug/text/style/color.spec.ts](../tests/shared/slug/text/style/color.spec.ts).

Use this as the source of truth when verifying or modifying color handling.

---

## 1. Scope

### 1.1 User-facing color fields

All fields below accept the `SlugTextColor` union. Internal storage always becomes `[r, g, b, a]` normalized to 0..1.

| Location | Field | Default (current alpha when preserved) |
|---|---|---|
| [SlugTextStyleOptions.fill](../src/shared/slug/text/init.ts) | Init field | `Defaults.SlugText.FillColor = [1, 1, 1, 1]` |
| [SlugStroke.color](../src/shared/slug/text/init.ts) | Init field (nested in stroke object) | `Defaults.SlugText.StrokeColor = [0, 0, 0, 1]` |
| [SlugDropShadow.color](../src/shared/slug/text/init.ts) | Init field (nested in dropShadow object) | `Defaults.SlugText.DropShadowColor = [0, 0, 0, 1]` |
| `SlugTextBase.color` | Setter | `this._color` (current value) |
| `SlugTextBase.strokeColor` | Setter | `this._strokeColor` (current value) |
| `SlugTextBase.stroke` | Compound setter → `stroke.color` | `this._strokeColor` when updating, default when disabling |
| `SlugTextBase.dropShadow` | Compound setter → `dropShadow.color` | `this._dropShadow.color` when updating, default when first enabling |

### 1.2 The `SlugTextColor` type

Defined in [src/shared/slug/text/style/color.ts](../src/shared/slug/text/style/color.ts):

```ts
type SlugTextColor =
    | string
    | number
    | readonly [number, number, number]
    | readonly [number, number, number, number];
```

### 1.3 The resolver

```ts
function slugTextColorToRgba(
    input: SlugTextColor | null | undefined,
    current: readonly [number, number, number, number]
): [number, number, number, number];
```

- `input` — user-supplied value.
- `current` — the RGBA tuple used for alpha preservation and as the fallback when input is invalid or unset.
- Return — a fresh 4-element RGBA tuple (0..1 per channel). Never shares reference with `current`.

---

## 2. Supported input forms

### 2.1 Hex strings

Allowed prefixes: `#`, `0x`, none. Case-insensitive. Whitespace is trimmed from both ends before parsing. After prefix stripping, the remaining body must be all hex characters (`0-9`, `a-f`, `A-F`) and must be **exactly 2, 3, 4, 6, or 8 characters long**.

| Digits (after prefix) | Interpretation | Alpha source | Example | Expected output |
|---|---|---|---|---|
| 2 | Grayscale `GG` → `GGGGGG` | **preserve** `current[3]` | `'#80'` with current alpha 0.5 | `[0.502, 0.502, 0.502, 0.5]` |
| 3 | RGB shorthand `RGB` → `RRGGBB` | **preserve** `current[3]` | `'#F0A'` with current alpha 0.5 | `[1, 0, 0.667, 0.5]` |
| 4 | RGBA shorthand `RGBA` → `RRGGBBAA` | **from input** (4th digit doubled) | `'#F00A'` | `[1, 0, 0, 0.667]` |
| 6 | Long-form `RRGGBB` | **preserve** `current[3]` | `'#FF0000'` with current alpha 0.5 | `[1, 0, 0, 0.5]` |
| 8 | Long-form `RRGGBBAA` | **from input** (last 2 digits) | `'#FF0000CC'` | `[1, 0, 0, 0.8]` |

**Digit expansion rules:**
- 2-digit grayscale: `GG` becomes `GGGGGG` in the 6-digit form (i.e., each nibble in the byte provides both R, G, and B channels equal to that byte).
- 3-digit shorthand: each nibble `X` becomes the byte `XX`. `F` → `0xFF = 255`, `A` → `0xAA = 170`, `0` → `0x00 = 0`.
- 4-digit shorthand: same expansion applied to each nibble including the alpha nibble.

**Prefix handling:**
- `'#FF0000'`, `'0xFF0000'`, `'FF0000'` are all equivalent.
- `'0xff0000'` (lowercase) is equivalent to `'0xFF0000'`.
- Prefix must appear at the **start** of the string after trim. `'FF0x0000'` is invalid (treated as 8-digit body, non-hex characters present).

### 2.2 Hex numbers

JavaScript number literals can't distinguish 6-digit from 8-digit forms by syntax — `0xFF0000` and `0x00FF0000` have identical values. Classification is therefore by **magnitude**:

| Numeric range | Interpretation | Alpha source | Example | Expected output |
|---|---|---|---|---|
| `0 ≤ n ≤ 0xFFFFFF` | 6-digit RGB | **preserve** `current[3]` | `0xFF0000` with current alpha 0.5 | `[1, 0, 0, 0.5]` |
| `0xFFFFFF < n ≤ 0xFFFFFFFF` | 8-digit RRGGBBAA | **from input** | `0xFF0000CC` | `[1, 0, 0, 0.8]` |

**Consequence to communicate to users:** a literal `0xFFFFFFFF` is **opaque white** (8-digit, alpha = 1.0), not "6-digit white with accidental extra bits." To get 6-digit white-with-preserved-alpha use `0xFFFFFF` or `0x00FFFFFF`.

The value `0` is valid — black with preserved alpha.

### 2.3 Numeric arrays

Array length must be exactly **3** or **4**. Each element must be finite and `0 ≤ v ≤ 255`.

**Preflight pass** determines scale by scanning all elements (RGB + alpha if present):
- If **every** element is `≤ 1` → `normalizeInput = true`. Values pass through as already-normalized 0..1.
- If **any** element is `> 1` → `normalizeInput = false`. Every element is divided by 255 to normalize to 0..1.

The preflight rule resolves the ambiguity of the value `1`. On its own, `[1, 0, 0]` is read as fully saturated normalized red. As part of `[1, 128, 255]` it is read as `1/255` in the 0..255 scale (a very dark channel). The full-array scan prevents silent scale mixing within one color.

| Array | Preflight | Output |
|---|---|---|
| `[1, 0, 0]` | `true` (all ≤ 1) | `[1, 0, 0, current[3]]` |
| `[1, 0, 0, 1]` | `true` (all ≤ 1) | `[1, 0, 0, 1]` |
| `[255, 0, 0]` | `false` (any > 1) | `[1, 0, 0, current[3]]` |
| `[1, 128, 255]` | `false` (any > 1) | `[1/255, 128/255, 1, current[3]]` |
| `[255, 0, 0, 128]` | `false` (any > 1) | `[1, 0, 0, 128/255]` |
| `[0.5, 0.25, 0.75]` | `true` | `[0.5, 0.25, 0.75, current[3]]` |
| `[0, 0, 0]` | `true` (all ≤ 1) | `[0, 0, 0, current[3]]` |
| `[0, 0, 0, 0]` | `true` | `[0, 0, 0, 0]` |

**Alpha source:** 3-element preserves `current[3]`; 4-element takes alpha from the array's 4th element (same scale as the RGB part).

### 2.4 `null` and `undefined`

`null` or `undefined` means **unset** — the caller omitted the field entirely. The resolver:
- Returns a copy of `current` unchanged.
- Does **not** log `console.error`. This is not a failure; it's the normal "use default / preserve existing" path.

---

## 3. Invalid inputs

### 3.1 General contract

**Every invalid case:**
1. Logs **exactly one** `console.error` message with the `[SlugText:color]` prefix and a specific actionable message.
2. Returns a fresh copy of the `current` tuple. The caller's stored state stays unchanged.
3. **Never throws.** Color parse failures are developer feedback, not scene-breakers.

### 3.2 Invalid hex strings

All of these trigger `console.error` and preserve `current`:

| Input | Reason |
|---|---|
| `''` | Empty |
| `'#'` / `'0x'` | Bare prefix, no body |
| `'#F'` | 1 digit (unsupported length) |
| `'#FFFFF'` | 5 digits (unsupported length) |
| `'#FFFFFFF'` | 7 digits |
| `'#FFFFFFFFF'` | 9+ digits |
| `'#GGGGGG'` | Non-hex characters |
| `'#FF00ZZ'` | Mixed hex + non-hex |
| `'not a color'` | Not hex |
| `'FF0x0000'` | Prefix not at start; body has `x` after trim |

Error message format: `Invalid hex string "<input>" — expected 2, 3, 4, 6, or 8 hex digits, optionally prefixed with # or 0x.`

### 3.3 Invalid hex numbers

| Input | Reason |
|---|---|
| `-1` | Negative |
| `0x100000000` (4294967296) | Exceeds `0xFFFFFFFF` |
| `1.5` | Non-integer |
| `NaN` | Non-finite |
| `Infinity` / `-Infinity` | Non-finite |

Error message format: `Invalid hex number <input> — expected a finite integer in 0..0xFFFFFFFF.`

### 3.4 Invalid arrays

| Input | Reason |
|---|---|
| `[]` | Wrong length (0) |
| `[1]` / `[1, 2]` | Wrong length (< 3) |
| `[1, 2, 3, 4, 5]` | Wrong length (> 4) |
| `[1, -0.5, 0]` | Element < 0 |
| `[1, 256, 0]` | Element > 255 |
| `[NaN, 0, 0]` | Non-finite element |
| `[Infinity, 0, 0]` | Non-finite element |

Error message format: `Invalid color array [<values>] — each element must be a finite number in 0..255, and the array must have 3 or 4 elements.`

### 3.5 Invalid types

Any input that isn't `null`, `undefined`, `string`, `number`, or `Array`:

| Input | Reason |
|---|---|
| `true` / `false` | Boolean |
| `{}` / `{r: 1, g: 0, b: 0}` | Plain object (not array) |
| `() => 0` | Function |
| `Symbol('x')` | Symbol |

Error message format: `Unsupported color input type (<typeof>). Expected string, number, or [r, g, b] / [r, g, b, a] array.`

---

## 4. Alpha-preservation semantics

### 4.1 When alpha is preserved

The resolver preserves `current[3]` when the input provides **no** alpha information:
- Hex string with 2, 3, or 6 digits after prefix.
- Hex number `≤ 0xFFFFFF`.
- 3-element array.
- `null` / `undefined` (the entire `current` tuple is preserved, including alpha).
- Invalid input of any kind.

### 4.2 When alpha is taken from input

The resolver sets alpha from the input when the input provides alpha:
- Hex string with 4 or 8 digits after prefix.
- Hex number `> 0xFFFFFF`.
- 4-element array (alpha uses the same scale as the RGB elements, determined by the array's preflight).

### 4.3 Round-trip examples

Starting state: `_color = [0.1, 0.2, 0.3, 0.5]`.

| Assignment | Resulting `_color` |
|---|---|
| `text.color = '#FF0000'` | `[1, 0, 0, 0.5]` — alpha preserved |
| `text.color = [0, 1, 0]` | `[0, 1, 0, 0.5]` — alpha preserved |
| `text.color = 0x0000FF` | `[0, 0, 1, 0.5]` — alpha preserved |
| `text.color = '#FF0000CC'` | `[1, 0, 0, 0.8]` — alpha from input |
| `text.color = [128, 128, 128, 64]` | `[0.502, 0.502, 0.502, 0.251]` — 0..255 scale, alpha from input |
| `text.color = 0xFF000080` | `[1, 0, 0, 0.502]` — 8-digit, alpha from input |
| `text.color = null` | `[0.1, 0.2, 0.3, 0.5]` — unchanged |
| `text.color = 'bogus'` | `[0.1, 0.2, 0.3, 0.5]` — unchanged + console.error |

---

## 5. Internal contracts

### 5.1 `_dropShadow` storage shape

The user-facing `SlugDropShadow` interface has all optional fields and `color: SlugTextColor | null`. The **internal** storage uses `SlugDropShadowResolved`:

```ts
export interface SlugDropShadowResolved {
    alpha: number;
    angle: number;
    blur: number;
    color: [number, number, number, number];
    distance: number;
}
```

- `SlugTextBase._dropShadow: SlugDropShadowResolved | null` — enforces that every field, including `color`, is always resolved to a concrete value by the time rendering runs.
- The `dropShadow` getter returns `SlugDropShadowResolved | null` so consumers read the resolved shape.
- The `dropShadow` setter accepts `SlugDropShadow | null` (wide user input) and resolves on the way in.

**Why:** render passes in [src/v8/slug/text.ts](../src/v8/slug/text.ts), [src/v7/slug/text.ts](../src/v7/slug/text.ts), [src/v6/slug/text.ts](../src/v6/slug/text.ts) read `_dropShadow.color[0..3]` directly. Storing the resolved tuple keeps those call sites unchanged.

### 5.2 Strokes

`_strokeColor` is already a flat `[number, number, number, number]` field on `SlugTextBase`. No separate resolved-interface is needed.

### 5.3 Fill

`_color` is `[number, number, number, number]`. Same — no resolved-interface needed.

### 5.4 Defaults

`Defaults.SlugText.{FillColor,StrokeColor,DropShadowColor}` are `readonly [number, number, number, number]`. The resolver accepts them directly as the `current` argument via the `readonly [number, number, number, number]` parameter type. Do not mutate the defaults.

---

## 6. Integration points (call sites)

When modifying or adding color paths, every site that converts user input to stored `RGBA` must call `slugTextColorToRgba(input, current)`. Current call sites:

**[src/shared/slug/text/base.ts](../src/shared/slug/text/base.ts):**

1. `initBase` — 3 sites:
   - `this._color = slugTextColorToRgba(init.options?.fill, Defaults.SlugText.FillColor)`
   - `this._strokeColor = slugTextColorToRgba(stroke?.color, Defaults.SlugText.StrokeColor)`
   - `color: slugTextColorToRgba(ds.color, Defaults.SlugText.DropShadowColor)` (inside the `_dropShadow = { … }` literal)

2. `color` setter — `slugTextColorToRgba(value, this._color)`

3. `strokeColor` setter — `slugTextColorToRgba(value, this._strokeColor)`

4. `stroke` compound setter — `slugTextColorToRgba(value?.color, colorBase)` where `colorBase` is `this._strokeColor` when updating an active stroke, or `Defaults.SlugText.StrokeColor` when `value` is null (disabling).

5. `dropShadow` compound setter — `slugTextColorToRgba(value.color, colorBase)` where `colorBase` is `this._dropShadow.color` when updating, or `Defaults.SlugText.DropShadowColor` when first enabling the shadow.

**New color fields added in the future** must funnel through `slugTextColorToRgba`. Do not open-code hex parsing or array normalization anywhere else.

---

## 7. Dependencies & validation helpers

The resolver uses `@toreda/verify` submodule imports to avoid pulling the package's barrel (which requires `@toreda/fate` at runtime):

```ts
import {isIntPos} from '@toreda/verify/dist/is/int/pos';
import {isNumberFinite} from '@toreda/verify/dist/is/number/finite';
```

- `isIntPos(n)` — used in `parseNumber`. Returns true only for finite non-negative integers. Replaces `Number.isFinite(n) && Number.isInteger(n) && n >= 0`.
- `isNumberFinite(v)` — used in `parseArray` per-element. Replaces `Number.isFinite(v)`.

**Do not switch to the barrel import `from '@toreda/verify'`** unless `@toreda/fate` is added as an explicit dependency of pixi-slug — it will break runtime imports.

**`@toreda/strong-types`'s `isHexColorCode` / `isHexColorCodeStr` are intentionally not used** — they cap at `0xFFFFFF` / 6 hex digits and reject 8-digit inputs, which is incompatible with our alpha-from-input 8-digit handling.

---

## 8. Test matrix

Tests in [tests/shared/slug/text/style/color.spec.ts](../tests/shared/slug/text/style/color.spec.ts). Groups (update alongside any change to the rules above):

| Group | Count | Focus |
|---|---|---|
| null / undefined | 3 | Unset path, no error |
| hex string — prefixes | 5 | `#` / `0x` / none / case / whitespace |
| hex string — 2-digit | 3 | Grayscale expansion |
| hex string — 3-digit | 3 | RGB shorthand expansion |
| hex string — 4-digit | 3 | RGBA shorthand, alpha from input |
| hex string — 6-digit | 3 | Preserve alpha |
| hex string — 8-digit | 3 | Alpha from input |
| hex string — invalid | 10 | All invalid string cases, verify console.error |
| hex number — valid | 6 | Boundaries + preserve-vs-input alpha |
| hex number — invalid | 5 | Negative / out-of-range / non-integer / non-finite |
| array — normalized | 4 | All ≤ 1 branch |
| array — 0..255 | 3 | Any > 1 branch including `1` ambiguity |
| array — invalid | 8 | Wrong length / out-of-range / non-finite |
| unsupported types | 3 | Boolean / object / function |
| alpha-preservation round trip | 4 | End-to-end alpha behavior |

Target coverage: every branch of `parseHexString`, `parseNumber`, `parseArray`, and each `reportColorError` call site.

---

## 9. Change-validation checklist

When modifying color handling, verify:

- [ ] Every user-facing color field still accepts every form in §2.
- [ ] Every invalid case in §3 still logs `console.error` and preserves `current`.
- [ ] No invalid path ever throws.
- [ ] `null` / `undefined` never logs.
- [ ] Alpha preservation rules in §4 still hold.
- [ ] Internal `_dropShadow` storage is never widened to user-input types (§5.1).
- [ ] All call sites in §6 still use `slugTextColorToRgba`.
- [ ] Tests in §8 all pass.
- [ ] TypeScript typechecks clean for `tsconfig.v6.json`, `tsconfig.v7.json`, `tsconfig.v8.json`, and `tests/tsconfig.json`.

---

## 10. Out of scope

Not implemented (may be added later if demand surfaces):

- CSS named colors (`'red'`, `'transparent'`).
- `rgb(…)` / `rgba(…)` / `hsl(…)` functional notation.
- Conversion from RGBA back to hex (`slugTextRgbaToHex`).
- Per-element scale detection within a single array (currently the array is scanned once; we commit to one scale for the whole array).
