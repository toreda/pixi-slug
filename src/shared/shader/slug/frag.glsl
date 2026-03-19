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

// Coverage combination for single-direction rays (no band-split optimization).
//
// Without band-split, interior pixels far from both edges on one axis get
// xcov ≈ +1 - 1 = 0 (the entering and exiting crossings both saturate and cancel).
// The weight tracks how close the nearest intersection is to the pixel center.
// Near edges (high weight): the weighted average provides antialiasing.
// In the interior (low weight): we fall back to max(abs(xcov), abs(ycov)) which
// correctly reads ~1.0 for pixels where at least one axis has an uncanceled crossing.
//
// Note: the reference shader uses a single accumulator with sqrt(abs(sum)*0.5),
// which works with band-split but produces dim interiors (~0.7) without it.
// xcov/ycov: fractional winding (can cancel to 0 inside glyph)
// xwgt/ywgt: proximity weight (high near edges, 0 in interior)
// xwind/ywind: integer winding number (nonzero = inside, per the patent)
//
// The fractional winding (xcov) cancels to 0 for interior pixels where both
// edge crossings are far away. The integer winding (xwind) does NOT cancel
// because it only counts crossings where Cx(t) > 0 (to the right of pixel).
// For interior pixels, the entering crossing is to the right (+1) but the
// exiting crossing is also to the right (+1 for code=1, -1 for code=2),
// so the integer winding is nonzero.
float CalcCoverage(float xcov, float ycov, float xwgt, float ywgt, float xwind, float ywind)
{
	// Integer winding is the definitive inside/outside test.
	// This produces zero artifacts at all sizes.
	// TODO: Add proper antialiasing that respects diagonal edges.
	// The challenge: per-axis fractional coverage doesn't correctly
	// represent diagonal edges where the edge crosses both axes.
	// Band-split (bidirectional rays) would solve this by preventing
	// the interior cancellation that makes per-axis coverage unreliable.
	return step(0.5, max(abs(xwind), abs(ywind)));
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

	// Single coverage accumulator matching the reference shader exactly.
	// Both horizontal and vertical rays contribute to the same variable.
	float coverage = 0.0;

	// Separate accumulators for debug visualization only.
	float xcov = 0.0;
	float xwgt = 0.0;
	float xwind = 0.0;  // integer winding from raw (unscaled) intersection position

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

			float x1raw = (ax * t1 - bx * 2.0) * t1 + p12.x;
			float x2raw = (ax * t2 - bx * 2.0) * t2 + p12.x;
			float x1 = x1raw * pixelsPerEm.x;
			float x2 = x2raw * pixelsPerEm.x;

			if ((code & 1u) != 0u)
			{
				float contrib = clamp(x1 + 0.5, 0.0, 1.0);
				xcov += contrib;
				// Patent integer winding: Cx(t) > 0 means intersection is to the RIGHT
				// of pixel in em-space (before scaling). This is the binary inside/outside test.
				xwind += step(0.0, x1raw);
				xwgt = max(xwgt, clamp(1.0 - abs(x1) * 2.0, 0.0, 1.0));
				coverage += contrib;
			}

			if (code > 1u)
			{
				float contrib = clamp(x2 + 0.5, 0.0, 1.0);
				xcov -= contrib;
				xwind -= step(0.0, x2raw);
				xwgt = max(xwgt, clamp(1.0 - abs(x2) * 2.0, 0.0, 1.0));
				coverage -= contrib;
			}
		}
	}

	// ---------------------------------------------------------------
	// Vertical ray (+Y direction)
	// Uses the rotated polynomial from the reference — note the PLUS
	// on p2's y-component (ax) and the swapped x↔y roles.
	// ---------------------------------------------------------------

	float ycov = 0.0;
	float ywgt = 0.0;
	float ywind = 0.0;  // integer winding for vertical ray

	uvec2 vbandData = fetchBand(ivec2(glyphLoc.x + bandMax.y + 1 + bandIndex.x, glyphLoc.y));
	ivec2 vbandLoc = CalcBandLoc(glyphLoc, vbandData.y);

	int vcount = min(int(vbandData.x), kMaxCurvesPerBand);
	for (int curveIndex = 0; curveIndex < vcount; curveIndex++)
	{
		ivec2 curveLoc = ivec2(fetchBand(ivec2(vbandLoc.x + curveIndex, vbandLoc.y)));
		vec4 p12 = texelFetch(uCurveTexture, curveLoc, 0) - vec4(renderCoord, renderCoord);
		vec2 p3 = texelFetch(uCurveTexture, ivec2(curveLoc.x + 1, curveLoc.y), 0).xy - renderCoord;

		if (max(max(p12.y, p12.w), p3.y) * pixelsPerEm.y < -0.5) break;

		// Root eligibility from x-coordinate signs (rotated ray).
		uint code = (0x2E74u >> (((p12.x > 0.0) ? 2u : 0u) +
		        ((p12.z > 0.0) ? 4u : 0u) + ((p3.x > 0.0) ? 8u : 0u))) & 3u;

		if (code != 0u)
		{
			// Rotated polynomial: ax uses PLUS on p2 term.
			float ax = p12.y + p12.w * 2.0 + p3.y;
			float ay = p12.x - p12.z * 2.0 + p3.x;
			float bx = p12.y - p12.w;
			float by = p12.x - p12.z;
			float ra = 1.0 / ay;

			float d = sqrt(max(by * by - ay * p12.x, 0.0));
			float t1 = (by - d) * ra;
			float t2 = (by + d) * ra;

			if (abs(ay) < kQuadraticEpsilon) { t1 = p12.x * 0.5 / by; t2 = t1; }

			float y1raw = (ax * t1 - bx * 2.0) * t1 + p12.y;
			float y2raw = (ax * t2 - bx * 2.0) * t2 + p12.y;
			float y1 = y1raw * pixelsPerEm.y;
			float y2 = y2raw * pixelsPerEm.y;

			if ((code & 1u) != 0u)
			{
				float contrib = clamp(y1 + 0.5, 0.0, 1.0);
				ycov += contrib;
				ywind += step(0.0, y1raw);
				ywgt = max(ywgt, clamp(1.0 - abs(y1) * 2.0, 0.0, 1.0));
				coverage += contrib;
			}

			if (code > 1u)
			{
				float contrib = clamp(y2 + 0.5, 0.0, 1.0);
				ycov -= contrib;
				ywind -= step(0.0, y2raw);
				ywgt = max(ywgt, clamp(1.0 - abs(y2) * 2.0, 0.0, 1.0));
				coverage -= contrib;
			}
		}
	}

	slug_debug_xcov = xcov;
	slug_debug_ycov = ycov;

	// Reference formula (single accumulator)
	float refCoverage = sqrt(clamp(abs(coverage) * 0.5, 0.0, 1.0));

	// Our weight-based formula (separate accumulators + integer winding)
	float ourCoverage = CalcCoverage(xcov, ycov, xwgt, ywgt, xwind, ywind);

	return ourCoverage;
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
