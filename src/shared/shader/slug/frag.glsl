#version 300 es

precision highp float;
precision highp int;
precision highp usampler2D;

// Curve texture: float RGBA, contains quadratic Bezier control points.
// Each curve = 2 texels: [p1.x, p1.y, p2.x, p2.y], [p3.x, p3.y, ?, ?]
uniform sampler2D uCurveTexture;

// Band texture: uint RGBA, contains band index data mapping bands to curves.
uniform usampler2D uBandTexture;

// Texture width as log2 (e.g. 12 for 4096). Configurable to allow smaller textures.
uniform int uLogTextureWidth;

// Derived from uLogTextureWidth at usage site
#define TEXTURE_WIDTH (1 << uLogTextureWidth)
#define TEXTURE_MASK (TEXTURE_WIDTH - 1)

in vec4 vColor;
in vec2 vTexcoord;
flat in vec4 vBanding;
flat in ivec4 vGlyph;

out vec4 fragColor;

/**
 * Fetch a texel from the band texture by linear index.
 * Wraps across rows when index exceeds texture width.
 */
uvec4 fetchBand(int index, int baseY) {
	int x = index & TEXTURE_MASK;
	int y = baseY + (index >> uLogTextureWidth);
	return texelFetch(uBandTexture, ivec2(x, y), 0);
}

/**
 * Fetch curve control points from the curve texture.
 * Each curve occupies 2 consecutive texels starting at (baseX + curveIndex*2, baseY).
 */
