import type { VpnNode, VpnNodeGroup } from "@/app/(map)/mapbox/system_vpn/vpnTypes"
import { getBuildingById, VPN_NODE_COORDINATES } from "@/app/(map)/mapbox/system_buildings/buildingRegistry"

type VpnNodeDefinition = Omit<VpnNode, "coordinates"> & { buildingId?: string }
type VpnNodeGroupDefinition = Omit<VpnNodeGroup, "nodes"> & { nodes: VpnNodeDefinition[] }

export const VPN_NODE_GROUPS: VpnNodeGroupDefinition[] = [
  {
    id: "group-alpha",
    scopeId: "new-york",
    label: "Group Alpha",
    exitNodeId: "ny-node-5",
    entryNodeId: "ny-node-1",
    nextGroupId: "group-bravo",
    nodes: [
      { id: "ny-node-1", groupId: "group-alpha", label: "NY Relay 01", buildingId: "ny-finance-plaza" },
      { id: "ny-node-2", groupId: "group-alpha", label: "NY Relay 02", buildingId: "ny-market-arcade" },
      { id: "ny-node-3", groupId: "group-alpha", label: "NY Relay 03", buildingId: "ny-relay-tower-east" },
      { id: "ny-node-4", groupId: "group-alpha", label: "NY Relay 04", buildingId: "ny-relay-tower-west" },
      { id: "ny-node-5", groupId: "group-alpha", label: "NY Relay 05" }
    ]
  },
  {
    id: "group-bravo",
    scopeId: "los-angeles",
    label: "Group Bravo",
    exitNodeId: "la-node-5",
    entryNodeId: "la-node-1",
    nextGroupId: "group-charlie",
    nodes: [
      { id: "la-node-1", groupId: "group-bravo", label: "LA Relay 01" },
      { id: "la-node-2", groupId: "group-bravo", label: "LA Relay 02" },
      { id: "la-node-3", groupId: "group-bravo", label: "LA Relay 03" },
      { id: "la-node-4", groupId: "group-bravo", label: "LA Relay 04" },
      { id: "la-node-5", groupId: "group-bravo", label: "LA Relay 05" }
    ]
  },
  {
    id: "group-charlie",
    scopeId: "chicago",
    label: "Group Charlie",
    exitNodeId: "chi-node-5",
    entryNodeId: "chi-node-1",
    nextGroupId: "group-delta",
    nodes: [
      { id: "chi-node-1", groupId: "group-charlie", label: "CHI Relay 01" },
      { id: "chi-node-2", groupId: "group-charlie", label: "CHI Relay 02" },
      { id: "chi-node-3", groupId: "group-charlie", label: "CHI Relay 03" },
      { id: "chi-node-4", groupId: "group-charlie", label: "CHI Relay 04" },
      { id: "chi-node-5", groupId: "group-charlie", label: "CHI Relay 05" }
    ]
  },
  {
    id: "group-delta",
    scopeId: "miami",
    label: "Group Delta",
    exitNodeId: "mia-node-5",
    entryNodeId: "mia-node-1",
    nextGroupId: null,
    nodes: [
      { id: "mia-node-1", groupId: "group-delta", label: "MIA Relay 01" },
      { id: "mia-node-2", groupId: "group-delta", label: "MIA Relay 02" },
      { id: "mia-node-3", groupId: "group-delta", label: "MIA Relay 03" },
      { id: "mia-node-4", groupId: "group-delta", label: "MIA Relay 04" },
      { id: "mia-node-5", groupId: "group-delta", label: "MIA Relay 05" }
    ]
  }
]

function getVpnNodeGroupForScope(scopeId: string): VpnNodeGroupDefinition | null {
  return VPN_NODE_GROUPS.find((group) => group.scopeId === scopeId) ?? null
}

function getGroupEntryCoordinates(groupId: string): [number, number] | null {
  const targetGroup = VPN_NODE_GROUPS.find((group) => group.id === groupId)
  if (!targetGroup) return null
  const entryNode = targetGroup.nodes.find((node) => node.id === targetGroup.entryNodeId)
  if (!entryNode) return null
  return resolveNodeCoordinates(entryNode)
}

function resolveNodeCoordinates(node: VpnNodeDefinition): [number, number] {
  const fallbackCoordinates = VPN_NODE_COORDINATES[node.id]
  if (!node.buildingId) return fallbackCoordinates
  const building = getBuildingById(node.buildingId)
  if (!building?.coordinates) return fallbackCoordinates
  return building.coordinates
}

export function getVpnNodesForGroup(scopeId: string): VpnNode[] {
  const group = getVpnNodeGroupForScope(scopeId)
  if (!group) return []

  const nextGroupEntry = group.nextGroupId ? getGroupEntryCoordinates(group.nextGroupId) : null

  return group.nodes.map((node) => {
    const resolvedCoordinates = resolveNodeCoordinates(node)
    if (node.id !== group.exitNodeId) {
      return {
        ...node,
        coordinates: resolvedCoordinates,
        isExit: false,
        exitToCoordinates: undefined
      }
    }
    return {
      ...node,
      coordinates: resolvedCoordinates,
      isExit: true,
      exitToCoordinates: nextGroupEntry ?? undefined
    }
  })
}

export function getAllVpnNodeGroups(): VpnNodeGroup[] {
  return VPN_NODE_GROUPS.map((group) => ({
    ...group,
    nodes: getVpnNodesForGroup(group.scopeId)
  }))
}

export function getAllVpnNodes(): VpnNode[] {
  return getAllVpnNodeGroups().flatMap((group) => group.nodes)
}

// Backward compatibility with existing callers.
export function getVpnNodesForCity(cityId: string): VpnNode[] {
  return getVpnNodesForGroup(cityId)
}
