"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import * as THREE from "three"
import {
  CITY_VIEW_BEARING,
  CITY_VIEW_PITCH,
  CITY_VIEW_ZOOM
} from "@/app/(map)/mapbox/config"
import { createBuildingInteractionHandlers } from "@/app/(map)/mapbox/system_buildings/buildingInteractions"
import {
  ensureBuildingLayers,
  setHighlightedBuildingById,
  setRegisteredBuildingsByIds
} from "@/app/(map)/mapbox/system_buildings/buildingLayers"
import { REGISTERED_BUILDING_IDS } from "@/app/(map)/mapbox/system_buildings/registeredBuildings"
import { createShaderMaterial } from "@/app/(map)/mapbox/shaders/shaderMaterial"
import type { MapboxMapProps, SelectedBuildingId } from "@/app/(map)/mapbox/types"
import {
  ensureSatelliteTrackingLayer,
  type SatelliteTrackingLayerController
} from "@/app/(map)/mapbox/system_satalites/satelliteTrackingLayer"
import { ensureVisualShaderLayer } from "@/app/(map)/mapbox/shaders/visualShaderLayer"
import type { ShaderMode } from "@/app/(map)/components/VisualControls"
import {
  ensureVpnLayer,
  VPN_NODE_LAYER_ID,
  VPN_SELECTED_NODE_LAYER_ID,
  setHighlightedVpnNode,
  setVpnLayerNodes
} from "@/app/(map)/mapbox/system_vpn/vpnLayer"
import DebugSystemPopover from "@/app/(map)/mapbox/debug_system"
import {
  getDebugBuildingInfo,
  type DebugBuildingInfo
} from "@/app/(map)/mapbox/debug_system/buildingSelector/func"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

