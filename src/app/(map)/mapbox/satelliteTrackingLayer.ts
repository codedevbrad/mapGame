import mapboxgl from "mapbox-gl"
import * as THREE from "three"
import {
  eciToGeodetic,
  gstime,
  json2satrec,
  propagate,
  radiansToDegrees,
  twoline2satrec,
  type OMMJsonObject,
  type SatRec
} from "satellite.js"
import type { SatelliteListItem } from "@/app/(map)/mapbox/types"

const SATELLITE_GROUP = "stations"
const SATELLITE_FETCH_MS = 10 * 60 * 1000
const SATELLITE_POSITION_UPDATE_MS = 1000
const SATELLITE_TRAIL_UPDATE_MS = 15 * 1000
const MAX_SATELLITES = 80

const SATELLITE_SOURCE_ID = "satellite-tracking-source"
const SATELLITE_HIT_LAYER_ID = "satellite-tracking-hit-layer"
const SATELLITE_3D_LAYER_ID = "satellite-tracking-3d-layer"

const SATELLITE_DEFAULT_COLOR = "#67e8f9"
const SATELLITE_SELECTED_COLOR = "#fcd34d"

type TrackedSatellite = {
  id: string
  name: string
  satrec: SatRec
  lastLngLat: [number, number]
  altitudeKm: number
  speedKps: number
}

type OrbitTrailPoint = {
  lng: number
  lat: number
  altitudeMeters: number
}

type CelestrakSatellite = OMMJsonObject & {
  OBJECT_NAME: string
  NORAD_CAT_ID: string | number
}

type FallbackTleSatellite = {
  id: string
  name: string
  line1: string
  line2: string
}

type SatelliteTrackingOptions = {
  selectedSatelliteId?: string | null
  onSatelliteSelect?: (satelliteId: string | null) => void
  onSatellitesChange?: (satellites: SatelliteListItem[]) => void
}

export type SatelliteTrackingLayerController = {
  cleanup: () => void
  setSelectedSatellite: (satelliteId: string | null) => void
  focusSatellite: (satelliteId: string) => void
}

const FALLBACK_TLE_SATELLITES: FallbackTleSatellite[] = [
  {
    id: "25544",
    name: "ISS (ZARYA)",
    line1: "1 25544U 98067A   24067.54167824  .00016052  00000+0  29004-3 0  9993",
    line2: "2 25544  51.6416 131.1061 0004574 322.5073  95.1637 15.50227437442194"
  },
  {
    id: "20580",
    name: "HUBBLE SPACE TELESCOPE",
    line1: "1 20580U 90037B   24066.86502290  .00000631  00000+0  28501-4 0  9997",
    line2: "2 20580  28.4696  13.5943 0002857  70.2558 289.8612 15.26030481751321"
  },
  {
    id: "25338",
    name: "NOAA 15",
    line1: "1 25338U 98030A   24066.83407009  .00000095  00000+0  86487-4 0  9991",
    line2: "2 25338  98.7392 128.8202 0011822 220.8623 139.1458 14.25917439349224"
  },
  {
    id: "25994",
    name: "TERRA",
    line1: "1 25994U 99068A   24067.22768056  .00000084  00000+0  21831-4 0  9996",
    line2: "2 25994  98.2051 125.8432 0001344  86.3756 273.7562 14.57108728289170"
  },
  {
    id: "39084",
    name: "LANDSAT 8",
    line1: "1 39084U 13008A   24067.20653936  .00000030  00000+0  17768-4 0  9999",
    line2: "2 39084  98.2235 132.3844 0001307  90.2452 269.8870 14.57109413592776"
  },
  {
    id: "40697",
    name: "SENTINEL-2A",
    line1: "1 40697U 15028A   24067.16272937  .00000031  00000+0  15243-4 0  9998",
    line2: "2 40697  98.5699 133.7258 0001246  88.2686 271.8627 14.30815733456013"
  }
]

function buildTrackedSatellitesFromFallbackTle() {
  return FALLBACK_TLE_SATELLITES.map((record) => ({
    id: record.id,
    name: record.name,
    satrec: twoline2satrec(record.line1, record.line2),
    lastLngLat: [0, 0] as [number, number],
    altitudeKm: 0,
    speedKps: 0
  }))
}

function emptyFeatureCollection(): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: []
  }
}

