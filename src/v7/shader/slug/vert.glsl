#version 300 es
// ===================================================
// Slug algorithm vertex shader — GLSL ES 3.00 port.
// PixiJS v7 variant: uses v7 uniform names.
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

// PixiJS v7 uniforms — names differ from v8.
// projectionMatrix is auto-populated via renderer.globalUniforms.
// translationMatrix is set per-mesh by Mesh._renderDefault().
uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;

// Viewport size must be provided manually in v7 (no built-in uResolution).
uniform vec2 uResolution;

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

vec2 SlugDilate(vec4 pos, vec4 tex, vec4 jac, mat4 mvp, vec2 dim, out vec2 vpos)
{
	// INVARIANT: pos.zw (normal) must be nonzero.
	vec2 n = normalize(pos.zw);

	vec4 Mpos = mvp * vec4(pos.xy, 0.0, 1.0);
	vec4 Mn   = mvp * vec4(n,      0.0, 0.0);

	float s = Mpos.w;
	float t = Mn.w;

	float u = (s * Mn.x - t * Mpos.x) * dim.x;
	float v = (s * Mn.y - t * Mpos.y) * dim.y;

	float s2 = s * s;
	float st = s * t;
	float uv = u * u + v * v;

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
	mat3 m = projectionMatrix * translationMatrix;
	mat4 mvp = mat4(
		m[0][0], m[0][1], 0.0, 0.0,  // column 0
		m[1][0], m[1][1], 0.0, 0.0,  // column 1
		0.0,     0.0,     1.0, 0.0,  // column 2
		m[2][0], m[2][1], 0.0, 1.0   // column 3
	);

	vec2 dim = uResolution * 0.5;

	vec2 p;
	vTexcoord = SlugDilate(aPositionNormal, aTexcoord, aJacobian, mvp, dim, p);

	gl_Position = mvp * vec4(p, 0.0, 1.0);

	// Object-local UV inside the fill bbox. The fragment shader uses this
	// to sample gradients (mode 1/2) and to derive world-pixel coords for
	// texture fills (mode 3). Guard against zero-size bbox so single-pixel
	// glyphs don't divide by zero — matches shared/vert.glsl.
	vFillUV = (p - uFillBoundsPx.xy) / max(uFillBoundsPx.zw, vec2(1.0));

	SlugUnpack(aTexcoord, aBanding, vBanding, vGlyph);
	vColor = aColor;
}
