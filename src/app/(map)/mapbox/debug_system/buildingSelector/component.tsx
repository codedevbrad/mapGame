"use client"

import type { DebugBuildingInfo } from "@/app/(map)/mapbox/debug_system/buildingSelector/func"

type BuildingSelectorDebugProps = {
  selectedBuilding: DebugBuildingInfo | null
}

export default function BuildingSelectorDebug({ selectedBuilding }: BuildingSelectorDebugProps) {
  const registrationValue =
    !selectedBuilding || selectedBuilding.featureId === null
      ? "No feature id"
      : typeof selectedBuilding.featureId === "string"
        ? `"${selectedBuilding.featureId}"`
        : String(selectedBuilding.featureId)

  return (
    <div className="space-y-2 text-[11px] text-cyan-100">
      <h3 className="intel-code-title text-[11px]">BUILDING SELECTOR</h3>
      {!selectedBuilding ? (
        <p className="intel-code-text opacity-80">Click a building on the map to inspect it.</p>
      ) : (
        <dl className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <dt className="intel-code-text opacity-80">Feature ID</dt>
            <dd className="max-w-[170px] truncate text-right">
              {selectedBuilding.featureId === null
                ? "Missing"
                : String(selectedBuilding.featureId)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="intel-code-text opacity-80">Longitude</dt>
            <dd>{selectedBuilding.coordinates[0].toFixed(6)}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="intel-code-text opacity-80">Latitude</dt>
            <dd>{selectedBuilding.coordinates[1].toFixed(6)}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="intel-code-text opacity-80">Height</dt>
            <dd>
              {selectedBuilding.heightMeters === null
                ? "Unknown"
                : `${Math.round(selectedBuilding.heightMeters)} m`}
            </dd>
          </div>
          <div className="rounded border border-cyan-300/30 bg-black/35 p-1.5">
            <dt className="intel-code-text opacity-80">Paste value</dt>
            <dd className="mt-0.5 break-all font-mono text-[10px]">{registrationValue}</dd>
          </div>
        </dl>
      )}
    </div>
  )
}
