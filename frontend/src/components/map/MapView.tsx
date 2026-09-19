import React, { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import type { Point, FeatureCollection } from "geojson";

// Ensure MapLibre Web Worker is bundled correctly by Vite for GeoJSON clustering and heatmaps
maplibregl.setWorkerUrl(maplibreWorkerUrl);
import {
  FaLocationDot,
  FaCircleNodes,
  FaFire,
  FaTruck,
  FaWifi,
  FaWarehouse,
} from "react-icons/fa6";
import { MapPin, ArrowRight, Edit2, X } from "lucide-react";
import type { Entity } from "../../types/entity";
import { TypeBadge, StatusBadge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { createPinpointElement } from "./PinpointMarker";

export type MapViewMode = "pinpoints" | "clusters" | "heatmap";

interface MapViewProps {
  entities: Entity[];
  selectedEntityId: string | null;
  onSelectEntity: (id: string | null) => void;
  onOpenDetail?: (entity: Entity) => void;
  onOpenEdit?: (entity: Entity) => void;
  onMapClickCoordinates?: (lat: number, lng: number) => void;
  isPickingLocation?: boolean;
}

const CLUSTER_SOURCE_ID = "clustered-entities-source";
const RAW_SOURCE_ID = "raw-entities-source";
const LAYER_HEATMAP = "entities-heatmap-layer";
const LAYER_HEATMAP_HALO = "entities-heatmap-halo-layer";
const LAYER_HEATMAP_POINTS = "entities-heatmap-points-layer";
const LAYER_CLUSTER_PULSE = "entities-cluster-pulse-layer";
const LAYER_CLUSTER_OUTER_RING = "entities-cluster-outer-ring-layer";
const LAYER_CLUSTER_CIRCLES = "entities-cluster-circles-layer";
const LAYER_CLUSTER_COUNT = "entities-cluster-count-layer";
const LAYER_UNCLUSTERED_SELECTED_HALO = "entities-unclustered-selected-halo";
const LAYER_UNCLUSTERED_PINS = "entities-unclustered-pins-layer";

const baseMapStyle: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    [CLUSTER_SOURCE_ID]: {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      cluster: true,
      clusterMaxZoom: 15,
      clusterRadius: 65,
    },
    [RAW_SOURCE_ID]: {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      cluster: false,
    },
  },
  layers: [
    {
      id: "osm-tiles-layer",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
    {
      id: LAYER_HEATMAP,
      type: "heatmap",
      source: RAW_SOURCE_ID,
      layout: { visibility: "none" },
      paint: {
        "heatmap-weight": 1.0,
        "heatmap-intensity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          0.6,
          8,
          0.8,
          11,
          1.0,
          14,
          1.3,
        ],
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(247, 252, 245, 0)",
          0.1,
          "rgba(199, 233, 192, 0.4)", // brand-200 soft mint (Low Density)
          0.3,
          "rgba(161, 217, 155, 0.6)", // brand-300 fresh green
          0.5,
          "rgba(116, 196, 118, 0.72)", // brand-400 vivid meadow
          0.7,
          "rgba(65, 171, 93, 0.82)", // brand-500 rich emerald (Mid Density)
          0.85,
          "rgba(35, 139, 69, 0.88)", // brand-600 deep forest
          1,
          "rgba(0, 109, 44, 0.92)", // brand-700 deep brand green (High Density)
        ],
        "heatmap-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          14,
          6,
          20,
          9,
          28,
          12,
          40,
          15,
          56,
        ],
        "heatmap-opacity": 0.75,
      },
    },
    // Heatmap Outer Delicate Beacon Halo
    {
      id: LAYER_HEATMAP_HALO,
      type: "circle",
      source: RAW_SOURCE_ID,
      layout: { visibility: "none" },
      paint: {
        "circle-radius": 9,
        "circle-color": "rgba(255, 255, 255, 0.7)",
        "circle-stroke-width": 1.2,
        "circle-stroke-color": "rgba(0, 109, 44, 0.35)",
        "circle-opacity": 0.85,
      },
    },
    // Heatmap Core Jewel Dot
    {
      id: LAYER_HEATMAP_POINTS,
      type: "circle",
      source: RAW_SOURCE_ID,
      layout: { visibility: "none" },
      paint: {
        "circle-radius": 4,
        "circle-color": "#006d2c",
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": 0.95,
      },
    },
    // 1. Cluster Outer Translucent Radar Pulse Halo
    {
      id: LAYER_CLUSTER_PULSE,
      type: "circle",
      source: CLUSTER_SOURCE_ID,
      filter: ["has", "point_count"],
      layout: { visibility: "none" },
      paint: {
        "circle-color": "rgba(65, 171, 93, 0.22)",
        "circle-radius": [
          "step",
          ["get", "point_count"],
          32,
          10,
          38,
          50,
          46,
        ],
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "rgba(35, 139, 69, 0.4)",
        "circle-opacity": 0.9,
      },
    },
    // 2. Cluster Intermediate Crisp White Relief Ring
    {
      id: LAYER_CLUSTER_OUTER_RING,
      type: "circle",
      source: CLUSTER_SOURCE_ID,
      filter: ["has", "point_count"],
      layout: { visibility: "none" },
      paint: {
        "circle-color": "#ffffff",
        "circle-radius": [
          "step",
          ["get", "point_count"],
          23,
          10,
          28,
          50,
          34,
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": [
          "step",
          ["get", "point_count"],
          "#c7e9c0", // brand-200
          10,
          "#a1d99b", // brand-300
          50,
          "#74c476", // brand-400
        ],
        "circle-opacity": 0.98,
      },
    },
    // 3. Cluster Deep Brand Green Core Disc
    {
      id: LAYER_CLUSTER_CIRCLES,
      type: "circle",
      source: CLUSTER_SOURCE_ID,
      filter: ["has", "point_count"],
      layout: { visibility: "none" },
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#238b45", // < 10 points: vibrant lush emerald
          10,
          "#006d2c", // 10 - 50 points: deep brand forest
          50,
          "#00441b", // > 50 points: midnight green
        ],
        "circle-radius": [
          "step",
          ["get", "point_count"],
          18,
          10,
          22,
          50,
          27,
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": 1,
      },
    },
    // 4. Cluster Count Number (Bold, Crisp White)
    {
      id: LAYER_CLUSTER_COUNT,
      type: "symbol",
      source: CLUSTER_SOURCE_ID,
      filter: ["has", "point_count"],
      layout: {
        visibility: "none",
        "text-field": ["to-string", ["get", "point_count"]],
        "text-size": 13,
        "text-font": ["Noto Sans Bold"],
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "rgba(0, 68, 27, 0.75)",
        "text-halo-width": 0.75,
      },
    },
    // 5. Unclustered Selected Halo (highlights active selection)
    {
      id: LAYER_UNCLUSTERED_SELECTED_HALO,
      type: "circle",
      source: CLUSTER_SOURCE_ID,
      filter: [
        "all",
        ["!", ["has", "point_count"]],
        ["==", ["get", "isSelected"], true],
      ],
      layout: { visibility: "none" },
      paint: {
        "circle-radius": 28,
        "circle-color": "rgba(65, 171, 93, 0.3)",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#238b45",
      },
    },
    // 6. Unclustered Invisible Anchor Layer (used for spatial query of unclustered features in clusters mode)
    {
      id: LAYER_UNCLUSTERED_PINS,
      type: "circle",
      source: CLUSTER_SOURCE_ID,
      filter: ["!", ["has", "point_count"]],
      layout: {
        visibility: "visible",
      },
      paint: {
        "circle-radius": 1,
        "circle-opacity": 0,
      },
    },
  ],
};

