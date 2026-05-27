# MathText — Specification

This document is the canonical specification for `MathText`, a new public class for rendering mathematical formulas, equations, and expressions composed of one or more `SlugText` instances. Use it as the source of truth when verifying or modifying the implementation.

**Status:** Specification draft. Not yet implemented. v8 first; v6/v7 ports follow per project policy.

---

## 1. Problem

`SlugText` renders a single string with one font, one style, one baseline. Mathematical notation is fundamentally 2-D: a fraction is one expression stacked over another with a rule between them; a summation has a large operator glyph flanked by smaller index and bound expressions above and below; a matrix is a 2-D grid of cells inside auto-scaled brackets. None of this fits inside the single-string SlugText model — every formula component is a separate piece of laid-out text, sized and positioned relative to its neighbors.

Two structural needs follow from this:

1. **A composer** that places multiple SlugText instances into a coherent 2-D layout per formula.
2. **A math-font path** that has the glyphs (`∑ ∫ ∏ √ ⟨ ⟩ ≤ ≥ ≈ ∞ ℝ …`) the user's body font usually doesn't.

A formula is also rarely a single line — it might be a system of three equations with aligned `=` columns, or a piecewise definition with a brace and two cases. The composer needs to handle the multi-line case as a first-class concern, not as an afterthought stitched together by the consumer.

## 2. Goal & success criteria

**Goal:** Provide a public `MathText` class that composes one or more `SlugText` instances into a 2-D mathematical formula, with a self-contained default math font, optional user-supplied math font, and an explicit function-composition API that gives the consumer direct control over layout while the class handles per-component sizing rules.

**Success criteria:**

1. A consumer can render `Σᵢ₌₀ⁿ xᵢ/n` (summation with index, bound, and a fraction body) in 3–5 lines of TypeScript with no external dependencies.
2. The default math font ships with the package and works with zero setup — no fetch, no asset registration.
3. A user-supplied math font is used when provided; on load failure the consumer gets a `console.warn` and the default font fills in transparently.
4. Big operators (`∑ ∏ ∫`) scale visually larger than their argument expressions; fraction rules span both numerator and denominator widths; auto-scaling parens/brackets match the height of their contents.
5. Multi-line input renders as stacked lines with consumer-controllable alignment (left / center / `=`-aligned / column-aligned).
6. Mutations to a formula reuse child SlugText instances where possible (see §9 — composition cooperates with the [incremental mesh rebuild path](./incremental-mesh-rebuild.md)).
7. Toggle-off / no-op cases (empty formula, no children) work without throwing and without leaking PIXI objects.

## 3. Scope

**In scope (v1):**

- New file: `src/shared/slug/math/` package — node types, builder, layout, font default, public class mixin.
- v8 public class: `src/v8/slug/math.ts` (mirrors the SlugText v8 wrapper pattern).
- v7 / v6 ports of the v8 surface (separate sessions; v8 ships first, verified, then ported).
- Default math-font asset embedded via `scripts/build-fallback-font.mjs` (extend or fork the existing roboto-fallback build).
- Public API: `MathText` class, `MathBuilder` interface with the v1 function set (§5), `MathTextInit` / `MathTextStyleOptions`.
- Test coverage: per-node-type unit tests (layout-only, no GPU), end-to-end render tests for representative formulas, pixel-readback parity for one font swap case.

**Out of scope (explicitly deferred):**

- LaTeX or any string-syntax parser. Function composition is the only input form. A `MathText.fromLatex(...)` constructor can be added later without breaking the function API; not in v1.
- Math layout that responds to the runtime container width. Formulas are not word-wrapped — the consumer breaks lines explicitly with multi-line input (§5.5). Auto-wrap of long expressions is a future feature, not a v1 concern.
- Variable typography rules from the Unicode math spec (automatic italic for single-letter variables, etc.). v1 renders glyphs exactly as the consumer provides them in `m.text(...)` calls. Style helpers (`m.var('x')`, `m.op('sin')`) can be layered later.
- Color-by-token, per-node animation, or interactive editing. The class is a renderer, not an editor.
- WebGPU. Slug's shader is GLSL today; MathText inherits whatever backend support SlugText has at any given moment.

## 4. Architecture

### 4.1 Recursive container hierarchy

```
              ┌────────────────────────────────────────────────┐
              │  Public class — MathText extends Container     │
              │  (per-version: v6 / v7 / v8)                   │
              │  Owns ONE root MathContainer.                  │
              └──────────────────────┬─────────────────────────┘
                                     │ owns
                                     ▼
              ┌────────────────────────────────────────────────┐
              │  MathContainer tree — one container per node   │
              │  Each container owns its slots + its own       │
              │  decorations (fraction rule, sqrt vinculum,    │
              │  fence glyphs, …). Each container lays out     │
              │  its OWN children in its OWN coordinate space  │
              │  and reports (width, ascent, descent) upward.  │
              └──────────────────────┬─────────────────────────┘
                                     │ wraps (at leaves)
                                     ▼
              ┌────────────────────────────────────────────────┐
              │  SlugText instances — one per atomic text run  │
              │  Existing per-version class, untouched.        │
              └────────────────────────────────────────────────┘
```

- **Public class** (`MathText`) holds one root `MathContainer`, fires layout on mutation, owns the math-font resolution. It does not walk the tree itself — it triggers the root's `layout()` and positions only the root within its own local space.
- **MathContainer tree** is the layout engine. Each `MathNode` kind compiles to a corresponding `MathContainer` subclass (`FractionContainer`, `SubsupContainer`, `BigOpContainer`, …) which holds its child slots and any decorations it owns. Containers nest, mirroring the `MathNode` tree.
- **SlugText instances** are the leaves. Atomic text runs are wrapped by `AtomContainer`, which owns exactly one `SlugText`. SlugText has no awareness it lives inside a MathText.

### 4.2 Design tenets

The container hierarchy realizes three load-bearing tenets. Future changes to the layout engine **must preserve** these — they are why the architecture works at all.

#### Tenet 1: Recursive correctness invariant

Each container is responsible for the correctness of its own subtree. The invariant is:

> If every child container correctly reports its own `(width, ascent, descent)` and correctly positions its own children, and every parent correctly positions its slot children relative to each other using only the children's reported metrics, then the entire formula is correct by induction.

Concretely:

- A parent **never** reaches inside a child container's layout. It only reads `child.mathWidth`, `child.mathAscent`, `child.mathDescent` and assigns `child.x`, `child.y` in the parent's local coordinate space.
- A child **never** assumes anything about the parent's surrounding context. It lays out its own children in its own local space, with `(0, 0)` at its baseline-left.
- Adding a new formula kind means defining one new `MathContainer` subclass + its `layout()` rule. No other container needs to change. The invariant guarantees the new kind composes correctly with every existing kind, in any nesting position.

This is why no positioning is hard-coded against specific child types. The fraction container does not know whether its numerator is a single atom, a row, or another fraction — it only knows that whatever the numerator is, it reports honest metrics.

The contract is enforced at [`src/v8/slug/math/containers/base.ts`](../../src/v8/slug/math/containers/base.ts) via the abstract `layout()` signature and the doc comment.

#### Tenet 2: Formula-owned decorations

Each formula kind owns the symbols, shapes, and accents drawn alongside its slot content. These are not separate nodes in the tree — they are part of the parent container's render output.

Examples:

