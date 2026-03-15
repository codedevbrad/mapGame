import type mapboxgl from "mapbox-gl"
import {
  BUILDING_3D_LAYER_ID,
  BUILDING_HIGHLIGHT_2D_LAYER_ID,
  BUILDING_HIGHLIGHT_3D_LAYER_ID,
  BUILDING_HIT_LAYER_ID,
  BUILDING_SOURCE_ID
} from "@/app/(map)/mapbox/config"
import type { SelectedBuildingId } from "@/app/(map)/mapbox/types"

const original3dLayerFilterByMap = new WeakMap<mapboxgl.Map, mapboxgl.FilterSpecification | null>()

type BuildingLayerSpec = {
  source: string
  sourceLayer?: string
  minzoom3d: number
  extrusionHeight: mapboxgl.DataDrivenPropertyValueSpecification<number>
  extrusionBase: mapboxgl.DataDrivenPropertyValueSpecification<number>
}

function getBuildingLayerSpec(map: mapboxgl.Map): BuildingLayerSpec {
  const existing3dLayer = map.getLayer(BUILDING_3D_LAYER_ID) as
    | (mapboxgl.FillExtrusionLayer & { source: string; "source-layer"?: string })
    | undefined

  const fallbackHeight: mapboxgl.DataDrivenPropertyValueSpecification<number> = [
    "coalesce",
    ["to-number", ["get", "height"]],
    0
  ]
  const fallbackBase: mapboxgl.DataDrivenPropertyValueSpecification<number> = [
    "coalesce",
    ["to-number", ["get", "min_height"]],
    0
  ]

  if (!existing3dLayer?.source) {
    return {
      source: BUILDING_SOURCE_ID,
      sourceLayer: "building",
      minzoom3d: 11,
      extrusionHeight: fallbackHeight,
      extrusionBase: fallbackBase
    }
  }

  const existingHeight =
    (map.getPaintProperty(
      BUILDING_3D_LAYER_ID,
      "fill-extrusion-height"
    ) as mapboxgl.DataDrivenPropertyValueSpecification<number> | undefined) ?? fallbackHeight
  const existingBase =
    (map.getPaintProperty(
      BUILDING_3D_LAYER_ID,
      "fill-extrusion-base"
    ) as mapboxgl.DataDrivenPropertyValueSpecification<number> | undefined) ?? fallbackBase

  return {
    source: existing3dLayer.source,
    sourceLayer: existing3dLayer["source-layer"],
    minzoom3d: typeof existing3dLayer.minzoom === "number" ? existing3dLayer.minzoom : 11,
    extrusionHeight: existingHeight,
    extrusionBase: existingBase
  }
}

export function getTopBuildingFeatureAtPoint(map: mapboxgl.Map, point: mapboxgl.PointLike) {
  const queryableLayers = [BUILDING_3D_LAYER_ID, BUILDING_HIT_LAYER_ID].filter((layerId) =>
    Boolean(map.getLayer(layerId))
  )

  if (queryableLayers.length === 0) return undefined

  const buildingFeatures = map.queryRenderedFeatures(point, {
    layers: queryableLayers
  })
  return buildingFeatures[0]
}

export function setHighlightedBuildingById(map: mapboxgl.Map, featureId: SelectedBuildingId) {
  const filter: mapboxgl.FilterSpecification =
    featureId === null
      ? ["==", ["id"], ""]
      : ["==", ["id"], featureId]

  if (map.getLayer(BUILDING_HIGHLIGHT_2D_LAYER_ID)) {
    map.setFilter(BUILDING_HIGHLIGHT_2D_LAYER_ID, filter)
  }
  if (map.getLayer(BUILDING_HIGHLIGHT_3D_LAYER_ID)) {
    map.setFilter(BUILDING_HIGHLIGHT_3D_LAYER_ID, filter)
  }

  if (!map.getLayer(BUILDING_3D_LAYER_ID)) return

  if (!original3dLayerFilterByMap.has(map)) {
    const currentFilter = map.getFilter(BUILDING_3D_LAYER_ID)
    original3dLayerFilterByMap.set(map, (currentFilter as mapboxgl.FilterSpecification | null) ?? null)
  }

  const originalFilter = original3dLayerFilterByMap.get(map) ?? null
  if (featureId === null) {
    map.setFilter(BUILDING_3D_LAYER_ID, originalFilter ?? null)
    return
  }

  const excludeSelectedFilter: mapboxgl.FilterSpecification = ["!=", ["id"], featureId]
  const mergedFilter: mapboxgl.FilterSpecification = originalFilter
    ? ["all", originalFilter, excludeSelectedFilter]
    : excludeSelectedFilter
  map.setFilter(BUILDING_3D_LAYER_ID, mergedFilter)
}

