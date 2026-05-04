# Citardauq Migration Plan — Replacing `kQuadraticEpsilon`

## Background

The fragment shader's H-ray and V-ray solvers currently use the classical quadratic root formula `t = (by ± d) / ay` to find ray-curve intersections. As `ay → 0` (near-horizontal curves for the H-ray, near-vertical for the V-ray), `1/ay` blows up and `(by - d)` suffers catastrophic float32 cancellation. The current mitigation is `kQuadraticEpsilon`: a hard-coded threshold (`0.01`) that switches to a linear-equation fallback when `|ay|` is small.

This works but the threshold is magic. It's not pinned to screen-space scale, it had to be retuned once already (`0.0001` → `0.01` in the A/Z investigation), and it leaves the door open for the same failure mode to resurface at extreme font sizes or on fonts whose curves cluster around different `ay` values.

The Citardauq formulation is the textbook fix: a numerically-stable rearrangement of the quadratic roots that picks a non-cancelling denominator per-root based on `sign(by)`. It removes the magic threshold entirely and replaces it with a much smaller, scale-independent guard for genuinely degenerate curves.

**Performance**: Citardauq is roughly arithmetic-equivalent to the current solver (≈ +1 div, –1 branch per curve), well within the noise floor of texture-fetch–dominated curve loop. Not a deciding factor.

**Investigation context**: see [artifact_investigation_a_z.md](artifact_investigation_a_z.md) (where Citardauq is explicitly listed as the preferred follow-up — section "Caveats and follow-ups", item 1) and [artifact_investigation.md](artifact_investigation.md) (the prior V/X/R/W investigation whose fixes the new solver must not regress).

## Goal

Replace `kQuadraticEpsilon` and the four classical-formula sites in [src/shared/shader/slug/frag.glsl](../src/shared/shader/slug/frag.glsl) with a stable Citardauq solver, with no visual regression on any previously-correct glyph and elimination of the A/Z and V/X/R/W artifact families.

## Step 0 — Lock in the regression baseline

Before any code change, capture current rendering as the visual-diff reference.

1. **Screenshot golden set** at fontSize 800pt for:
   - `AAZZ##!` — current investigation set (artifacts gone after `kQuadraticEpsilon = 0.01` fix)
   - `VXRWB` — 2026-03 fix family
   - `OoeQg` — round glyphs, control group (no near-horizontal curves)
   - Pangram (uppercase + lowercase) for general regression
2. **Both encodings**: Roboto TTF and Roboto OTF. The OTF cubic→quadratic conversion in [src/shared/slug/glyph/curves.ts](../src/shared/slug/glyph/curves.ts) produces a different distribution of `ay` values and is a separate test surface.
3. **Size sweep**: 16pt, 64pt, 270pt, 800pt. Precision stress varies with screen-pixels-per-em; cover all four bands.
4. Save screenshots outside the repo (chat scrollback or a scratch directory). They are the visual-diff baseline for Step 5.

## Step 1 — Update the CPU simulator first

[tests/shared/slug/artifact-pixel-simulator.spec.ts](../tests/shared/slug/artifact-pixel-simulator.spec.ts) is a bit-exact float32 mirror of the H-ray solver. **Implement Citardauq there before touching the shader.**

Reasons:

- Runs in milliseconds; no WebGL build cycle.
- Numerically compare classical vs Citardauq across thousands of synthetic curves without GPU upload/download.
- Wrong math surfaces as a unit-test failure, not a 800pt screenshot squint.

Concrete tests to add:

- **Synthetic sweep**: 1000 curves with `ay ∈ [1e-8, 1.0]`, `by ∈ [1e-8, 1.0]`. Compare classical / current-fallback / Citardauq. Assert agreement to ~1e-4 relative error in the stable region (`|ay| > 0.01`); assert Citardauq stays bounded (`|t| < 100`) in the unstable region where classical produces runaway values.
- **Real glyph regression**: pull actual control points for Roboto's A and Z (the artifact-prone glyphs from [artifact_investigation_a_z.md](artifact_investigation_a_z.md)). Confirm Citardauq produces identical xcov to classical for pixels outside the artifact zone, and a stable bounded value for pixels inside it.

