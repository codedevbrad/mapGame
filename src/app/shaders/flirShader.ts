export const flirFragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform float uIntensity;
varying vec2 vUv;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = vUv;
  float scanline = 0.5 + 0.5 * sin((uv.y * uResolution.y) * 0.28 + uTime * 8.0);
  float noise = random(vec2(uv.y * 320.0, uTime * 0.2)) * 0.18;
  float vignette = smoothstep(0.95, 0.22, distance(uv, vec2(0.5)));

  vec3 tint = vec3(1.0, 0.45, 0.12);
  vec3 color = tint * (0.5 + scanline * 0.45 + noise) * uIntensity;
  float alpha = (0.08 + 0.12 * scanline + noise) * vignette * uIntensity;

  gl_FragColor = vec4(color, alpha);
}
`
