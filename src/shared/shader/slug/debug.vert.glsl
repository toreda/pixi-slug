#version 300 es

precision highp float;

in vec4 aPositionNormal;
in vec4 aColor;

// Canvas size for pixel-to-clip-space conversion
uniform vec2 uCanvasSize;

out vec4 vColor;

void main() {
	// Convert pixel coordinates to clip space (-1 to 1)
	vec2 clipPos = (aPositionNormal.xy / uCanvasSize) * 2.0 - 1.0;
	// Flip Y (clip space Y is up, pixel space Y is down)
	clipPos.y = -clipPos.y;
	gl_Position = vec4(clipPos, 0.0, 1.0);
	vColor = aColor;
}
