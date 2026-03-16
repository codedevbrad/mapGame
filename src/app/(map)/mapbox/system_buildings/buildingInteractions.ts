import type { MutableRefObject } from "react"
import mapboxgl from "mapbox-gl"
import {
  getTopBuildingFeatureAtPoint,
  setHighlightedBuildingById
} from "@/app/(map)/mapbox/system_buildings/buildingLayers"
import type { SelectedBuildingId } from "@/app/(map)/mapbox/types"

function getBuildingDisplayData(feature: mapboxgl.MapboxGeoJSONFeature) {
  const properties = (feature.properties ?? {}) as Record<string, unknown>
  const rawName = properties.name
  const rawHeight = properties.height

  const name =
    typeof rawName === "string" && rawName.trim().length > 0
      ? rawName
      : "Unnamed building"
  const parsedHeight = Number(rawHeight)
  const heightLabel =
    Number.isFinite(parsedHeight) && parsedHeight > 0
      ? `${Math.round(parsedHeight)} m`
      : "Unknown height"

  return { name, heightLabel }
}

type BuildingInteractionOptions = {
  map: mapboxgl.Map
  selectedBuildingPopupRef: MutableRefObject<mapboxgl.Popup | null>
  selectedBuildingIdRef: MutableRefObject<SelectedBuildingId>
}

export function createBuildingInteractionHandlers({
  map,
  selectedBuildingPopupRef,
  selectedBuildingIdRef
}: BuildingInteractionOptions) {
  const setHighlightAndState = (featureId: SelectedBuildingId) => {
    selectedBuildingIdRef.current = featureId
    setHighlightedBuildingById(map, featureId)
  }

  const handleMapClick = (event: mapboxgl.MapMouseEvent) => {
    const feature = getTopBuildingFeatureAtPoint(map, event.point)
    if (!feature) {
      selectedBuildingPopupRef.current?.remove()
      selectedBuildingPopupRef.current = null
      setHighlightAndState(null)
      return
    }

    const { name, heightLabel } = getBuildingDisplayData(feature)
    const popupContainer = document.createElement("div")
    popupContainer.className = "text-xs"

    const title = document.createElement("div")
    title.className = "font-semibold text-black"
    title.textContent = name

    const subtitle = document.createElement("div")
    subtitle.textContent = `Height: ${heightLabel}`


    popupContainer.appendChild(title)
    popupContainer.appendChild(subtitle)

    selectedBuildingPopupRef.current?.remove()
    selectedBuildingPopupRef.current = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
      offset: 12
    })
      .setLngLat(event.lngLat)
      .setDOMContent(popupContainer)
      .addTo(map)

    setHighlightAndState(
      typeof feature.id === "string" || typeof feature.id === "number"
        ? feature.id
        : null
    )
  }

  const handleMapMouseMove = (event: mapboxgl.MapMouseEvent) => {
    const isHoveringBuilding = Boolean(getTopBuildingFeatureAtPoint(map, event.point))
    map.getCanvas().style.cursor = isHoveringBuilding ? "pointer" : ""
  }

  const handleMapMouseLeave = () => {
    map.getCanvas().style.cursor = ""
  }

  return {
    handleMapClick,
    handleMapMouseMove,
    handleMapMouseLeave
  }
}
