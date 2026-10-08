# Reference Slug Tips — Adoption Record (2026-10-08)

The official Slug repository added implementation notes after this library was first written. This document records what each tip changed in pixi-slug, what it cost, and what it measurably gained. The band statistics below were produced by running the real curve and band builders over the bundled Roboto subset (190 glyphs, 8,203 curves, 58% straight lines) and the STIX Two Math font (4,585 glyphs, 201,623 curves) with the 32-band cap.

## Summary

| Tip | Status | Where |
|---|---|---|
| 1. 16-bit float curve texture | Adopted — `rgba16float`, `Uint16Array` of half-float bits | `pack.ts`, `float16/*`, `font.ts`, `v{6,7,8}/slug/font/gpu.ts` |
| 2a. Two 16-bit uint band channels | Adopted as `r32float` with a packed uint16 pair per texel (same 4-byte footprint; PixiJS v8 cannot upload integer formats) | `pack.ts`, `frag.glsl` `fetchBand`, gpu files |
| 2b. 1/1024 em band overlap | Adopted, replacing the ±1 band margin | `bands.ts`, `Defaults.BAND_EPSILON_EM` |
| 2c. Band count tuned per glyph | Not adopted — measured ~5% gain, see below | — |
| 2d. Descending sort by max coordinate | Already done | `bands.ts` |
| 3. Identical / contiguous-subset band reuse | Adopted | `pack.ts` `layoutGlyphBands` |
| 4. Exclude axis-parallel lines | Adopted | `bands.ts` |
| 5. Cap-height pixel snapping | Adopted as opt-in helpers | `SlugFont.capHeight`, `SlugFont.snapFontSize`, `SlugText.snapBaseline` |
| 6. Lines as `{p1, p2, p2}` | Adopted | `curves.ts` `lineToQuadratic` |

## Measured band data (Roboto subset, 32-band cap)

| Strategy | Band refs | Avg max curves per band | Worst band |
|---|---|---|---|
| Before: ±1 band margin | 72,250 | 16.8 | 44 |
| Epsilon 1/1024 em | 44,002 | 12.0 | — |
| Epsilon + exclude parallel lines | 36,223 | 8.9 | 18 |
| + identical adjacent band reuse | 29,209 | 8.9 | 18 |
| + contiguous-subset reuse | 27,484 | 8.9 | 18 |

"Avg max curves per band" is the average over glyphs of the largest band, i.e. the per-pixel worst case the fragment shader loops over. Each curve costs two texel fetches plus the sign test, so tips 2b and 4 together roughly halve the per-pixel loop.

STIX Two Math shows the same ratios: 1,901,553 refs before, 818,804 after all band changes.

Band texture bytes at the final formats: Roboto 1.27 MB → 0.14 MB; STIX 33.5 MB → 4.1 MB. Curve texture bytes halved by the half-float format: Roboto 128 KB → 64 KB; STIX 3.1 MB → 1.6 MB.

### Why tip 2c was skipped

Choosing the band count per glyph to minimise the largest band gave an average max of 8.51 versus 8.93 at a fixed 32 bands on Roboto (9.58 vs 10.20 on STIX). The chosen counts spread evenly from 4 to 64, so there is no better fixed value either. Not worth the extra packing complexity. The shader already supports different horizontal and vertical counts if this is revisited.

## Notes per change

- **Epsilon vs. margin.** The ±1 band margin existed to cover CPU/GPU float32 disagreement in `int(renderCoord * bandScale + bandOffset)`. That disagreement is on the order of one float32 ulp of the band index; 1/1024 em is roughly 2 font units, thousands of ulps. Curves that start exactly on a band boundary now also land in the band below, which is the intended overlap.
- **Axis-parallel lines.** All three control points share the coordinate the ray varies along, so the winding-number lookup (`0x2E74`) always yields code 0. They cost fetches and contribute nothing. A curve with level end points but a raised control point is *not* a line and stays in the band. Stroke distance is unaffected because the perpendicular ray still sees the line.
- **Band texture packing.** Headers store `(count << 16) | offset`, references `(column << 16) | row`. The small-range field is in the high half so the float32 exponent bits (23–30) can never all be set, which rules out NaN bit patterns. Subnormal patterns (count or column below 128) are the same status quo the old `rgba32float` layout relied on. Relative list offsets must fit 16 bits; `pack.ts` throws if a glyph's band data exceeds 65,535 texels.
- **List reuse.** Any band whose sorted list is a contiguous run of a list already written for the same glyph points into it (headers are glyph-relative). Both the count pass and the write pass run the same `layoutGlyphBands` code so they cannot drift. No shader change.
- **Half-float curves.** Every integer up to 2048 is exact; above that the step is 2 font units, and in general 11 significant bits (0.05% relative error), identical in relative terms to the reference implementation's em-normalised storage. `bands.ts` rounds control points through `slugTextureFloat16Round` before computing bounds so CPU membership matches what the GPU reads. Subnormal halves are flushed to zero on the CPU so nothing depends on GPU subnormal handling.
- **Line encoding.** With a midpoint control point every line has a zero quadratic coefficient and goes through the Citardauq degenerate branch; after half-float rounding the midpoint may not stay collinear, creating a nearly-degenerate curve. With `{p1, p2, p2}` the control point and end point round identically, and `p1 - 2·p2 + p3 = p1 - p3` is non-zero for any line not parallel to the ray.
- **Cap-height snapping.** `SlugFont.snapFontSize(size, resolution)` returns the nearest size whose cap height is a whole number of device pixels. The glyph baseline in `slugGlyphQuads` is `maxGlyphTop × scale`, which depends on the string and is usually fractional, so the `snapBaseline` option rounds the baseline (and the multiline pitch, and the sub/sup and decoration anchors) to whole local pixels. Both are opt-in; the SlugText must also sit at an integer position with unit scale.

## Verification

- `tests/shared/slug/glyph/bands.spec.ts` — epsilon overlap, no whole-band margin, parallel-line exclusion, half-float quantisation of membership.
- `tests/shared/slug/texture/pack.spec.ts` — packed layout, NaN safety, identical/subset reuse, count-pass vs write-pass equality.
- `tests/shared/slug/texture/float16.spec.ts` — encode/decode round trip over every finite bit pattern, ties-to-even.
- `tests/shared/slug/font/snap.spec.ts`, `tests/shared/slug/glyph/quad-snap.spec.ts` — cap-height snapping and baseline rounding.
- `tests/shared/slug/font-eager-vs-lazy.spec.ts` — byte equivalence of eager and lazy packing still holds for the full Roboto cmap.

Visual verification in a browser (band-boundary stripes at large sizes, V/X/R/W sharp corners, A/Z at 800 px) was not run as part of this change and should be done before release.