const buildGeoJSON = (
  entityList: Entity[],
  selectedId: string | null
): FeatureCollection<Point> => ({
  type: "FeatureCollection",
  features: entityList.map((e) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [e.longitude, e.latitude],
    },
    properties: {
      id: e.id,
      name: e.name,
      type: e.type,
      status: e.status,
      description: e.description || "",
      latitude: e.latitude,
      longitude: e.longitude,
      isSelected: e.id === selectedId,
    },
  })),
});

export const MapView: React.FC<MapViewProps> = ({
  entities,
  selectedEntityId,
  onSelectEntity,
  onOpenDetail,
  onOpenEdit,
  onMapClickCoordinates,
  isPickingLocation = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersMapRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<MapViewMode>("pinpoints");

  const viewModeRef = useRef(viewMode);
  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  const syncClusterMarkersRef = useRef<(() => void) | null>(null);

  const entitiesRef = useRef(entities);
  useEffect(() => {
    entitiesRef.current = entities;
  }, [entities]);

  const selectedEntityIdRef = useRef(selectedEntityId);
  useEffect(() => {
    selectedEntityIdRef.current = selectedEntityId;
  }, [selectedEntityId]);

  const onSelectEntityRef = useRef(onSelectEntity);
  const onMapClickCoordinatesRef = useRef(onMapClickCoordinates);
  const isPickingLocationRef = useRef(isPickingLocation);

  useEffect(() => {
    onSelectEntityRef.current = onSelectEntity;
  }, [onSelectEntity]);

  useEffect(() => {
    onMapClickCoordinatesRef.current = onMapClickCoordinates;
  }, [onMapClickCoordinates]);

  useEffect(() => {
    isPickingLocationRef.current = isPickingLocation;
  }, [isPickingLocation]);

  const selectedEntity = entities.find((e) => e.id === selectedEntityId) || null;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: baseMapStyle,
      center: [104.7565, -2.9835], // Center in Palembang
      zoom: 12,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      "top-right"
    );

    const onStyleReady = () => {
      // Synchronize initial data into both sources
      const geojson = buildGeoJSON(entitiesRef.current, selectedEntityIdRef.current);
      const clusterSource = map.getSource(CLUSTER_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (clusterSource) {
        clusterSource.setData(geojson);
      }
      const rawSource = map.getSource(RAW_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (rawSource) {
        rawSource.setData(geojson);
      }
      setMapLoaded(true);
    };

    if (map.isStyleLoaded()) {
      onStyleReady();
    } else {
      map.on("style.load", onStyleReady);
      map.on("load", onStyleReady);
    }

    // Synchronize unclustered DOM markers in clusters mode
    const syncClusterMarkers = () => {
      if (viewModeRef.current !== "clusters") return;
      const m = mapRef.current;
      if (!m) return;

      const unclusteredIds = new Set<string>();

      try {
        const srcFeatures = m.querySourceFeatures(CLUSTER_SOURCE_ID, {
          filter: ["!=", "cluster", true],
        });
        for (const f of srcFeatures) {
          if (f.properties?.id) unclusteredIds.add(f.properties.id as string);
        }
      } catch {
        // source may not be loaded yet
      }

      try {
        const renderedFeatures = m.queryRenderedFeatures({
          layers: [LAYER_UNCLUSTERED_PINS],
        });
        for (const f of renderedFeatures) {
          if (f.properties?.id) unclusteredIds.add(f.properties.id as string);
        }
      } catch {
        // layer may not be loaded yet
      }

      const currentMarkers = markersMapRef.current;

      // Remove markers that are no longer unclustered
      for (const [id, marker] of currentMarkers.entries()) {
        if (!unclusteredIds.has(id)) {
          marker.remove();
          currentMarkers.delete(id);
        }
      }

      // Add or update markers for unclustered entities
      entitiesRef.current.forEach((entity) => {
        if (!unclusteredIds.has(entity.id)) return;

        const isSelected = entity.id === selectedEntityIdRef.current;

        if (currentMarkers.has(entity.id)) {
          currentMarkers.get(entity.id)!.remove();
        }

        const el = createPinpointElement(entity, isSelected, () => {
          if (isPickingLocationRef.current && onMapClickCoordinatesRef.current) {
            onMapClickCoordinatesRef.current(entity.latitude, entity.longitude);
            return;
          }
          onSelectEntityRef.current(entity.id);
        });

        const marker = new maplibregl.Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat([entity.longitude, entity.latitude])
          .addTo(m);

        currentMarkers.set(entity.id, marker);
      });
    };

    syncClusterMarkersRef.current = syncClusterMarkers;

    map.on("move", syncClusterMarkers);
    map.on("moveend", syncClusterMarkers);
    map.on("zoom", syncClusterMarkers);
    map.on("zoomend", syncClusterMarkers);
    map.on("idle", syncClusterMarkers);
    map.on("sourcedata", (e: maplibregl.MapSourceDataEvent) => {
      if (e.sourceId === CLUSTER_SOURCE_ID && e.isSourceLoaded) {
        syncClusterMarkers();
      }
    });

    // Cluster Expansion Click (supports clicking on any part of the cluster)
    const clusterLayers = [
      LAYER_CLUSTER_CIRCLES,
      LAYER_CLUSTER_OUTER_RING,
      LAYER_CLUSTER_PULSE,
    ];
    clusterLayers.forEach((layerId) => {
      map.on(
        "click",
        layerId,
        (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
          if (!e.features || !e.features.length) return;
          const clusterId = e.features[0].properties?.cluster_id;
          if (clusterId == null) return;

          const source = map.getSource(CLUSTER_SOURCE_ID) as maplibregl.GeoJSONSource;
          source
            .getClusterExpansionZoom(clusterId)
            .then((zoom) => {
              if (zoom == null) return;
              const geom = e.features![0].geometry as Point;
              map.easeTo({
                center: geom.coordinates as [number, number],
                zoom: zoom + 0.6,
                duration: 500,
              });
            })
            .catch(() => {});
        }
      );
    });

    // Heatmap Point Click (select entity in heatmap mode)
    const heatmapInteractiveLayers = [LAYER_HEATMAP_POINTS, LAYER_HEATMAP_HALO];
    heatmapInteractiveLayers.forEach((layerId) => {
      map.on(
        "click",
        layerId,
        (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
          if (isPickingLocationRef.current) return;
          if (e.features && e.features.length > 0) {
            const id = e.features[0].properties?.id;
            if (id) {
              onSelectEntityRef.current(id);
            }
          }
        }
      );
    });

    // Cursors on interactive layers
    const interactiveLayers = [
      LAYER_CLUSTER_CIRCLES,
      LAYER_CLUSTER_OUTER_RING,
      LAYER_CLUSTER_PULSE,
      LAYER_HEATMAP_POINTS,
      LAYER_HEATMAP_HALO,
    ];
    interactiveLayers.forEach((layerId) => {
      map.on("mouseenter", layerId, () => {
        if (!isPickingLocationRef.current) {
          map.getCanvas().style.cursor = "pointer";
        }
      });
      map.on("mouseleave", layerId, () => {
        if (!isPickingLocationRef.current) {
          map.getCanvas().style.cursor = "";
        }
      });
    });

    // Handle map click for location picking or background deselect
    map.on("click", (e: maplibregl.MapMouseEvent) => {
      if (isPickingLocationRef.current && onMapClickCoordinatesRef.current) {
        const lat = Number(e.lngLat.lat.toFixed(6));
        const lng = Number(e.lngLat.lng.toFixed(6));
        onMapClickCoordinatesRef.current(lat, lng);
        return;
      }

      // Check if clicking interactive layers before deselecting
      const bbox: [maplibregl.PointLike, maplibregl.PointLike] = [
        [e.point.x - 6, e.point.y - 6],
        [e.point.x + 6, e.point.y + 6],
      ];
      const features = map.queryRenderedFeatures(bbox, {
        layers: interactiveLayers,
      });
      if (features.length === 0 && !isPickingLocationRef.current) {
        onSelectEntityRef.current(null);
      }
    });

    mapRef.current = map;
    const currentMarkersMap = markersMapRef.current;

    return () => {
      for (const marker of currentMarkersMap.values()) {
        marker.remove();
      }
      currentMarkersMap.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update cursor mode when isPickingLocation changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.getCanvas().style.cursor = isPickingLocation ? "crosshair" : "";
  }, [isPickingLocation]);

  // Synchronize GeoJSON source data whenever entities or selectedEntityId changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const geojsonData = buildGeoJSON(entities, selectedEntityId);

    const clusterSource = map.getSource(CLUSTER_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (clusterSource) {
      clusterSource.setData(geojsonData);
    }

    const rawSource = map.getSource(RAW_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (rawSource) {
      rawSource.setData(geojsonData);
    }
  }, [entities, selectedEntityId, mapLoaded]);

  // Manage layer visibility and pinpoint markers based on viewMode
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const setLayerVis = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
      }
    };

    if (viewMode === "pinpoints") {
      setLayerVis(LAYER_CLUSTER_PULSE, false);
      setLayerVis(LAYER_CLUSTER_OUTER_RING, false);
      setLayerVis(LAYER_CLUSTER_CIRCLES, false);
      setLayerVis(LAYER_CLUSTER_COUNT, false);
      setLayerVis(LAYER_UNCLUSTERED_SELECTED_HALO, false);
      setLayerVis(LAYER_UNCLUSTERED_PINS, false);
      setLayerVis(LAYER_HEATMAP, false);
      setLayerVis(LAYER_HEATMAP_HALO, false);
      setLayerVis(LAYER_HEATMAP_POINTS, false);

      // Show DOM pinpoint markers
      const currentMarkers = markersMapRef.current;
      const nextEntityIds = new Set(entities.map((e) => e.id));

      for (const [id, marker] of currentMarkers.entries()) {
        if (!nextEntityIds.has(id)) {
          marker.remove();
          currentMarkers.delete(id);
        }
      }

      entities.forEach((entity) => {
        const isSelected = entity.id === selectedEntityId;

        if (currentMarkers.has(entity.id)) {
          currentMarkers.get(entity.id)!.remove();
        }

        const el = createPinpointElement(entity, isSelected, () => {
          if (isPickingLocationRef.current && onMapClickCoordinatesRef.current) {
            onMapClickCoordinatesRef.current(entity.latitude, entity.longitude);
            return;
          }
          onSelectEntityRef.current(entity.id);
        });

        const marker = new maplibregl.Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat([entity.longitude, entity.latitude])
          .addTo(map);

        currentMarkers.set(entity.id, marker);
      });
    } else if (viewMode === "clusters") {
      const geojsonData = buildGeoJSON(entities, selectedEntityId);
      const clusterSource = map.getSource(CLUSTER_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (clusterSource) {
        clusterSource.setData(geojsonData);
      }

      // Enable cluster layers
      setLayerVis(LAYER_CLUSTER_PULSE, true);
      setLayerVis(LAYER_CLUSTER_OUTER_RING, true);
      setLayerVis(LAYER_CLUSTER_CIRCLES, true);
      setLayerVis(LAYER_CLUSTER_COUNT, true);
      setLayerVis(LAYER_UNCLUSTERED_SELECTED_HALO, false);
      setLayerVis(LAYER_UNCLUSTERED_PINS, true);
      setLayerVis(LAYER_HEATMAP, false);
      setLayerVis(LAYER_HEATMAP_HALO, false);
      setLayerVis(LAYER_HEATMAP_POINTS, false);

      // Synchronize unclustered DOM markers using reusable createPinpointElement
      syncClusterMarkersRef.current?.();
      const t1 = setTimeout(() => syncClusterMarkersRef.current?.(), 50);
      const t2 = setTimeout(() => syncClusterMarkersRef.current?.(), 200);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else if (viewMode === "heatmap") {
      const geojsonData = buildGeoJSON(entities, selectedEntityId);
      const rawSource = map.getSource(RAW_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (rawSource) {
        rawSource.setData(geojsonData);
      }

      // Enable heatmap layers
      setLayerVis(LAYER_CLUSTER_PULSE, false);
      setLayerVis(LAYER_CLUSTER_OUTER_RING, false);
      setLayerVis(LAYER_CLUSTER_CIRCLES, false);
      setLayerVis(LAYER_CLUSTER_COUNT, false);
      setLayerVis(LAYER_UNCLUSTERED_SELECTED_HALO, false);
      setLayerVis(LAYER_UNCLUSTERED_PINS, false);
      setLayerVis(LAYER_HEATMAP, true);
      setLayerVis(LAYER_HEATMAP_HALO, false);
      setLayerVis(LAYER_HEATMAP_POINTS, false);

      // Remove DOM pinpoint markers in heatmap mode
      for (const marker of markersMapRef.current.values()) {
        marker.remove();
      }
      markersMapRef.current.clear();
    }
  }, [entities, selectedEntityId, mapLoaded, viewMode]);

  // Pan / Fly to selected entity
  useEffect(() => {
    if (!selectedEntityId || !mapRef.current) return;
    const target = entities.find((e) => e.id === selectedEntityId);
    if (target) {
      mapRef.current.flyTo({
        center: [target.longitude, target.latitude],
        zoom: Math.max(mapRef.current.getZoom(), 13),
        essential: true,
        duration: 800,
      });
    }
  }, [selectedEntityId, entities]);

  // Format first 3 attributes for quick infowindow display
  const attributeEntries = selectedEntity?.attributes
    ? Object.entries(selectedEntity.attributes).slice(0, 3)
    : [];

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Anti-Slop View Mode Selector (Pure vector react-icons, zero emojis) */}
      <div className="absolute top-4 right-14 z-10 bg-white/95 backdrop-blur-xs border border-brand-200 rounded-xl p-1 shadow-md flex items-center gap-1 pointer-events-auto">
        <button
          type="button"
          onClick={() => setViewMode("pinpoints")}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer",
            viewMode === "pinpoints"
              ? "bg-brand-600 text-white shadow-2xs font-semibold"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
          )}
        >
          <FaLocationDot className="w-3 h-3" />
          <span>Pinpoints</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode("clusters")}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer",
            viewMode === "clusters"
              ? "bg-brand-600 text-white shadow-2xs font-semibold"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
          )}
        >
          <FaCircleNodes className="w-3 h-3" />
          <span>Clusters</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode("heatmap")}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer",
            viewMode === "heatmap"
              ? "bg-brand-600 text-white shadow-2xs font-semibold"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
          )}
        >
          <FaFire className="w-3 h-3" />
          <span>Heatmap</span>
        </button>
      </div>

      {/* Dynamic Brand Geospatial Legend */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-xs rounded-xl p-2.5 shadow-md border border-brand-200 text-xs hidden sm:flex flex-col gap-1.5 pointer-events-auto min-w-44">
        {viewMode === "pinpoints" && (
          <>
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-brand-900 border-b border-brand-100 pb-1">
              <FaLocationDot className="w-3 h-3 text-brand-600" />
              <span>Brand Pinpoints</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-zinc-700">
              <span className="flex items-center gap-1 font-medium">
                <FaTruck className="w-3 h-3 text-brand-700" /> Vehicle
              </span>
              <span className="flex items-center gap-1 font-medium">
                <FaWifi className="w-3 h-3 text-brand-700" /> IoT Device
              </span>
              <span className="flex items-center gap-1 font-medium">
                <FaWarehouse className="w-3 h-3 text-brand-700" /> Facility
              </span>
              <span className="flex items-center gap-1 font-medium">
                <FaLocationDot className="w-3 h-3 text-brand-700" /> Other
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-zinc-100 text-[9px] text-zinc-500 font-medium">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Maint.
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" /> Inactive
              </span>
            </div>
          </>
        )}

        {viewMode === "clusters" && (
          <>
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-brand-900 border-b border-brand-100 pb-1">
              <FaCircleNodes className="w-3 h-3 text-brand-600" />
              <span>Spatial Superclusters</span>
            </div>
            <div className="space-y-1 text-[10px] text-zinc-700">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-500 ring-1 ring-brand-200" />
                  &lt; 10 entities
                </span>
                <span className="text-[9px] font-mono text-zinc-400">Small</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-600 ring-1 ring-brand-300" />
                  10 - 50 entities
                </span>
                <span className="text-[9px] font-mono text-zinc-400">Medium</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-900 ring-1 ring-brand-400" />
                  &gt; 50 entities
                </span>
                <span className="text-[9px] font-mono text-zinc-400">Dense</span>
              </div>
            </div>
            <p className="text-[9px] text-brand-700 italic border-t border-zinc-100 pt-1">
              Click any cluster to expand zoom
            </p>
          </>
        )}

        {viewMode === "heatmap" && (
          <>
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-brand-900 border-b border-brand-100 pb-1">
              <FaFire className="w-3 h-3 text-brand-600" />
              <span>Density Heatmap</span>
            </div>
            <div className="space-y-1 text-[10px]">
              <div className="h-2.5 w-full rounded-full bg-linear-to-r from-brand-200 via-brand-500 to-brand-900 border border-zinc-200" />
              <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                <span>Low Density</span>
                <span>High Density</span>
              </div>
            </div>
            <p className="text-[9px] text-zinc-500 pt-0.5">
              Visualizing spatial entity concentration
            </p>
          </>
        )}
      </div>

      {/* Crosshair Picking Alert */}
      {isPickingLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-brand-700 text-white px-5 py-2.5 rounded-full shadow-lg text-sm font-medium flex items-center gap-2 border border-brand-300 animate-bounce">
          <MapPin className="w-4 h-4 text-brand-300" />
          <span>Click anywhere on the map to set coordinates</span>
        </div>
      )}

      {/* Interactive Infowindow Card on Map */}
      {selectedEntity && !isPickingLocation && (
        <div className="absolute bottom-6 left-4 right-4 sm:right-auto sm:w-92 z-20 bg-white/98 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 shadow-2xl border border-brand-200 text-left transition-all animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <TypeBadge type={selectedEntity.type} />
                <StatusBadge status={selectedEntity.status} />
              </div>
              <h4 className="font-bold text-zinc-900 truncate text-sm sm:text-base leading-tight">
                {selectedEntity.name}
              </h4>
            </div>
            <button
              onClick={() => onSelectEntity(null)}
              className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md transition-colors cursor-pointer"
              title="Close Infowindow"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-brand-800 bg-brand-50 border border-brand-200/80 px-2 py-0.5 rounded-md font-mono font-medium mt-2 w-fit">
            <MapPin className="w-3 h-3 text-brand-600 shrink-0" />
            <span>
              {selectedEntity.latitude.toFixed(5)}, {selectedEntity.longitude.toFixed(5)}
            </span>
          </div>

          {selectedEntity.description && (
            <p className="text-xs text-zinc-600 line-clamp-2 mt-2 leading-relaxed">
              {selectedEntity.description}
            </p>
          )}

          {/* Dynamic Attributes Preview */}
          {attributeEntries.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-brand-100 flex flex-wrap gap-1">
              {attributeEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-brand-50 border border-brand-100 text-[10px] text-brand-700"
                >
                  <span className="font-medium font-mono">{key}:</span>
                  <span className="font-mono">{String(value)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenEdit && onOpenEdit(selectedEntity)}
              className="text-xs h-7.5 px-2.5 gap-1 border-brand-200 text-brand-700 hover:bg-brand-50 rounded-md"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onOpenDetail && onOpenDetail(selectedEntity)}
              className="text-xs h-7.5 px-3 gap-1 bg-brand-600 hover:bg-brand-700 text-white shadow-xs font-medium rounded-md"
            >
              <span>Full Details</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