function getCelestrakUrl(group: string) {
  return `/api/satellites?group=${encodeURIComponent(group)}`
}

function velocityMagnitudeKps(positionVelocity: ReturnType<typeof propagate>) {
  if (!positionVelocity?.velocity) return 0
  const { x, y, z } = positionVelocity.velocity
  return Math.sqrt(x * x + y * y + z * z)
}

function create3DSatelliteMesh() {
  // 3-sided cone gives a clear triangular satellite marker.
  const geometry = new THREE.ConeGeometry(1, 2.2, 3)
  geometry.rotateX(Math.PI / 2)
  const material = new THREE.MeshBasicMaterial({
    color: SATELLITE_DEFAULT_COLOR,
    transparent: true,
    opacity: 0.9,
    depthTest: false,
    depthWrite: false
  })
  material.flatShading = true
  material.needsUpdate = true
  const mesh = new THREE.Mesh(geometry, material)
  mesh.renderOrder = 20
  return mesh
}

function create3DTrailLine() {
  const geometry = new THREE.BufferGeometry()
  const material = new THREE.LineBasicMaterial({
    color: SATELLITE_DEFAULT_COLOR,
    transparent: true,
    opacity: 0.24,
    depthTest: false,
    depthWrite: false
  })
  const line = new THREE.Line(geometry, material)
  line.renderOrder = 10
  return line
}

function buildOrbitTrailPoints(satrec: SatRec, atTime: Date) {
  const points: OrbitTrailPoint[] = []
  for (let minutes = -45; minutes <= 45; minutes += 3) {
    const sampleTime = new Date(atTime.getTime() + minutes * 60 * 1000)
    const sample = propagate(satrec, sampleTime)
    if (!sample?.position) continue

    const sampleGmst = gstime(sampleTime)
    const sampleGeodetic = eciToGeodetic(sample.position, sampleGmst)
    points.push({
      lng: radiansToDegrees(sampleGeodetic.longitude),
      lat: radiansToDegrees(sampleGeodetic.latitude),
      altitudeMeters: Math.max(0, sampleGeodetic.height * 1000)
    })
  }
  return points
}

function buildMercatorTrailGeometry(points: OrbitTrailPoint[]) {
  const vectors: THREE.Vector3[] = []
  let previousLng: number | null = null

  for (const point of points) {
    if (previousLng !== null && Math.abs(point.lng - previousLng) > 180) {
      continue
    }
    previousLng = point.lng

    const mercator = mapboxgl.MercatorCoordinate.fromLngLat(
      { lng: point.lng, lat: point.lat },
      point.altitudeMeters
    )
    vectors.push(new THREE.Vector3(mercator.x, mercator.y, mercator.z))
  }

  return new THREE.BufferGeometry().setFromPoints(vectors)
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    for (const item of material) {
      item.dispose()
    }
    return
  }
  material.dispose()
}

