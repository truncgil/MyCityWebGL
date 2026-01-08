// Outline/Selection highlight shader

// Vertex Shader
#ifdef VERTEX_SHADER
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
#endif

// Fragment Shader
#ifdef FRAGMENT_SHADER
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform vec2 uResolution;
uniform vec3 uOutlineColor;
uniform float uOutlineThickness;
uniform float uOutlineThreshold;

varying vec2 vUv;

// Sobel edge detection
float sobelSample(sampler2D tex, vec2 uv, vec2 offset) {
    return texture2D(tex, uv + offset).r;
}

float sobelEdge(sampler2D tex, vec2 uv, vec2 texelSize) {
    float tl = sobelSample(tex, uv, texelSize * vec2(-1.0, 1.0));
    float t  = sobelSample(tex, uv, texelSize * vec2(0.0, 1.0));
    float tr = sobelSample(tex, uv, texelSize * vec2(1.0, 1.0));
    float l  = sobelSample(tex, uv, texelSize * vec2(-1.0, 0.0));
    float r  = sobelSample(tex, uv, texelSize * vec2(1.0, 0.0));
    float bl = sobelSample(tex, uv, texelSize * vec2(-1.0, -1.0));
    float b  = sobelSample(tex, uv, texelSize * vec2(0.0, -1.0));
    float br = sobelSample(tex, uv, texelSize * vec2(1.0, -1.0));
    
    float gx = tl + 2.0 * l + bl - tr - 2.0 * r - br;
    float gy = tl + 2.0 * t + tr - bl - 2.0 * b - br;
    
    return sqrt(gx * gx + gy * gy);
}

void main() {
    vec4 texColor = texture2D(tDiffuse, vUv);
    vec2 texelSize = uOutlineThickness / uResolution;
    
    // Edge detection on depth buffer
    float edge = sobelEdge(tDepth, vUv, texelSize);
    
    // Threshold and smooth
    float outline = smoothstep(uOutlineThreshold - 0.1, uOutlineThreshold + 0.1, edge);
    
    // Mix outline color
    vec3 finalColor = mix(texColor.rgb, uOutlineColor, outline * 0.7);
    
    gl_FragColor = vec4(finalColor, texColor.a);
}
#endif
