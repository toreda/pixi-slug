#version 300 es

precision highp float;
precision highp int;
// Combined texture: float RGBA, contains both curve and band data.
// Curve data occupies the top rows, band data follows below.
// uBandRowOffset indicates where band data starts (row index).
uniform sampler2D uSlugData;

// Row offset where band data starts in the combined texture
uniform float uBandRowOffset;
// TEMP HARDCODE for debugging - Roboto with 1024 width has 65 curve rows
const int BAND_ROW_OFFSET = 65; // curveData.length / 4 / 1024

// Texture width as log2 (e.g. 10 for 1024).
uniform int uLogTextureWidth;

// TEMP HARDCODE: use constant 10 (= 1024) for debugging.
// TODO: restore to uLogTextureWidth once uniform delivery is confirmed.
const int LOG_TEX_W = 10; // 1024 width
#define TEXTURE_WIDTH (1 << LOG_TEX_W)
#define TEXTURE_MASK (TEXTURE_WIDTH - 1)

in vec4 vColor;
in vec2 vTexcoord;
flat in vec4 vBanding;
flat in ivec4 vGlyph;

out vec4 fragColor;

/**
 * Fetch a texel from the band region of the combined texture by linear index.
 * Band data starts at row uBandRowOffset.
 */
uvec4 fetchBand(int index, int baseY) {
	int x = index & TEXTURE_MASK;
	int y = BAND_ROW_OFFSET + baseY + (index >> LOG_TEX_W);
	vec4 raw = texelFetch(uSlugData, ivec2(x, y), 0);
	return uvec4(uint(raw.x), uint(raw.y), uint(raw.z), uint(raw.w));
}

/**
 * Fetch curve control points from the curve region of the combined texture.
 * Curve data starts at row 0. Each curve occupies 2 consecutive texels.
 */
void fetchCurve(int curveIndex, int baseX, int baseY, out vec2 p1, out vec2 p2, out vec2 p3) {
	int idx0 = baseX + curveIndex * 2;
	int idx1 = idx0 + 1;

	vec4 t0 = texelFetch(uSlugData, ivec2(idx0 & TEXTURE_MASK, baseY + (idx0 >> LOG_TEX_W)), 0);
	vec4 t1 = texelFetch(uSlugData, ivec2(idx1 & TEXTURE_MASK, baseY + (idx1 >> LOG_TEX_W)), 0);

	p1 = t0.xy;
	p2 = t0.zw;
	p3 = t1.xy;
}

/**
 * Determine root eligibility from sign bits of control point y-coords.
 * Branchless: uses sign-bit extraction to build a 3-bit code.
 */
int calcRootCode(float y1, float y2, float y3) {
	uint s1 = floatBitsToUint(y1) >> 31u;
	uint s2 = floatBitsToUint(y2) >> 31u;
	uint s3 = floatBitsToUint(y3) >> 31u;
	return int(s1 | (s2 << 1u) | (s3 << 2u));
}

/**
 * Trace a horizontal ray from the fragment against a single quadratic Bezier curve.
 * Returns the signed coverage contribution for the nonzero winding rule.
 * Uses the Sluggish classification approach with magic constant 0x2E74.
 *
 * @param p1, p2, p3  Control points relative to fragment position
 * @param pixelsPerEm Reciprocal of pixel size in em-space for AA
 */
