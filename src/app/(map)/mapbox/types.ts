import type mapboxgl from "mapbox-gl"
import type { ShaderMode } from "@/app/(map)/components/VisualControls"

export type SatelliteListItem = {
  id: string
  name: string
  altitudeKm: number
  speedKps: number
  position: [number, number]
}

export type MapboxMapProps = {
  shaderMode: ShaderMode
  shaderIntensity: number
  backgroundDimOpacity: number
  center: [number, number]
  flyToKey?: number
  onMapReady?: (map: mapboxgl.Map) => void
  selectedSatelliteId?: string | null
  selectedSatelliteFocusKey?: number
  onSatelliteSelect?: (satelliteId: string | null) => void
  onSatellitesChange?: (satellites: SatelliteListItem[]) => void
}

export type SelectedBuildingId = string | number | null