- `FractionContainer` owns the **horizontal rule** between numerator and denominator.
- `SqrtContainer` owns the **radical glyph** (`√`) and the **horizontal vinculum** over the radicand.
- `FenceContainer` owns the **opening and closing delimiter glyphs** (`(`, `)`, `[`, `]`, …).
- `AccentContainer` owns the **accent glyph** (hat, bar, vec, …) drawn over the base.
- `OverlineContainer` / `BraceContainer` own their respective lines and brace glyphs.

This colocation matters because the decoration's size, position, and stretching rules are part of the formula's identity. The fraction rule is not a generic line element drawn somewhere by the parent — it is *the fraction's own line*, drawn by the fraction itself, with size derived from the fraction's slot content.

#### Tenet 3: Rule-based slot constraints with explicit stretch behavior

Every decoration's stretching behavior is a **rule** the formula type declares — not arbitrary numeric math scattered through the layout body. Each rule answers: along which axes (`width`, `height`, both, or neither) does the decoration scale with its slot content?

Today these rules are encoded as logic inside each container's `layout()` method (the fraction rule width is `max(num.mathWidth, den.mathWidth)`; the sqrt radical height tracks the radicand's height; an accent does not stretch). They are not yet exposed as configurable fields on a per-instance basis — that's a future enhancement (see §13.5 tenet 3) which would let a consumer override the default stretch axis for advanced layouts via something like `matchSize: 'width' | 'height' | 'all' | 'none'` on each decoration.

The intent is unchanged regardless of whether the rule is hard-coded or configurable: defining a new formula kind requires declaring its slots and its decoration stretch rules, then visual correctness follows automatically for any slot content the consumer provides.

A related future tenet is **per-slot max-expansion caps** — today every slot grows freely to fit its content, which can cause a wide subscript to push a row wider than is visually desirable. Adding per-slot expansion limits is recorded as future work in §13.5.

The rule constants for sizing and gaps live in [`src/shared/slug/math/layout/sizes.ts`](../../src/shared/slug/math/layout/sizes.ts); positioning rules live inline in each container's `layout()` method.

### 4.3 Composition over inheritance

`MathText extends Container` and **owns** a root `MathContainer`. It does not extend SlugText, and it does not extend `MathContainer` directly.

**Why:** SlugText is built around a single string, one font, one mesh set, one fill/stroke/shadow pipeline. A formula has N strings, possibly different fonts (math glyphs from one font, variables from another — §7.4), and inherently 2-D positioning. Extending SlugText would mean either (a) gutting and re-routing every setter (font, fontSize, text, fill — none apply to a composite), or (b) inheriting a public API that is wrong for the new shape. Composition lets MathText present a clean math-shaped API and lets each child SlugText do its one thing well.

This was confirmed up-front; see §13.1 for the decision log entry.

### 4.4 Children are not part of the public API

Consumers interact with MathText only through `setFormula(...)` / `formula` / style setters. They do not (and cannot, supported-API-wise) walk `mathText.children` and mutate individual SlugTexts or MathContainers. The class enforces this by:

- Marking the child array's mutation as internal-only (no public method exposes a child by index).
- Documenting that direct child mutation is undefined behavior — a subsequent formula change will overwrite or destroy whatever the consumer set.
- Setting `interactiveChildren = false` and `eventMode = 'none'` on the children, mirroring SlugText (§9.1 of [parallel_shader_compile](./parallel_shader_compile.md) cites the same defensive pattern).

If the consumer needs per-component styling, that's a `MathText` style option (per-node `m.styled(node, {color: …})` helper, future) — not direct child mutation.

### 4.5 Why not a flat-placement emitter

An earlier design (recorded in pre-implementation drafts of this spec) sketched the layout engine as a depth-first walker that emits a flat `MathPlacement[]` array of `(text, font, size, x, y)` tuples. **That design was tried and abandoned.**

The flat-placement model implicitly assumes every text run shares a single global baseline that the walker can compute up-front. In practice, math layout has no single shared baseline — a fraction's numerator and denominator have *different* baselines, and a subscript drops *into* the fraction's gap region without disturbing the numerator's baseline. The flat walker could not express this because it had to commit to each placement's `y` before knowing what its siblings would do.

The recursive container model fixes this by giving each subtree its own coordinate space. A fraction's numerator computes its own internal layout (including any subscript drop) and reports a single `(width, ascent, descent)` triple to the parent. The fraction positions the *whole numerator slot* relative to the rule — not the individual letters inside it — so the rule sits at the visual center, the subscript drops into the gap, and the numerator's first letter sits at the expected y. The container model gets this right by construction; the flat model could not.

The lesson generalizes: any case where a slot's internal positioning needs to be hidden from its parent (which is **every** non-trivial math layout case) is naturally expressed in the container model and unnatural in a flat-placement model.

## 5. Public API

### 5.1 Class shape

```typescript
class MathText extends Container {
    constructor(init: MathTextInit);

    // Formula content
    public formula: MathNode | MathNode[];   // getter + setter; setter triggers layout
    public setFormula(node: MathNode | MathNode[]): void;  // explicit setter; equivalent to `formula = …`

    // Style (mirrors PIXI's pattern: assign whole object or mutate single fields)
    public style: MathTextStyle;
    public fontSize: number;                  // px, em-equivalent for the layout base size
    public font: SlugTextFontInput;           // body font (variables, digits, parens)
    public mathFont: SlugTextFontInput;       // math glyph font (defaults to bundled fallback)
    public fill: SlugTextColor;               // default fill for every child SlugText

    // Layout & multi-line
    public lineSpacing: number;               // multiplier on em (default 1.2)
    public align: 'left' | 'center' | 'right' | 'equals';  // multi-line alignment (§5.5)
    public columnGap: number;                 // gap between columns when input uses m.column(...)

    // Diagnostics — read-only
    public readonly bbox: Rectangle;          // tight bounding box across all children
    public readonly nodeCount: number;        // total MathNode count (debug)
}
```

`MathTextInit` mirrors `SlugTextInit`:

```typescript
interface MathTextInit {
    formula: MathNode | MathNode[];
    font?: SlugTextFontInput;                 // body font; defaults to roboto-fallback
    mathFont?: SlugTextFontInput;             // math font; defaults to bundled math fallback
    fontSize?: number;                        // default 24
    options?: MathTextStyleOptions;
    fallbackWhileLoading?: boolean;           // forwarded to child SlugTexts
    errorPolicy?: Partial<SlugFontErrorPolicy>;
}
```

### 5.2 Builder — `MathText.build`

Static helper that exposes the function set in one ergonomic place:

```typescript
const node = MathText.build((m) => m.summation(
    m.text('i=0'),
    m.text('n'),
    m.frac(m.text('x_i'), m.text('n'))
));

const formula = new MathText({formula: node, fontSize: 32});
```

The builder argument `m` is a `MathBuilder` — a plain object literal with one function per node kind. Each function returns a `MathNode` (an immutable tree value), so consumers can store, share, or compose subtrees freely:

```typescript
const denom = m.text('2σ²');
const top   = m.frac(m.paren(m.sub(m.text('x'), m.text('μ'))), denom);
const expr  = m.exp(m.text('e'), m.neg(top));
```

`MathNode` is the public type; the implementation tags it with a `kind` field for the layout walker, but consumers never construct nodes directly — they always go through the builder.

### 5.3 v1 builder surface — comprehensive

Per the up-front scope decision (see §13.2 / question 4 answer), v1 ships the **comprehensive** set: core layout + matrices + cases + decorations.

Grouped by purpose. **All node arguments accept `MathNode | string`** — bare strings are auto-wrapped as `m.text(s)`.

**Atoms — text runs**