float traceRayCurveH(vec2 p1, vec2 p2, vec2 p3, float pixelsPerEm) {
	// Classification: which roots contribute to winding, based on sign pattern of y-coords.
	// Magic constant 0x2E74 encodes a 2-bit lookup table:
	//   index = (p1.y>0 ? 2 : 0) + (p2.y>0 ? 4 : 0) + (p3.y>0 ? 8 : 0)
	//   code = (0x2E74 >> index) & 3
	//   code==0: no crossing, code&1: add t1 coverage, code>1: subtract t2 coverage
	uint idx = ((p1.y > 0.0) ? 2u : 0u) + ((p2.y > 0.0) ? 4u : 0u) + ((p3.y > 0.0) ? 8u : 0u);
	uint code = (0x2E74u >> idx) & 3u;
	if (code == 0u) return 0.0;

	// Quadratic solve: a*t^2 - 2*b*t + c = 0
	vec2 a = p1 - p2 * 2.0 + p3;
	vec2 b = p1 - p2;
	float c = p1.y;

	float t1, t2;
	if (abs(a.y) > 1e-6) {
		float d = sqrt(max(b.y * b.y - a.y * c, 0.0));
		t1 = (b.y - d) / a.y;
		t2 = (b.y + d) / a.y;
	} else {
		// Linear fallback
		t1 = c / (2.0 * b.y);
		t2 = t1;
	}

	float coverage = 0.0;

	if ((code & 1u) != 0u) {
		// Add coverage from root t1
		float x = (a.x * t1 - b.x * 2.0) * t1 + p1.x;
		coverage += clamp(x * pixelsPerEm + 0.5, 0.0, 1.0);
	}

	if (code > 1u) {
		// Subtract coverage from root t2
		float x = (a.x * t2 - b.x * 2.0) * t2 + p1.x;
		coverage -= clamp(x * pixelsPerEm + 0.5, 0.0, 1.0);
	}

	return coverage;
}

/**
 * Trace a vertical ray — same as horizontal but with coordinates swizzled.
 */
float traceRayCurveV(vec2 p1, vec2 p2, vec2 p3, float pixelsPerEm) {
	return traceRayCurveH(p1.yx, p2.yx, p3.yx, pixelsPerEm);
}

/**
 * Main Slug rendering function.
 * Casts horizontal and vertical rays, accumulates winding-based coverage,
 * and averages both directions for the final alpha.
 * Based on the Sluggish reference implementation.
 */
float slugRender(vec2 renderCoord) {
	// Pixels per em for anti-aliasing
	vec2 pxScale = fwidth(renderCoord);
	float pixelsPerEmH = 1.0 / max(pxScale.x, 1e-6);
	float pixelsPerEmV = 1.0 / max(pxScale.y, 1e-6);

	// Band transform: map em-space coord to band indices
	vec2 bandCoord = renderCoord * vBanding.xy + vBanding.zw;
	// vGlyph.z = hBandCount - 1, vGlyph.w = vBandCount - 1
	// bandY indexes horizontal bands (y-axis), bandX indexes vertical bands (x-axis)
	int bandY = clamp(int(bandCoord.y), 0, vGlyph.z);
	int bandX = clamp(int(bandCoord.x), 0, vGlyph.w);

	int glyphBandOffset = vGlyph.x + (vGlyph.y << LOG_TEX_W);

	// --- Horizontal ray ---
	float coverageX = 0.0;
	{
		uvec4 hdr = fetchBand(glyphBandOffset + bandY, 0);
		int count = int(hdr.x);
		int offset = int(hdr.y);

		for (int i = 0; i < count && i < 64; i++) {
			uvec4 ref = fetchBand(offset + i, 0);
			int ci = int(ref.x);

			vec2 p1, p2, p3;
			fetchCurve(ci, 0, 0, p1, p2, p3);

			coverageX += traceRayCurveH(p1 - renderCoord, p2 - renderCoord, p3 - renderCoord, pixelsPerEmH);
		}
	}

	// --- Vertical ray ---
	float coverageY = 0.0;
	{
		// Vertical band headers start after hBandCount horizontal headers.
		// vGlyph.z = hBandCount - 1, so hBandCount = vGlyph.z + 1
		int hBandCount = vGlyph.z + 1;
		uvec4 hdr = fetchBand(glyphBandOffset + hBandCount + bandX, 0);
		int count = int(hdr.x);
		int offset = int(hdr.y);

		for (int i = 0; i < count && i < 64; i++) {
			uvec4 ref = fetchBand(offset + i, 0);
			int ci = int(ref.x);

			vec2 p1, p2, p3;
			fetchCurve(ci, 0, 0, p1, p2, p3);

			coverageY += traceRayCurveV(p1 - renderCoord, p2 - renderCoord, p3 - renderCoord, pixelsPerEmV);
		}
	}

	// Average horizontal and vertical coverage
	return clamp((abs(coverageX) + abs(coverageY)) * 0.5, 0.0, 1.0);
}

void main() {
	float coverage = slugRender(vTexcoord);
	fragColor = vColor * coverage;
}
