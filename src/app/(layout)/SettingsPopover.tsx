"use client"

import { useMemo, useState } from "react"
import type { ShaderMode } from "@/app/(map)/components/VisualControls"
import { useVisualSettingsStore } from "@/app/stores/useVisualSettingsStore"

export default function SettingsPopover() {
  const [isOpen, setIsOpen] = useState(false)
  const shaderMode = useVisualSettingsStore((state) => state.shaderMode)
  const shaderIntensity = useVisualSettingsStore((state) => state.shaderIntensity)
  const staticNoiseOpacity = useVisualSettingsStore((state) => state.staticNoiseOpacity)
  const backgroundDimOpacity = useVisualSettingsStore((state) => state.backgroundDimOpacity)
  const setShaderMode = useVisualSettingsStore((state) => state.setShaderMode)
  const setShaderIntensity = useVisualSettingsStore((state) => state.setShaderIntensity)
  const setStaticNoiseOpacity = useVisualSettingsStore((state) => state.setStaticNoiseOpacity)
  const setBackgroundDimOpacity = useVisualSettingsStore((state) => state.setBackgroundDimOpacity)

  const panelClasses = useMemo(
    () =>
      `pointer-events-auto absolute bottom-12 right-0 w-[min(88vw,320px)] rounded-md border border-cyan-300/45 bg-black/80 p-3 text-cyan-100 shadow-lg backdrop-blur-sm transition ${
        isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`,
    [isOpen]
  )

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-40">
      <div className={panelClasses}>
        <div className="mb-3 text-xs tracking-[0.2em] text-cyan-300">SETTINGS</div>

        <label className="mb-1 block text-[11px] tracking-widest text-cyan-300">MAP SHADER</label>
        <select
          value={shaderMode}
          onChange={(event) => setShaderMode(event.target.value as ShaderMode)}
          className="mb-3 w-full rounded border border-cyan-300/40 bg-black/70 px-2 py-1 text-sm text-cyan-100 outline-none"
        >
          <option value="none">None</option>
          <option value="flir">FLIR</option>
          <option value="nvg">NVG</option>
          <option value="glitch">Glitch</option>
        </select>

        <label className="mb-1 block text-[11px] tracking-widest text-cyan-300">
          SHADER INTENSITY {shaderIntensity.toFixed(2)}
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={shaderIntensity}
          onChange={(event) => setShaderIntensity(Number(event.target.value))}
          className="mb-3 w-full accent-cyan-300"
        />

        <label className="mb-1 block text-[11px] tracking-widest text-cyan-300">
          STATIC NOISE {staticNoiseOpacity.toFixed(2)}
        </label>
        <input
          type="range"
          min={0}
          max={0.7}
          step={0.01}
          value={staticNoiseOpacity}
          onChange={(event) => setStaticNoiseOpacity(Number(event.target.value))}
          className="mb-3 w-full accent-cyan-300"
        />

        <label className="mb-1 block text-[11px] tracking-widest text-cyan-300">
          BACKGROUND DIM {backgroundDimOpacity.toFixed(2)}
        </label>
        <input
          type="range"
          min={0}
          max={0.8}
          step={0.01}
          value={backgroundDimOpacity}
          onChange={(event) => setBackgroundDimOpacity(Number(event.target.value))}
          className="w-full accent-cyan-300"
        />
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="pointer-events-auto ml-auto flex h-10 items-center rounded-md border border-cyan-300/45 bg-black/80 px-3 text-xs tracking-widest text-cyan-100 transition hover:border-cyan-200"
      >
        SETTINGS
      </button>
    </div>
  )
}
