# Project Knowledge Index - pixi-slug

This file serves as a quick reference to project knowledge and documentation. For detailed information, consult the referenced documents in `_docs/`.

## Project Overview
**pixi-slug** is a PixiJS implementation of the Slug algorithm for GPU-accelerated text rendering directly from Bézier curves without texture maps or distance fields.

## Quick Links to Documentation

### Core Understanding
- **[_docs/goals.md](_docs/goals.md)** - High-level goals and strategic objectives
  *What we're trying to achieve and why*

- **[_docs/summary.md](_docs/summary.md)** - Executive summary and key innovations
  *Quick overview of the algorithm, critical components, and adoption status*

- **[_docs/requirements.md](_docs/requirements.md)** - Detailed technical requirements
  *Exact mathematical formulas, data storage specs, shader operations, GPU features*

- **[_docs/implementation.md](_docs/implementation.md)** - Complete step-by-step implementation guide
  *Every phase of the algorithm mapped to code: CPU preprocessing (TypeScript) → vertex shader → fragment shader. Derived from US Patent 10,373,352. Includes data flow diagram, patent claim mapping, equivalence class table, and file-to-step index.*

- **[_docs/webgl-requirements.md](_docs/webgl-requirements.md)** - WebGL/PixiJS/TypeScript platform requirements
  *HLSL→GLSL translation audit, every typed array analyzed for precision drift, band texture uint32-as-float32 problem, packed attribute bit-pattern fidelity, WebGL2 feature requirements, identified risks with mitigations, invariant checklist.*

- **[_docs/artifact_investigation.md](_docs/artifact_investigation.md)** - Sharp-angle vertex artifact investigation
  *Root cause analysis, all 8 fix attempts with results, debug data from V glyph, what we haven't tried (band-split, supersampling, negative rays). Remaining artifacts at V apex, X crossing, R leg — all at shared curve endpoints with acute angles.*

- **[_docs/port_risks.md](_docs/port_risks.md)** - Port risks: HLSL→GLSL and C++→JavaScript
  *21 risks across two sections. "Port from HLSL to GLSL" (14 risks): matrix order, negative zero sign bit, div-by-zero undefined, RGBA16→32 format change, missing usampler2D, saturate(), flat provoking vertex, dFdx/dFdy spec, texelFetch OOB, integer precision, #version, precision qualifiers, ternary logic, loop limits. "Port to JavaScript" (7 risks): band float64/float32 mismatch, uint32-as-float32, NaN packing, cubic approximation, alpha premultiply, WebGL2, mobile derivatives.*

### Reference Materials
- **[_references/EXTRACTED_SUMMARY.md](_references/EXTRACTED_SUMMARY.md)** - Full technical synthesis from PDFs
  *Comprehensive details extracted from all three reference papers*

- **[_references/A Decade of Slug - Eric Lengyel.pdf](_references/A%20Decade%20of%20Slug%20-%20Eric%20Lengyel.pdf)** - Historical context and 2026 updates
  *March 2026 patent dedication to public domain*

- **[_references/Dynamic Glyph Dilation - Eric Lengyel.pdf](_references/Dynamic%20Glyph%20Dilation%20-%20Eric%20Lengyel.pdf)** - Per-vertex dilation technique
  *2019 enhancement for perspective-aware antialiasing*

- **[_references/Lengyel2017FontRendering.pdf](_references/Lengyel2017FontRendering.pdf)** - Foundational JCGT paper
  *Original algorithm publication with full mathematical details*

## Key Algorithm Components

### 1. Winding Number Test
Determines if pixel is inside glyph by casting rays and counting intersections.

**Critical Formula**:
```
Input code = ((y₁ > 0) ? 2 : 0) + ((y₂ > 0) ? 4 : 0) + ((y₃ > 0) ? 8 : 0)
Lookup: (0x2E74 >> (input_code * 2)) & 0x3
```
This magic number (0x2E74) eliminates ALL floating-point precision errors.

### 2. Root Eligibility via Equivalence Classes
**DO NOT** use floating-point range checks. Use 16-bit lookup table.

### 3. Dynamic Dilation
Quadratic equation solved per-vertex in viewport space:
```
(u² + v² - s²t²)d² - 2s³td - s⁴ = 0
d = (s³t + √(s²u² + v²)) / (u² + v² - s²t²)
```
- Perspective-aware (works at any viewing angle)
- Recalculated per frame for dynamic transforms
- Jacobian matrix required for em-space offset

### 4. Band-Based Curve Culling
Organize curves into spatial bands to avoid processing irrelevant curves per pixel.

### 5. Coverage Calculation
```
f = sat(m·Cₓ(tᵢ) + 0.5)  where m = pixels per em
```

## Data Storage Architecture

### Control Point Texture (RGBA16F)
- Two control points per texel, third point shared with next curve
- ~8 bytes per curve
- Typical: 4096×6 to 4096×100+ resolution

### Band Data Texture (RGBA16U)
- Header per band (curve count, offset, optional split location)
- Curve location lists
- Typical: 4096×5 to 4096×23 resolution

## Shader Structure

### Vertex Shader
1. Calculate dynamic dilation distance
2. Apply dilation to vertex position
3. Transform to viewport space
4. Offset em-space sampling coordinates using Jacobian

### Pixel Shader
1. Band lookup from pixel position
2. Fetch band headers
3. Iterate curves in sorted order with early-out
4. For each curve: lookup roots → calculate coverage → accumulate
5. **Critical**: No branching on coverage values (GPU efficiency)

## Important Constraints

- **Format**: TrueType quadratic Bézier curves only (not CFF cubic)
- **Precision**: Sign-based checks only (no epsilon comparisons)
- **GPU**: OpenGL 3.x+ or DirectX 10+ with 16-bit float/int textures
- **Performance**: Predictable per-curve complexity (console-class gaming)
- **Quality**: Robust at all scales, 3D transforms, perspective angles

## Band Width Formula

```
band_width = max(total_curves / 4, limited to 16 bands)
```

For fonts at 1/4 size or smaller, multiply band width reciprocally.

## Performance Targets

GeForce GTX 1060 at 2 megapixels, 50 lines, 32px/em:
- Arial (23 curves): 1.1 ms
- Times (35 curves): 1.3 ms
- Centaur (48 curves): 3.8 ms
- Hallowed (96 curves): 13.1 ms

## Reference Implementation

MIT-licensed GitHub repository available with:
- Complete vertex shader (with dynamic dilation)
- Optimized pixel shader
- Full implementation example

## Patent Status

**Granted 2019** (#10,373,352)
**Public Domain since March 17, 2026**
→ Free to use, modify, and commercialize without restrictions

## Quick Decision Matrix

### When to use band split optimization?
- Known large-size rendering only
- Trade: modest speed gain vs. shader divergence
- Default: disabled for clarity

### When to use geometry clipping?
- Very large glyphs with lots of empty space
- Trade: pixel reduction vs. occupancy loss
- Default: disabled unless profiling shows benefit

### When to use supersampling?
- Always enabled in modern implementation
- Dynamic dilation provides excellent antialiasing
- Minimal overhead compared to benefits

## File Organization

Following project conventions:
- PascalCase → nested lowercase folders + lowercase filename
- All code files follow naming convention in codebase
- Shaders: `src/shared/shader/slug/`
- TypeScript: `src/v{6,7,8}/slug/` or `src/shared/slug/`

## See Also
- [Global CLAUDE.md](../../.claude/CLAUDE.md) - User's global instructions
- Memory files at `~/.claude/projects/g--Projects-Toreda-pixi-slug/memory/` - Project history
