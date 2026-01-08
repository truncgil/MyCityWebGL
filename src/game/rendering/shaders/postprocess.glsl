// Main post-processing shader combining multiple effects

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
uniform vec2 uResolution;

// Effect toggles and parameters
uniform float uVignetteIntensity;
uniform float uVignetteRadius;
uniform float uBloomThreshold;
uniform float uBloomIntensity;
uniform float uSaturation;
uniform float uContrast;
uniform float uBrightness;
uniform float uGamma;

varying vec2 vUv;

// Vignette effect
vec3 applyVignette(vec3 color, vec2 uv) {
    float dist = distance(uv, vec2(0.5));
    float vignette = smoothstep(uVignetteRadius, uVignetteRadius - 0.3, dist);
    return color * mix(1.0 - uVignetteIntensity, 1.0, vignette);
}

// Simple bloom (bright areas glow)
vec3 applyBloom(vec3 color, vec2 uv) {
    vec3 bloom = vec3(0.0);
    float samples = 8.0;
    float radius = 3.0 / uResolution.x;
    
    for (float i = 0.0; i < samples; i++) {
        float angle = i / samples * 6.28318;
        vec2 offset = vec2(cos(angle), sin(angle)) * radius;
        vec3 sampleColor = texture2D(tDiffuse, uv + offset).rgb;
        
        // Only add bright pixels
        float brightness = dot(sampleColor, vec3(0.2126, 0.7152, 0.0722));
        if (brightness > uBloomThreshold) {
            bloom += sampleColor * (brightness - uBloomThreshold);
        }
    }
    
    bloom /= samples;
    return color + bloom * uBloomIntensity;
}

// Color adjustments
vec3 adjustColor(vec3 color) {
    // Brightness
    color = color * uBrightness;
    
    // Contrast
    color = (color - 0.5) * uContrast + 0.5;
    
    // Saturation
    float gray = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(vec3(gray), color, uSaturation);
    
    // Gamma correction
    color = pow(color, vec3(1.0 / uGamma));
    
    return color;
}

// Film grain noise
float random(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 applyFilmGrain(vec3 color, vec2 uv, float amount) {
    float noise = random(uv + fract(uResolution.x * 0.001)) * 2.0 - 1.0;
    return color + noise * amount;
}

void main() {
    vec4 texColor = texture2D(tDiffuse, vUv);
    vec3 color = texColor.rgb;
    
    // Apply effects in order
    color = applyBloom(color, vUv);
    color = adjustColor(color);
    color = applyVignette(color, vUv);
    
    // Very subtle film grain for texture
    color = applyFilmGrain(color, vUv, 0.02);
    
    // Clamp to valid range
    color = clamp(color, 0.0, 1.0);
    
    gl_FragColor = vec4(color, texColor.a);
}
#endif
