export type VpnNode = {
  id: string
  groupId: string
  label: string
  coordinates: [number, number]
  buildingId?: string
  isExit?: boolean
  exitToCoordinates?: [number, number]
}

export type VpnNodeGroup = {
  id: string
  scopeId: string
  label: string
  exitNodeId: string
  entryNodeId: string
  nextGroupId: string | null
  nodes: VpnNode[]
}