| Function | Purpose | Argument shape |
|---|---|---|
| `m.text(s)` | Plain text run (body font). | `(s: string)` |
| `m.mathText(s)` | Plain text run rendered in the math font. Use for symbols the body font lacks. | `(s: string)` |
| `m.space(em)` | Explicit horizontal space, in em units. | `(em: number)` |

**Scripts**

| Function | Purpose | Argument shape |
|---|---|---|
| `m.sup(base, exponent)` | Superscript: `base^exponent`. | `(base, exp)` |
| `m.sub(base, subscript)` | Subscript: `base_subscript`. | `(base, sub)` |
| `m.subsup(base, sub, sup)` | Both at once: `base_sub^sup`. | `(base, sub, sup)` |

**Fractions and roots**

| Function | Purpose | Argument shape |
|---|---|---|
| `m.frac(num, den)` | Stacked fraction with rule. | `(num, den)` |
| `m.sqrt(radicand)` | Square root. | `(radicand)` |
| `m.nthroot(index, radicand)` | n-th root. | `(index, radicand)` |

**Big operators (above/below limits)**

| Function | Purpose | Argument shape |
|---|---|---|
| `m.summation(lower, upper, body)` | `∑` with lower (under) and upper (over) limits, body to the right. | `(lower, upper, body)` |
| `m.product(lower, upper, body)` | `∏` ditto. | `(lower, upper, body)` |
| `m.integral(lower, upper, body)` | `∫` — limits render as subscript/superscript by convention (not stacked); see §6.4. | `(lower, upper, body)` |
| `m.bigOp(symbol, lower, upper, body)` | Generic big-op for `⋂ ⋃ ⨁ ⊕` etc. | `(symbol: string, lower, upper, body)` |

**Auto-scaling fences**

| Function | Purpose | Argument shape |
|---|---|---|
| `m.paren(inner)` | `(…)`, auto-scaled to inner height. | `(inner)` |
| `m.bracket(inner)` | `[…]`. | `(inner)` |
| `m.brace(inner)` | `{…}`. | `(inner)` |
| `m.angle(inner)` | `⟨…⟩`. | `(inner)` |
| `m.abs(inner)` | `|…|` (vertical bars). | `(inner)` |
| `m.norm(inner)` | `‖…‖` (double bars). | `(inner)` |
| `m.fence(left, right, inner)` | Custom delimiter pair, e.g. `m.fence('⌊', '⌋', x)` for floor. | `(left: string, right: string, inner)` |

**Matrices & systems**

| Function | Purpose | Argument shape |
|---|---|---|
| `m.matrix(rows, fence?)` | 2-D array. `rows: MathNode[][]`. Optional fence wraps the whole matrix: `'paren' \| 'bracket' \| 'brace' \| 'abs' \| 'none'`. Default `'bracket'`. | `(rows, fence?)` |
| `m.cases(cases)` | Piecewise definition `{ … if …; …`. `cases: Array<[value, condition]>`. Renders with a left brace, two columns. | `(cases: [MathNode, MathNode][])` |
| `m.aligned(rows, anchor?)` | Multi-line aligned at a column. `rows: MathNode[][]`. `anchor`: column index that aligns (default 1 — second column, the typical `=` anchor). | `(rows, anchor?)` |

**Accents / decorations**

| Function | Purpose | Argument shape |
|---|---|---|
| `m.vec(base)` | Right-arrow accent: `x⃗`. | `(base)` |
| `m.hat(base)` | Hat: `x̂`. | `(base)` |
| `m.bar(base)` | Bar: `x̄`. | `(base)` |
| `m.dot(base)` | Single dot. | `(base)` |
| `m.ddot(base)` | Double dot. | `(base)` |
| `m.tilde(base)` | Tilde: `x̃`. | `(base)` |
| `m.overline(inner)` | Line over the whole group (width-matched, unlike `m.bar`). | `(inner)` |
| `m.underline(inner)` | Line under the whole group. | `(inner)` |
| `m.overbrace(inner, label?)` | `⏞` over a group with optional label. | `(inner, label?)` |
| `m.underbrace(inner, label?)` | `⏟` under a group. | `(inner, label?)` |
| `m.lim(var_, target, body)` | `lim` with `x→a` below and body to the right. | `(var_, target, body)` |

**Grouping & layout helpers**

| Function | Purpose | Argument shape |
|---|---|---|
| `m.row(...children)` | Inline horizontal group (variadic). Used to glue pieces that share a baseline. | `(...children)` |
| `m.column(...children)` | Vertical column group — children stack with `lineSpacing`. Used by `m.matrix` internally; also exposed for ad-hoc stacking. | `(...children)` |
| `m.styled(child, style)` | Per-node style override: `{color?, font?, fontSize?, mathFont?}`. Style is layered onto the child's resolved style. | `(child, style)` |

**That's 33 functions in the core v1 set.** Sections 5.3.1–5.3.4 below add the named-operator, separator-fence, op-atom, tensor, and "additional structural primitives" groups confirmed during the coverage-gap survey (see §13.4). The full v1 builder surface is **~80 functions** — most are thin wrappers around a shared generic node kind (e.g. 20 named-operator presets all wrap `kind: 'namedOp'`; 25 op helpers all wrap `kind: 'op'`).

#### 5.3.1 Named operators (upright function names)

Function names like `sin`, `log`, `lim` are not variables — they render upright (not italic), with function-spacing around them, and any subscript/superscript attaches to the **name** rather than the argument (`sin²(x)`, `log_b x`, `sin⁻¹`). This is a distinct typographic class.

| Function | Renders | Notes |
|---|---|---|
| `m.namedOp(name, sub?, sup?)` | Generic upright operator name with optional script slots. | Scripts use named-op script size (slightly larger than ordinary sub/sup). `m.namedOp('sin', null, '2')` → `sin²`. |
| Presets (all wrap `m.namedOp`): `m.sin m.cos m.tan m.cot m.sec m.csc m.arcsin m.arccos m.arctan m.sinh m.cosh m.tanh m.log m.ln m.exp m.det m.tr m.dim m.rank m.gcd m.max m.min m.sup_ m.inf_ m.mod m.Re m.Im m.arg m.ker m.span m.hom` | `sin x`, `cos(x)`, `log x`, `lim x`, `det(A)`, etc. | Each takes `(sub?, sup?)`. `m.sup_` and `m.inf_` use trailing underscores to avoid shadowing `m.sup` / `m.sub`. ~30 presets total. |

Composed example: `m.row(m.log(null, '2'), '8')` → `log₂ 8`. Argument is glued by `m.row` with function-spacing inserted automatically after the named op.

#### 5.3.2 Separator-fence helpers (bra-ket, set-builder, augmented matrix)

Generalize fences to accept multiple children with a separator glyph between them. Covers QM bra-ket, set-builder, and the augmented-matrix column rule with one mechanism.

| Function | Renders | Notes |
|---|---|---|
| `m.fenceSep(left, right, children[], separator?)` | Generic. `children` is laid out left-to-right with `separator` glyph (default `|`) between adjacent children, fences auto-scaled to overall height. | The escape hatch. `right` may be empty for one-sided fences. |
| `m.bra(φ)` | `⟨φ|` | One-sided fence: left `⟨`, right `|`. |
| `m.ket(ψ)` | `|ψ⟩` | One-sided fence: left `|`, right `⟩`. |
| `m.braket(φ, ψ)` | `⟨φ|ψ⟩` | `fenceSep('⟨','⟩',[φ,ψ],'|')`. |
| `m.bracketOp(φ, A, ψ)` | `⟨φ|A|ψ⟩` | Three-child variant. |
| `m.setBuilder(x, condition)` | `{x | condition}` | `fenceSep('{','}',[x,condition],'|')`. |
| Augmented matrix | `m.matrix(rows, fence, {augmentCol?})` | `augmentCol: number` (0-indexed column count from left where the vertical rule appears). Reuses existing matrix node; not a new function. |

