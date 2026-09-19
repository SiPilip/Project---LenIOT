import React, { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { Feature, Point, FeatureCollection } from "geojson";
import type { Entity } from "../../types/entity";

interface MapViewProps {
  entities: Entity[];
  selectedEntityId: string | null;
  onSelectEntity: (id: string) => void;
  onMapClickCoordinates?: (lat: number, lng: number) => void;
  isPickingLocation?: boolean;
}

const osmRasterStyle: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
  ],
};

const SOURCE_ID = "entities-source";
const LAYER_GLOW_ID = "entities-glow-layer";
const LAYER_CIRCLES_ID = "entities-circles-layer";
const LAYER_LABELS_ID = "entities-labels-layer";

export const MapView: React.FC<MapViewProps> = ({
  entities,
  selectedEntityId,
  onSelectEntity,
  onMapClickCoordinates,
  isPickingLocation = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

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

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: osmRasterStyle,
      center: [104.75, -2.98], // Center in Indonesia / Palembang
      zoom: 6,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      "top-right"
    );

    map.on("load", () => {
      // Add GeoJSON Source
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Outer Glow Layer
      map.addLayer({
        id: LAYER_GLOW_ID,
        type: "circle",
        source: SOURCE_ID,
        paint: {
          "circle-radius": 12,
          "circle-color": [
            "match",
            ["get", "type"],
            "vehicle",
            "#3b82f6",
            "iot_device",
            "#8b5cf6",
            "facility",
            "#f59e0b",
            "#64748b",
          ],
          "circle-opacity": 0.25,
        },
      });

      // Entity Circles Layer
      map.addLayer({
        id: LAYER_CIRCLES_ID,
        type: "circle",
        source: SOURCE_ID,
        paint: {
          "circle-radius": 7,
          "circle-color": [
            "match",
            ["get", "type"],
            "vehicle",
            "#2563eb",
            "iot_device",
            "#7c3aed",
            "facility",
            "#d97706",
            "#475569",
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Labels Layer
      map.addLayer({
        id: LAYER_LABELS_ID,
        type: "symbol",
        source: SOURCE_ID,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-optional": true,
        },
        paint: {
          "text-color": "#1f2937",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
        },
      });
    });

    // Handle clicks on entities
    map.on("click", LAYER_CIRCLES_ID, (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      if (isPickingLocationRef.current) return;
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const id = feature.properties?.id;
        if (id) {
          onSelectEntityRef.current(id);
        }
      }
    });

    // Handle map click for location picking
    map.on("click", (e: maplibregl.MapMouseEvent) => {
      if (isPickingLocationRef.current && onMapClickCoordinatesRef.current) {
        const lat = Number(e.lngLat.lat.toFixed(6));
        const lng = Number(e.lngLat.lng.toFixed(6));
        onMapClickCoordinatesRef.current(lat, lng);
      }
    });

    // Cursor pointer when hovering over entities
    map.on("mouseenter", LAYER_CIRCLES_ID, () => {
      if (!isPickingLocationRef.current) {
        map.getCanvas().style.cursor = "pointer";
      }
    });

    map.on("mouseleave", LAYER_CIRCLES_ID, () => {
      if (!isPickingLocationRef.current) {
        map.getCanvas().style.cursor = "";
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update cursor mode when isPickingLocation changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.getCanvas().style.cursor = isPickingLocation ? "crosshair" : "";
  }, [isPickingLocation]);

  // Update GeoJSON source data whenever entities or selection changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    const features: Feature<Point>[] = entities.map((e) => ({
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
        isSelected: e.id === selectedEntityId,
      },
    }));

    const collection: FeatureCollection<Point> = {
      type: "FeatureCollection",
      features,
    };

    source.setData(collection);

    // Dynamically update paint properties for selected entity size
    if (map.getLayer(LAYER_CIRCLES_ID)) {
      map.setPaintProperty(LAYER_CIRCLES_ID, "circle-radius", [
        "case",
        ["==", ["get", "id"], selectedEntityId || ""],
        10,
        6.5,
      ]);
      map.setPaintProperty(LAYER_CIRCLES_ID, "circle-stroke-width", [
        "case",
        ["==", ["get", "id"], selectedEntityId || ""],
        3,
        2,
      ]);
    }

    if (map.getLayer(LAYER_GLOW_ID)) {
      map.setPaintProperty(LAYER_GLOW_ID, "circle-radius", [
        "case",
        ["==", ["get", "id"], selectedEntityId || ""],
        20,
        12,
      ]);
      map.setPaintProperty(LAYER_GLOW_ID, "circle-opacity", [
        "case",
        ["==", ["get", "id"], selectedEntityId || ""],
        0.45,
        0.2,
      ]);
    }
  }, [entities, selectedEntityId]);

  // Pan / Fly to selected entity
  useEffect(() => {
    if (!selectedEntityId || !mapRef.current) return;
    const target = entities.find((e) => e.id === selectedEntityId);
    if (target) {
      mapRef.current.flyTo({
        center: [target.longitude, target.latitude],
        zoom: Math.max(mapRef.current.getZoom(), 12),
        essential: true,
        duration: 1200,
      });
    }
  }, [selectedEntityId, entities]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
      {isPickingLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2 animate-bounce">
          <span>Click anywhere on the map to select coordinates</span>
        </div>
      )}
    </div>
  );
};
