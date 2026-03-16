import { getRegisteredMapFeatureIds } from "@/app/(map)/mapbox/system_buildings/buildingRegistry"

// Backward-compatible export used by existing map layer wiring.
export const REGISTERED_BUILDING_IDS: string[] = getRegisteredMapFeatureIds()
