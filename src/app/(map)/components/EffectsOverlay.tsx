"use client"

import type { CSSProperties } from "react"
import { useVisualSettingsStore } from "@/app/stores/useVisualSettingsStore"

export default function EffectsOverlay() {
  const staticNoiseOpacity = useVisualSettingsStore((state) => state.staticNoiseOpacity)
  const backgroundDimOpacity = useVisualSettingsStore((state) => state.backgroundDimOpacity)

  return (
    <>
      <div aria-hidden="true" className="tv-background-dim" style={{ opacity: backgroundDimOpacity }} />
      <div
        aria-hidden="true"
        className="tv-static-overlay"
        style={{ "--noise-opacity": staticNoiseOpacity } as CSSProperties}
      />
    </>
  )
}
