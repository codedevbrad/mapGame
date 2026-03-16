import type { Feature, FeatureCollection, LineString, Point } from "geojson"
import type { VpnNode } from "@/app/(map)/mapbox/system_vpn/vpnTypes"

type VpnPointFeature = Feature<Point, { kind: "node"; nodeId: string; label: string }>
type VpnLineFeature = Feature<
  LineString,
  { kind: "link" | "exit-link"; fromNodeId: string; toNodeId: string }
>

export function buildVpnFeatureCollection(nodes: VpnNode[]): FeatureCollection<Point | LineString> {
  const pointFeatures: VpnPointFeature[] = nodes.map((node) => ({
    type: "Feature",
    properties: {
      kind: "node",
      nodeId: node.id,
      label: node.label
    },
    geometry: {
      type: "Point",
      coordinates: node.coordinates
    }
  }))

  const lineFeatures: VpnLineFeature[] = []
  const nodesByGroup = new Map<string, VpnNode[]>()
  for (const node of nodes) {
    const groupNodes = nodesByGroup.get(node.groupId)
    if (groupNodes) {
      groupNodes.push(node)
    } else {
      nodesByGroup.set(node.groupId, [node])
    }
  }

  for (const groupNodes of nodesByGroup.values()) {
    for (let i = 0; i < groupNodes.length; i += 1) {
      for (let j = i + 1; j < groupNodes.length; j += 1) {
        const fromNode = groupNodes[i]
        const toNode = groupNodes[j]
        lineFeatures.push({
          type: "Feature",
          properties: {
            kind: "link",
            fromNodeId: fromNode.id,
            toNodeId: toNode.id
          },
          geometry: {
            type: "LineString",
            coordinates: [fromNode.coordinates, toNode.coordinates]
          }
        })
      }
    }
  }

  for (const node of nodes) {
    if (!node.isExit || !node.exitToCoordinates) continue
    lineFeatures.push({
      type: "Feature",
      properties: {
        kind: "exit-link",
        fromNodeId: node.id,
        toNodeId: "next-group-entry"
      },
      geometry: {
        type: "LineString",
        coordinates: [node.coordinates, node.exitToCoordinates]
      }
    })
  }

  return {
    type: "FeatureCollection",
    features: [...lineFeatures, ...pointFeatures]
  }
}
