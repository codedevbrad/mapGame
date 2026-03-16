import type mapboxgl from "mapbox-gl"
import { buildVpnFeatureCollection } from "@/app/(map)/mapbox/system_vpn/vpnGraph"
import type { VpnNode } from "@/app/(map)/mapbox/system_vpn/vpnTypes"

export const VPN_SOURCE_ID = "vpn-network-source"
export const VPN_LINK_LAYER_ID = "vpn-network-links"
export const VPN_NODE_LAYER_ID = "vpn-network-nodes"
export const VPN_SELECTED_NODE_LAYER_ID = "vpn-network-selected-node"

const EMPTY_SELECTED_FILTER: mapboxgl.FilterSpecification = ["==", ["get", "nodeId"], ""]

export function ensureVpnLayer(map: mapboxgl.Map, labelLayerId?: string) {
  if (!map.getSource(VPN_SOURCE_ID)) {
    map.addSource(VPN_SOURCE_ID, {
      type: "geojson",
      data: buildVpnFeatureCollection([])
    })
  }

  if (!map.getLayer(VPN_LINK_LAYER_ID)) {
    map.addLayer(
      {
        id: VPN_LINK_LAYER_ID,
        type: "line",
        source: VPN_SOURCE_ID,
        filter: ["==", ["geometry-type"], "LineString"],
        paint: {
          "line-color": "#34d399",
          "line-width": 2,
          "line-opacity": 0.72
        }
      },
      labelLayerId
    )
  }

  if (!map.getLayer(VPN_NODE_LAYER_ID)) {
    map.addLayer(
      {
        id: VPN_NODE_LAYER_ID,
        type: "circle",
        source: VPN_SOURCE_ID,
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": 5,
          "circle-color": "#00f0ff",
          "circle-stroke-width": 1,
          "circle-stroke-color": "#002b36"
        }
      },
      labelLayerId
    )
  }

  if (!map.getLayer(VPN_SELECTED_NODE_LAYER_ID)) {
    map.addLayer(
      {
        id: VPN_SELECTED_NODE_LAYER_ID,
        type: "circle",
        source: VPN_SOURCE_ID,
        filter: EMPTY_SELECTED_FILTER,
        paint: {
          "circle-radius": 8,
          "circle-color": "#fde047",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#facc15"
        }
      },
      labelLayerId
    )
  }
}

export function setVpnLayerNodes(map: mapboxgl.Map, nodes: VpnNode[]) {
  const source = map.getSource(VPN_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
  if (!source) return
  source.setData(buildVpnFeatureCollection(nodes))
}

export function setHighlightedVpnNode(map: mapboxgl.Map, nodeId: string | null) {
  if (!map.getLayer(VPN_SELECTED_NODE_LAYER_ID)) return
  map.setFilter(
    VPN_SELECTED_NODE_LAYER_ID,
    nodeId ? ["==", ["get", "nodeId"], nodeId] : EMPTY_SELECTED_FILTER
  )
}