## Step 2 — Pick the Citardauq formulation

The doc's sketch in [artifact_investigation_a_z.md](artifact_investigation_a_z.md) (line 144) shows the simple two-Citardauq form:

```glsl
t1 = p12.y / (by + d);
t2 = p12.y / (by - d);
```

**This is not the form to ship.** It swaps which root is unstable: `(by - d)` cancels when `by < 0` and `d → |by|`. Half the near-horizontal curves get fixed; the other half regress. The H-ray and V-ray would exercise the failure on different glyph subsets.

**Use the textbook per-root sign-safe form**:

```glsl
float q = -(abs(by) + d);                       // safe denominator: never cancels, never zero unless degenerate
float t1 = (by >= 0.0) ? (q / ay) : (p12.y / q);
float t2 = (by >= 0.0) ? (p12.y / q) : (q / ay);
```

`abs(by) + d` avoids the `sign(by) == 0` edge case automatically (since `d ≥ 0`). The `(by >= 0.0)` branch keeps `t1` as the smaller root in the same sense the classical formula does — important because the upstream `code & 1` and `code > 1` checks use `t1` and `t2` respectively. Swapping which root is which would render every code-3 curve backwards.

**Verify root ordering matches classical** on a handful of test curves in the simulator before going further.

### Edge case: `ay == 0.0` exactly

When `ay` is exactly zero (possible from float32 subtraction collapse), `q / ay` is `inf`. The other branch `p12.y / q` is finite. Verify in the simulator that an `inf` `t2` either gets dropped by the curve being skipped upstream (degenerate-code check) or lands in `clamp(x + 0.5, 0, 1)` correctly without contaminating `xcov`. If it propagates, add a `t2 = (ay == 0.0) ? safe_value : t2` guard.

### Genuine degeneracy guard

When both `by` and `d` are tiny, `q ≈ 0` and `p12.y / q` blows up. This is the "curve is essentially a point" case and matches the existing `if (abs(by) < kQuadraticEpsilon) continue;` skip. Replace with a much smaller, less arbitrary threshold:

```glsl
if (abs(q) < 1e-7) { /* skip — genuinely degenerate */ continue; }
```

`1e-7` is sub-precision-noise for float32 in the relevant ranges and not a regime switch — it only fires for actually-degenerate inputs.

## Step 3 — Stage behind a compile-time flag

Same pattern as the existing `SLUG_DEBUG_*` flags. In [frag.glsl](../src/shared/shader/slug/frag.glsl):

```glsl
#define SLUG_USE_CITARDAUQ 1   // 0 = classical + epsilon (current), 1 = Citardauq
```

Both paths live in the shader simultaneously. Build with `0`, screenshot, build with `1`, screenshot, diff. Lets you flip back instantly if a regression appears. Plan to retire the flag (and `kQuadraticEpsilon`) after one release cycle of bake time.

## Step 4 — Replace all four solver sites at once

The current epsilon appears at four sites in [frag.glsl](../src/shared/shader/slug/frag.glsl): H-ray and V-ray, each in supersampling and non-supersampling code paths. **All four must change together.** Leaving any on the classical formula creates inconsistent rendering between paths (e.g., supersampling on vs off would produce different artifacts on the same glyph).

Factor into a helper to keep the four sites in sync:

```glsl
void solveQuadraticRoots(float ay, float by, float p_y, out float t1, out float t2) {
    float d = sqrt(max(by * by - ay * p_y, 0.0));
    float q = -(abs(by) + d);
    if (abs(q) < 1e-7) { t1 = 0.0; t2 = 0.0; return; }   // upstream code check should drop these
    if (by >= 0.0) { t1 = q / ay;    t2 = p_y / q; }
    else           { t1 = p_y / q;   t2 = q / ay;  }
}
```

