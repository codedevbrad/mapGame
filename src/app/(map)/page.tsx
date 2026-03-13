"use client"

import { useCallback, useRef, useState } from "react"
import MapboxMap from "@/app/(map)/components/Mapbox"
import VisualControls from "@/app/(map)/components/VisualControls"
import CitySelector, { CITY_PRESETS } from "@/app/(map)/components/CitySelector"
import { useVisualSettingsStore } from "@/app/stores/useVisualSettingsStore"

export default function Page() {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [selectedCityId, setSelectedCityId] = useState<string>(CITY_PRESETS[0].id)
  const [flyToKey, setFlyToKey] = useState(0)
  const shaderMode = useVisualSettingsStore((state) => state.shaderMode)
  const shaderIntensity = useVisualSettingsStore((state) => state.shaderIntensity)
  const backgroundDimOpacity = useVisualSettingsStore((state) => state.backgroundDimOpacity)
  const setShaderMode = useVisualSettingsStore((state) => state.setShaderMode)
  const selectedCity = CITY_PRESETS.find((city) => city.id === selectedCityId) ?? CITY_PRESETS[0]
  const handleMapReady = useCallback((map: mapboxgl.Map) => {
    mapRef.current = map
  }, [])
  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn({ duration: 350 })
  }, [])
  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut({ duration: 350 })
  }, [])
  const handleCitySelect = useCallback((cityId: string) => {
    setSelectedCityId(cityId)
    setFlyToKey((key) => key + 1)
  }, [])

  return (
    <main className="relative flex h-full w-full flex-col overflow-hidden">
      <div className="flex w-full flex-1 min-h-0 items-center justify-center">
        <div className="w-1/3 h-full p-4">
          leftside
        </div>
        <MapboxMap
          shaderMode={shaderMode}
          shaderIntensity={shaderIntensity}
          backgroundDimOpacity={backgroundDimOpacity}
          center={selectedCity.center}
          flyToKey={flyToKey}
          onMapReady={handleMapReady}
        />
        <div className="w-1/3 h-full p-4">
          rightside
        </div>
      </div>
      <div className="absolute bottom-5 left-1/2 z-30 flex w-[min(1100px,94vw)] -translate-x-1/2 items-center justify-between gap-4 rounded-md border border-cyan-400/45 bg-black/70 px-4 py-3 text-cyan-100 shadow-lg backdrop-blur-sm">
        <CitySelector
          selectedCityId={selectedCityId}
          onCitySelect={handleCitySelect}
        />

        <VisualControls
          shaderMode={shaderMode}
          onShaderChange={setShaderMode}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />
      </div>
    </main>
  )
}