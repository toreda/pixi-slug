#version 300 es
// ===================================================
// Slug algorithm fragment shader — GLSL ES 3.00 port.
// Root eligibility and solver math from the reference GLSL shader
// by Eric Lengyel (Lengyel2017FontRendering-GlyphShader.glsl).
// Coverage combination adapted for single-direction rays (no band split).
// ===================================================
precision highp float;
precision highp int;
precision highp sampler2D;

#define kLogBandTextureWidth 12
#define kMaxCurvesPerBand 512
#define kQuadraticEpsilon 0.0001

in vec4 vColor;
in vec2 vTexcoord;
flat in vec4 vBanding;
flat in ivec4 vGlyph;

uniform sampler2D uCurveTexture;
uniform sampler2D uBandTexture;

// Fetch two uint32 values from the band texture at the given texel coordinate.
uvec2 fetchBand(ivec2 coord)
{
	vec2 raw = texelFetch(uBandTexture, coord, 0).xy;
	return uvec2(uint(raw.x + 0.5), uint(raw.y + 0.5));
}

ivec2 CalcBandLoc(ivec2 glyphLoc, uint offset)
{
	ivec2 bandLoc = ivec2(glyphLoc.x + int(offset), glyphLoc.y);
	bandLoc.y += bandLoc.x >> kLogBandTextureWidth;
	bandLoc.x &= (1 << kLogBandTextureWidth) - 1;
	return bandLoc;
}

// CalcCoverage from the latest Slug reference shader (GitHub, March 2026).
// Near edges (high weight): weighted average provides smooth antialiasing.
// Interior (low weight): min(abs(xcov), abs(ycov)) provides solid fill.
// Interior pixels have xcov ≈ ±1.0 and ycov ≈ ±1.0 because the entering
// edge saturates to 1.0 and the exiting edge is far away (saturates to 0).
float CalcCoverage(float xcov, float ycov, float xwgt, float ywgt)
{
	float coverage = max(
		abs(xcov * xwgt + ycov * ywgt) / max(xwgt + ywgt, 1.0 / 65536.0),
		min(abs(xcov), abs(ycov))
	);

	return clamp(coverage, 0.0, 1.0);
}

out vec4 fragColor;

// Debug globals — set by SlugRender for diagnostic visualization.
float slug_debug_xcov = 0.0;
float slug_debug_ycov = 0.0;