export function ensureSatelliteTrackingLayer(
  map: mapboxgl.Map,
  beforeLayerId?: string,
  options?: SatelliteTrackingOptions
): SatelliteTrackingLayerController {
  if (map.getLayer(SATELLITE_3D_LAYER_ID)) {
    return {
      cleanup: () => {},
      setSelectedSatellite: () => {},
      focusSatellite: () => {}
    }
  }

  let renderer: THREE.WebGLRenderer | null = null
  let camera: THREE.Camera | null = null
  let scene: THREE.Scene | null = null
  let isDisposed = false
  let fetchAbortController: AbortController | null = null
  let fetchIntervalId: ReturnType<typeof setInterval> | null = null
  let tickIntervalId: ReturnType<typeof setInterval> | null = null
  let trailIntervalId: ReturnType<typeof setInterval> | null = null
  let selectedSatelliteId = options?.selectedSatelliteId ?? null

  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnMove: true,
    closeOnClick: true
  })

  const satellites = new Map<string, TrackedSatellite>()
  const satelliteMeshes = new Map<string, THREE.Mesh>()
  const trailLines = new Map<string, THREE.Line>()

  function cleanupMeshes() {
    for (const mesh of satelliteMeshes.values()) {
      scene?.remove(mesh)
      mesh.geometry.dispose()
      disposeMaterial(mesh.material)
    }
    for (const trailLine of trailLines.values()) {
      scene?.remove(trailLine)
      trailLine.geometry.dispose()
      disposeMaterial(trailLine.material)
    }
    satelliteMeshes.clear()
    trailLines.clear()
  }

  function serializeSatelliteFeature(
    satellite: TrackedSatellite
  ): GeoJSON.Feature<GeoJSON.Point, { id: string; name: string; altitudeKm: number; speedKps: number }> {
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: satellite.lastLngLat
      },
      properties: {
        id: satellite.id,
        name: satellite.name,
        altitudeKm: Number(satellite.altitudeKm.toFixed(1)),
        speedKps: Number(satellite.speedKps.toFixed(2))
      }
    }
  }

  function updateGeoJsonSource() {
    const source = map.getSource(SATELLITE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
    if (!source) return

    const features = Array.from(satellites.values()).map((satellite) =>
      serializeSatelliteFeature(satellite)
    )

    source.setData({
      type: "FeatureCollection",
      features
    })

    options?.onSatellitesChange?.(
      features.map((feature) => ({
        id: String(feature.properties.id),
        name: String(feature.properties.name),
        altitudeKm: Number(feature.properties.altitudeKm),
        speedKps: Number(feature.properties.speedKps),
        position: feature.geometry.coordinates as [number, number]
      }))
    )
  }

  function ensureSatelliteMesh(satellite: TrackedSatellite) {
    if (satelliteMeshes.has(satellite.id)) return satelliteMeshes.get(satellite.id)!
    const mesh = create3DSatelliteMesh()
    scene?.add(mesh)
    satelliteMeshes.set(satellite.id, mesh)
    return mesh
  }

  function ensureTrailLine(satelliteId: string) {
    if (trailLines.has(satelliteId)) return trailLines.get(satelliteId)!
    const line = create3DTrailLine()
    scene?.add(line)
    trailLines.set(satelliteId, line)
    return line
  }

  function updateOrbitTrails3D() {
    const now = new Date()

    for (const satellite of satellites.values()) {
      const points = buildOrbitTrailPoints(satellite.satrec, now)
      if (points.length < 2) continue

      const nextGeometry = buildMercatorTrailGeometry(points)
      if (nextGeometry.attributes.position.count < 2) {
        nextGeometry.dispose()
        continue
      }

      const line = ensureTrailLine(satellite.id)
      line.geometry.dispose()
      line.geometry = nextGeometry
    }
  }

  function apply3DStyles() {
    for (const [satelliteId, mesh] of satelliteMeshes.entries()) {
      const material = mesh.material as THREE.MeshBasicMaterial
      const isSelected = satelliteId === selectedSatelliteId
      const scaleMultiplier = isSelected ? 1.45 : 1
      material.color.set(isSelected ? SATELLITE_SELECTED_COLOR : SATELLITE_DEFAULT_COLOR)
      material.opacity = isSelected ? 1 : 0.88
      mesh.scale.multiplyScalar(scaleMultiplier / mesh.userData.scaleMultiplier)
      mesh.userData.scaleMultiplier = scaleMultiplier
    }

    for (const [satelliteId, line] of trailLines.entries()) {
      const material = line.material as THREE.LineBasicMaterial
      const isSelected = satelliteId === selectedSatelliteId
      material.color.set(isSelected ? SATELLITE_SELECTED_COLOR : SATELLITE_DEFAULT_COLOR)
      material.opacity = isSelected ? 0.96 : 0.24
    }

    map.triggerRepaint()
  }

  function focusSatellite(satelliteId: string) {
    const target = satellites.get(satelliteId)
    if (!target) return
    const altitudeKm = Math.max(0, target.altitudeKm)
    const altitudeNormalized = Math.min(1, altitudeKm / 1200)
    const recommendedZoom = 4.6 - altitudeNormalized * 1.9
    const zoom = Math.min(map.getZoom(), Math.max(2.2, Math.min(4.8, recommendedZoom)))

    map.easeTo({
      center: target.lastLngLat,
      // Keep focus overhead and zoomed-out enough to account for altitude.
      zoom,
      pitch: 12,
      bearing: map.getBearing(),
      duration: 1200,
      essential: true
    })
  }

  function setSelectedSatellite(satelliteId: string | null, shouldFocus = false) {
    selectedSatelliteId = satelliteId
    apply3DStyles()
    if (shouldFocus && satelliteId) {
      focusSatellite(satelliteId)
    }
    options?.onSatelliteSelect?.(satelliteId)
  }

  function updateSatellitePositions() {
    if (isDisposed) return
    const now = new Date()
    const gmst = gstime(now)

    for (const satellite of satellites.values()) {
      const positionVelocity = propagate(satellite.satrec, now)
      if (!positionVelocity?.position) continue

      const geodetic = eciToGeodetic(positionVelocity.position, gmst)
      const lng = radiansToDegrees(geodetic.longitude)
      const lat = radiansToDegrees(geodetic.latitude)
      const altitudeKm = geodetic.height
      const altitudeMeters = Math.max(0, altitudeKm * 1000)
      const mercator = mapboxgl.MercatorCoordinate.fromLngLat({ lng, lat }, altitudeMeters)
      const mesh = ensureSatelliteMesh(satellite)
      const visualSizeMeters = 20000
      const scale = mercator.meterInMercatorCoordinateUnits() * visualSizeMeters

      mesh.position.set(mercator.x, mercator.y, mercator.z)
      mesh.scale.setScalar(scale)
      if (!mesh.userData.scaleMultiplier) {
        mesh.userData.scaleMultiplier = 1
      }

      satellite.lastLngLat = [lng, lat]
      satellite.altitudeKm = altitudeKm
      satellite.speedKps = velocityMagnitudeKps(positionVelocity)
    }

    updateGeoJsonSource()
    apply3DStyles()
    map.triggerRepaint()
  }

  async function loadSatellites() {
    if (isDisposed) return
    fetchAbortController?.abort()
    const controller = new AbortController()
    fetchAbortController = controller

    try {
      const response = await fetch(getCelestrakUrl(SATELLITE_GROUP), {
        signal: controller.signal
      })
      let nextSatellites: TrackedSatellite[] = []

      if (response.ok) {
        const responseText = await response.text()
        try {
          const records = JSON.parse(responseText) as CelestrakSatellite[]
          nextSatellites = records
            .slice(0, MAX_SATELLITES)
            .map((record) => {
              try {
                const satrec = json2satrec(record)
                return {
                  id: String(record.NORAD_CAT_ID),
                  name: record.OBJECT_NAME ?? `NORAD ${record.NORAD_CAT_ID}`,
                  satrec,
                  lastLngLat: [0, 0] as [number, number],
                  altitudeKm: 0,
                  speedKps: 0
                } satisfies TrackedSatellite
              } catch {
                return null
              }
            })
            .filter((satellite): satellite is TrackedSatellite => satellite !== null)
        } catch {
          nextSatellites = buildTrackedSatellitesFromFallbackTle()
        }
      } else {
        nextSatellites = buildTrackedSatellitesFromFallbackTle()
      }

      if (nextSatellites.length === 0) {
        nextSatellites = buildTrackedSatellitesFromFallbackTle()
      }

      const nextIds = new Set(nextSatellites.map((satellite) => satellite.id))
      for (const existingId of satellites.keys()) {
        if (nextIds.has(existingId)) continue
        satellites.delete(existingId)

        const existingMesh = satelliteMeshes.get(existingId)
        if (existingMesh) {
          scene?.remove(existingMesh)
          existingMesh.geometry.dispose()
          disposeMaterial(existingMesh.material)
          satelliteMeshes.delete(existingId)
        }

        const existingTrail = trailLines.get(existingId)
        if (existingTrail) {
          scene?.remove(existingTrail)
          existingTrail.geometry.dispose()
          disposeMaterial(existingTrail.material)
          trailLines.delete(existingId)
        }
      }

      for (const satellite of nextSatellites) {
        satellites.set(satellite.id, satellite)
      }

      updateSatellitePositions()
      updateOrbitTrails3D()
      apply3DStyles()
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }
      satellites.clear()
      for (const satellite of buildTrackedSatellitesFromFallbackTle()) {
        satellites.set(satellite.id, satellite)
      }
      updateSatellitePositions()
      updateOrbitTrails3D()
      apply3DStyles()
    }
  }

  function onSatelliteClick(event: mapboxgl.MapLayerMouseEvent) {
    const feature = event.features?.[0]
    if (!feature || feature.geometry.type !== "Point") return

    const [lng, lat] = feature.geometry.coordinates as [number, number]
    const name = String(feature.properties?.name ?? "Satellite")
    const altitudeKm = Number(feature.properties?.altitudeKm ?? 0)
    const speedKps = Number(feature.properties?.speedKps ?? 0)
    const satelliteId = String(feature.properties?.id ?? "")

    popup
      .setLngLat([lng, lat])
      .setHTML(
        `<strong>${name}</strong><br/>Altitude: ${altitudeKm.toFixed(1)} km<br/>Speed: ${speedKps.toFixed(2)} km/s`
      )
      .addTo(map)

    if (satelliteId) {
      setSelectedSatellite(satelliteId, true)
    }
  }

  function onSatelliteMouseEnter() {
    map.getCanvas().style.cursor = "pointer"
  }

  function onSatelliteMouseLeave() {
    map.getCanvas().style.cursor = ""
  }

  const satelliteLayer: mapboxgl.CustomLayerInterface = {
    id: SATELLITE_3D_LAYER_ID,
    type: "custom",
    renderingMode: "3d",
    onAdd: (_map, gl) => {
      camera = new THREE.Camera()
      scene = new THREE.Scene()

      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl as WebGLRenderingContext,
        antialias: true
      })
      renderer.autoClear = false
    },
    render: (_gl, matrix) => {
      if (!renderer || !camera || !scene) return

      camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix as number[])
      renderer.resetState()
      renderer.render(scene, camera)
      map.triggerRepaint()
    },
    onRemove: () => {
      cleanupMeshes()
      renderer?.dispose()
      renderer = null
      camera = null
      scene = null
    }
  }

  if (!map.getSource(SATELLITE_SOURCE_ID)) {
    map.addSource(SATELLITE_SOURCE_ID, {
      type: "geojson",
      data: emptyFeatureCollection()
    })
  }

  // Keep an almost-invisible 2D layer for interaction only.
  if (!map.getLayer(SATELLITE_HIT_LAYER_ID)) {
    map.addLayer(
      {
        id: SATELLITE_HIT_LAYER_ID,
        type: "circle",
        source: SATELLITE_SOURCE_ID,
        paint: {
          "circle-color": SATELLITE_DEFAULT_COLOR,
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            1,
            8,
            4,
            12,
            8,
            16
          ],
          "circle-opacity": 0.01
        }
      },
      beforeLayerId
    )
  }

  map.addLayer(satelliteLayer)
  map.on("click", SATELLITE_HIT_LAYER_ID, onSatelliteClick)
  map.on("mouseenter", SATELLITE_HIT_LAYER_ID, onSatelliteMouseEnter)
  map.on("mouseleave", SATELLITE_HIT_LAYER_ID, onSatelliteMouseLeave)

  void loadSatellites()
  tickIntervalId = setInterval(updateSatellitePositions, SATELLITE_POSITION_UPDATE_MS)
  trailIntervalId = setInterval(() => {
    updateOrbitTrails3D()
    apply3DStyles()
  }, SATELLITE_TRAIL_UPDATE_MS)
  fetchIntervalId = setInterval(() => {
    void loadSatellites()
  }, SATELLITE_FETCH_MS)
  setSelectedSatellite(selectedSatelliteId)

  const cleanup = () => {
    isDisposed = true
    fetchAbortController?.abort()
    fetchAbortController = null
    if (tickIntervalId) clearInterval(tickIntervalId)
    if (trailIntervalId) clearInterval(trailIntervalId)
    if (fetchIntervalId) clearInterval(fetchIntervalId)

    popup.remove()

    if (map.getLayer(SATELLITE_HIT_LAYER_ID)) {
      map.off("click", SATELLITE_HIT_LAYER_ID, onSatelliteClick)
      map.off("mouseenter", SATELLITE_HIT_LAYER_ID, onSatelliteMouseEnter)
      map.off("mouseleave", SATELLITE_HIT_LAYER_ID, onSatelliteMouseLeave)
      map.removeLayer(SATELLITE_HIT_LAYER_ID)
    }
    if (map.getLayer(SATELLITE_3D_LAYER_ID)) {
      map.removeLayer(SATELLITE_3D_LAYER_ID)
    }
    if (map.getSource(SATELLITE_SOURCE_ID)) {
      map.removeSource(SATELLITE_SOURCE_ID)
    }
  }

  return {
    cleanup,
    setSelectedSatellite,
    focusSatellite
  }
}
