// Day/Night cycle shader for post-processing

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
uniform float uTime; // 0-1 representing time of day
uniform float uTransition; // Transition smoothness

varying vec2 vUv;

// Color grading for different times
vec3 getDayColor() {
    return vec3(1.0, 1.0, 1.0); // Neutral
}

vec3 getSunriseColor() {
    return vec3(1.1, 0.9, 0.8); // Warm orange
}

vec3 getSunsetColor() {
    return vec3(1.15, 0.85, 0.75); // Warm red-orange
}

vec3 getNightColor() {
    return vec3(0.6, 0.7, 0.9); // Cool blue
}

// Smooth interpolation
float smootherstep(float edge0, float edge1, float x) {
    x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

void main() {
    vec4 texColor = texture2D(tDiffuse, vUv);
    
    // Calculate time-based color grading
    vec3 colorGrade;
    
    // 0.0 = midnight, 0.25 = 6am, 0.5 = noon, 0.75 = 6pm, 1.0 = midnight
    if (uTime < 0.2) {
        // Night to sunrise
        float t = smootherstep(0.15, 0.25, uTime);
        colorGrade = mix(getNightColor(), getSunriseColor(), t);
    } else if (uTime < 0.35) {
        // Sunrise to day
        float t = smootherstep(0.2, 0.35, uTime);
        colorGrade = mix(getSunriseColor(), getDayColor(), t);
    } else if (uTime < 0.7) {
        // Day
        colorGrade = getDayColor();
    } else if (uTime < 0.8) {
        // Day to sunset
        float t = smootherstep(0.7, 0.8, uTime);
        colorGrade = mix(getDayColor(), getSunsetColor(), t);
    } else if (uTime < 0.9) {
        // Sunset to night
        float t = smootherstep(0.8, 0.9, uTime);
        colorGrade = mix(getSunsetColor(), getNightColor(), t);
    } else {
        // Night
        colorGrade = getNightColor();
    }
    
    // Apply color grading
    vec3 gradedColor = texColor.rgb * colorGrade;
    
    // Add ambient occlusion darkening at night
    float nightFactor = 1.0 - smootherstep(0.2, 0.8, uTime) * (1.0 - smootherstep(0.2, 0.0, uTime));
    float ambientDarkening = mix(1.0, 0.7, nightFactor);
    gradedColor *= ambientDarkening;
    
    // Slight contrast boost during day
    float dayFactor = smootherstep(0.3, 0.5, uTime) * (1.0 - smootherstep(0.7, 0.9, uTime));
    gradedColor = mix(gradedColor, pow(gradedColor, vec3(0.95)), dayFactor);
    
    gl_FragColor = vec4(gradedColor, texColor.a);
}
#endif
