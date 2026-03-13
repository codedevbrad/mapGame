export const nvgFragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform float uIntensity;
varying vec2 vUv;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = vUv;
  float pulse = 0.65 + 0.35 * sin(uTime * 1.8);
  float grain = random(vec2(uv * uResolution * 0.25 + uTime * 2.0)) * 0.2;
  float vignette = smoothstep(0.98, 0.28, distance(uv, vec2(0.5)));

  vec3 tint = vec3(0.36, 1.0, 0.52);
  vec3 color = tint * (0.45 + grain + pulse * 0.2) * uIntensity;
  float alpha = (0.08 + grain * 0.8) * vignette * uIntensity;

  gl_FragColor = vec4(color, alpha);
}
`