float SlugRender(vec2 renderCoord, vec4 bandTransform, ivec4 glyphData)
{
	// Match the reference exactly: use fwidth() not abs(dFdx()).
	// fwidth(x) = abs(dFdx(x)) + abs(dFdy(x)), which differs from abs(dFdx(x))
	// when the texcoord has cross-axis derivatives (e.g. near quad edges,
	// or if the coordinate system is rotated/skewed). This affects the scale
	// factor applied to every intersection position before clamping.
	vec2 pixelsPerEm = vec2(1.0 / max(fwidth(renderCoord.x), 1.0 / 65536.0),
	                        1.0 / max(fwidth(renderCoord.y), 1.0 / 65536.0));

	ivec2 bandMax = glyphData.zw;
	bandMax.y &= 0x00FF;

	ivec2 bandIndex = clamp(ivec2(renderCoord * bandTransform.xy + bandTransform.zw), ivec2(0, 0), bandMax);
	ivec2 glyphLoc = glyphData.xy;

	float xcov = 0.0;
	float xwgt = 0.0;

	// ---------------------------------------------------------------
	// Horizontal ray (+X direction)
	// ---------------------------------------------------------------

	uvec2 hbandData = fetchBand(ivec2(glyphLoc.x + bandIndex.y, glyphLoc.y));
	ivec2 hbandLoc = CalcBandLoc(glyphLoc, hbandData.y);

	int hcount = min(int(hbandData.x), kMaxCurvesPerBand);
	for (int curveIndex = 0; curveIndex < hcount; curveIndex++)
	{
		ivec2 curveLoc = ivec2(fetchBand(ivec2(hbandLoc.x + curveIndex, hbandLoc.y)));
		vec4 p12 = texelFetch(uCurveTexture, curveLoc, 0) - vec4(renderCoord, renderCoord);
		vec2 p3 = texelFetch(uCurveTexture, ivec2(curveLoc.x + 1, curveLoc.y), 0).xy - renderCoord;

		if (max(max(p12.x, p12.z), p3.x) * pixelsPerEm.x < -0.5) break;

		// Root eligibility from y-coordinate signs (reference convention).
		uint code = (0x2E74u >> (((p12.y > 0.0) ? 2u : 0u) +
		        ((p12.w > 0.0) ? 4u : 0u) + ((p3.y > 0.0) ? 8u : 0u))) & 3u;

		if (code != 0u)
		{
			float ax = p12.x - p12.z * 2.0 + p3.x;
			float ay = p12.y - p12.w * 2.0 + p3.y;
			float bx = p12.x - p12.z;
			float by = p12.y - p12.w;
			float ra = 1.0 / ay;

			float d = sqrt(max(by * by - ay * p12.y, 0.0));
			float t1 = (by - d) * ra;
			float t2 = (by + d) * ra;

			// Match reference exactly: no guard on by. In GLSL ES, division by
			// zero is undefined, but the result is clamped immediately after.
			// If by ≈ 0, the clamp saturates the contribution to 0 or 1.
			if (abs(ay) < kQuadraticEpsilon) { t1 = p12.y * 0.5 / by; t2 = t1; }

			float x1 = (ax * t1 - bx * 2.0) * t1 + p12.x;
			float x2 = (ax * t2 - bx * 2.0) * t2 + p12.x;
			x1 *= pixelsPerEm.x;
			x2 *= pixelsPerEm.x;

			if ((code & 1u) != 0u)
			{
				xcov += clamp(x1 + 0.5, 0.0, 1.0);
				xwgt = max(xwgt, clamp(1.0 - abs(x1) * 2.0, 0.0, 1.0));
			}

			if (code > 1u)
			{
				xcov -= clamp(x2 + 0.5, 0.0, 1.0);
				xwgt = max(xwgt, clamp(1.0 - abs(x2) * 2.0, 0.0, 1.0));
			}
		}
	}

	// ---------------------------------------------------------------
	// Vertical ray (+Y direction)
	// Same solver as horizontal with x↔y roles swapped.
	// ---------------------------------------------------------------

	float ycov = 0.0;
	float ywgt = 0.0;

	uvec2 vbandData = fetchBand(ivec2(glyphLoc.x + bandMax.y + 1 + bandIndex.x, glyphLoc.y));
	ivec2 vbandLoc = CalcBandLoc(glyphLoc, vbandData.y);

	int vcount = min(int(vbandData.x), kMaxCurvesPerBand);
	for (int curveIndex = 0; curveIndex < vcount; curveIndex++)
	{
		ivec2 curveLoc = ivec2(fetchBand(ivec2(vbandLoc.x + curveIndex, vbandLoc.y)));
		vec4 p12 = texelFetch(uCurveTexture, curveLoc, 0) - vec4(renderCoord, renderCoord);
		vec2 p3 = texelFetch(uCurveTexture, ivec2(curveLoc.x + 1, curveLoc.y), 0).xy - renderCoord;

		if (max(max(p12.y, p12.w), p3.y) * pixelsPerEm.y < -0.5) break;

		uint code = (0x2E74u >> (((p12.x > 0.0) ? 2u : 0u) +
		        ((p12.z > 0.0) ? 4u : 0u) + ((p3.x > 0.0) ? 8u : 0u))) & 3u;

		if (code != 0u)
		{
			float ax = p12.y - p12.w * 2.0 + p3.y;
			float ay = p12.x - p12.z * 2.0 + p3.x;
			float bx = p12.y - p12.w;
			float by = p12.x - p12.z;
			float ra = 1.0 / ay;

			float d = sqrt(max(by * by - ay * p12.x, 0.0));
			float t1 = (by - d) * ra;
			float t2 = (by + d) * ra;

			if (abs(ay) < kQuadraticEpsilon) { t1 = p12.x * 0.5 / by; t2 = t1; }

			float y1 = (ax * t1 - bx * 2.0) * t1 + p12.y;
			float y2 = (ax * t2 - bx * 2.0) * t2 + p12.y;
			y1 *= pixelsPerEm.y;
			y2 *= pixelsPerEm.y;

			if ((code & 1u) != 0u)
			{
				ycov += clamp(y1 + 0.5, 0.0, 1.0);
				ywgt = max(ywgt, clamp(1.0 - abs(y1) * 2.0, 0.0, 1.0));
			}

			if (code > 1u)
			{
				ycov -= clamp(y2 + 0.5, 0.0, 1.0);
				ywgt = max(ywgt, clamp(1.0 - abs(y2) * 2.0, 0.0, 1.0));
			}
		}
	}

	slug_debug_xcov = xcov;
	slug_debug_ycov = ycov;

	return CalcCoverage(xcov, ycov, xwgt, ywgt);
}

void main()
{
	float cov = SlugRender(vTexcoord, vBanding, vGlyph);

	// Debug: color-code artifact pixels to see exactly what's happening.
	// WHITE = correct (both axes agree, coverage ~1.0)
	// YELLOW = edge transition (fractional coverage, expected)
	// RED = false positive (raw says outside but CalcCoverage says inside)
	// BLUE = false negative (raw says inside but CalcCoverage says low)
	// BLACK = correct outside
	fragColor = vColor * cov;
}
