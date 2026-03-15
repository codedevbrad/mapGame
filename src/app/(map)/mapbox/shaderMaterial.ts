import * as THREE from "three"
import { flirFragmentShader } from "@/app/shaders/flirShader"
import { nvgFragmentShader } from "@/app/shaders/nvgShader"
import { glitchFragmentShader } from "@/app/shaders/glitchShader"
import type { ShaderMode } from "@/app/(map)/components/VisualControls"

const fullScreenVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`

function getFragmentShader(shaderMode: ShaderMode) {
  if (shaderMode === "flir") return flirFragmentShader
  if (shaderMode === "nvg") return nvgFragmentShader
  if (shaderMode === "glitch") return glitchFragmentShader

  return `
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

void main() {
  gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
}
`
}

export function createShaderMaterial(shaderMode: ShaderMode, shaderIntensity: number) {
  return new THREE.ShaderMaterial({
    vertexShader: fullScreenVertexShader,
    fragmentShader: getFragmentShader(shaderMode),
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uIntensity: { value: shaderIntensity }
    },
    transparent: true,
    depthTest: false,
    depthWrite: false
  })
}
