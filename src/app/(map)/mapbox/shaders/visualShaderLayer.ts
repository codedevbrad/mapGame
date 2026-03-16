import type { MutableRefObject } from "react"
import type mapboxgl from "mapbox-gl"
import * as THREE from "three"
import { VISUAL_SHADER_LAYER_ID } from "@/app/(map)/mapbox/config"
import { createShaderMaterial } from "@/app/(map)/mapbox/shaders/shaderMaterial"
import type { ShaderMode } from "@/app/(map)/components/VisualControls"

type VisualShaderLayerRefs = {
  initialShaderModeRef: MutableRefObject<ShaderMode>
  shaderIntensityRef: MutableRefObject<number>
  shaderMaterialRef: MutableRefObject<THREE.ShaderMaterial | null>
  shaderMeshRef: MutableRefObject<THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null>
}

export function ensureVisualShaderLayer(map: mapboxgl.Map, refs: VisualShaderLayerRefs) {
  if (map.getLayer(VISUAL_SHADER_LAYER_ID)) return

  let renderer: THREE.WebGLRenderer | null = null
  let scene: THREE.Scene | null = null
  let camera: THREE.OrthographicCamera | null = null
  let quad: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null = null
  const start = performance.now()

  const shaderLayer: mapboxgl.CustomLayerInterface = {
    id: VISUAL_SHADER_LAYER_ID,
    type: "custom",
    renderingMode: "2d",
    onAdd: (_map, gl) => {
      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl as WebGLRenderingContext,
        antialias: true
      })
      renderer.autoClear = false

      scene = new THREE.Scene()
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

      const geometry = new THREE.PlaneGeometry(2, 2)
      const material = createShaderMaterial(refs.initialShaderModeRef.current, refs.shaderIntensityRef.current)
      quad = new THREE.Mesh(geometry, material)
      scene.add(quad)

      refs.shaderMaterialRef.current = material
      refs.shaderMeshRef.current = quad
    },
    render: () => {
      if (!renderer || !scene || !camera || !refs.shaderMaterialRef.current) return

      const canvas = map.getCanvas()
      refs.shaderMaterialRef.current.uniforms.uTime.value = (performance.now() - start) / 1000
      refs.shaderMaterialRef.current.uniforms.uResolution.value.set(canvas.width, canvas.height)

      renderer.resetState()
      renderer.render(scene, camera)
      map.triggerRepaint()
    },
    onRemove: () => {
      if (quad) {
        quad.geometry.dispose()
        quad.material.dispose()
      }
      renderer?.dispose()
    }
  }

  map.addLayer(shaderLayer)
}
