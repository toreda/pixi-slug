# Project Documentation

This directory contains synthesized knowledge about the Slug algorithm and pixi-slug implementation.

## Files Overview

### [goals.md](goals.md) - High-Level Goals (5.4 KB)
**What we're trying to achieve and why**
- Primary goal: Unlimited-scale GPU text rendering
- Strategic objectives (scalability, 3D transforms, efficiency, quality)
- Quality benchmarks and performance targets
- Long-term vision

### [summary.md](summary.md) - Executive Summary (3.7 KB)
**Quick overview for context**
- Core problem solved
- Key requirements
- Fundamental algorithm overview
- Critical innovation: equivalence classes (0x2E74)
- Dynamic dilation enhancement
- Performance profile
- Use cases

### [implementation.md](implementation.md) - Complete Implementation Guide (from Patent)
**Step-by-step algorithm derived from US Patent 10,373,352**
- 7 phases: font parsing → curve extraction → band computation → texture packing → quad construction → vertex shader dilation → fragment shader winding number
- Each step identifies where work happens (CPU TypeScript vs. vertex shader vs. fragment shader)
- Full data flow diagram (ASCII)
- Patent claim-to-code mapping table
- Eight equivalence classes explained with geometric meaning
- File-to-step index for navigating the codebase
- Critical constants explained (0x2E74, 1/65536, kLogBandTextureWidth)

### [webgl-requirements.md](webgl-requirements.md) - WebGL/PixiJS/TypeScript Platform Requirements
**Precision analysis, typed array audit, HLSL→GLSL translation, risk assessment**
- Audits every CPU→GPU data path (curve texture, band texture, vertex attributes, index buffer)
- Analyzes where JS float64→float32 truncation can cause drift in band assignment, curve placement, or winding
- Documents the uint32-as-float32 band texture workaround and its safety bounds (values < 2^24)
- Verifies packed integer attributes survive the float64 round-trip (NaN analysis)
- Lists all WebGL2 features required (texelFetch, flat varyings, floatBitsToUint, RGBA32F)
- Identifies 6 risks with severity ratings and mitigations
- Provides 17-item invariant checklist for correctness

### [port_risks.md](port_risks.md) - Port Risks (21 total across two sections)
**"Port from HLSL to GLSL" — 14 shader-level risks:**
- GLSL-1 (HIGH): Matrix storage row→column major — mitigated
- GLSL-2 (HIGH): Negative zero sign bit — safe but fragile, must not insert math before classification
- GLSL-3 (MEDIUM): Division by zero undefined in GLSL ES — solver linear case + dilation denominator unguarded
- GLSL-4 (MEDIUM): RGBA16F/16U → RGBA32F doubles memory/bandwidth
- GLSL-5 (MEDIUM): No `usampler2D` — PixiJS lacks integer texture formats, float workaround in place
- GLSL-6 (LOW): `saturate()` → `clamp()` — already done
- GLSL-7 (MEDIUM): `flat` provoking vertex differs (last in WebGL vs first in DX) — safe because all corners identical
- GLSL-8 (LOW): `dFdx`/`dFdy` vs `ddx`/`ddy` — 2×2 quad granularity, only affects AA smoothness
- GLSL-9 (LOW): `texelFetch` OOB returns undefined (HLSL returns zero) — safe if packing correct
- GLSL-10 (LOW): Integer bitwise precision — safe with `highp int`
- GLSL-11 (MEDIUM): `#version` directive placement — currently correct
- GLSL-12 (HIGH): `precision highp` mandatory — mediump would be catastrophic
- GLSL-13 (LOW): Ternary logic instruction unavailable — lookup table approach is equivalent
- GLSL-14 (LOW): Mobile loop iteration limits — unlikely with typical band sizes

**"Port to JavaScript" — 7 CPU/upload-level risks:**
- JS-1 (HIGH): Band assignment float64/float32 mismatch — `curveBounds()` uses float64
- JS-2 (MEDIUM): Band texture uint32→float32 — safe below 2^24, no guard
- JS-3 (LOW): NaN in packed vertex attributes — impossible for current data
- JS-4 (LOW): Cubic-to-quadratic approximation — 2 quadratics may not suffice for complex OTF
- JS-5 (HIGH if wrong): Texture alpha premultiplication — mitigated
- JS-6 (MEDIUM): WebGL2 hard requirement — no fallback
- JS-7 (LOW): Mobile derivative precision — inherent

### [requirements.md](requirements.md) - Detailed Requirements (8.2 KB)
**Exact specs for implementation**
- Mathematical requirements (Bézier curves, winding number, lookup table)
- Dynamic dilation quadratic equation
- Data storage formats (textures, layouts, dimensions)
- Shader implementation details (vertex + pixel)
- Band configuration formulas
- GPU feature requirements
- Performance tuning parameters
- Precision requirements

## Quick Reference

### For Architecture Decisions
→ Start with [goals.md](goals.md)

### For Understanding the Algorithm
→ Start with [summary.md](summary.md)

### For Implementation Details
→ Reference [requirements.md](requirements.md)

### For Deep Technical Dive
→ See [../CLAUDE.md](../CLAUDE.md) which links all resources

## Critical Formulas

**Root Eligibility Lookup** (eliminates ALL precision artifacts):
```
0x2E74 magic number applied per-curve based on y-coordinate signs
```

**Dynamic Dilation** (perspective-aware viewport expansion):
```
(u² + v² - s²t²)d² - 2s³td - s⁴ = 0
```

**Band Width** (curve organization):
```
max(total_curves / 4, limited to 16 bands)
```

## Key Constraints

- TrueType quadratic Bézier only (no cubic)
- Sign-based checks only (no epsilon comparisons)
- OpenGL 3.x+ or DirectX 10+ required
- 16-bit float and integer texture support needed

## Patent Status

✅ **Public Domain (March 17, 2026)**
- Originally granted 2019 (#10,373,352)
- Dedicated to public domain by Eric Lengyel
- Free to use, modify, and commercialize

