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
// Sub-precision-noise threshold for the Citardauq solver's degeneracy check.
// Smaller than any meaningful float32 input in this pipeline, so it only fires
// for genuinely degenerate curves — not as a regime switch.
#define kCitardauqDegenEps 1e-7

// Debug visualization (compile-time). Paint raw ray-accumulator values to
// the screen instead of the final coverage. Reset to 0 before shipping.
//   0 = off (production)
//   1 = xcov:    R=clamp(xcov,0,1) G=clamp(-xcov,0,1) B=0      (saturated)
//   2 = xwgt:    R=xwgt G=xwgt B=xwgt                          (greyscale)
//   3 = ycov:    R=clamp(ycov,0,1) G=clamp(-ycov,0,1) B=0
//   4 = ywgt:    R=ywgt G=ywgt B=ywgt
//   5 = xcov bucketed:  red=high, yellow=mid, green=low, blue=zero
//   6 = (xcov, ycov, weighted_avg) packed into RGB
//   7 = bug-pixel detector: bright magenta where |xcov|>0.1 and xwgt<0.1 (= unsupported H-ray contribution)
//   8 = bug-pixel detector: bright magenta where |xcov|>0.1 and xwgt is small relative to |xcov|
//   9 = axis-disagreement detector: H says inside (small or full), V says outside, both wgt~0
//  10 = H-ray count of code!=0 curves (color-coded). Reveals if bug is missing crossings.
//  11 = artifact-only h-count. shows count number ONLY at bug pixels (yellow-9 condition).
//  12 = fine-grained xcov visualization with explicit value bands.
//  13 = bandIndex.y as color ramp: each horizontal band gets a different hue.
//       Use to confirm artifact stripes correspond 1:1 with band rows.
#define SLUG_DEBUG_RAW 0

// Debug — skip a specific position-within-band in the H-ray loop. Set to a
// non-negative integer N to make the H-ray's iteration `if (curveIndex == N) continue;`.
// Set to -1 (default) to disable. Used to test: "if curve at position N in the band
// were skipped, would the artifact disappear?"
//
// IMPORTANT: this skips the curve at the given POSITION in the band's curve list
// (sorted descending by max-X). For A's hBand[0] = [5,9,6,1,3,2], position 4 = curve 3.
// For other bands the positions map differently — useful for isolating bands too.
#define SLUG_DEBUG_HRAY_SKIP_POS -1

// Debug — limit the H-ray loop to only the first N curves in the band.
// Set to a non-negative integer N to make the loop break after processing
// N curves (i.e. `if (curveIndex >= N) break;`). Set to -1 to disable.
// Used to incrementally build up xcov curve-by-curve and identify which
// curve in the band's sorted list pushes xcov from cancelled-zero to ~1.
#define SLUG_DEBUG_HRAY_LIMIT -1

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