export default function MapboxMap({
  shaderMode,
  shaderIntensity,
  backgroundDimOpacity,
  center,
  vpnNodes = [],
  selectedVpnNodeId = null,
  selectedVpnNodeFocusKey = 0,
  flyToKey = 0,
  onMapReady,
  selectedSatelliteId = null,
  selectedSatelliteFocusKey = 0,
  onVpnNodeSelect,
  onSatelliteSelect,
  onSatellitesChange
}: MapboxMapProps) {

  const mapContainer = useRef<HTMLDivElement>(null)
  const [debugBuildingInfo, setDebugBuildingInfo] = useState<DebugBuildingInfo | null>(null)
  const initialShaderModeRef = useRef<ShaderMode>(shaderMode)
  const shaderIntensityRef = useRef<number>(shaderIntensity)
  const initialCenterRef = useRef<[number, number]>(center)
  const onMapReadyRef = useRef<MapboxMapProps["onMapReady"]>(onMapReady)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const shaderMaterialRef = useRef<THREE.ShaderMaterial | null>(null)
  const shaderMeshRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null>(null)
  const selectedBuildingPopupRef = useRef<mapboxgl.Popup | null>(null)
  const selectedBuildingIdRef = useRef<SelectedBuildingId>(null)
  const satelliteLayerControllerRef = useRef<SatelliteTrackingLayerController | null>(null)
  const selectedSatelliteIdRef = useRef<string | null>(selectedSatelliteId)
  const vpnNodesRef = useRef<MapboxMapProps["vpnNodes"]>(vpnNodes)
  const selectedVpnNodeIdRef = useRef<string | null>(selectedVpnNodeId)
  const onVpnNodeSelectRef = useRef<MapboxMapProps["onVpnNodeSelect"]>(onVpnNodeSelect)
  const onSatelliteSelectRef = useRef<MapboxMapProps["onSatelliteSelect"]>(onSatelliteSelect)
  const onSatellitesChangeRef = useRef<MapboxMapProps["onSatellitesChange"]>(onSatellitesChange)

  useEffect(() => {
    vpnNodesRef.current = vpnNodes
    if (!mapRef.current) return
    setVpnLayerNodes(mapRef.current, vpnNodes)
  }, [vpnNodes])

  useEffect(() => {
    selectedVpnNodeIdRef.current = selectedVpnNodeId
    if (!mapRef.current) return
    setHighlightedVpnNode(mapRef.current, selectedVpnNodeId)
  }, [selectedVpnNodeId])

  useEffect(() => {
    onVpnNodeSelectRef.current = onVpnNodeSelect
  }, [onVpnNodeSelect])

  useEffect(() => {
    if (!selectedVpnNodeId) return
    const selectedNode = vpnNodesRef.current?.find((node) => node.id === selectedVpnNodeId)
    if (!selectedNode) return
    mapRef.current?.easeTo({
      center: selectedNode.coordinates,
      zoom: Math.max(CITY_VIEW_ZOOM + 1, 12),
      pitch: CITY_VIEW_PITCH,
      bearing: CITY_VIEW_BEARING,
      duration: 1200
    })
  }, [selectedVpnNodeId, selectedVpnNodeFocusKey])

  useEffect(() => {
    selectedSatelliteIdRef.current = selectedSatelliteId
    satelliteLayerControllerRef.current?.setSelectedSatellite(selectedSatelliteId)
  }, [selectedSatelliteId])

  useEffect(() => {
    if (!selectedSatelliteId) return
    satelliteLayerControllerRef.current?.focusSatellite(selectedSatelliteId)
  }, [selectedSatelliteId, selectedSatelliteFocusKey])

  useEffect(() => {
    onSatelliteSelectRef.current = onSatelliteSelect
  }, [onSatelliteSelect])

  useEffect(() => {
    onSatellitesChangeRef.current = onSatellitesChange
  }, [onSatellitesChange])

  useEffect(() => {

    if (!mapContainer.current) return

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/navigation-night-v1",
      projection: "globe",
      center: initialCenterRef.current,
      zoom: 1.8,
      pitch: 0,
      bearing: 0,
      antialias: true
    })
    mapRef.current = map
    onMapReadyRef.current?.(map)

    map.addControl(new mapboxgl.FullscreenControl(), "top-left")
    map.addControl(new mapboxgl.ScaleControl({ unit: "metric" }), "bottom-left")
    map.doubleClickZoom.enable()

    const { handleMapClick, handleMapMouseMove, handleMapMouseLeave } =
      createBuildingInteractionHandlers({
        map,
        selectedBuildingPopupRef,
        selectedBuildingIdRef
      })
    const handleVpnNodeClick = (event: mapboxgl.MapMouseEvent) => {
      const vpnLayers = [VPN_SELECTED_NODE_LAYER_ID, VPN_NODE_LAYER_ID].filter((layerId) =>
        Boolean(map.getLayer(layerId))
      )
      if (vpnLayers.length === 0) return

      const vpnFeature = map
        .queryRenderedFeatures(event.point, {
          layers: vpnLayers
        })
        .find((feature) => feature.geometry.type === "Point")

      if (!vpnFeature) return

      const properties = (vpnFeature.properties ?? {}) as Record<string, unknown>
      const nodeId = properties.nodeId
      if (typeof nodeId !== "string") return
      onVpnNodeSelectRef.current?.(nodeId)
    }
    const handleDebugBuildingClick = (event: mapboxgl.MapMouseEvent) => {
      const info = getDebugBuildingInfo(map, event)
      if (!info) {
        setDebugBuildingInfo(null)
        return
      }
      setDebugBuildingInfo(info)
    }

    map.on("click", handleMapClick)
    map.on("mousemove", handleMapMouseMove)
    map.on("mouseleave", handleMapMouseLeave)
    map.on("click", handleVpnNodeClick)
    map.on("click", handleDebugBuildingClick)

    map.on("style.load", () => {
      const layers = map.getStyle().layers
      const labelLayerId = layers?.find(
        (layer) => layer.type === "symbol" && layer.layout && "text-field" in layer.layout
      )?.id

      ensureBuildingLayers(map, labelLayerId)
      setRegisteredBuildingsByIds(map, REGISTERED_BUILDING_IDS)
      setHighlightedBuildingById(map, selectedBuildingIdRef.current)
      satelliteLayerControllerRef.current?.cleanup()
      satelliteLayerControllerRef.current = ensureSatelliteTrackingLayer(map, labelLayerId, {
        selectedSatelliteId: selectedSatelliteIdRef.current,
        onSatelliteSelect: (satelliteId) => onSatelliteSelectRef.current?.(satelliteId),
        onSatellitesChange: (satellites) => onSatellitesChangeRef.current?.(satellites)
      })
      ensureVpnLayer(map, labelLayerId)
      setVpnLayerNodes(map, vpnNodesRef.current ?? [])
      setHighlightedVpnNode(map, selectedVpnNodeIdRef.current)
      ensureVisualShaderLayer(map, {
        initialShaderModeRef,
        shaderIntensityRef,
        shaderMaterialRef,
        shaderMeshRef
      })
    })

    return () => {
      map.off("click", handleMapClick)
      map.off("click", handleVpnNodeClick)
      map.off("click", handleDebugBuildingClick)
      map.off("mousemove", handleMapMouseMove)
      map.off("mouseleave", handleMapMouseLeave)
      satelliteLayerControllerRef.current?.cleanup()
      satelliteLayerControllerRef.current = null
      selectedBuildingPopupRef.current?.remove()
      selectedBuildingPopupRef.current = null
      mapRef.current = null
      shaderMaterialRef.current = null
      shaderMeshRef.current = null
      map.remove()
    }

  }, [])

  useEffect(() => {
    const mesh = shaderMeshRef.current
    const material = shaderMaterialRef.current
    if (!mesh || !material) return

    const nextMaterial = createShaderMaterial(shaderMode, shaderIntensityRef.current)
    mesh.material = nextMaterial
    shaderMaterialRef.current = nextMaterial
    material.dispose()
    mapRef.current?.triggerRepaint()
  }, [shaderMode])

  useEffect(() => {
    shaderIntensityRef.current = shaderIntensity
    if (!shaderMaterialRef.current) return
    shaderMaterialRef.current.uniforms.uIntensity.value = shaderIntensity
    mapRef.current?.triggerRepaint()
  }, [shaderIntensity])

  useEffect(() => {
    mapRef.current?.easeTo({
      center,
      zoom: CITY_VIEW_ZOOM,
      pitch: CITY_VIEW_PITCH,
      bearing: CITY_VIEW_BEARING,
      duration: 1600
    })
  }, [center, flyToKey])

  return (
    <div
      className="relative w-full h-full"
      style={{ filter: `brightness(${Math.max(0.2, 1 - backgroundDimOpacity)})` }}
    >
      {/* <div className="pointer-events-none absolute  rounded-[45%] -inset-1 border-2 border-gray-800 blur-[9px]" /> */}
      <div className="map-plus-cursor relative h-full w-full overflow-hidden rounded-[45%]">
        <div
          ref={mapContainer}
          className="h-full w-full "
        />
      </div>
      <DebugSystemPopover selectedBuilding={debugBuildingInfo} />
      {/* <div className="pointer-events-none absolute bottom-0 left-0 z-30 h-20 w-full bg-background" /> */}
    </div>
  )
}