void fetchCurve(int curveIndex, int baseX, int baseY, out vec2 p1, out vec2 p2, out vec2 p3) {
	int texelIndex = baseX + curveIndex * 2;
	int x0 = texelIndex & TEXTURE_MASK;
	int y0 = baseY + (texelIndex >> uLogTextureWidth);

	vec4 t0 = texelFetch(uCurveTexture, ivec2(x0, y0), 0);
	vec4 t1 = texelFetch(uCurveTexture, ivec2(x0 + 1, y0), 0);

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
 * Solve quadratic for horizontal ray crossings (y = 0).
 * Returns x-coordinates where the curve crosses the horizontal ray.
 */
vec2 solveHorizPoly(vec2 p1, vec2 p2, vec2 p3) {
	// Quadratic Bezier y(t) = (1-t)^2*p1.y + 2(1-t)t*p2.y + t^2*p3.y
	// Rearranged: a*t^2 + b*t + c = 0
	float a = p1.y - 2.0 * p2.y + p3.y;
	float b = 2.0 * (p2.y - p1.y);
	float c = p1.y;

	vec2 result = vec2(0.0);

	if (abs(a) < 1e-6) {
		// Linear case
		if (abs(b) > 1e-6) {
			float t = -c / b;
			if (t >= 0.0 && t <= 1.0) {
				float oneMinusT = 1.0 - t;
				result.x = oneMinusT * oneMinusT * p1.x + 2.0 * oneMinusT * t * p2.x + t * t * p3.x;
			}
		}
	} else {
		float disc = b * b - 4.0 * a * c;
		if (disc >= 0.0) {
			float sqrtDisc = sqrt(disc);
			float inv2a = 0.5 / a;

			float t0 = (-b - sqrtDisc) * inv2a;
			float t1 = (-b + sqrtDisc) * inv2a;

			if (t0 >= 0.0 && t0 <= 1.0) {
				float oneMinusT = 1.0 - t0;
				result.x = oneMinusT * oneMinusT * p1.x + 2.0 * oneMinusT * t0 * p2.x + t0 * t0 * p3.x;
			}
			if (t1 >= 0.0 && t1 <= 1.0) {
				float oneMinusT = 1.0 - t1;
				result.y = oneMinusT * oneMinusT * p1.x + 2.0 * oneMinusT * t1 * p2.x + t1 * t1 * p3.x;
			}
		}
	}

	return result;
}

/**
 * Solve quadratic for vertical ray crossings (x = 0).
 * Same as horizontal but with x/y swapped.
 */
vec2 solveVertPoly(vec2 p1, vec2 p2, vec2 p3) {
	return solveHorizPoly(p1.yx, p2.yx, p3.yx);
}

/**
 * Combine horizontal and vertical coverage into final alpha.
 * Uses weighted blend with fallback to min coverage.
 */
float calcCoverage(float xcov, float xwgt, float ycov, float ywgt) {
	float totalWgt = xwgt + ywgt;
	if (totalWgt < 1e-6) {
		return 0.0;
	}

	float blended = (xcov * xwgt + ycov * ywgt) / totalWgt;
	float minCov = min(abs(xcov), abs(ycov));

	return clamp(mix(minCov, abs(blended), clamp(totalWgt, 0.0, 1.0)), 0.0, 1.0);
}

/**
 * Main Slug rendering function.
 * Casts horizontal and vertical rays, accumulates winding numbers,
 * and computes final pixel coverage.
 */
float slugRender(vec2 renderCoord) {
	// Pixel scale in em-space for anti-aliasing
	vec2 pixelScale = fwidth(renderCoord);

	// Band transform: map em-space coord to band indices
	vec2 bandScale = vBanding.xy;
	vec2 bandOffset = vBanding.zw;

	vec2 bandCoord = renderCoord * bandScale + bandOffset;
	int bandX = clamp(int(bandCoord.x), 0, vGlyph.z);
	int bandY = clamp(int(bandCoord.y), 0, vGlyph.w);

	int glyphBaseX = vGlyph.x;
	int glyphBaseY = vGlyph.y;
	int bandMaxY = vGlyph.w;

	// Horizontal band: accumulate x coverage
	float xcov = 0.0;
	float xwgt = 0.0;

	uvec4 hBandHeader = fetchBand(glyphBaseX + bandY, glyphBaseY);
	int hCurveCount = int(hBandHeader.x);
	int hCurveOffset = int(hBandHeader.y);

	for (int i = 0; i < hCurveCount; i++) {
		uvec4 curveRef = fetchBand(hCurveOffset + i, glyphBaseY);
		int curveIdx = int(curveRef.x);

		vec2 p1, p2, p3;
		fetchCurve(curveIdx, 0, 0, p1, p2, p3);

		// Make sample-relative
		p1 -= renderCoord;
		p2 -= renderCoord;
		p3 -= renderCoord;

		int rootCode = calcRootCode(p1.y, p2.y, p3.y);
		if (rootCode == 0 || rootCode == 7) continue;

		vec2 crossings = solveHorizPoly(p1, p2, p3);

		// Accumulate winding
		if (crossings.x > 0.0) {
			xcov += 1.0;
			xwgt += clamp(1.0 - abs(crossings.x) / pixelScale.x, 0.0, 1.0);
		}
		if (crossings.y > 0.0) {
			xcov -= 1.0;
			xwgt += clamp(1.0 - abs(crossings.y) / pixelScale.x, 0.0, 1.0);
		}
	}

	// Vertical band: accumulate y coverage
	float ycov = 0.0;
	float ywgt = 0.0;

	uvec4 vBandHeader = fetchBand(glyphBaseX + bandMaxY + 1 + bandX, glyphBaseY);
	int vCurveCount = int(vBandHeader.x);
	int vCurveOffset = int(vBandHeader.y);

	for (int i = 0; i < vCurveCount; i++) {
		uvec4 curveRef = fetchBand(vCurveOffset + i, glyphBaseY);
		int curveIdx = int(curveRef.x);

		vec2 p1, p2, p3;
		fetchCurve(curveIdx, 0, 0, p1, p2, p3);

		p1 -= renderCoord;
		p2 -= renderCoord;
		p3 -= renderCoord;

		int rootCode = calcRootCode(p1.x, p2.x, p3.x);
		if (rootCode == 0 || rootCode == 7) continue;

		vec2 crossings = solveVertPoly(p1, p2, p3);

		if (crossings.x > 0.0) {
			ycov += 1.0;
			ywgt += clamp(1.0 - abs(crossings.x) / pixelScale.y, 0.0, 1.0);
		}
		if (crossings.y > 0.0) {
			ycov -= 1.0;
			ywgt += clamp(1.0 - abs(crossings.y) / pixelScale.y, 0.0, 1.0);
		}
	}

	return calcCoverage(xcov, xwgt, ycov, ywgt);
}

void main() {
	float coverage = slugRender(vTexcoord);
	fragColor = vColor * coverage;
}
