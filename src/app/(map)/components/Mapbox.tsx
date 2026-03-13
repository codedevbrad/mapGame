"use client"

import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import * as THREE from "three"
import { flirFragmentShader } from "@/app/shaders/flirShader"
import { nvgFragmentShader } from "@/app/shaders/nvgShader"
import { glitchFragmentShader } from "@/app/shaders/glitchShader"
import type { ShaderMode } from "@/app/(map)/components/VisualControls"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

type MapboxMapProps = {
  shaderMode: ShaderMode
  shaderIntensity: number
  backgroundDimOpacity: number
  center: [number, number]
  flyToKey?: number
  onMapReady?: (map: mapboxgl.Map) => void
}

const fullScreenVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`

const CITY_VIEW_ZOOM = 10.5
const CITY_VIEW_PITCH = 55
const CITY_VIEW_BEARING = -15

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

function createShaderMaterial(shaderMode: ShaderMode, shaderIntensity: number) {
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

export default function MapboxMap({
  shaderMode,
  shaderIntensity,
  backgroundDimOpacity,
  center,
  flyToKey = 0,
  onMapReady
}: MapboxMapProps) {

  const mapContainer = useRef<HTMLDivElement>(null)
  const initialShaderModeRef = useRef<ShaderMode>(shaderMode)
  const shaderIntensityRef = useRef<number>(shaderIntensity)
  const initialCenterRef = useRef<[number, number]>(center)
  const onMapReadyRef = useRef<MapboxMapProps["onMapReady"]>(onMapReady)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const shaderMaterialRef = useRef<THREE.ShaderMaterial | null>(null)
  const shaderMeshRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null>(null)

  useEffect(() => {

    if (!mapContainer.current) return

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/navigation-night-v1",
      projection: "globe",
      center: initialCenterRef.current,
      zoom: 1.8,
      pitch: 0,
      bearing: 0,
      antialias: true
    })
    mapRef.current = map
    onMapReadyRef.current?.(map)

    map.addControl(new mapboxgl.FullscreenControl(), "top-left")
    map.addControl(new mapboxgl.ScaleControl({ unit: "metric" }), "bottom-left")
    map.doubleClickZoom.enable()

    map.on("style.load", () => {
      const layers = map.getStyle().layers
      const labelLayerId = layers?.find(
        (layer) => layer.type === "symbol" && layer.layout && "text-field" in layer.layout
      )?.id

      if (!map.getSource("mapbox-streets")) {
        map.addSource("mapbox-streets", {
          type: "vector",
          url: "mapbox://mapbox.mapbox-streets-v8"
        })
      }

      if (map.getLayer("3d-buildings")) return

      map.addLayer(
        {
          id: "3d-buildings",
          source: "mapbox-streets",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 15,
          paint: {
            "fill-extrusion-color": "#aaa",
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "height"]
            ],
            "fill-extrusion-base": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "min_height"]
            ],
            "fill-extrusion-opacity": 0.6
          }
        },
        labelLayerId
      )

      if (!map.getLayer("visual-shader-layer")) {
        let renderer: THREE.WebGLRenderer | null = null
        let scene: THREE.Scene | null = null
        let camera: THREE.OrthographicCamera | null = null
        let quad: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null = null
        const start = performance.now()

        const shaderLayer: mapboxgl.CustomLayerInterface = {
          id: "visual-shader-layer",
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
            const material = createShaderMaterial(initialShaderModeRef.current, shaderIntensityRef.current)
            quad = new THREE.Mesh(geometry, material)
            scene.add(quad)

            shaderMaterialRef.current = material
            shaderMeshRef.current = quad
          },
          render: () => {
            if (!renderer || !scene || !camera || !shaderMaterialRef.current) return
            const canvas = map.getCanvas()
            shaderMaterialRef.current.uniforms.uTime.value = (performance.now() - start) / 1000
            shaderMaterialRef.current.uniforms.uResolution.value.set(canvas.width, canvas.height)

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
    })

    return () => {
      mapRef.current = null
      shaderMaterialRef.current = null
      shaderMeshRef.current = null
      map.remove()
    }

  }, [])

  useEffect(() => {
    const mesh = shaderMeshRef.current
    const material = shaderMaterialRef.current
    if (!mesh || !material) return

    const nextMaterial = createShaderMaterial(shaderMode, shaderIntensityRef.current)
    mesh.material = nextMaterial
    shaderMaterialRef.current = nextMaterial
    material.dispose()
    mapRef.current?.triggerRepaint()
  }, [shaderMode])

  useEffect(() => {
    shaderIntensityRef.current = shaderIntensity
    if (!shaderMaterialRef.current) return
    shaderMaterialRef.current.uniforms.uIntensity.value = shaderIntensity
    mapRef.current?.triggerRepaint()
  }, [shaderIntensity])

  useEffect(() => {
    mapRef.current?.easeTo({
      center,
      zoom: CITY_VIEW_ZOOM,
      pitch: CITY_VIEW_PITCH,
      bearing: CITY_VIEW_BEARING,
      duration: 1600
    })
  }, [center, flyToKey])

  return (
    <div
      className="relative w-[80%] h-[90%]"
      style={{ filter: `brightness(${Math.max(0.2, 1 - backgroundDimOpacity)})` }}
    >
      {/* <div className="pointer-events-none absolute  rounded-[45%] -inset-1 border-2 border-gray-800 blur-[9px]" /> */}
      <div className="map-plus-cursor relative h-full w-full overflow-hidden rounded-[45%]">
        <div
          ref={mapContainer}
          className="h-full w-full "
        />
      </div>
      {/* <div className="pointer-events-none absolute bottom-0 left-0 z-30 h-20 w-full bg-background" /> */}
    </div>
  )
}