// Solve ay·t² - 2·by·t + py = 0 for the two ray-intersection parameters t1, t2.
// Returns false when the curve is genuinely degenerate at this pixel and
// should be skipped (caller must `continue` the loop).
//
// Per-root sign-safe Citardauq. Defines Q = by + sign(by)·d so |Q| = |by| + d
// and never suffers cancellation. The algebraic identity (by - d)(by + d) = ay·py
// gives an alternate form for the otherwise-cancelling root:
// classical_t1 = py/Q (by ≥ 0) or Q/ay (by < 0). Order matches the classical
// formula (t1 corresponds to numerator (by - d), t2 to (by + d)), so upstream
// `code & 1` and `code > 1` checks remain correct.
//
// Two edge cases:
//  - |Q| AND |ay| both tiny: curve is essentially a point along the ray axis.
//    Skip via `return false`.
//  - |Q| tiny but |ay| non-tiny: double root (disc → 0, Q → by → 0 when by → 0).
//    py/Q would be NaN, but the actual root is t = Q/ay. Use that for both.
//
// See _docs/citardauq_migration.md for the derivation and the simulator-caught
// bugs in earlier sketches of this formula.
bool solveQuadraticRoots(float ay, float by, float py, out float t1, out float t2)
{
	float disc = max(by * by - ay * py, 0.0);
	float d = sqrt(disc);
	float Q = (by >= 0.0) ? (by + d) : (by - d);
	if (abs(Q) < kCitardauqDegenEps && abs(ay) < kCitardauqDegenEps)
	{
		t1 = 0.0;
		t2 = 0.0;
		return false;
	}
	if (abs(Q) < kCitardauqDegenEps)
	{
		float t = Q / ay;
		t1 = t;
		t2 = t;
		return true;
	}
	if (by >= 0.0)
	{
		t1 = py / Q;
		t2 = Q / ay;
	}
	else
	{
		t1 = Q / ay;
		t2 = py / Q;
	}
	return true;
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
#if SLUG_DEBUG_HRAY_SKIP_POS >= 0
		if (curveIndex == SLUG_DEBUG_HRAY_SKIP_POS) continue;
#endif
#if SLUG_DEBUG_HRAY_LIMIT >= 0
		if (curveIndex >= SLUG_DEBUG_HRAY_LIMIT) break;
#endif
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

			float t1, t2;
			if (!solveQuadraticRoots(ay, by, p12.y, t1, t2)) continue;

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

			float t1, t2;
			if (!solveQuadraticRoots(ay, by, p12.x, t1, t2)) continue;

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

#if SLUG_DEBUG_RAW != 0
// Debug-only: rerun ray accumulation and return raw (xcov, ycov, xwgt, ywgt).
// Logic mirrors SlugRenderEx exactly so values are identical to production.
vec4 SlugRenderRaw(vec2 renderCoord, vec4 bandTransform, ivec4 glyphData)
{
	vec2 pixelsPerEm = vec2(1.0 / max(fwidth(renderCoord.x), 1.0 / 65536.0),
	                        1.0 / max(fwidth(renderCoord.y), 1.0 / 65536.0));
	float earlyOutBias = -0.5;
	ivec2 bandMax = glyphData.zw;
	bandMax.y &= 0x00FF;
	ivec2 bandIndex = clamp(ivec2(renderCoord * bandTransform.xy + bandTransform.zw), ivec2(0, 0), bandMax);
	ivec2 glyphLoc = glyphData.xy;

	float xcov = 0.0, xwgt = 0.0, ycov = 0.0, ywgt = 0.0;

	// Horizontal
	uvec2 hbandData = fetchBand(ivec2(glyphLoc.x + bandIndex.y, glyphLoc.y));
	ivec2 hbandLoc = CalcBandLoc(glyphLoc, hbandData.y);
	int hcount = min(int(hbandData.x), kMaxCurvesPerBand);
	for (int curveIndex = 0; curveIndex < hcount; curveIndex++)
	{
		ivec2 curveLoc = ivec2(fetchBand(ivec2(hbandLoc.x + curveIndex, hbandLoc.y)));
		vec4 p12 = texelFetch(uCurveTexture, curveLoc, 0) - vec4(renderCoord, renderCoord);
		vec2 p3 = texelFetch(uCurveTexture, ivec2(curveLoc.x + 1, curveLoc.y), 0).xy - renderCoord;
		if (max(max(p12.x, p12.z), p3.x) * pixelsPerEm.x < earlyOutBias) break;
		uint code = (0x2E74u >> (((p12.y > 0.0) ? 2u : 0u) + ((p12.w > 0.0) ? 4u : 0u) + ((p3.y > 0.0) ? 8u : 0u))) & 3u;
		if (code == 0u) continue;
		float ax = p12.x - p12.z * 2.0 + p3.x;
		float ay = p12.y - p12.w * 2.0 + p3.y;
		float bx = p12.x - p12.z;
		float by = p12.y - p12.w;
		float t1, t2;
		if (!solveQuadraticRoots(ay, by, p12.y, t1, t2)) continue;
		float x1 = ((ax * t1 - bx * 2.0) * t1 + p12.x) * pixelsPerEm.x;
		float x2 = ((ax * t2 - bx * 2.0) * t2 + p12.x) * pixelsPerEm.x;
		if ((code & 1u) != 0u) { xcov += clamp(x1 + 0.5, 0.0, 1.0); xwgt = max(xwgt, clamp(1.0 - abs(x1) * 2.0, 0.0, 1.0)); }
		if (code > 1u)         { xcov -= clamp(x2 + 0.5, 0.0, 1.0); xwgt = max(xwgt, clamp(1.0 - abs(x2) * 2.0, 0.0, 1.0)); }
	}

	// Vertical
	uvec2 vbandData = fetchBand(ivec2(glyphLoc.x + bandMax.y + 1 + bandIndex.x, glyphLoc.y));
	ivec2 vbandLoc = CalcBandLoc(glyphLoc, vbandData.y);
	int vcount = min(int(vbandData.x), kMaxCurvesPerBand);
	for (int curveIndex = 0; curveIndex < vcount; curveIndex++)
	{
		ivec2 curveLoc = ivec2(fetchBand(ivec2(vbandLoc.x + curveIndex, vbandLoc.y)));
		vec4 p12 = texelFetch(uCurveTexture, curveLoc, 0) - vec4(renderCoord, renderCoord);
		vec2 p3 = texelFetch(uCurveTexture, ivec2(curveLoc.x + 1, curveLoc.y), 0).xy - renderCoord;
		if (max(max(p12.y, p12.w), p3.y) * pixelsPerEm.y < earlyOutBias) break;
		uint code = (0x2E74u >> (((p12.x > 0.0) ? 2u : 0u) + ((p12.z > 0.0) ? 4u : 0u) + ((p3.x > 0.0) ? 8u : 0u))) & 3u;
		if (code == 0u) continue;
		float ax = p12.y - p12.w * 2.0 + p3.y;
		float ay = p12.x - p12.z * 2.0 + p3.x;
		float bx = p12.y - p12.w;
		float by = p12.x - p12.z;
		float t1, t2;
		if (!solveQuadraticRoots(ay, by, p12.x, t1, t2)) continue;
		float y1 = ((ax * t1 - bx * 2.0) * t1 + p12.y) * pixelsPerEm.y;
		float y2 = ((ax * t2 - bx * 2.0) * t2 + p12.y) * pixelsPerEm.y;
		if ((code & 1u) != 0u) { ycov += clamp(y1 + 0.5, 0.0, 1.0); ywgt = max(ywgt, clamp(1.0 - abs(y1) * 2.0, 0.0, 1.0)); }
		if (code > 1u)         { ycov -= clamp(y2 + 0.5, 0.0, 1.0); ywgt = max(ywgt, clamp(1.0 - abs(y2) * 2.0, 0.0, 1.0)); }
	}

	return vec4(xcov, ycov, xwgt, ywgt);
}

// Debug-only: count how many curves in each ray's band actually contribute
// (code != 0). Mismatched counts can indicate a missing crossing.
vec2 SlugRenderCounts(vec2 renderCoord, vec4 bandTransform, ivec4 glyphData)
{
	vec2 pixelsPerEm = vec2(1.0 / max(fwidth(renderCoord.x), 1.0 / 65536.0),
	                        1.0 / max(fwidth(renderCoord.y), 1.0 / 65536.0));
	float earlyOutBias = -0.5;
	ivec2 bandMax = glyphData.zw;
	bandMax.y &= 0x00FF;
	ivec2 bandIndex = clamp(ivec2(renderCoord * bandTransform.xy + bandTransform.zw), ivec2(0, 0), bandMax);
	ivec2 glyphLoc = glyphData.xy;

	int hHits = 0, vHits = 0;

	uvec2 hbandData = fetchBand(ivec2(glyphLoc.x + bandIndex.y, glyphLoc.y));
	ivec2 hbandLoc = CalcBandLoc(glyphLoc, hbandData.y);
	int hcount = min(int(hbandData.x), kMaxCurvesPerBand);
	for (int curveIndex = 0; curveIndex < hcount; curveIndex++) {
		ivec2 curveLoc = ivec2(fetchBand(ivec2(hbandLoc.x + curveIndex, hbandLoc.y)));
		vec4 p12 = texelFetch(uCurveTexture, curveLoc, 0) - vec4(renderCoord, renderCoord);
		vec2 p3 = texelFetch(uCurveTexture, ivec2(curveLoc.x + 1, curveLoc.y), 0).xy - renderCoord;
		if (max(max(p12.x, p12.z), p3.x) * pixelsPerEm.x < earlyOutBias) break;
		uint code = (0x2E74u >> (((p12.y > 0.0) ? 2u : 0u) + ((p12.w > 0.0) ? 4u : 0u) + ((p3.y > 0.0) ? 8u : 0u))) & 3u;
		if (code != 0u) hHits++;
	}

	uvec2 vbandData = fetchBand(ivec2(glyphLoc.x + bandMax.y + 1 + bandIndex.x, glyphLoc.y));
	ivec2 vbandLoc = CalcBandLoc(glyphLoc, vbandData.y);
	int vcount = min(int(vbandData.x), kMaxCurvesPerBand);
	for (int curveIndex = 0; curveIndex < vcount; curveIndex++) {
		ivec2 curveLoc = ivec2(fetchBand(ivec2(vbandLoc.x + curveIndex, vbandLoc.y)));
		vec4 p12 = texelFetch(uCurveTexture, curveLoc, 0) - vec4(renderCoord, renderCoord);
		vec2 p3 = texelFetch(uCurveTexture, ivec2(curveLoc.x + 1, curveLoc.y), 0).xy - renderCoord;
		if (max(max(p12.y, p12.w), p3.y) * pixelsPerEm.y < earlyOutBias) break;
		uint code = (0x2E74u >> (((p12.x > 0.0) ? 2u : 0u) + ((p12.z > 0.0) ? 4u : 0u) + ((p3.x > 0.0) ? 8u : 0u))) & 3u;
		if (code != 0u) vHits++;
	}

	return vec2(float(hHits), float(vHits));
}
#endif

void main()
{
#if SLUG_DEBUG_RAW != 0
	{
		// Bypass the production path entirely. Paint the raw ray-accumulator
		// values to the screen so we can see what the GPU actually computes.
		vec4 raw = SlugRenderRaw(vTexcoord, vBanding, vGlyph);
		float xcov = raw.x;
		float ycov = raw.y;
		float xwgt = raw.z;
		float ywgt = raw.w;
		vec3 dbg;
#if SLUG_DEBUG_RAW == 1
		// xcov: red = positive, green = negative, magnitude = brightness.
		dbg = vec3(clamp(xcov, 0.0, 1.0), clamp(-xcov, 0.0, 1.0), 0.0);
#elif SLUG_DEBUG_RAW == 2
		// xwgt: greyscale (0 = no near edges, 1 = pixel sits exactly on an edge).
		dbg = vec3(xwgt);
#elif SLUG_DEBUG_RAW == 3
		dbg = vec3(clamp(ycov, 0.0, 1.0), clamp(-ycov, 0.0, 1.0), 0.0);
#elif SLUG_DEBUG_RAW == 4
		dbg = vec3(ywgt);
#elif SLUG_DEBUG_RAW == 5
		// xcov bucketed. Highlights the magnitude of the spurious xcov values.
		float a = abs(xcov);
		if (a > 0.95)      dbg = vec3(0.0, 0.6, 0.0);   // green   = ~ integer (correct)
		else if (a > 0.55) dbg = vec3(0.0, 0.0, 0.8);   // blue    = mid (edge AA)
		else if (a > 0.15) dbg = vec3(1.0, 0.6, 0.0);   // orange  = SUSPICIOUS — small but nonzero
		else if (a > 0.02) dbg = vec3(1.0, 0.0, 0.0);   // red     = tiny noise
		else               dbg = vec3(0.05);            // dark    = ~ zero (correct outside)
#elif SLUG_DEBUG_RAW == 6
		// Pack three signals into one image: R=xcov, G=ycov, B=weighted_avg.
		float weighted = abs(xcov*xwgt + ycov*ywgt) / max(xwgt + ywgt, 1.0/65536.0);
		dbg = vec3(abs(xcov), abs(ycov), weighted);
#elif SLUG_DEBUG_RAW == 7
		// Bug-pixel detector v1: paint magenta where |xcov| > 0.1 and xwgt < 0.1.
		// Those pixels accumulated H-ray contribution without registering as a near-edge,
		// which would explain why CalcCoverage's edge-confidence blend can't fix them.
		// Other pixels retain the production rendering for context.
		bool isBug = abs(xcov) > 0.1 && xwgt < 0.1;
		if (isBug) {
			dbg = vec3(1.0, 0.0, 1.0);
		} else {
			// Faint backdrop for context: |xcov| as red, |ycov| as green.
			dbg = vec3(abs(xcov) * 0.2, abs(ycov) * 0.2, 0.0);
		}
#elif SLUG_DEBUG_RAW == 8
		// Bug-pixel detector v2: paint magenta where |xcov| has more magnitude
		// than xwgt can justify. AA-correct pixels have xwgt >= |xcov| roughly;
		// bug pixels have |xcov| > xwgt + 0.1.
		bool isBug = abs(xcov) > xwgt + 0.1 && abs(xcov) > 0.05;
		if (isBug) {
			dbg = vec3(1.0, 0.0, 1.0);
		} else {
			dbg = vec3(abs(xcov) * 0.2, abs(ycov) * 0.2, 0.0);
		}
#elif SLUG_DEBUG_RAW == 10
		// H-ray crossing-count visualization. Number of curves with code!=0.
		// Color encoding:
		//   black = 0 hits
		//   red = 1 hit (suspicious — entry without exit, or vice versa)
		//   yellow = 2 hits (canonical interior pixel — entry+exit)
		//   green = 3+ hits (multiple contour crossings — could be V-shape interior)
		//   blue tint added if v-hits != h-hits (axes disagree on count)
		vec2 counts = SlugRenderCounts(vTexcoord, vBanding, vGlyph);
		int h = int(counts.x);
		int v = int(counts.y);
		if      (h == 0) dbg = vec3(0.0);
		else if (h == 1) dbg = vec3(1.0, 0.0, 0.0);
		else if (h == 2) dbg = vec3(1.0, 1.0, 0.0);
		else             dbg = vec3(0.0, 1.0, 0.0);
		if (h != v) dbg += vec3(0.0, 0.0, 0.4); // blue tint = axes disagree on count
#elif SLUG_DEBUG_RAW == 11
		// Artifact-only crossing-count. Show count ONLY at bug pixels:
		// pixels where xcov has full integer (~1) but ycov is zero.
		// Color encoding (only at bug pixels, else black):
		//   red    = 1 H-ray hit at this pixel
		//   yellow = 2 H-ray hits
		//   green  = 3 hits
		//   white  = 4+ hits
		// Pixel must satisfy: |xcov| > 0.95 AND |ycov| < 0.05 AND wgts < 0.1
		float ax = abs(xcov);
		float ay = abs(ycov);
		bool isBug = ax > 0.95 && ay < 0.05 && xwgt < 0.1 && ywgt < 0.1;
		if (isBug) {
			vec2 counts = SlugRenderCounts(vTexcoord, vBanding, vGlyph);
			int h = int(counts.x);
			if      (h == 1) dbg = vec3(1.0, 0.0, 0.0);
			else if (h == 2) dbg = vec3(1.0, 1.0, 0.0);
			else if (h == 3) dbg = vec3(0.0, 1.0, 0.0);
			else             dbg = vec3(1.0);
		} else {
			// Backdrop: faint outline of the rendering for context.
			dbg = vec3(ax * 0.15, ay * 0.15, 0.0);
		}
#elif SLUG_DEBUG_RAW == 9
		// Axis-disagreement detector. The artifact happens at pixels where:
		//   - the H-ray accumulated some |xcov| (full or partial)
		//   - the V-ray says zero (no |ycov|)
		//   - neither axis has high AA weight
		// Color code:
		//   bright magenta = |xcov| in [0.05, 0.55] and |ycov| < 0.05 and weights < 0.1 (BUG)
		//   white          = |xcov| > 0.95 and |ycov| > 0.95 (correct interior)
		//   yellow         = |xcov| > 0.95 and |ycov| < 0.05 (axes disagree, but H says full inside)
		//   black          = both ~zero (correctly outside)
		float ax = abs(xcov);
		float ay = abs(ycov);
		bool weightsLow = xwgt < 0.1 && ywgt < 0.1;
		if (ax > 0.05 && ax < 0.55 && ay < 0.05 && weightsLow) {
			dbg = vec3(1.0, 0.0, 1.0); // BUG
		} else if (ax > 0.95 && ay > 0.95) {
			dbg = vec3(1.0, 1.0, 1.0); // correct interior
		} else if (ax > 0.95 && ay < 0.05) {
			dbg = vec3(1.0, 1.0, 0.0); // axes disagree (H full, V zero) — possibly artifact too
		} else if (ax < 0.05 && ay > 0.95) {
			dbg = vec3(0.0, 1.0, 1.0); // axes disagree (V full, H zero)
		} else if (ax < 0.05 && ay < 0.05) {
			dbg = vec3(0.0, 0.0, 0.1); // correct background
		} else {
			// Edge AA — partial, with at least some weight.
			dbg = vec3(0.4, 0.4, 0.4);
		}
#elif SLUG_DEBUG_RAW == 12
		// Fine-grained xcov bands. Each band is a different color so we can
		// read the EXACT value of xcov at any pixel by inspection.
		float a = abs(xcov);
		vec3 c;
		if      (a < 0.05) c = vec3(0.0);
		else if (a < 0.15) c = vec3(0.4, 0.0, 0.0);
		else if (a < 0.25) c = vec3(0.7, 0.0, 0.0);
		else if (a < 0.35) c = vec3(1.0, 0.2, 0.0);
		else if (a < 0.45) c = vec3(1.0, 0.4, 0.0);
		else if (a < 0.55) c = vec3(1.0, 0.6, 0.0);
		else if (a < 0.65) c = vec3(1.0, 0.8, 0.0);
		else if (a < 0.75) c = vec3(1.0, 1.0, 0.2);
		else if (a < 0.85) c = vec3(1.0, 1.0, 0.4);
		else if (a < 0.95) c = vec3(1.0, 1.0, 0.7);
		else               c = vec3(1.0, 1.0, 1.0);
		if (xcov < 0.0) c = c.bgr; // swap r↔b for negative xcov
		dbg = c;
#elif SLUG_DEBUG_RAW == 13
		// bandIndex.y (horizontal band) as color ramp. Confirms whether the
		// artifact stripes correspond 1:1 with band-row boundaries.
		ivec2 bandMaxDbg = vGlyph.zw;
		bandMaxDbg.y &= 0x00FF;
		ivec2 biDbg = clamp(ivec2(vTexcoord * vBanding.xy + vBanding.zw), ivec2(0, 0), bandMaxDbg);
		// Cycle through 6 distinct hues so adjacent bands are easy to tell apart.
		int b = biDbg.y;
		int hueIdx = b - (b / 6) * 6;
		if      (hueIdx == 0) dbg = vec3(1.0, 0.0, 0.0); // red
		else if (hueIdx == 1) dbg = vec3(1.0, 0.6, 0.0); // orange
		else if (hueIdx == 2) dbg = vec3(1.0, 1.0, 0.0); // yellow
		else if (hueIdx == 3) dbg = vec3(0.0, 1.0, 0.0); // green
		else if (hueIdx == 4) dbg = vec3(0.0, 0.6, 1.0); // blue
		else                  dbg = vec3(0.6, 0.0, 1.0); // purple
		// Darken slightly per "cycle" of 6 so we can tell band 0 from band 6.
		float shade = 1.0 - 0.15 * float(b / 6);
		dbg *= max(shade, 0.4);
#endif
		fragColor = vec4(dbg, 1.0);
		return;
	}
#endif

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