#### 5.3.3 Operator atoms with math-class spacing

`m.op(symbol, sub?, sup?)` is a single atom that renders an operator glyph with math-class spacing (different from `m.text` which uses ordinary text spacing). The optional script slots cover the subscripted-operator case (`⊗_R`, `⊕_{j∈J}`) and render at operator-script size, not base-text size.

| Function | Glyph | Function | Glyph |
|---|---|---|---|
| `m.op(s, sub?, sup?)` | Generic | `m.in_()` | `∈` |
| `m.times()` | `×` | `m.notIn()` | `∉` |
| `m.cdot()` | `·` | `m.subset()` | `⊂` |
| `m.pm()` | `±` | `m.subseteq()` | `⊆` |
| `m.mp()` | `∓` | `m.cup()` | `∪` |
| `m.leq()` | `≤` | `m.cap()` | `∩` |
| `m.geq()` | `≥` | `m.emptySet()` | `∅` |
| `m.neq()` | `≠` | `m.land()` | `∧` |
| `m.approx()` | `≈` | `m.lor()` | `∨` |
| `m.equiv()` | `≡` | `m.lnot()` | `¬` |
| `m.cong()` | `≅` | `m.forall()` | `∀` |
| `m.sim()` | `∼` | `m.exists()` | `∃` |
| `m.to()` | `→` | `m.infty()` | `∞` |
| `m.mapsto()` | `↦` | `m.circ()` | `∘` |
| `m.implies()` | `⇒` | `m.oplus()` | `⊕` |
| `m.iff_()` | `⇔` | `m.otimes()` | `⊗` |
| `m.Implies()` | `⟹` | `m.iff_long()` | `⟺` |
| `m.degree()` | `°` |  |  |

~33 helpers + the generic. All wrap `kind: 'op'`. `m.iff_` uses a trailing underscore to avoid colliding with the JS `if` keyword's visual cluster.

#### 5.3.4 Additional structural primitives (survey-driven)

These shipped per the four survey decisions (§13.4):

| Function | Purpose | Argument shape |
|---|---|---|
| `m.tensor(base, upper[], lower[])` | Aligned multi-column tensor indices: `T^{i₁…iₘ}_{j₁…jₙ}`. Upper and lower columns render aligned at the same horizontal positions; per-column auto-width based on the wider of the two. | `(base, upper: MathNode[], lower: MathNode[])` |
| `m.map(name, from, to, mapsTo?)` | Function-signature line `name : from → to`, with the second-line `x ↦ ...` form when `mapsTo` is supplied. Spacing around `:` and `→` is the typographic math-spacing rule, not plain text. | `(name, from, to, mapsTo?)` |
| `m.stackedSub(base, ...lines)` | Big-op subscript spanning multiple stacked lines (`∑` with `i<j` written as two rows under the sigma). Each `line` argument is one row of the stacked subscript. Use with `m.bigOp` / `m.summation` etc. | `(base, ...lines: MathNode[])` |
| `m.prime(base, count?)` | Prime / multi-prime: `f′`, `f″`, `f‴`. `count` defaults to 1; renders `′` × count at superscript baseline. Distinct from `m.sup(base, "'")` because the glyph and baseline are different. | `(base, count?: number)` |
| `m.binom(n, k)` | Binomial coefficient: `n` over `k` in parens, no fraction rule. Same vertical layout as `m.frac` minus the rule. | `(n, k)` |
| `m.ellipsis(style?)` | Ellipsis atom. `style: 'baseline' \| 'center' \| 'vertical' \| 'diagonal'` → `… ⋯ ⋮ ⋱`. Default `'baseline'` for `…`. | `(style?)` |
| `m.floor(inner)` | `⌊inner⌋`. Wraps `m.fence('⌊','⌋',inner)` — convenience. | `(inner)` |
| `m.ceil(inner)` | `⌈inner⌉`. | `(inner)` |
| `m.contour(lower, upper, body)` | Contour integral `∮`. | `(lower, upper, body)` |
| `m.doubleIntegral(lower, upper, body)` | `∬`. | Convenience over `m.bigOp('∬', ...)`. |
| `m.tripleIntegral(lower, upper, body)` | `∭`. |  |
| `m.surfaceIntegral(lower, upper, body)` | `∯`. |  |
| `m.prescript(base, sub?, sup?)` | Left-side prescripts: `ᵗA`, `²₁H`. Scripts render to the **left** of the base at the same vertical positions as ordinary sub/sup. | `(base, sub?, sup?)` |

Font-variant axis (no new function — extends existing `m.styled`):

```typescript
m.styled(child, {color?, font?, fontSize?, mathFont?, variant?})
// variant: 'normal' | 'bb' | 'cal' | 'frak' | 'script'
```

When `variant !== 'normal'`, the layout substitutes the corresponding Unicode-math-alphanumeric code points (`ℝ` for `R` under `'bb'`, etc.) before glyph lookup. Falls through if a code point lacks a variant form in the active math font.

### 5.4 Strings as nodes

Every function that takes a `MathNode` also accepts a bare `string`, auto-wrapped as `m.text(s)`. This trims most formulas:

```typescript
// Verbose
m.summation(m.text('i=0'), m.text('n'), m.frac(m.text('x_i'), m.text('n')))
// Equivalent — strings auto-wrap
m.summation('i=0', 'n', m.frac('x_i', 'n'))
```

Auto-wrap uses the body font. To force the math font on a bare-string position, use `m.mathText(...)` explicitly.

### 5.5 Multi-line input

`formula` accepts either a single `MathNode` or `MathNode[]`. An array renders as stacked lines with vertical gap `lineSpacing * fontSize` between baselines and horizontal alignment per `align`:

```typescript
new MathText({
    formula: MathText.build((m) => [
        m.row('y', '=', 'mx + b'),
        m.row('m', '=', m.frac(m.text('Δy'), m.text('Δx'))),
        m.row('b', '=', 'y - mx'),
    ]),
    align: 'equals',
});
```

With `align: 'equals'` the layout finds the leftmost `m.text('=')` (or `m.mathText('=')`) in each line and column-aligns them. If a line has no `=`, it falls back to `align: 'left'` for that line only.

`align: 'columns'` is reserved — when paired with `m.column(...)` at the top level the columns align across rows. v1 ships `'left' | 'center' | 'right' | 'equals'`; `'columns'` is a follow-up.

### 5.6 Node tree shape (internal)

