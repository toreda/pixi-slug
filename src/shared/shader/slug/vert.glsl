#version 300 es
// ===================================================
// Slug algorithm vertex shader — GLSL ES 3.00 port.
// Original HLSL reference shader by Eric Lengyel.
// SPDX-License-Identifier: MIT OR Apache-2.0
// Copyright 2017, by Eric Lengyel.
// ===================================================

// Per-vertex attribute layout:
//
// 0 - pos  : object-space vertex coords (xy) and normal vector (zw)
// 1 - tex  : em-space sample coords (xy), packed glyph data location (z), packed band max + flags (w)
// 2 - jac  : inverse Jacobian matrix entries (00, 01, 10, 11)
// 3 - bnd  : band scale x, band scale y, band offset x, band offset y
// 4 - col  : vertex color (rgba)

precision highp float;
precision highp int;

layout(location = 0) in vec4 aPositionNormal; // pos xy + normal zw
layout(location = 1) in vec4 aTexcoord;       // em-space uv + packed glyph loc + packed bands
layout(location = 2) in vec4 aJacobian;       // inverse Jacobian (00, 01, 10, 11)
layout(location = 3) in vec4 aBanding;        // band scale xy + band offset xy
layout(location = 4) in vec4 aColor;          // vertex color rgba

// PixiJS v8 global uniforms — auto-populated each frame by the renderer (bind group 100).
uniform mat3 uProjectionMatrix; // Orthographic projection: world pixels → NDC.
uniform vec2 uResolution;       // Viewport size in pixels (width, height).

// PixiJS v8 local uniforms — per-object transform injected by MeshPipe (bind group 101).
uniform mat3 uTransformMatrix;  // World transform of this mesh: local → world pixels.

// Per-pass fill bbox in object/model-local pixel space — same coordinate
// space as aPositionNormal.xy. Drives `vFillUV` for gradient/texture
// sampling in the fragment shader. For solid fills the value is unused.
//   xy = bbox min (top-left)
//   zw = bbox size (width, height)
uniform vec4 uFillBoundsPx;

out vec4 vColor;
out vec2 vTexcoord;
out vec2 vFillUV;
flat out vec4 vBanding;
flat out ivec4 vGlyph;

// Unpack glyph metadata from bit-packed float32 vertex attributes.
// Reads aTexcoord.zw (packed integers) and aBanding (band transform) —
// independent of the em-space coords in aTexcoord.xy used by SlugDilate.
void SlugUnpack(vec4 tex, vec4 bnd, out vec4 vbnd, out ivec4 vgly)
{
	uvec2 g = floatBitsToUint(tex.zw);
	vgly = ivec4(
		int(g.x & 0xFFFFu),
		int(g.x >> 16u),
		int(g.y & 0xFFFFu),
		int(g.y >> 16u)
	);
	vbnd = bnd;
}

// Compute dynamic glyph dilation (Lengyel 2019).
// Expands the bounding polygon by 0.5 pixels in viewport space so the
// rasterizer generates fragments for boundary pixels whose centers fall
// just outside the undilated quad.
//
// The displacement uses pos.zw (the raw scaled normal, e.g. (-1,-1) at corners)
// rather than the unit normal n. The scalar factor is derived from n via u and v,
// and the magnitude of pos.zw is absorbed into the quadratic solution — this is
// correct per the Dynamic Glyph Dilation paper.
vec2 SlugDilate(vec4 pos, vec4 tex, vec4 jac, mat4 mvp, vec2 dim, out vec2 vpos)
{
	// INVARIANT: pos.zw (normal) must be nonzero. quad.ts always sets
	// normals to (-1,-1), (1,-1), (1,1), (-1,1) for quad corners.
	vec2 n = normalize(pos.zw);

	// Project position and normal through the MVP matrix.
	vec4 Mpos = mvp * vec4(pos.xy, 0.0, 1.0);
	vec4 Mn   = mvp * vec4(n,      0.0, 0.0);

	float s = Mpos.w;
	float t = Mn.w;

	float u = (s * Mn.x - t * Mpos.x) * dim.x;
	float v = (s * Mn.y - t * Mpos.y) * dim.y;

	float s2 = s * s;
	float st = s * t;
	float uv = u * u + v * v;

	// Solve: (uv - st²)d² - 2s³t·d - s⁴ = 0
	// Guard the denominator against division-by-zero (undefined in GLSL ES,
	// see port_risks.md GLSL-3). For orthographic 2D, t=0 always so the
	// denominator is uv = u²+v². It is zero only when the normal projects
	// to zero screen-space length (degenerate MVP or zero viewport).
	// In that case, skip dilation — the vertex stays at its original position.
	float denom = uv - st * st;
	if (abs(denom) < 1e-10)
	{
		vpos = pos.xy;
		return tex.xy;
	}

	vec2 d = pos.zw * (s2 * (st + sqrt(uv)) / denom);

	vpos = pos.xy + d;
	return vec2(tex.x + dot(d, jac.xy), tex.y + dot(d, jac.zw));
}

void main()
{
	// Combine projection and world transform into a single 2D affine mat3,
	// then lift it to a column-major mat4 for the Slug dilation algorithm.
	// The W row is (0,0,0,1) — correct for orthographic projection.
	// For perspective, the W row would need to carry the actual projection terms.
	mat3 m = uProjectionMatrix * uTransformMatrix;
	mat4 mvp = mat4(
		m[0][0], m[0][1], 0.0, 0.0,  // column 0
		m[1][0], m[1][1], 0.0, 0.0,  // column 1
		0.0,     0.0,     1.0, 0.0,  // column 2
		m[2][0], m[2][1], 0.0, 1.0   // column 3
	);

	// Half viewport converts clip-space normal vectors to pixel-space distances.
	vec2 dim = uResolution * 0.5;

	vec2 p;
	vTexcoord = SlugDilate(aPositionNormal, aTexcoord, aJacobian, mvp, dim, p);

	gl_Position = mvp * vec4(p, 0.0, 1.0);

	// Bbox-relative UV in object/model-local pixel space. `p` is the
	// post-dilation pixel position before MVP — same space as the bbox
	// uniform. max() guards against zero-size bbox (e.g., empty text).
	vFillUV = (p - uFillBoundsPx.xy) / max(uFillBoundsPx.zw, vec2(1.0));

	SlugUnpack(aTexcoord, aBanding, vBanding, vGlyph);
	vColor = aColor;
}
