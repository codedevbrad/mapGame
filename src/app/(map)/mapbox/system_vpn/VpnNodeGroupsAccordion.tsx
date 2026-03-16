"use client"

import { useMemo, useState } from "react"
import type { VpnNodeGroup } from "@/app/(map)/mapbox/system_vpn/vpnTypes"

type VpnNodeGroupsAccordionProps = {
  groups: VpnNodeGroup[]
  selectedVpnNodeId: string | null
  onVpnNodeFocus: (nodeId: string, scopeId: string) => void
}

export default function VpnNodeGroupsAccordion({
  groups,
  selectedVpnNodeId,
  onVpnNodeFocus
}: VpnNodeGroupsAccordionProps) {
  const [openGroupIds, setOpenGroupIds] = useState<Record<string, boolean>>(() =>
    groups.length > 0 ? { [groups[0].id]: true } : {}
  )

  const sortedGroups = useMemo(
    () =>
      [...groups].map((group) => ({
        ...group,
        nodes: [...group.nodes].sort((a, b) => a.label.localeCompare(b.label))
      })),
    [groups]
  )

  if (sortedGroups.length === 0) {
    return <p className="intel-code-text text-[11px] opacity-80">No VPN groups available.</p>
  }

  return (
    <div className="space-y-2">
      {sortedGroups.map((group) => {
        const isOpen = Boolean(openGroupIds[group.id])
        return (
          <div key={group.id} className="rounded border border-cyan-300/30 bg-black/25">
            <button
              type="button"
              onClick={() =>
                setOpenGroupIds((current) => ({
                  ...current,
                  [group.id]: !isOpen
                }))
              }
              className="flex w-full items-center justify-between px-2 py-2 text-left transition hover:bg-cyan-400/10"
            >
              <span className="text-xs font-semibold tracking-wide">{group.label}</span>
              <span className="text-[10px] text-cyan-200/85">{isOpen ? "HIDE" : "SHOW"}</span>
            </button>

            {isOpen ? (
              <ul className="space-y-2 px-2 pb-2">
                {group.nodes.map((node) => {
                  const isSelected = node.id === selectedVpnNodeId
                  return (
                    <li key={node.id}>
                      <button
                        type="button"
                        onClick={() => onVpnNodeFocus(node.id, group.scopeId)}
                        className={`w-full rounded border px-2 py-2 text-left transition ${
                          isSelected
                            ? "border-yellow-300 bg-yellow-400/20 text-yellow-100"
                            : "border-cyan-300/35 bg-black/35 hover:border-cyan-200/80 hover:bg-cyan-400/10"
                        }`}
                      >
                        <div className="truncate text-xs font-semibold tracking-wide">{node.label}</div>
                        <div className="mt-1 text-[11px] text-cyan-200/90">
                          {node.coordinates[1].toFixed(4)}, {node.coordinates[0].toFixed(4)}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
