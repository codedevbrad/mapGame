import mapboxgl from "mapbox-gl"

type GlobeAutoRotateOptions = {
  degreesPerSecond?: number
}

const DEFAULT_DEGREES_PER_SECOND = 0.9
const MAX_FRAME_DELTA_MS = 100

const normalizeBearing = (bearing: number): number => {
  const normalized = bearing % 360
  return normalized < 0 ? normalized + 360 : normalized
}

export const startGlobeAutoRotate = (
  map: mapboxgl.Map,
  options: GlobeAutoRotateOptions = {}
): (() => void) => {
  const degreesPerSecond = options.degreesPerSecond ?? DEFAULT_DEGREES_PER_SECOND
  let isStopped = false
  let animationFrameId: number | null = null
  let previousTimestamp = performance.now()

  const tick = (timestamp: number) => {
    if (isStopped) return

    const rawDelta = timestamp - previousTimestamp
    previousTimestamp = timestamp
    const deltaMs = Math.min(Math.max(rawDelta, 0), MAX_FRAME_DELTA_MS)

    if (map.isStyleLoaded() && !map.isMoving()) {
      const currentBearing = map.getBearing()
      const bearingDelta = (degreesPerSecond * deltaMs) / 1000
      map.jumpTo({ bearing: normalizeBearing(currentBearing + bearingDelta) })
    }

    animationFrameId = window.requestAnimationFrame(tick)
  }

  animationFrameId = window.requestAnimationFrame(tick)

  return () => {
    if (isStopped) return
    isStopped = true
    if (animationFrameId !== null) {
      window.cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }
}
