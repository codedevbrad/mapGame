"use client"

export type CityPreset = {
  id: string
  label: string
  center: [number, number]
}

export const CITY_PRESETS: CityPreset[] = [
  { id: "new-york", label: "New York", center: [-74.006, 40.7128] },
  { id: "los-angeles", label: "Los Angeles", center: [-118.2437, 34.0522] },
  { id: "chicago", label: "Chicago", center: [-87.6298, 41.8781] },
  { id: "miami", label: "Miami", center: [-80.1918, 25.7617] }
]

type CitySelectorProps = {
  selectedCityId: string
  onCitySelect: (cityId: string) => void
}

export default function CitySelector({ selectedCityId, onCitySelect }: CitySelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {CITY_PRESETS.map((city) => {
        const isActive = city.id === selectedCityId
        return (
          <button
            key={city.id}
            type="button"
            onClick={() => onCitySelect(city.id)}
            className={`rounded border px-3 py-1 text-xs tracking-wide transition ${
              isActive
                ? "border-cyan-300 bg-cyan-400/20 text-cyan-100"
                : "border-cyan-300/35 bg-black/40 text-cyan-200 hover:border-cyan-300/70"
            }`}
          >
            {city.label}
          </button>
        )
      })}
    </div>
  )
}
