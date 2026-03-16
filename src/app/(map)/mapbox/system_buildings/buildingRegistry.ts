export type BuildingId = string

export type BuildingKind = "shop" | "business" | "vpn-hub" | "landmark"

export type BuildingRecord = {
  id: BuildingId
  scopeId: string
  mapFeatureId: string
  label: string
  kind: BuildingKind
  coordinates?: [number, number]
  subKind?: string
}

export const BUILDING_REGISTRY: BuildingRecord[] = [
  {
    id: "ny-finance-plaza",
    scopeId: "new-york",
    mapFeatureId: "248238971",
    label: "Finance Plaza",
    kind: "business",    
    subKind: "finance",
    coordinates: [-74.0112, 40.7075],

  },
  {
    id: "ny-market-arcade",
    scopeId: "new-york",
    mapFeatureId: "248239173",
    label: "Market Arcade",
    kind: "shop",
    subKind: "retail",
    coordinates: [-74.0048, 40.7139]
  },
  {
    id: "ny-relay-tower-east",
    scopeId: "new-york",
    mapFeatureId: "248352565",
    label: "Relay Tower East",
    kind: "vpn-hub",
    subKind: "telecom",
    coordinates: [-73.9976, 40.7214]
  },
  {
    id: "ny-relay-tower-west",
    scopeId: "new-york",
    mapFeatureId: "248352964",
    label: "Relay Tower West",
    kind: "vpn-hub",
    subKind: "telecom",
    coordinates: [-73.9899, 40.7292]
  }
]

export const VPN_NODE_COORDINATES: Record<string, [number, number]> = {
  "ny-node-1": [-74.0112, 40.7075],
  "ny-node-2": [-74.0048, 40.7139],
  "ny-node-3": [-73.9976, 40.7214],
  "ny-node-4": [-73.9899, 40.7292],
  "ny-node-5": [-74.0164, 40.7355],
  "la-node-1": [-118.2507, 34.0472],
  "la-node-2": [-118.2438, 34.0529],
  "la-node-3": [-118.2362, 34.0588],
  "la-node-4": [-118.2529, 34.0604],
  "la-node-5": [-118.2464, 34.0419],
  "chi-node-1": [-87.6349, 41.8856],
  "chi-node-2": [-87.6294, 41.8785],
  "chi-node-3": [-87.6234, 41.8838],
  "chi-node-4": [-87.6393, 41.8769],
  "chi-node-5": [-87.6281, 41.8718],
  "mia-node-1": [-80.1947, 25.7798],
  "mia-node-2": [-80.1887, 25.7726],
  "mia-node-3": [-80.1831, 25.7675],
  "mia-node-4": [-80.1979, 25.7646],
  "mia-node-5": [-80.1908, 25.7582]
}

const buildingById = new Map<BuildingId, BuildingRecord>()

for (const building of BUILDING_REGISTRY) {
  if (buildingById.has(building.id)) {
    throw new Error(`Duplicate building id in BUILDING_REGISTRY: ${building.id}`)
  }
  buildingById.set(building.id, building)
}

export function getAllBuildings(): BuildingRecord[] {
  return [...BUILDING_REGISTRY]
}

export function getBuildingById(buildingId: BuildingId): BuildingRecord | null {
  return buildingById.get(buildingId) ?? null
}

export function getBuildingsByScope(scopeId: string): BuildingRecord[] {
  return BUILDING_REGISTRY.filter((building) => building.scopeId === scopeId)
}

export function getRegisteredMapFeatureIds(scopeId?: string): string[] {
  const records = scopeId ? getBuildingsByScope(scopeId) : BUILDING_REGISTRY
  return records.map((building) => building.mapFeatureId)
}
