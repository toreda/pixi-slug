#version 300 es
// ===================================================
// Slug algorithm fragment shader — GLSL ES 3.00 port.
// Original HLSL reference shader by Eric Lengyel.
// Copyright 2017, MIT License.
// ===================================================
precision highp float;
precision highp int;
precision highp sampler2D;

#define kLogBandTextureWidth 12
#define kMaxCurvesPerBand 512

in vec4 vColor;
in vec2 vTexcoord;
flat in vec4 vBanding;
flat in ivec4 vGlyph;

uniform sampler2D uCurveTexture;
uniform sampler2D uBandTexture; // Float32 texture storing uint values as exact floats; read via fetchBand().

// Fetch two uint32 values from the band texture at the given texel coordinate.
// Uses +0.5 rounding before truncation to guard against float32 representation
// error (e.g. a value of 6 stored as 5.9999999 would truncate to 5 without it).
uvec2 fetchBand(ivec2 coord)
{
	vec2 raw = texelFetch(uBandTexture, coord, 0).xy;
	return uvec2(uint(raw.x + 0.5), uint(raw.y + 0.5));
}

out vec4 fragColor;

uint CalcRootCode(float y1, float y2, float y3)
{
	uint i1 = floatBitsToUint(y1) >> 31u;
	uint i2 = floatBitsToUint(y2) >> 30u;
	uint i3 = floatBitsToUint(y3) >> 29u;

	uint shift = (i2 & 2u) | (i1 & ~2u);
	shift = (i3 & 4u) | (shift & ~4u);

	return ((0x2E74u >> shift) & 0x0101u);
}

// Near-zero threshold used to detect degenerate quadratics and avoid
// undefined division-by-zero in GLSL ES (see port_risks.md GLSL-3).
#define kNearZero (1.0 / 65536.0)

vec2 SolveHorizPoly(vec4 p12, vec2 p3)
{
	vec2 a = p12.xy - p12.zw * 2.0 + p3;
	vec2 b = p12.xy - p12.zw;

	float t1, t2;

	if (abs(a.y) < kNearZero)
	{
		// Linear case: a ≈ 0, solve c/2b. Guard b.y to avoid undefined div-by-zero.
		float rb = 0.5 / (abs(b.y) < kNearZero ? 1.0 : b.y);
		t1 = p12.y * rb;
		t2 = t1;
	}
	else
	{
		// Quadratic case: safe to divide by a.y.
		float ra = 1.0 / a.y;
		float d = sqrt(max(b.y * b.y - a.y * p12.y, 0.0));
		t1 = (b.y - d) * ra;
		t2 = (b.y + d) * ra;
	}

	t1 = clamp(t1, 0.0, 1.0);
	t2 = clamp(t2, 0.0, 1.0);

	return vec2((a.x * t1 - b.x * 2.0) * t1 + p12.x, (a.x * t2 - b.x * 2.0) * t2 + p12.x);
}

vec2 SolveVertPoly(vec4 p12, vec2 p3)
{
	vec2 a = p12.xy - p12.zw * 2.0 + p3;
	vec2 b = p12.xy - p12.zw;

	float t1, t2;

	if (abs(a.x) < kNearZero)
	{
		// Linear case: a ≈ 0, solve c/2b. Guard b.x to avoid undefined div-by-zero.
		float rb = 0.5 / (abs(b.x) < kNearZero ? 1.0 : b.x);
		t1 = p12.x * rb;
		t2 = t1;
	}
	else
	{
		// Quadratic case: safe to divide by a.x.
		float ra = 1.0 / a.x;
		float d = sqrt(max(b.x * b.x - a.x * p12.x, 0.0));
		t1 = (b.x - d) * ra;
		t2 = (b.x + d) * ra;
	}

	t1 = clamp(t1, 0.0, 1.0);
	t2 = clamp(t2, 0.0, 1.0);

	return vec2((a.y * t1 - b.y * 2.0) * t1 + p12.y, (a.y * t2 - b.y * 2.0) * t2 + p12.y);
}

ivec2 CalcBandLoc(ivec2 glyphLoc, uint offset)
{
	ivec2 bandLoc = ivec2(glyphLoc.x + int(offset), glyphLoc.y);
	bandLoc.y += bandLoc.x >> kLogBandTextureWidth;
	bandLoc.x &= (1 << kLogBandTextureWidth) - 1;
	return bandLoc;
}

