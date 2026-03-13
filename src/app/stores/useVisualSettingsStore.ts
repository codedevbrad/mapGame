"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ShaderMode } from "@/app/(map)/components/VisualControls"

type VisualSettingsState = {
  shaderMode: ShaderMode
  shaderIntensity: number
  staticNoiseOpacity: number
  backgroundDimOpacity: number
  setShaderMode: (mode: ShaderMode) => void
  setShaderIntensity: (value: number) => void
  setStaticNoiseOpacity: (value: number) => void
  setBackgroundDimOpacity: (value: number) => void
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const useVisualSettingsStore = create<VisualSettingsState>()(
  persist(
    (set) => ({
      shaderMode: "flir",
      shaderIntensity: 0.85,
      staticNoiseOpacity: 0.24,
      backgroundDimOpacity: 0.16,
      setShaderMode: (mode) => set({ shaderMode: mode }),
      setShaderIntensity: (value) => set({ shaderIntensity: clamp(value, 0, 1) }),
      setStaticNoiseOpacity: (value) => set({ staticNoiseOpacity: clamp(value, 0, 0.7) }),
      setBackgroundDimOpacity: (value) => set({ backgroundDimOpacity: clamp(value, 0, 0.8) })
    }),
    {
      name: "visual-settings-store",
      partialize: (state) => ({
        shaderMode: state.shaderMode,
        shaderIntensity: state.shaderIntensity,
        staticNoiseOpacity: state.staticNoiseOpacity,
        backgroundDimOpacity: state.backgroundDimOpacity
      })
    }
  )
)
