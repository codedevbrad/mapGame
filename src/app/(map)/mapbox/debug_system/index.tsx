"use client"

import { useState } from "react"
import BuildingSelectorDebug from "@/app/(map)/mapbox/debug_system/buildingSelector/component"
import type { DebugBuildingInfo } from "@/app/(map)/mapbox/debug_system/buildingSelector/func"

type DebugSystemPopoverProps = {
  selectedBuilding: DebugBuildingInfo | null
}

export default function DebugSystemPopover({ selectedBuilding }: DebugSystemPopoverProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="fixed top-1 right-4 z-40 w-[280px] rounded-md border border-cyan-400/50 bg-black/80 p-3 text-cyan-100 shadow-xl backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="intel-code-title text-xs">DEBUG SYSTEM</h2>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="rounded border border-cyan-300/45 px-2 py-0.5 text-[10px] tracking-wide transition hover:border-cyan-200 hover:bg-cyan-500/10"
        >
          {isOpen ? "HIDE" : "SHOW"}
        </button>
      </div>
      {isOpen ? <BuildingSelectorDebug selectedBuilding={selectedBuilding} /> : null}
    </div>
  )
}
