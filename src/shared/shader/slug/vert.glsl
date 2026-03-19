#version 300 es

precision highp float;

// Viewport dimensions in pixels (for pixel-to-clip-space conversion)
uniform vec2 uSlugViewport;

// PixiJS transform matrix (injected by MeshPipe)
uniform mat3 uTransformMatrix;

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
 * are not clipped. Dilation distance is half a pixel in em-space.
 */
vec2 slugDilate(vec2 position, vec2 normal) {
	// Compute pixel size in the coordinate space of the position
	vec2 pixelSize = 2.0 / uSlugViewport;
	float dilateDistance = max(pixelSize.x, pixelSize.y) * 0.5;

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
	int bandMaxX = int(packedBands & 0xFFFFu);
	int bandMaxY = int((packedBands >> 16u) & 0xFFFFu);

	return ivec4(glyphX, glyphY, bandMaxX, bandMaxY);
}

void main() {
	// Dilate vertex position along normal
	vec2 dilatedPos = slugDilate(aPositionNormal.xy, aPositionNormal.zw);

	// Apply PixiJS transform (includes container position, scale, rotation)
	vec3 transformed = uTransformMatrix * vec3(dilatedPos, 1.0);

	// Convert pixel coordinates to clip space (-1 to 1), flip Y
	vec2 clipPos = (transformed.xy / uSlugViewport) * 2.0 - 1.0;
	clipPos.y = -clipPos.y;
	gl_Position = vec4(clipPos, 0.0, 1.0);

	// Pass through color and texcoords
	vColor = aColor;
	vTexcoord = aTexcoord.xy;

	// Unpack glyph data (flat, no interpolation)
	vGlyph = slugUnpack(aTexcoord);

	// Band transform (flat, no interpolation)
	vBanding = aBanding;
}
