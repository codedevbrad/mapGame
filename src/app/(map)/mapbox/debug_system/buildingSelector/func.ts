import type mapboxgl from "mapbox-gl"
import { getTopBuildingFeatureAtPoint } from "@/app/(map)/mapbox/system_buildings/buildingLayers"

export type DebugBuildingInfo = {
  featureId: string | number | null
  coordinates: [number, number]
  heightMeters: number | null
}

export function getDebugBuildingInfo(
  map: mapboxgl.Map,
  event: mapboxgl.MapMouseEvent
): DebugBuildingInfo | null {
  const feature = getTopBuildingFeatureAtPoint(map, event.point)
  if (!feature) return null

  const properties = (feature.properties ?? {}) as Record<string, unknown>
  const rawHeight = Number(properties.height)
  const heightMeters = Number.isFinite(rawHeight) && rawHeight > 0 ? rawHeight : null

  return {
    featureId:
      typeof feature.id === "string" || typeof feature.id === "number"
        ? feature.id
        : null,
    coordinates: [event.lngLat.lng, event.lngLat.lat],
    heightMeters
  }
}