```typescript
type MathNode =
    | {kind: 'text'; text: string; useMathFont: boolean}
    | {kind: 'space'; em: number}
    | {kind: 'sup'; base: MathNode; sup: MathNode}
    | {kind: 'sub'; base: MathNode; sub: MathNode}
    | {kind: 'subsup'; base: MathNode; sub: MathNode; sup: MathNode}
    | {kind: 'frac'; num: MathNode; den: MathNode}
    | {kind: 'sqrt'; radicand: MathNode}
    | {kind: 'nthroot'; index: MathNode; radicand: MathNode}
    | {kind: 'bigop'; symbol: string; lower: MathNode | null; upper: MathNode | null; body: MathNode; integralStyle: boolean}
    | {kind: 'fence'; left: string; right: string; inner: MathNode}
    | {kind: 'fenceSep'; left: string; right: string; children: MathNode[]; separator: string}
    | {kind: 'matrix'; rows: MathNode[][]; fence: 'paren' | 'bracket' | 'brace' | 'abs' | 'none'; augmentCol: number | null}
    | {kind: 'cases'; cases: [MathNode, MathNode][]}
    | {kind: 'aligned'; rows: MathNode[][]; anchor: number}
    | {kind: 'accent'; base: MathNode; accent: 'vec' | 'hat' | 'bar' | 'dot' | 'ddot' | 'tilde'}
    | {kind: 'over'; inner: MathNode; line: 'overline' | 'underline'}
    | {kind: 'brace'; inner: MathNode; label: MathNode | null; position: 'over' | 'under'}
    | {kind: 'lim'; var_: MathNode; target: MathNode; body: MathNode}
    | {kind: 'row'; children: MathNode[]}
    | {kind: 'column'; children: MathNode[]}
    | {kind: 'styled'; child: MathNode; style: MathNodeStyle}
    | {kind: 'namedOp'; name: string; sub: MathNode | null; sup: MathNode | null}
    | {kind: 'op'; symbol: string; sub: MathNode | null; sup: MathNode | null}
    | {kind: 'tensor'; base: MathNode; upper: MathNode[]; lower: MathNode[]}
    | {kind: 'map'; name: MathNode; from: MathNode; to: MathNode; mapsTo: MathNode | null}
    | {kind: 'stackedSub'; base: MathNode; lines: MathNode[]}
    | {kind: 'prime'; base: MathNode; count: number}
    | {kind: 'binom'; n: MathNode; k: MathNode}
    | {kind: 'ellipsis'; style: 'baseline' | 'center' | 'vertical' | 'diagonal'}
    | {kind: 'prescript'; base: MathNode; sub: MathNode | null; sup: MathNode | null};
```

This is exported as `type MathNode` from `src/shared/slug/math/node.ts` for advanced consumers (custom builders, AST inspection). The builder is the supported construction path — consumers writing literals against the discriminated union do so at their own risk and may break on a future spec revision.

## 6. Layout engine

Lives in `src/shared/slug/math/layout/`. Pure JS — zero PIXI imports. Walks a `MathNode` tree depth-first, producing a flat array of placements:

```typescript
interface MathPlacement {
    text: string;
    font: SlugFont;
    fontSize: number;
    x: number;        // baseline x, em-space
    y: number;        // baseline y, em-space (positive = down)
    fill: Rgba;
    // Optional: per-placement extras (rule width for fractions, etc.)
}

interface MathLayoutResult {
    placements: MathPlacement[];
    rules: MathRule[];        // horizontal/vertical lines: fractions, sqrt, overline, matrix delimiters
    bbox: Rectangle;
}
```

`MathRule` carries `(x1, y1, x2, y2, thickness, fill)` for the graphics layer (§8).

### 6.1 Font-metrics adapter

The layout needs glyph widths and vertical metrics (cap height, x-height, ascender, descender) for sizing decisions. SlugText already exposes measurement via [src/shared/slug/text/measure.ts](../../src/shared/slug/text/measure.ts) — the layout calls `slugMeasureText` against resolved `SlugFont` instances to get string widths at a given font size.

Math font selection per node:
- `kind: 'text'` → body font.
- `kind: 'text'` with `useMathFont: true` (from `m.mathText`) → math font.
- `kind: 'bigop' | 'fence' | 'sqrt' | 'nthroot' | 'matrix' | 'cases' | 'over' | 'brace'` → math font for the operator/symbol glyphs; inner content uses whatever its own subtree resolves to.

### 6.2 Per-node-kind sizing rules

The layout encodes per-kind sizing rules so the consumer doesn't have to. v1 rules (modeled on TeX's `mathstyle` system, scoped down):

| Context | Size relative to enclosing |
|---|---|
| Top-level body / row content | 1.0 (the configured `fontSize`) |
| Superscript / subscript | 0.7 (one level down) |
| Sup/sub of a sup/sub | 0.5 (two levels down — floor) |
| Numerator / denominator of a top-level fraction | 1.0 |
| Numerator / denominator nested inside a fraction | 0.7 |
| Limits of `bigop` (above/below) | 0.7 |
| Operator glyph for `bigop` | 1.8 (visually larger than its arguments — answer to user requirement) |
| Operator glyph for `sqrt` / `nthroot` | matches inner height (stretchy) |
| Fence glyphs (`paren`, `bracket`, …) | matches inner height (stretchy) |
| `nthroot` index | 0.6 |
| Accent glyph | 0.8 |
| `m.cases` rows | 0.9 |

These are codified as a single constants block in `src/shared/slug/math/layout/sizes.ts` — easy to tweak in one place if the visual balance is off.

### 6.3 Fraction rule, sqrt vinculum, matrix delimiters

Fractions, square roots, and matrices have non-text rendering elements:

- **Fraction rule** — a horizontal line between numerator and denominator. Width = `max(numWidth, denWidth)`, plus a small em-padding. Thickness ≈ `0.05 * fontSize`.
- **Sqrt radical** — a glyph (`√`) from the math font, scaled to match radicand height, plus a horizontal vinculum (line over the radicand) at the top.
- **Matrix delimiters** — vertical bars on the left/right at the height of the matrix. Per-fence style: `paren` uses two `(` `)` glyphs stretched vertically; `bracket` uses `[` `]`; `brace` uses `{` `}`; `abs` uses two thin vertical rules.

