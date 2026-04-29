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
in vec2 vFillUV;
flat in vec4 vBanding;
flat in ivec4 vGlyph;

uniform sampler2D uCurveTexture;
uniform sampler2D uBandTexture;
uniform int uSupersampleCount;
uniform float uStrokeExpand;     // Stroke expansion in pixels. 0 = normal fill.
uniform float uStrokeAlphaStart; // Starting alpha at inner stroke edge. @default 1.0
uniform float uStrokeAlphaRate;  // Alpha change per pixel outward. 0 = uniform. @default 0.0

// --- Fill mode uniforms ---
// uFillMode selects how the base color is computed before multiplying
// by coverage:
//   0 = solid (use vColor — vertex color baked at quad-build time)
//   1 = linear gradient (sample uFillGradient at projected t)
//   2 = radial gradient (sample uFillGradient at radial t)
//   3 = texture (sample uFillTexture at transformed UV)
// For stroke and shadow passes, uFillMode is always 0; only the fill
// pass branches into the gradient/texture paths.
uniform int uFillMode;
// Mode-specific parameters. Linear: xy=start, zw=end (in normalized
// bbox-UV space). Radial: xy=center, z=innerRadius, w=outerRadius.
// Unused for solid and texture modes.
uniform vec4 uFillParams0;
// Text bbox in object/model-local pixel space. xy = top-left, zw = size.
// Same value the vertex shader uses to compute vFillUV. The texture
// repeat/clamp paths need bbox size to convert vFillUV (0..1) into
// pixel-space coordinates.
uniform vec4 uFillBoundsPx;
// 1D color LUT for gradients (256x1 RGBA8). Sampled with
// texture(uFillGradient, vec2(t, 0.5)).
uniform sampler2D uFillGradient;
// User texture for fill mode 3.
uniform sampler2D uFillTexture;
// Texture pixel dimensions. Used by repeat/clamp fit modes to compute
// 1:1 native-pixel mapping. Stretch mode ignores this.
uniform vec2 uFillTextureSizePx;
// Fit mode for textures: 0 = stretch, 1 = repeat, 2 = clamp.
uniform int uFillTextureFit;
// Per-axis texture scale. 1 = native size; 2 = texture appears 2x larger
// (covers more area / tiles half as densely). Negative values flip.
uniform vec2 uFillTextureScale;
// X / Y offset applied to texture coords in pixel space. Positive shifts
// the texture toward +X / +Y, so what was at offset now sits at the bbox
// origin.
uniform vec2 uFillTextureOffset;

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

// Resolve the per-pixel fill color before coverage modulation. Branches
// on uFillMode at runtime — GPUs handle the divergence cheaply when the
// mode is uniform across a draw (which is always the case here, since
// uFillMode is set once per pass).
vec4 slugFillColor()
{
	if (uFillMode == 1)
	{
		// Linear gradient: project vFillUV onto axis (params0.zw - params0.xy).
		vec2 axis = uFillParams0.zw - uFillParams0.xy;
		float lenSq = max(dot(axis, axis), 1e-12);
		float t = clamp(dot(vFillUV - uFillParams0.xy, axis) / lenSq, 0.0, 1.0);
		return texture(uFillGradient, vec2(t, 0.5));
	}
	if (uFillMode == 2)
	{
		// Radial gradient: t maps innerRadius..outerRadius to 0..1.
		float r = length(vFillUV - uFillParams0.xy);
		float span = max(uFillParams0.w - uFillParams0.z, 1e-6);
		float t = clamp((r - uFillParams0.z) / span, 0.0, 1.0);
		return texture(uFillGradient, vec2(t, 0.5));
	}
	if (uFillMode == 3)
	{
		// Texture mode. UV math depends on fit:
		//
		//  stretch: vFillUV (0..1 across bbox) maps to 0..1 across the
		//   texture, modulated by scale and offset. Aspect ratio is *not*
		//   preserved — one copy fills the bbox.
		//
		//  repeat / clamp: native-pixel mapping. Each pixel of the bbox
		//   samples one texel (× scale) of the source, with `offset`
		//   shifting the texture in pixel space. Repeat tiles via the
		//   texture sampler's repeat addressing; clamp discards pixels
		//   outside the texture rect to make them transparent.
		vec2 bboxPx = uFillBoundsPx.zw;
		vec2 texPx = max(uFillTextureSizePx, vec2(1.0));
		vec2 uv;
		if (uFillTextureFit == 0)
		{
			// stretch: bbox-relative UV, then map by scale/offset.
			// offset is in pixel units, normalized by texture size so a
			// scale-1 stretch behaves the same in stretch and repeat.
			uv = (vFillUV - uFillTextureOffset / texPx) / uFillTextureScale;
		}
		else
		{
			// repeat / clamp: 1:1 native pixel mapping.
			uv = (vFillUV * bboxPx - uFillTextureOffset) / (texPx * uFillTextureScale);
			if (uFillTextureFit == 2 && (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0))
			{
				discard;
			}
		}
		return texture(uFillTexture, uv);
	}
	// Solid (mode 0): vertex color carries the resolved fill / stroke /
	// shadow color. Stroke and shadow passes always take this path.
	return vColor;
}

