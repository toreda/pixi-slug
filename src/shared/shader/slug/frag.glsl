#version 300 es
// ===================================================
// Slug algorithm fragment shader — GLSL ES 3.00 port.
// Based on the reference Slug shader by Eric Lengyel.
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
uniform int uSupersampleCount;
uniform float uStrokeExpand; // Stroke expansion in pixels. 0 = normal fill.

// Band texture stores uint32 data as float32 bit patterns (ArrayBuffer reinterpretation).
// floatBitsToUint recovers the exact uint32 values losslessly — no rounding needed.
uvec2 fetchBand(ivec2 coord)
{
	vec2 raw = texelFetch(uBandTexture, coord, 0).xy;
	return uvec2(floatBitsToUint(raw.x), floatBitsToUint(raw.y));
}

ivec2 CalcBandLoc(ivec2 glyphLoc, uint offset)
{
	ivec2 bandLoc = ivec2(glyphLoc.x + int(offset), glyphLoc.y);
	bandLoc.y += bandLoc.x >> kLogBandTextureWidth;
	bandLoc.x &= (1 << kLogBandTextureWidth) - 1;
	return bandLoc;
}

// Combine horizontal and vertical fractional winding into coverage.
// Near edges (high weight): weighted average provides smooth antialiasing.
// Interior (low weight): max(abs(xcov), abs(ycov)) provides solid fill.
// max() is used instead of min() to handle glyphs with oppositely-wound
// contours where one axis cancels to ~0 while the other reads ~1.
float CalcCoverage(float xcov, float ycov, float xwgt, float ywgt)
{
	float coverage = max(
		abs(xcov * xwgt + ycov * ywgt) / max(xwgt + ywgt, 1.0 / 65536.0),
		max(abs(xcov), abs(ycov))
	);

	return clamp(sqrt(abs(coverage)), 0.0, 1.0);
}

out vec4 fragColor;

float SlugRender(vec2 renderCoord, vec4 bandTransform, ivec4 glyphData, float strokePx)
{
	vec2 pixelsPerEm = vec2(1.0 / max(fwidth(renderCoord.x), 1.0 / 65536.0),
	                        1.0 / max(fwidth(renderCoord.y), 1.0 / 65536.0));

	// Early-out threshold: expanded by stroke so curves within stroke range
	// are not skipped. When strokePx is 0 this reduces to the original -0.5.
	float earlyOutBias = -0.5 - strokePx;

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

		if (max(max(p12.x, p12.z), p3.x) * pixelsPerEm.x < earlyOutBias) break;

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

			if (abs(ay) < kQuadraticEpsilon)
			{
				if (abs(by) < kQuadraticEpsilon) continue;
				t1 = p12.y * 0.5 / by;
				t2 = t1;
			}

			float x1 = (ax * t1 - bx * 2.0) * t1 + p12.x;
			float x2 = (ax * t2 - bx * 2.0) * t2 + p12.x;
			x1 *= pixelsPerEm.x;
			x2 *= pixelsPerEm.x;

			// Stroke dilation: shift entry crossings inward (+strokePx)
			// and exit crossings outward (-strokePx) to expand the glyph
			// boundary uniformly on all sides.
			if ((code & 1u) != 0u)
			{
				float sx1 = x1 + strokePx;
				xcov += clamp(sx1 + 0.5, 0.0, 1.0);
				xwgt = max(xwgt, clamp(1.0 - abs(sx1) * 2.0, 0.0, 1.0));
			}

			if (code > 1u)
			{
				float sx2 = x2 - strokePx;
				xcov -= clamp(sx2 + 0.5, 0.0, 1.0);
				xwgt = max(xwgt, clamp(1.0 - abs(sx2) * 2.0, 0.0, 1.0));
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

		if (max(max(p12.y, p12.w), p3.y) * pixelsPerEm.y < earlyOutBias) break;

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

			if (abs(ay) < kQuadraticEpsilon)
			{
				if (abs(by) < kQuadraticEpsilon) continue;
				t1 = p12.x * 0.5 / by;
				t2 = t1;
			}

			float y1 = (ax * t1 - bx * 2.0) * t1 + p12.y;
			float y2 = (ax * t2 - bx * 2.0) * t2 + p12.y;
			y1 *= pixelsPerEm.y;
			y2 *= pixelsPerEm.y;

			// Vertical ray stroke dilation: signs are flipped from horizontal
			// because the vertical ray's +Y direction is up in em-space but
			// down in screen space. Entry subtracts strokePx, exit adds it.
			if ((code & 1u) != 0u)
			{
				float sy1 = y1 - strokePx;
				ycov += clamp(sy1 + 0.5, 0.0, 1.0);
				ywgt = max(ywgt, clamp(1.0 - abs(sy1) * 2.0, 0.0, 1.0));
			}

			if (code > 1u)
			{
				float sy2 = y2 + strokePx;
				ycov -= clamp(sy2 + 0.5, 0.0, 1.0);
				ywgt = max(ywgt, clamp(1.0 - abs(sy2) * 2.0, 0.0, 1.0));
			}
		}
	}

	return CalcCoverage(xcov, ycov, xwgt, ywgt);
}