These are emitted as `MathRule` entries (for straight lines: fraction rule, sqrt vinculum, `abs` bars, `overline`/`underline`) or as extra `MathPlacement` entries (for delimiter glyphs from the math font, scaled to height via the font's `√(˝˝˝˝)` stretchy variant where present, otherwise a single glyph rendered at the target height via `fontSize` adjustment).

Modern math fonts (STIX Two Math, Latin Modern Math) ship multiple sizes of delimiters under OpenType `MATH` table variants. **v1 ignores the `MATH` table** and uses a single glyph scaled by font-size adjustment. This is visually adequate at most sizes and avoids requiring an OpenType MATH parser in the build. The `MATH` table is a §13 follow-up.

### 6.4 Integral vs. summation limits

By long-standing typography convention:
- Display style: integrals render limits as superscript/subscript to the right of the `∫` glyph (not stacked above/below).
- Display style: summations and products render limits stacked above/below.

`m.integral(...)` defaults to side-set limits (the convention). `m.summation(...)` and `m.product(...)` default to stacked. Override via the generic `m.bigOp(symbol, lower, upper, body)` and the `integralStyle: boolean` field on the node (the builder does not expose this directly in v1 — it's a follow-up sugar method `m.bigOp.sideset(...)`).

## 7. Math font

### 7.1 Default — bundled

A subset of an Apache- or OFL-licensed Unicode math font, embedded the same way as [roboto.ts](../../src/shared/slug/fonts/fallback/roboto.ts):

- Source: pick **STIX Two Math** (SIL OFL 1.1) at the time of implementation. Backup: **Latin Modern Math** (GUST L) or **Asana Math** (OFL). Choice made in the implementation PR after subsetting a sample of each and comparing bundle size.
- Subset to the math-essentials code-point range (Basic Latin digits + operators + Mathematical Operators block `U+2200-U+22FF` + Mathematical Alphanumeric Symbols `U+1D400-U+1D7FF` + Supplemental Mathematical Operators `U+2A00-U+2AFF` + Miscellaneous Mathematical Symbols-A/B + arrows). Target bundle add: ≤80 KB after subset and minification. Compare to the existing 36 KB roboto-fallback.
- Generated module: `src/shared/slug/fonts/fallback/math.ts`, exporting `mathFallbackBytes: Uint8Array`.
- Build script: extend `scripts/build-fallback-font.mjs` (or add `scripts/build-math-fallback-font.mjs`) with the subset character list. Source font file checked into `assets/fonts/`.

### 7.2 Registration

The math fallback is registered on first MathText instantiation via the same `SlugFonts._installFallback` path the body roboto fallback uses. Registered under alias `'__slug_math_fallback__'` (double-underscore matches the convention for internal-but-public aliases per the [parallel_shader_compile spec §12.2.8](./parallel_shader_compile.md)).

### 7.3 User override + fallback

```typescript
new MathText({
    formula: …,
    mathFont: 'my-math',                      // URL or registered alias
});
```

Resolution flow:

1. Try to load the user's math font through the standard `SlugFonts.fromUrl` / alias path.
2. On success: every node that would have used the math font uses the user's font instead. The default is never registered or loaded.
3. On failure (timeout, fetch error, parse error): log `console.warn('[MathText] math font "…" failed to load — using default math font.')` once per failed font URL. The default math font is used in its place. The user's `errorPolicy` still applies for whether to throw.
4. While loading (the user opted in to `fallbackWhileLoading: true`): the default math font renders immediately and is swapped to the user's font once it resolves, just like SlugText's body-font fallback path.

If the user passes a non-math font as `mathFont` (e.g. Arial), the formula renders with whatever glyphs that font happens to have. `∑` and `∫` typically aren't there, so glyphs are missing — same behavior as SlugText with a font that lacks the requested code points. No error: the consumer chose the font.

### 7.4 Two-font composition

The body font (variables, digits, parens) and math font (big operators, special symbols) can be different fonts. The layout engine routes per-node: every `m.text(...)` uses the body font; every `m.mathText(...)` and every operator/fence/accent glyph uses the math font. Within a single fraction, the numerator can be all body-font and the rule + denominator scale can include math-font glyphs without seams — they're separate SlugText instances positioned in the same coordinate space.

### 7.5 Sharing the body font with SlugText

The `font` option on `MathText` accepts the same `SlugTextFontInput` as `SlugText`. If a consumer already has a font registered for their body text (e.g. they're using `SlugText` elsewhere with `'Inter'`), they pass `'Inter'` to `MathText.font` and the same registered `SlugFont` instance is reused. No second copy of the font is fetched.

## 8. Rendering — children construction

After layout produces `MathPlacement[]` and `MathRule[]`, MathText:

### 8.1 SlugText children per placement

For each placement, MathText creates or reuses one SlugText:

```typescript
new SlugText({
    text: placement.text,
    font: placement.font,
    fontSize: placement.fontSize,
    options: {fill: placement.fill},
});
```

Position the SlugText at `(placement.x, placement.y)`. Each placement is one SlugText — so `Σ` is one SlugText, the lower limit `i=0` is another, the upper limit `n` is a third, the numerator `x_i` is a fourth, the fraction rule is one `Graphics` line, the denominator `n` is a fifth SlugText. Five SlugTexts + one rule for `∑ x_i/n`.

This is intentionally finer-grained than batching letters together: each SlugText is independently positioned, sized, and (future) styled. Per-component animation, color highlighting, and click-to-edit (future) all become trivial because each component has its own node in the scene graph.

### 8.2 Rules drawn via Graphics

Fraction rules, sqrt vinculums, matrix `abs` bars, overlines and underlines are drawn into one `Graphics` child per MathText (re-cleared and re-issued on rebuild, mirroring the [decoration Graphics reuse pattern](../../src/v8/slug/decoration/fill.ts) cited in [incremental-mesh-rebuild.md §3 in-scope bullet](./incremental-mesh-rebuild.md)).

### 8.3 Child reuse on formula change

When `setFormula(...)` is called with a new tree:

1. Run the layout against the new tree.
2. Diff against the previous placements by **structural index** (the depth-first walk position in the tree). If a placement at index `i` has the same `text` and `font`, reuse the existing SlugText at that slot and update only its `fontSize` and position.
3. If `text` changed but font is the same, set the SlugText's `text` setter — which hits the [incremental mesh rebuild](./incremental-mesh-rebuild.md) path on the SlugText if the new quad count fits in the current capacity. **This is the load-bearing reuse path** — formula mutations like "value text changes from `0.95` to `0.96`" reduce to one SlugText `text` setter call, hitting the incremental rebuild fast path.
4. If the new placement count is less than the old, destroy the surplus SlugTexts.
5. If greater, create fresh ones for the new tail.

No diff is attempted across structural changes (a fraction becoming a sqrt). The full subtree's SlugTexts are recreated. The diff cost is `O(n)` in placement count, which is small for any reasonable formula.

### 8.4 Render plan

MathText's render method is a no-op — its children render themselves through the standard PIXI traversal. The class only needs to keep its child set in sync with the layout result. The geometry/GPU split in SlugText ([parallel_shader_compile §5.5](./parallel_shader_compile.md)) applies transparently to each child.

## 9. Performance characteristics

A formula with N atomic text runs creates N SlugTexts + 1 Graphics. Per-frame cost is the sum of per-SlugText render costs.

**Expected workloads:**
- Static formula (no mutations): O(1) per frame — PIXI just draws the cached meshes.
- Value-changing formula (clock displaying `m.frac(t, T)` where `t` increments): O(1) per frame on the changing leaves. The fraction rule and denominator placement don't recalculate; only the numerator's SlugText text changes, which hits the incremental rebuild path.
- Structure-changing formula (user toggling a piecewise display): O(N) per change, plus full SlugText rebuild for the new branches. Still well inside a 16 ms frame for any formula a human would write (typical N ≤ 30).

**Bundle cost:** ~80 KB math-font subset, plus the layout engine (~5–8 KB minified). Total feature cost ≈ 90 KB. Tree-shakable — consumers who only use `SlugText` and never reference `MathText` do not pay for the math font or the layout engine.

## 10. Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Math font subset misses a glyph a consumer needs | High | Document the included Unicode ranges. Consumers can pass their own math font for full coverage. Make the subset list a single source-of-truth file (`scripts/math-fallback-subset.mjs`) so adding a glyph is a one-line change + rebuild. |
| Sizing rules in §6.2 produce visually off output for some formulas | Medium | Constants in one file. Iterate on real test fixtures (LaTeX rendering side-by-side) during implementation. v1 doesn't have to be perfect — it has to be readable. |
| Stretchy delimiters at extreme sizes look bad (single glyph scaled non-uniformly) | Medium | Document the limitation in the spec. Add OpenType MATH table support as a follow-up if it becomes a complaint. |
| Diff in §8.3 misidentifies a structurally-changed subtree as reusable | Low | Conservative diff: same `text` AND same resolved font AND same kind of node. Any mismatch destroys the SlugText and creates a new one. |
| Consumer expects LaTeX input | Medium | Document up front (§3) that v1 is function-composition only. A `fromLatex(...)` constructor can land later without breaking the function API. |
| Per-MathText layout cost is non-trivial when 100+ MathTexts mutate in a frame | Low | Layout is pure JS arithmetic on a small tree — fast. If it becomes an issue, the same incremental approach SlugText uses applies (cache the placement array, diff against the new one). Not a v1 concern. |
| Math font license incompatibility | Low | Pick from OFL-licensed candidates only (STIX Two Math, Latin Modern Math, Asana Math). Document the license in the build script header same as roboto. |
| Glyph metrics from the math font's `MATH` OpenType table are ignored, causing sub-optimal vertical positioning of scripts on tall bases | Medium | v1 uses font ascender/descender — adequate for most cases. MATH-table support is §13 follow-up. |

## 11. Test surface

### 11.1 Layout-only (pure-JS, no PIXI)

| File | Cases |
|---|---|
| `tests/shared/slug/math/builder.spec.ts` | Every function returns the correct node kind; bare-string auto-wrap; nested composition. |
| `tests/shared/slug/math/layout/sizes.spec.ts` | Sizing constants table is consistent; nested sup-of-sup floors at level 2. |
| `tests/shared/slug/math/layout/walk.spec.ts` | Depth-first walk over each node kind emits the expected placement count. |
| `tests/shared/slug/math/layout/multiline.spec.ts` | `align: 'equals'` finds the `=` column; fallback to `'left'` when no `=`; line spacing matches `lineSpacing * fontSize`. |
| `tests/shared/slug/math/layout/diff.spec.ts` | Same-text/same-font placements diff as reuse; text-change emits an incremental update; structural change recreates the subtree. |

### 11.2 End-to-end (per version)

| File | Cases |
|---|---|
| `tests/v8/slug/math/render.spec.ts` (and v7 / v6 once ported) | Construct each builder primitive; assert child SlugText count matches expected placement count; bbox is non-empty. |
| `tests/v8/slug/math/font.spec.ts` | User mathFont missing → default fallback used + warn fired once; user mathFont valid → default never registered. |
| `tests/v8/slug/math/setformula.spec.ts` | `setFormula` with same-shape new tree reuses children; different-shape destroys + creates. |

### 11.3 Pixel-readback lock-in

| File | Cases |
|---|---|
| `tests/v8/slug/math/pixel.spec.ts` | One representative formula rendered with the default math font produces byte-identical pixels across reruns. Same formula with a user-supplied math font produces a different (but byte-stable) output. **Skipped in CI until a WebGL2 test harness lands** (same status as the SlugText pixel lock-in in [parallel_shader_compile §12.4 follow-up 1](./parallel_shader_compile.md)). |

## 12. Acceptance checklist

When the v1 spec is shipped on v8:

- [ ] `MathText` constructable with a single-node formula and renders without throwing.
- [ ] `MathText.build(m => …)` returns a `MathNode`; passing it to `new MathText({formula: …})` renders.
- [ ] Every v1 builder function (§5.3) accepts both `MathNode` and bare-string arguments.
- [ ] Default math font registers on first MathText instantiation; user override loads in its place; failure fallback warns and uses the default.
- [ ] Big-operator glyphs (`∑ ∏`) render visibly larger than their argument expressions per the size table (§6.2).
- [ ] Fraction renders a rule of width `max(numWidth, denWidth)` between numerator and denominator.
- [ ] Multi-line input with `align: 'equals'` column-aligns `=` glyphs across lines.
- [ ] `setFormula` with the same-shape tree mutates child SlugTexts in place; SlugText count does not increase.
- [ ] `setFormula` with a smaller tree destroys surplus SlugTexts; no PIXI object leaks (verified via reference count in a torn-down test).
- [ ] Tree-shaking: a bundle that imports only `SlugText` does not include the math fallback font bytes (verified via bundle-analyze fixture).
- [ ] v7 and v6 port the v8 surface; tests pass identically. (Separate sessions; see §13.3.)

## 13. Decision log & follow-ups

### 13.1 Decisions made up front

| Question | Decision | Rationale |
|---|---|---|
| Input form | Function composition only | Explicit, type-checkable, no parser, smallest API surface for v1. LaTeX can layer later. |
| MathText vs. SlugText | `MathText extends Container`, owns SlugText children | Composition fits the multi-string, multi-font, 2-D shape; inheritance would fight SlugText's single-string architecture. |
| Layout architecture | Recursive container hierarchy; each `MathContainer` lays out its own subtree | Flat-placement emitter (the pre-implementation draft) cannot express slot-local baselines like fraction numerator drops. Container model gets this right by construction. See §4.5 and §13.5. |
| Math font | Bake in one default, allow user override, fallback on load failure | Same pattern as existing roboto-fallback. Self-contained zero-setup feature; user can specialize. |
| v1 scope | Comprehensive (core + matrices + cases + decorations) | Single landing rather than dribbling out across versions; matrix and cases are common enough that excluding them leaves obvious gaps. |

### 13.2 Open questions (deferred, not blockers)

1. **Math font choice.** STIX Two Math vs. Latin Modern Math vs. Asana Math — picked at implementation time after subsetting and visual review. Locked in once shipped.
2. **OpenType MATH table support.** Modern math fonts encode per-size delimiter variants and italic correction offsets in the `MATH` table. v1 ignores it; if visual quality of stretchy delimiters complaints arrive, parse and use it in v2.
3. **Color-by-token.** The `m.styled(child, {color})` helper is in v1 (§5.3) but per-token coloring within a single `m.text(...)` run is not. Could be a future `m.colored(s, color)` atom that splits the run into multiple per-character SlugTexts.
4. **Animation.** Tweening between formulas (one fraction morphing into another) — out of scope; the diff in §8.3 lays the groundwork by giving each component a stable identity across changes.
5. **String DSL sugar.** A thin `m.parse('sum(i=0; n; frac(x_i; n))')` helper that produces the same tree. Add if function-call boilerplate becomes a documented complaint.

### 13.3 Suggested order

1. **Session 1:** Spec review (this doc), font choice, subset script.
2. **Session 2:** Layout engine + builder, no rendering — unit tests against `MathPlacement[]` only.
3. **Session 3:** v8 public class + child management + Graphics for rules. End-to-end renders.
4. **Session 4:** v7 port.
5. **Session 5:** v6 port.
6. **Follow-up sessions:** MATH-table support, LaTeX parser, `columns` alignment, color-by-token.

Each phase ships independently and is independently useful — session 2 alone is a fully testable layout library; session 3 makes it visible.

### 13.5 Implementation-time architectural confirmations

These tenets were recorded after the v8 implementation landed. They are the design rules the container model was built to satisfy and must be preserved by any future change to the math layout engine. Full discussion in §4.2.

1. **Recursive correctness invariant.** Each container is responsible for its own subtree's correctness. Parents read children's `(width, ascent, descent)` and position children in the parent's local space — they never inspect the child's internals. Adding a new formula kind cannot break existing kinds because of this composition guarantee.
2. **Formula-owned decorations.** Symbols and shapes drawn alongside slot content (fraction rule, sqrt radical + vinculum, fence glyphs, accents, overline/underline, brace) are owned by the parent formula container itself, not as separate nodes in the tree. The decoration's geometry derives from the parent's slot contents.
3. **Rule-based slot constraints with explicit stretch behavior.** Every decoration declares its stretch axis (`width` / `height` / both / none) so the decoration scales with its slot content automatically. Today these rules are hard-coded in each container's `layout()`; exposing them as configurable per-instance fields (e.g. `matchSize: 'width' | 'height' | 'all' | 'none'` on `FractionContainer.rule`) is a future enhancement that would let consumers tune stretch behavior without forking the container.
4. **Per-slot max-expansion caps (future).** A deliberate gap today — every slot grows freely to fit its content. Some formula kinds will benefit from a cap (e.g. a subscript constrained not to push the row wider than its base). Adding this is a separate design pass when a real use case surfaces.

## 14. Examples-page integration

The existing example pages ([examples/v8/index.html](../../examples/v8/index.html), v7, v6) show a single editable `SlugText` driven by the shared sidebar in [examples/_shared/sidebar.html](../../examples/_shared/sidebar.html). The math feature needs visibility on the same pages — but the SlugText control surface (free-form `textarea` for the text body, single-font dropdown, single-fill picker) does not apply to a composed `MathText`. A formula isn't a string the user types; it's a fixed tree the example page constructs.

### 14.1 Layout — stacked, not replacing

The example canvas shows the existing SlugText at the top as today, and renders a `MathText` underneath it at a fixed offset (e.g. half the canvas height down from the SlugText baseline). Both are live simultaneously. The user keeps the full SlugText control surface unchanged; the MathText below is a non-editable demonstration of the math composer.

This stacking serves two purposes:
1. **Visibility** — every page visitor sees that MathText exists without having to click into a separate route.
2. **Comparison** — the body font, fontSize, and fill applied to SlugText via the sidebar can be re-applied to the MathText below, so the user sees the same font rendering both as plain text and as a formula composed of multiple text runs.

### 14.2 New sidebar section — "Math"

Add a new collapsible `ctrl-group` to [sidebar.html](../../examples/_shared/sidebar.html), gated `data-requires="mathText"` (the wire helper removes the whole group on pages that don't have MathText constructed — same mechanism `data-requires="underline"` uses today for v6/v7).

Controls:

| Control | id | Type | Purpose |
|---|---|---|---|
| Formula preset | `ctrlMathPreset` | `<select>` | Picks a canned formula. Options: `quadratic` (the quadratic formula), `summation` (Σ over a fraction), `matrix` (2×2 with brackets), `gaussian` (the normal-distribution PDF), `cases` (a piecewise definition), `pythagorean` (a²+b²=c²). The hand-typed preset list is the v1 surface — no free-form formula input. |
| Math font | `ctrlMathFont` | `<select>` | Default math font / user override. Initially: `default` (bundled fallback) + each loaded user font that exposes math glyph coverage. Mirrors the existing `ctrlFont` shape. |
| Math font size | `ctrlMathSize` | `<input type="range">` + numeric pair | Base em size for the formula. Defaults to 48; range 12–200. Matches the slider+numeric pair pattern of `ctrlFontSize`. |
| Math align (multi-line) | `ctrlMathAlign` | `<select>` | `left` / `center` / `right` / `equals`. Only affects multi-line presets. |
| Line spacing | `ctrlMathLineSpacing` | `<input type="range">` + numeric | Multiplier on em (default 1.2). Range 0.8–2.5. Demonstrates the `lineSpacing` property. |
| Use body font for variables | `ctrlMathUseBodyFont` | `<input type="checkbox">` | When checked, `m.text(...)` runs use the body font from `ctrlFont`. When unchecked, the formula renders entirely in the math font. Demonstrates the two-font composition path (§7.4). Default: checked. |

**Why a preset dropdown instead of a builder UI:** a drag-and-drop or function-by-function builder UI is its own feature and would dwarf the value of just showing the math output. The presets cover all v1 builder primitives (each preset exercises a different subset — quadratic hits `sqrt` / `frac` / `paren`, matrix hits `m.matrix`, gaussian hits `m.exp` / `m.frac` / `m.summation`-style fonts, etc.). Future enhancement: a tabbed inspector that shows the `MathText.build(...)` source code beside the rendered output, so a curious user can copy-paste into their own project.

### 14.3 Wire-up — `examples/_shared/wire.js`

The shared wire helper already constructs one SlugText, binds the sidebar controls to it, and re-renders on change. Extend it:

1. **Optional second instance.** Add a `wireMathText(scene, sidebar)` exported helper. Each per-version example page calls it after `wireSlugText`. Helper signature: `(app, parent, options) => MathText | null`. Returns `null` on the v6/v7 path until those ports land — caller no-ops.
2. **Position the MathText below the SlugText.** Compute a y-offset from the SlugText's bbox bottom (after each SlugText render) and place the MathText there with a small em-gap. This keeps the two visually grouped without overlap as the SlugText fontSize slider changes.
3. **Preset → MathNode tree.** A `mathPresets.js` module exports `{quadratic, summation, matrix, gaussian, cases, pythagorean}` — each a function `(m) => MathNode | MathNode[]`. The wire helper picks the function by the `ctrlMathPreset` value and passes it to `MathText.build(...)` then `setFormula(...)`.
4. **Live re-render.** Changing any math sidebar control calls the appropriate MathText setter (`fontSize`, `font`, `mathFont`, `align`, `lineSpacing`, etc.). No full reconstruction — same change-detection as the SlugText controls today.
5. **Body-font sync.** When `ctrlMathUseBodyFont` is checked, the `MathText.font` setter is bound to the same value as `ctrlFont`. Switching the body font in the main `Font` group updates both the SlugText and the MathText.

### 14.4 Per-version page changes

Each example page adds two lines after its `wireSlugText` call:

```javascript
// In examples/v8/index.html (and v7, v6 once ported)
import {wireMathText} from '../_shared/wire.js';
const mathText = wireMathText(app, scene, {initialPreset: 'quadratic'});
```

The HTML markup change is just the new `<div class="ctrl-group" data-requires="mathText">…</div>` in `sidebar.html`. The wire helper handles the rest, and pages on versions where MathText hasn't shipped yet get the sidebar group auto-removed by the existing `data-requires` mechanism.

### 14.5 What's left to the consumer

The example page does **not** try to show:

- A function-by-function formula builder UI. The sidebar would balloon to 4× its current size and the value-per-pixel is low — a code snippet next to the canvas (or in a docs page) covers this better than another slider group.
- Per-node styling (color a single token red, etc.). v1 ships `m.styled(...)` in the API but the example surface doesn't expose it — presets that use it can be added in a later spec revision.
- Pixel-perfect comparison against LaTeX. The examples demonstrate the renderer, not parity with TeX.

### 14.6 Acceptance — example pages

When this section is shipped:

- [ ] Each example page (v8 first; v7/v6 as their ports land) shows a SlugText at the top and a MathText below it, both visible without scrolling at a typical 1080p viewport.
- [ ] The sidebar's new `Math` group appears on pages that have a constructed MathText and is removed on pages that don't (via `data-requires="mathText"`).
- [ ] All six v1 presets (`quadratic`, `summation`, `matrix`, `gaussian`, `cases`, `pythagorean`) render visibly and switching between them via the dropdown updates the canvas within one frame.
- [ ] `ctrlMathSize`, `ctrlMathAlign`, `ctrlMathLineSpacing` mutate the MathText live with no re-construction (verified via console-logged construction count).
- [ ] `ctrlMathUseBodyFont` toggle visibly changes which font renders the `m.text(...)` parts of the formula.
- [ ] Resizing the canvas via the existing layout flow does not desynchronize the MathText's vertical placement under the SlugText.

## 15. Out of scope (recap, explicit)

- LaTeX or any string parser (v1; future).
- Word-wrap of long expressions (future).
- Variable typography rules per Unicode math spec (auto-italic single letters, etc.).
- Per-frame animation, interactive editing, color-by-token within a text run.
- OpenType MATH table (v1; future).
- WebGPU (inherits whatever SlugText supports).
- v6 / v7 in the v8 ship session — separate sessions per project policy.
