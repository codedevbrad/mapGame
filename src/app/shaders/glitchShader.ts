export const glitchFragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform float uIntensity;
varying vec2 vUv;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = vUv;
  float stripe = step(0.985, fract(uv.y * 40.0 + uTime * 0.9));
  float jitter = random(vec2(floor(uv.y * 120.0), floor(uTime * 14.0))) * 0.35;
  float glitch = stripe * jitter;
  float noise = random(uv * uResolution + uTime * 25.0) * 0.22;

  vec3 color = vec3(0.08 + noise, 0.55 + glitch, 0.95 + noise * 0.4) * uIntensity;
  float alpha = (0.05 + glitch * 0.75 + noise * 0.15) * uIntensity;

  gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.85));
}
`
