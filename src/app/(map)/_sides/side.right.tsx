"use client"

import type { SatelliteListItem } from "@/app/(map)/mapbox/types"

type SideRightProps = {
  satellites: SatelliteListItem[]
  selectedSatelliteId: string | null
  onSatelliteSelect: (satelliteId: string | null) => void
  onSatelliteFocus: (satelliteId: string) => void
}

export default function SideRight({
  satellites,
  selectedSatelliteId,
  onSatelliteSelect,
  onSatelliteFocus
}: SideRightProps) {
  const sortedSatellites = [...satellites].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <aside className="h-full w-[320px] shrink-0 grow-0 overflow-hidden p-4">
      <div className="flex h-full flex-col rounded-md border border-cyan-400/45 bg-black/65 p-3 text-cyan-100 shadow-lg backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="intel-code-title text-xs">SATELLITE TRACKING</h2>
          <span className="intel-code-text text-[10px]">{sortedSatellites.length} LIVE</span>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onSatelliteSelect(null)}
            className="rounded border border-cyan-300/45 px-2 py-1 text-[11px] tracking-wide text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-500/15"
          >
            CLEAR FOCUS
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {sortedSatellites.length === 0 ? (
            <p className="intel-code-text text-[11px] opacity-80">Waiting for live orbital feed...</p>
          ) : (
            <ul className="space-y-2">
              {sortedSatellites.map((satellite) => {
                const isSelected = satellite.id === selectedSatelliteId
                return (
                  <li key={satellite.id}>
                    <button
                      type="button"
                      onClick={() => onSatelliteFocus(satellite.id)}
                      className={`w-full rounded border px-2 py-2 text-left transition ${
                        isSelected
                          ? "border-amber-300 bg-amber-400/15 text-amber-100"
                          : "border-cyan-300/35 bg-black/35 hover:border-cyan-200/80 hover:bg-cyan-400/10"
                      }`}
                    >
                      <div className="truncate text-xs font-semibold tracking-wide">
                        {satellite.name}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-cyan-200/90">
                        <span>{satellite.altitudeKm.toFixed(1)} km</span>
                        <span>{satellite.speedKps.toFixed(2)} km/s</span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </aside>
  )
}