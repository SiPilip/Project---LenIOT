import React, { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { Feature, Point, FeatureCollection } from "geojson";
import { MapPin, ArrowRight, Edit2, X } from "lucide-react";
import type { Entity } from "../../types/entity";
import { TypeBadge, StatusBadge } from "../ui/badge";
import { Button } from "../ui/button";

interface MapViewProps {
  entities: Entity[];
  selectedEntityId: string | null;
  onSelectEntity: (id: string | null) => void;
  onOpenDetail?: (entity: Entity) => void;
  onOpenEdit?: (entity: Entity) => void;
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
  onOpenDetail,
  onOpenEdit,
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

  const selectedEntity = entities.find((e) => e.id === selectedEntityId) || null;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: osmRasterStyle,
      center: [104.7565, -2.9835], // Center in Indonesia / Palembang
      zoom: 7,
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
          "circle-radius": 14,
          "circle-color": [
            "match",
            ["get", "type"],
            "vehicle",
            "#0284c7",
            "iot_device",
            "#238b45",
            "facility",
            "#d97706",
            "#475569",
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
          "circle-radius": 7.5,
          "circle-color": [
            "match",
            ["get", "type"],
            "vehicle",
            "#0284c7",
            "iot_device",
            "#238b45",
            "facility",
            "#d97706",
            "#475569",
          ],
          "circle-stroke-width": 2.5,
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
          "text-offset": [0, 1.3],
          "text-anchor": "top",
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-optional": true,
        },
        paint: {
          "text-color": "#00441b",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
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

    // Handle map click for location picking or background deselect
    map.on("click", (e: maplibregl.MapMouseEvent) => {
      if (isPickingLocationRef.current && onMapClickCoordinatesRef.current) {
        const lat = Number(e.lngLat.lat.toFixed(6));
        const lng = Number(e.lngLat.lng.toFixed(6));
        onMapClickCoordinatesRef.current(lat, lng);
        return;
      }

      // If clicked empty canvas (not entity circle), deselect entity
      const bbox: [maplibregl.PointLike, maplibregl.PointLike] = [
        [e.point.x - 5, e.point.y - 5],
        [e.point.y + 5, e.point.y + 5],
      ];
      const features = map.queryRenderedFeatures(bbox, { layers: [LAYER_CIRCLES_ID] });
      if (features.length === 0 && !isPickingLocationRef.current) {
        // Leave selection or deselect
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

    // Dynamically update paint properties for selected entity size & halo
    if (map.getLayer(LAYER_CIRCLES_ID)) {
      map.setPaintProperty(LAYER_CIRCLES_ID, "circle-radius", [
        "case",
        ["==", ["get", "id"], selectedEntityId || ""],
        10.5,
        7,
      ]);
      map.setPaintProperty(LAYER_CIRCLES_ID, "circle-stroke-width", [
        "case",
        ["==", ["get", "id"], selectedEntityId || ""],
        3.5,
        2.5,
      ]);
      map.setPaintProperty(LAYER_CIRCLES_ID, "circle-stroke-color", [
        "case",
        ["==", ["get", "id"], selectedEntityId || ""],
        "#ffffff",
        "#ffffff",
      ]);
    }

    if (map.getLayer(LAYER_GLOW_ID)) {
      map.setPaintProperty(LAYER_GLOW_ID, "circle-radius", [
        "case",
        ["==", ["get", "id"], selectedEntityId || ""],
        22,
        14,
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
        duration: 1000,
      });
    }
  }, [selectedEntityId, entities]);

  // Format first 2 attributes for quick infowindow display
  const attributeEntries = selectedEntity?.attributes
    ? Object.entries(selectedEntity.attributes).slice(0, 3)
    : [];

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

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