GLSL inlines this; no call overhead.

## Step 5 — Visual-diff and walk the regression list

Build with the flag on, hard-reload, walk through the Step 0 golden set. Check:

1. **No new artifacts** on previously-clean glyphs (regression).
2. **A/Z stripes gone** at 800pt — already true with `kQuadraticEpsilon = 0.01`, must remain true.
3. **V/X/R/W still clean** at 800pt — the 2026-03 fix family from [artifact_investigation.md](artifact_investigation.md).
4. **Round glyphs (O, o, e, Q, g) pixel-identical** to baseline. Even subtle differences here would suggest the solver is producing slightly different roots in the stable regime — a math/rounding bug worth chasing before shipping.

For #4, a per-pixel PNG diff against the baseline screenshots is more sensitive than eyeballing.

Plus rerun the existing regression tests:
- [tests/shared/slug/bandscale-cpu-vs-vertex.spec.ts](../tests/shared/slug/bandscale-cpu-vs-vertex.spec.ts)
- [tests/shared/slug/artifact-pixel-simulator.spec.ts](../tests/shared/slug/artifact-pixel-simulator.spec.ts) (updated in Step 1)
- [tests/shared/slug/font-eager-vs-lazy.spec.ts](../tests/shared/slug/font-eager-vs-lazy.spec.ts)

## Step 6 — Retire the epsilon

Once the flag has baked for one release cycle without regressions:

1. Delete `kQuadraticEpsilon` from [frag.glsl:12](../src/shared/shader/slug/frag.glsl#L12).
2. Delete the four classical-formula branches.
3. Delete the `SLUG_USE_CITARDAUQ` flag.
4. Update [artifact_investigation_a_z.md](artifact_investigation_a_z.md) — mark the Citardauq follow-up as resolved, link to this doc.
5. Update [artifact_investigation.md](artifact_investigation.md) — note the solver replacement and confirm the V/X/R/W fixes still hold under the new solver.

## Order of operations

1. Capture golden screenshots (Step 0).
2. Implement + test Citardauq in the CPU simulator (Step 1).
3. Pick the per-root sign-safe formulation; verify root ordering (Step 2).
4. Stage in shader behind `SLUG_USE_CITARDAUQ` flag, all four sites via shared helper (Steps 3–4).
5. Visual + simulator regression check (Step 5).
6. Bake, then retire the flag and the epsilon (Step 6).

## Why the CPU simulator first

Step 1 is the highest-leverage move. A subtle bug in the Citardauq math — wrong root ordering, sign mistake, untreated `ay == 0` edge — surfaces in a 5-second test run instead of a font-rendering screenshot diff. Every subsequent step is mechanical once the simulator confirms the math.

## Risk summary

| Step | Risk | Mitigation |
|------|------|------------|
| 1 (simulator) | Bug in Citardauq math | Simulator catches it before shader change |
| 2 (formulation) | Root ordering swapped → code-3 curves render backwards | Explicit root-order assertion in simulator |
| 3 (flag) | Path divergence between flag on/off in dev | Flag is compile-time, only one path active per build |
| 4 (helper) | Inconsistent application across the four sites | Shared helper ensures identical math everywhere |
| 5 (regression) | Subtle pixel-diff on round glyphs | PNG diff against baseline; investigate before shipping |
| 6 (retire) | Removing the epsilon makes rollback harder | Bake one release cycle with flag before deletion |

## Related documents

- [artifact_investigation_a_z.md](artifact_investigation_a_z.md) — A/Z artifact resolution; Citardauq listed as preferred follow-up
- [artifact_investigation.md](artifact_investigation.md) — V/X/R/W resolution; solver context and prior fix history
- [port_risks.md](port_risks.md) — HLSL→GLSL and C++→JS porting risks, includes precision and div-by-zero entries relevant to the solver
- [webgl-requirements.md](webgl-requirements.md) — float32 precision constraints across the pipeline