// Returns vec2(coverage, minBoundaryDist).
// minBoundaryDist is the minimum absolute distance (in pixels) from this
// pixel to any curve crossing — an approximation of the distance to the
// nearest glyph boundary. Used for stroke alpha gradient.
vec2 SlugRenderEx(vec2 renderCoord, vec4 bandTransform, ivec4 glyphData, float strokePx)
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
	float minDist = 1e10;

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

			// Track minimum distance to any curve crossing (unsigned).
			if ((code & 1u) != 0u) minDist = min(minDist, abs(x1));
			if (code > 1u) minDist = min(minDist, abs(x2));

			// Stroke dilation: entry crossings shift inward (+strokePx),
			// exit crossings shift outward (-strokePx).
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

			// Track minimum distance to any curve crossing (unsigned).
			if ((code & 1u) != 0u) minDist = min(minDist, abs(y1));
			if (code > 1u) minDist = min(minDist, abs(y2));

			// Vertical stroke dilation: signs flipped from horizontal
			// because +Y em-space is up but +Y screen-space is down.
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

	float coverage = CalcCoverage(xcov, ycov, xwgt, ywgt);
	return vec2(coverage, minDist);
}

// Convenience wrapper that returns only coverage (used by fill pass and supersampling).
float SlugRender(vec2 renderCoord, vec4 bandTransform, ivec4 glyphData, float strokePx)
{
	return SlugRenderEx(renderCoord, bandTransform, glyphData, strokePx).x;
}

void main()
{
	float coverage;
	int sampleCount = min(uSupersampleCount, 16);
	float strokePx = uStrokeExpand;
	bool useGradientAlpha = (strokePx > 0.0 && uStrokeAlphaRate != 0.0);

	// When gradient alpha is active and no supersampling, use SlugRenderEx
	// to get both coverage and boundary distance in a single pass.
	if (useGradientAlpha && sampleCount <= 1)
	{
		vec2 result = SlugRenderEx(vTexcoord, vBanding, vGlyph, strokePx);
		coverage = result.x;

		// minDist is the distance from the pixel to the nearest original
		// glyph boundary (before stroke expansion). Pixels at the inner
		// stroke edge have minDist ≈ 0, outer edge have minDist ≈ strokePx.
		// The per-pixel alpha is: alphaStart + alphaRate * minDist
		float dist = clamp(result.y, 0.0, strokePx);
		float alpha = clamp(uStrokeAlphaStart + uStrokeAlphaRate * dist, 0.0, 1.0);
		fragColor = slugFillColor() * coverage * alpha;
		return;
	}

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

	// Apply stroke alpha (uStrokeAlphaStart). For fill passes (uStrokeExpand == 0)
	// uStrokeAlphaStart defaults to 1.0, so this is a no-op.
	fragColor = slugFillColor() * coverage * uStrokeAlphaStart;
}
