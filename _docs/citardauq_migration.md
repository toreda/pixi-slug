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

**Use the textbook per-root sign-safe form**. The shader's quadratic is `ay·t² - 2·by·t + py = 0` (note the **−2·by**, not the textbook +b). Walking through the algebra: define `Q = by + sign(by)·d` so `|Q| = |by| + d` never cancels. The identity `(by - d)(by + d) = by² - d² = ay·py` then rewrites the cancelling root in a stable form:

```glsl
float d = sqrt(max(by * by - ay * py, 0.0));
float Q = (by >= 0.0) ? (by + d) : (by - d);   // |Q| = |by| + d, never cancels
float t1, t2;
if (by >= 0.0) {
    t1 = py / Q;     // == classical (by - d)/ay (the cancellation-prone side)
    t2 = Q / ay;     // == classical (by + d)/ay
} else {
    t1 = Q / ay;     // == classical (by - d)/ay
    t2 = py / Q;     // == classical (by + d)/ay (the cancellation-prone side)
}
```

The `(by >= 0.0)` branch keeps `t1` as the same root the classical formula calls `t1` (numerator `by - d`) — important because the upstream `code & 1` and `code > 1` checks use `t1` and `t2` respectively. Swapping which root is which would render every code-3 curve backwards.

> **Note:** an earlier sketch of this doc had `q = -(abs(by) + d)` with `t1 = q/ay` for `by ≥ 0`, which inverts both signs vs classical — `t1 = -classical_t2`. The simulator's root-ordering test caught this on first run. The form above is the version the simulator and shader actually ship.

**Verify root ordering matches classical** on a handful of test curves in the simulator before going further. The simulator's `solveCitardauq` and the synthetic-sweep / real-glyph tests in [tests/shared/slug/artifact-pixel-simulator.spec.ts](../tests/shared/slug/artifact-pixel-simulator.spec.ts) cover this.

### Edge case: `ay == 0.0` exactly

When `ay` is exactly zero (possible from float32 subtraction collapse), `Q / ay` is `inf`. The other branch `py / Q` is finite. Verify in the simulator that an `inf` root either gets dropped by the curve being skipped upstream (degenerate-code check) or lands in `clamp(x + 0.5, 0, 1)` correctly without contaminating `xcov`. The `ay == 0.0` test in the simulator suite covers this case directly.

### Edge case: double root (disc → 0)

When `by² ≈ ay·py`, `d → |by|` and `Q → by`. If `by` is *also* near zero, `Q → 0` and `py/Q` blows up — but this isn't true degeneracy. The actual mathematical root is `t = by/ay` (a single root with multiplicity 2). The simulator caught this case during the O-glyph regression test — curves where `by = 0` and `py = 0` exactly produced `Q = 0` and `py/Q = NaN`, even though `ay = 48` and the classical formula gave a fine `t = 0` answer.

Handle it by special-casing `|Q| < eps` while `|ay|` is not tiny: fall back to `t1 = t2 = Q/ay`, which stays well-defined. Genuine degeneracy is when **both** `Q` and `ay` are below the threshold:

```glsl
if (abs(Q) < 1e-7 && abs(ay) < 1e-7) { /* skip — genuinely degenerate */ }
else if (abs(Q) < 1e-7) {
    // double-root case: t = Q/ay (well-defined since ay is non-tiny)
    float t = Q / ay;
    t1 = t; t2 = t;
}
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

Factor into a helper to keep the four sites in sync. The helper returns a `bool`
so the caller can `continue` the loop on genuine degeneracy:

```glsl
bool solveQuadraticRoots(float ay, float by, float py, out float t1, out float t2) {
    float disc = max(by * by - ay * py, 0.0);
    float d = sqrt(disc);
    float Q = (by >= 0.0) ? (by + d) : (by - d);
    if (abs(Q) < kCitardauqDegenEps && abs(ay) < kCitardauqDegenEps) {
        t1 = 0.0; t2 = 0.0; return false;   // genuinely degenerate — skip curve
    }
    if (abs(Q) < kCitardauqDegenEps) {
        // double root: Q → by → 0 with ay non-tiny. Use Q/ay for both.
        float t = Q / ay;
        t1 = t; t2 = t; return true;
    }
    if (by >= 0.0) { t1 = py / Q;  t2 = Q / ay; }
    else           { t1 = Q / ay;  t2 = py / Q; }
    return true;
}
```

GLSL inlines this; no call overhead. The actual implementation in [frag.glsl](../src/shared/shader/slug/frag.glsl) wraps both classical and Citardauq paths under `#if SLUG_USE_CITARDAUQ`.

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
