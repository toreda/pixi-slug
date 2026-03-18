#version 300 es

precision highp float;

// MVP matrix
uniform mat4 uSlugMatrix;
// Viewport dimensions in pixels
uniform vec2 uSlugViewport;

// Vertex attributes (5 total, matching Slug HLSL attrib[0..4])
// attrib[0]: xy = position, zw = normal (for dilation)
in vec4 aPositionNormal;
// attrib[1]: xy = em-space texcoord, z = packed glyph location, w = packed band max + flags
in vec4 aTexcoord;
// attrib[2]: inverse Jacobian matrix entries
in vec4 aJacobian;
// attrib[3]: band scale xy, band offset xy
in vec4 aBanding;
// attrib[4]: vertex color RGBA
in vec4 aColor;

// Varyings to fragment shader
out vec4 vColor;
out vec2 vTexcoord;
flat out vec4 vBanding;
flat out ivec4 vGlyph;

/**
 * Expand glyph quad outward along vertex normals so boundary pixels
 * are not clipped. Distance is derived from MVP + viewport size.
 */
vec2 slugDilate(vec2 position, vec2 normal, vec4 jacobian) {
	vec2 ndcScale = vec2(uSlugMatrix[0][0], uSlugMatrix[1][1]) * uSlugViewport * 0.5;
	float pixelSize = 1.0 / min(abs(ndcScale.x), abs(ndcScale.y));
	float dilateDistance = pixelSize * 0.5;

	return position + normal * dilateDistance;
}

/**
 * Unpack integer fields from packed float attributes into
 * glyph location (curve texture coords) and band max indices.
 */
ivec4 slugUnpack(vec4 texcoord) {
	uint packedLocation = floatBitsToUint(texcoord.z);
	uint packedBands = floatBitsToUint(texcoord.w);

	int glyphX = int(packedLocation & 0xFFFFu);
	int glyphY = int(packedLocation >> 16u);
	int bandMaxX = int(packedBands & 0xFFu);
	int bandMaxY = int((packedBands >> 8u) & 0xFFu);

	return ivec4(glyphX, glyphY, bandMaxX, bandMaxY);
}

void main() {
	// Dilate vertex position along normal
	vec2 dilatedPos = slugDilate(aPositionNormal.xy, aPositionNormal.zw, aJacobian);

	// Apply MVP transform
	gl_Position = uSlugMatrix * vec4(dilatedPos, 0.0, 1.0);

	// Pass through color and texcoords
	vColor = aColor;
	vTexcoord = aTexcoord.xy;

	// Unpack glyph data (flat, no interpolation)
	vGlyph = slugUnpack(aTexcoord);

	// Band transform (flat, no interpolation)
	vBanding = aBanding;
}