// Combine horizontal and vertical coverage into a single alpha value.
// Uses the patent's recommended simple average of the two axes
// (Patent col. 7, lines 55–60: "the simplest example is an average
// of two coverage values").
float CalcCoverage(float xcov, float ycov)
{
	float coverage = (abs(xcov) + abs(ycov)) * 0.5;

	coverage = clamp(coverage, 0.0, 1.0);

	return coverage;
}

float SlugRender(vec2 renderCoord, vec4 bandTransform, ivec4 glyphData)
{
	int curveIndex;

	vec2 emsPerPixel = vec2(abs(dFdx(renderCoord.x)), abs(dFdy(renderCoord.y)));
	vec2 pixelsPerEm = 1.0 / max(emsPerPixel, vec2(kNearZero));

	ivec2 bandMax = glyphData.zw;
	// Mask to low 8 bits — upper bits of glyphData.w are reserved for flags
	// (e.g. SLUG_EVENODD). CPU must not pack hBandCount > 256.
	bandMax.y &= 0x00FF;

	ivec2 bandIndex = clamp(ivec2(renderCoord * bandTransform.xy + bandTransform.zw), ivec2(0, 0), bandMax);
	ivec2 glyphLoc = glyphData.xy;

	float xcov = 0.0;

	uvec2 hbandData = fetchBand(ivec2(glyphLoc.x + bandIndex.y, glyphLoc.y));
	ivec2 hbandLoc = CalcBandLoc(glyphLoc, hbandData.y);

	// INVARIANT: curves in this band are sorted by descending max-x (see bands.ts).
	// The early-out break below relies on this — once a curve's max-x is more than
	// 0.5 pixels left of the pixel center, all subsequent curves are also too far.
	int hcount = min(int(hbandData.x), kMaxCurvesPerBand);
	for (curveIndex = 0; curveIndex < hcount; curveIndex++)
	{
		ivec2 curveLoc = ivec2(fetchBand(ivec2(hbandLoc.x + curveIndex, hbandLoc.y)));
		vec4 p12 = texelFetch(uCurveTexture, curveLoc, 0) - vec4(renderCoord, renderCoord);
		vec2 p3 = texelFetch(uCurveTexture, ivec2(curveLoc.x + 1, curveLoc.y), 0).xy - renderCoord;

		if (max(max(p12.x, p12.z), p3.x) * pixelsPerEm.x < -0.5) break;

		uint code = CalcRootCode(p12.y, p12.w, p3.y);
		if (code != 0u)
		{
			vec2 r = SolveHorizPoly(p12, p3) * pixelsPerEm.x;

			if ((code & 1u) != 0u)
			{
				xcov += clamp(r.x + 0.5, 0.0, 1.0);
			}

			if (code > 1u)
			{
				xcov -= clamp(r.y + 0.5, 0.0, 1.0);
			}
		}
	}

	float ycov = 0.0;

	uvec2 vbandData = fetchBand(ivec2(glyphLoc.x + bandMax.y + 1 + bandIndex.x, glyphLoc.y));
	ivec2 vbandLoc = CalcBandLoc(glyphLoc, vbandData.y);

	// INVARIANT: curves in this band are sorted by descending max-y (see bands.ts).
	int vcount = min(int(vbandData.x), kMaxCurvesPerBand);
	for (curveIndex = 0; curveIndex < vcount; curveIndex++)
	{
		ivec2 curveLoc = ivec2(fetchBand(ivec2(vbandLoc.x + curveIndex, vbandLoc.y)));
		vec4 p12 = texelFetch(uCurveTexture, curveLoc, 0) - vec4(renderCoord, renderCoord);
		vec2 p3 = texelFetch(uCurveTexture, ivec2(curveLoc.x + 1, curveLoc.y), 0).xy - renderCoord;

		if (max(max(p12.y, p12.w), p3.y) * pixelsPerEm.y < -0.5) break;

		uint code = CalcRootCode(p12.x, p12.z, p3.x);
		if (code != 0u)
		{
			vec2 r = SolveVertPoly(p12, p3) * pixelsPerEm.y;

			if ((code & 1u) != 0u)
			{
				ycov -= clamp(r.x + 0.5, 0.0, 1.0);
			}

			if (code > 1u)
			{
				ycov += clamp(r.y + 0.5, 0.0, 1.0);
			}
		}
	}

	return CalcCoverage(xcov, ycov);
}

void main()
{
	float coverage = SlugRender(vTexcoord, vBanding, vGlyph);
	fragColor = vColor * coverage;
}