void main()
{
	float coverage;
	int sampleCount = min(uSupersampleCount, 16);
	float strokePx = uStrokeExpand;

	if (sampleCount <= 1)
	{
		coverage = SlugRender(vTexcoord, vBanding, vGlyph, strokePx);
	}
	else
	{
		// Supersampling with configurable sample count.
		// Offsets are in em-space, derived from screen-space derivatives so they
		// scale correctly at any font size or transform.
		vec2 dx = dFdx(vTexcoord) * 0.5;
		vec2 dy = dFdy(vTexcoord) * 0.5;

		if (sampleCount <= 2)
		{
			// 2-sample: diagonal pair
			float c0 = SlugRender(vTexcoord + dx * 0.25 + dy * 0.25, vBanding, vGlyph, strokePx);
			float c1 = SlugRender(vTexcoord - dx * 0.25 - dy * 0.25, vBanding, vGlyph, strokePx);
			coverage = (c0 + c1) * 0.5;
		}
		else if (sampleCount <= 4)
		{
			// 4-sample rotated-grid supersampling (RGSS pattern).
			float c0 = SlugRender(vTexcoord + dx * 0.125 + dy * 0.375, vBanding, vGlyph, strokePx);
			float c1 = SlugRender(vTexcoord - dx * 0.125 - dy * 0.375, vBanding, vGlyph, strokePx);
			float c2 = SlugRender(vTexcoord + dx * 0.375 - dy * 0.125, vBanding, vGlyph, strokePx);
			float c3 = SlugRender(vTexcoord - dx * 0.375 + dy * 0.125, vBanding, vGlyph, strokePx);
			coverage = (c0 + c1 + c2 + c3) * 0.25;
		}
		else if (sampleCount <= 8)
		{
			// 8-sample: 8-queens pattern (good spatial distribution)
			float c0 = SlugRender(vTexcoord + dx * 0.0625 + dy * 0.4375, vBanding, vGlyph, strokePx);
			float c1 = SlugRender(vTexcoord - dx * 0.0625 - dy * 0.4375, vBanding, vGlyph, strokePx);
			float c2 = SlugRender(vTexcoord + dx * 0.3125 - dy * 0.0625, vBanding, vGlyph, strokePx);
			float c3 = SlugRender(vTexcoord - dx * 0.3125 + dy * 0.0625, vBanding, vGlyph, strokePx);
			float c4 = SlugRender(vTexcoord + dx * 0.1875 + dy * 0.1875, vBanding, vGlyph, strokePx);
			float c5 = SlugRender(vTexcoord - dx * 0.1875 - dy * 0.1875, vBanding, vGlyph, strokePx);
			float c6 = SlugRender(vTexcoord + dx * 0.4375 - dy * 0.3125, vBanding, vGlyph, strokePx);
			float c7 = SlugRender(vTexcoord - dx * 0.4375 + dy * 0.3125, vBanding, vGlyph, strokePx);
			coverage = (c0 + c1 + c2 + c3 + c4 + c5 + c6 + c7) * 0.125;
		}
		else
		{
			// 16-sample: 4x4 jittered grid for maximum quality
			float sum = 0.0;
			sum += SlugRender(vTexcoord + dx * 0.0625 + dy * 0.4375, vBanding, vGlyph, strokePx);
			sum += SlugRender(vTexcoord - dx * 0.4375 + dy * 0.0625, vBanding, vGlyph, strokePx);
			sum += SlugRender(vTexcoord + dx * 0.3125 - dy * 0.1875, vBanding, vGlyph, strokePx);
			sum += SlugRender(vTexcoord - dx * 0.1875 - dy * 0.3125, vBanding, vGlyph, strokePx);
			sum += SlugRender(vTexcoord + dx * 0.1875 + dy * 0.1875, vBanding, vGlyph, strokePx);
			sum += SlugRender(vTexcoord - dx * 0.0625 - dy * 0.4375, vBanding, vGlyph, strokePx);
			sum += SlugRender(vTexcoord + dx * 0.4375 - dy * 0.0625, vBanding, vGlyph, strokePx);
			sum += SlugRender(vTexcoord - dx * 0.3125 + dy * 0.3125, vBanding, vGlyph, strokePx);
			sum += SlugRender(vTexcoord + dx * 0.125 + dy * 0.375, vBanding, vGlyph, strokePx);
			sum += SlugRender(vTexcoord - dx * 0.375 + dy * 0.125, vBanding, vGlyph, strokePx);
			sum += SlugRender(vTexcoord + dx * 0.375 - dy * 0.125, vBanding, vGlyph, strokePx);
			sum += SlugRender(vTexcoord - dx * 0.125 - dy * 0.375, vBanding, vGlyph, strokePx);
			sum += SlugRender(vTexcoord + dx * 0.25 + dy * 0.25, vBanding, vGlyph, strokePx);
			sum += SlugRender(vTexcoord - dx * 0.25 - dy * 0.25, vBanding, vGlyph, strokePx);
			sum += SlugRender(vTexcoord + dx * 0.0 + dy * 0.0, vBanding, vGlyph, strokePx);
			sum += SlugRender(vTexcoord + dx * 0.5 + dy * 0.5, vBanding, vGlyph, strokePx);
			coverage = sum * 0.0625;
		}
	}

	fragColor = vColor * coverage;
}