export function ensureBuildingLayers(map: mapboxgl.Map, labelLayerId?: string) {
  const buildingLayerSpec = getBuildingLayerSpec(map)

  if (buildingLayerSpec.source === BUILDING_SOURCE_ID && !map.getSource(BUILDING_SOURCE_ID)) {
    map.addSource(BUILDING_SOURCE_ID, {
      type: "vector",
      url: "mapbox://mapbox.mapbox-streets-v8"
    })
  }

  if (!map.getLayer(BUILDING_HIT_LAYER_ID)) {
    map.addLayer(
      {
        id: BUILDING_HIT_LAYER_ID,
        source: buildingLayerSpec.source,
        ...(buildingLayerSpec.sourceLayer ? { "source-layer": buildingLayerSpec.sourceLayer } : {}),
        type: "fill",
        minzoom: 11,
        paint: {
          // Near-transparent fill keeps buildings hittable without changing visuals.
          "fill-color": "#000000",
          "fill-opacity": 0.001
        }
      },
      labelLayerId
    )
  }

  if (!map.getLayer(BUILDING_3D_LAYER_ID)) {
    map.addLayer(
      {
        id: BUILDING_3D_LAYER_ID,
        source: buildingLayerSpec.source,
        ...(buildingLayerSpec.sourceLayer ? { "source-layer": buildingLayerSpec.sourceLayer } : {}),
        type: "fill-extrusion",
        minzoom: 15,
        paint: {
          "fill-extrusion-color": "#aaa",
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            0,
            15.05,
            ["coalesce", ["to-number", ["get", "height"]], 0]
          ],
          "fill-extrusion-base": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            0,
            15.05,
            ["coalesce", ["to-number", ["get", "min_height"]], 0]
          ],
          "fill-extrusion-opacity": 0.6
        }
      },
      labelLayerId
    )
  }

  if (!map.getLayer(BUILDING_HIGHLIGHT_2D_LAYER_ID)) {
    map.addLayer(
      {
        id: BUILDING_HIGHLIGHT_2D_LAYER_ID,
        source: buildingLayerSpec.source,
        ...(buildingLayerSpec.sourceLayer ? { "source-layer": buildingLayerSpec.sourceLayer } : {}),
        type: "fill",
        minzoom: 11,
        maxzoom: buildingLayerSpec.minzoom3d,
        filter: ["==", ["id"], ""],
        paint: {
          "fill-color": "#ff0000",
          "fill-opacity": 0.3
        }
      },
      labelLayerId
    )
  }

  if (!map.getLayer(BUILDING_HIGHLIGHT_3D_LAYER_ID)) {
    map.addLayer(
      {
        id: BUILDING_HIGHLIGHT_3D_LAYER_ID,
        source: buildingLayerSpec.source,
        ...(buildingLayerSpec.sourceLayer ? { "source-layer": buildingLayerSpec.sourceLayer } : {}),
        type: "fill-extrusion",
        minzoom: buildingLayerSpec.minzoom3d,
        filter: ["==", ["id"], ""],
        paint: {
          "fill-extrusion-color": "#ff0000",
          "fill-extrusion-height": buildingLayerSpec.extrusionHeight,
          "fill-extrusion-base": buildingLayerSpec.extrusionBase,
          "fill-extrusion-opacity": 1
        }
      },
      labelLayerId
    )
  }
}
