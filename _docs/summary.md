# Slug Algorithm - Executive Summary

## Overview
The **Slug algorithm** is a GPU-accelerated method for rendering antialiased text directly from Bézier curves without precomputed texture maps, distance fields, or cached glyph images.

**Developed**: Fall 2016 by Eric Lengyel
**Published**: June 2017 (Journal of Computer Graphics Techniques)
**Patent Status**: Publicly dedicated to public domain March 17, 2026
**Adoption**: Widely licensed by Activision, Blizzard, id Software, 2K Games, Ubisoft, Adobe, and many others

## Core Problem Solved
Traditional text rendering methods require precomputed texture maps or distance fields, which limit scalability and require re-rendering at different scales. Slug solves this by:
- Computing coverage directly from glyph outline curves in the shader
- Supporting unlimited scaling without quality loss
- Rendering at any perspective angle (3D transformations)
- Maintaining high quality antialiasing at all sizes

## Key Requirements
- **Robustness**: No dropped pixels, sparkles, or streaking artifacts
- **Speed**: Render reasonable amounts of text without impacting frame rates
- **Quality**: Nicely antialiased text with smooth curves and sharp corners at any scale

## Fundamental Algorithm
1. **Winding Number Test**: Determine if pixel is inside glyph by counting ray-contour intersections
2. **Root Eligibility**: Use lookup-table-based equivalence classes for robust root checking (eliminates floating-point precision errors)
3. **Coverage Calculation**: Compute antialiasing coverage for each ray intersection
4. **Band-Based Culling**: Organize curves into spatial bands to avoid processing irrelevant curves per pixel

## Critical Innovation: Equivalence Classes
Instead of checking if roots fall in valid range (error-prone with floats), classify curves using a 3-bit state:
```
Input code = ((y₁ > 0) ? 2 : 0) + ((y₂ > 0) ? 4 : 0) + ((y₃ > 0) ? 8 : 0)
Lookup table: 0x2E74
Output = (0x2E74 >> (input_code * 2)) & 0x3
```
This 16-bit lookup completely eliminates precision-based artifacts like sparkles and streaks.

## Dynamic Dilation (2019 Enhancement)
Automatically expands bounding geometry by 0.5 pixels per vertex in viewport space:
- Perspective-aware (works at any viewing angle)
- Recalculated per frame for dynamic transforms
- Optimal at all scales (no compromise needed)
- Enables proper antialiasing at small sizes and better performance at large sizes

## Performance Profile
**GeForce GTX 1060, 2-megapixel area, 50 lines at 32px/em:**
- Arial (23 curves): 1.1 ms
- Times (35 curves): 1.3 ms
- Centaur (48 curves): 3.8 ms
- Hallowed (96 curves): 13.1 ms

vs. texture-based approaches: 14× slower for complex fonts, but unlimited scalability.

## Implementation Overview
- **Data**: Bézier control points + band metadata stored in textures
- **Vertex Shader**: Calculate dynamic dilation, transform to viewport
- **Pixel Shader**: Band lookup → curve iteration → coverage accumulation
- **No branching**: All calculations execute without conditionals (maximum GPU efficiency)

## Use Cases
- Real-time 3D games with dynamic text
- Perspective-distorted UI (oblique viewing angles)
- Console gaming HUDs
- Resolution-independent GUI rendering
- Vector graphics (equations, mathematical notation)
- High-quality equation editors

## Reference Resources
- GitHub repository with MIT-licensed reference implementation
- JCGT 2017 paper with detailed mathematical foundations
- Public domain patent enables free adoption

## Key Constraints
- Supports only quadratic Bézier curves (TrueType format)
- Requires 16-bit float + integer texture support
- Band width must be chosen proportionally to font size
- Perspective projection requires correct MVP matrix per glyph
