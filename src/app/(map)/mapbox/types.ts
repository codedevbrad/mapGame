import type mapboxgl from "mapbox-gl"
import type { ShaderMode } from "@/app/(map)/components/VisualControls"
import type { VpnNode } from "@/app/(map)/mapbox/system_vpn/vpnTypes"

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
  vpnNodes?: VpnNode[]
  selectedVpnNodeId?: string | null
  selectedVpnNodeFocusKey?: number
  flyToKey?: number
  onMapReady?: (map: mapboxgl.Map) => void
  selectedSatelliteId?: string | null
  selectedSatelliteFocusKey?: number
  onVpnNodeSelect?: (nodeId: string | null) => void
  onSatelliteSelect?: (satelliteId: string | null) => void
  onSatellitesChange?: (satellites: SatelliteListItem[]) => void
}

export type SelectedBuildingId = string | number | null
