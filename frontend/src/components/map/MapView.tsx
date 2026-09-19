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
const LAYER_SELECTION_GLOW_ID = "entities-selection-glow-layer";
const LAYER_GROUND_SHADOW_ID = "entities-ground-shadow-layer";
const LAYER_MARKERS_ID = "entities-markers-layer";
const LAYER_LABELS_ID = "entities-labels-layer";

const ENTITY_TYPES = ["vehicle", "iot_device", "facility", "other"] as const;
const ENTITY_STATUSES = ["active", "inactive", "maintenance"] as const;

/**
 * Dynamically renders high-craft custom pin markers in the 9-shade brand green palette.
 * Each mark point features:
 * - Brand green teardrop body (#006d2c -> #238b45) with crisp white contrast stroke
 * - Crisp inner disc in brand-50 (#f7fcf5)
 * - Vector equipment glyph (Vehicle, IoT sensor antenna, Facility warehouse, or Target) in #00441b
 * - Status indicator bead (Active = brand-500, Maint = amber, Inactive = slate)
 * - Needle tip anchored exactly at coordinate [lat, lng]
 */
function registerCustomMarkers(map: maplibregl.Map) {
  if (typeof document === "undefined") return;
  const width = 48;
  const height = 60;

  for (const type of ENTITY_TYPES) {
    for (const status of ENTITY_STATUSES) {
      const markerId = `custom-marker-${type}-${status}`;
      if (map.hasImage(markerId)) continue;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      ctx.clearRect(0, 0, width, height);

      // 1. Drop shadow behind the pin
      ctx.save();
      ctx.shadowColor = "rgba(0, 68, 27, 0.35)";
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 3;

      // Pin Teardrop Shape
      // Center of bulb: (24, 20), radius: 16
      // Tip at: (24, 58)
      ctx.beginPath();
      ctx.moveTo(24, 58);
      ctx.bezierCurveTo(9, 38, 7, 26, 7, 20);
      ctx.arc(24, 20, 16, Math.PI, 0, false);
      ctx.bezierCurveTo(41, 26, 39, 38, 24, 58);
      ctx.closePath();

      // Brand gradient fill (#006d2c -> #238b45)
      const grad = ctx.createLinearGradient(12, 4, 36, 58);
      grad.addColorStop(0, "#006d2c"); // brand-700
      grad.addColorStop(1, "#238b45"); // brand-600
      ctx.fillStyle = grad;
      ctx.fill();

      // Crisp white outer stroke for map contrast
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      ctx.restore();

      // 2. Inner disc (brand-50 background)
      ctx.beginPath();
      ctx.arc(24, 20, 10.5, 0, Math.PI * 2);
      ctx.fillStyle = "#f7fcf5"; // brand-50
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "#c7e9c0"; // brand-200
      ctx.stroke();

      // 3. Category glyph / icon inside disc
      ctx.strokeStyle = "#00441b"; // brand-900
      ctx.fillStyle = "#00441b";
      ctx.lineWidth = 1.4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (type === "vehicle") {
        // Vehicle / Truck glyph
        ctx.beginPath();
        ctx.rect(17.5, 19, 13, 4.5);
        ctx.fillStyle = "#006d2c";
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(20, 19);
        ctx.lineTo(22, 16);
        ctx.lineTo(27, 16);
        ctx.lineTo(29, 19);
        ctx.closePath();
        ctx.fillStyle = "#00441b";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(20, 23.5, 1.6, 0, Math.PI * 2);
        ctx.arc(28, 23.5, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = "#00441b";
        ctx.fill();
      } else if (type === "iot_device") {
        // IoT sensor / Antenna with radiating waves
        ctx.beginPath();
        ctx.moveTo(24, 25);
        ctx.lineTo(24, 18);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(24, 17.5, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = "#006d2c";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(24, 17.5, 4.5, -Math.PI * 0.75, -Math.PI * 0.25);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(24, 17.5, 7.5, -Math.PI * 0.75, -Math.PI * 0.25);
        ctx.stroke();
      } else if (type === "facility") {
        // Facility / Building warehouse glyph
        ctx.beginPath();
        ctx.moveTo(17, 19);
        ctx.lineTo(24, 14.5);
        ctx.lineTo(31, 19);
        ctx.closePath();
        ctx.fillStyle = "#00441b";
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.rect(18, 19, 12, 6);
        ctx.fillStyle = "#006d2c";
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#f7fcf5";
        ctx.fillRect(22.5, 21.5, 3, 3.5);
      } else {
        // Other / Geo target point
        ctx.beginPath();
        ctx.arc(24, 20, 5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(24, 20, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = "#006d2c";
        ctx.fill();
      }

      // 4. Status Indicator Bead (Top right)
      const statusColor =
        status === "active"
          ? "#41ab5d" // brand-500
          : status === "maintenance"
          ? "#f59e0b" // amber-500
          : "#94a3b8"; // slate-400

      ctx.beginPath();
      ctx.arc(35, 9.5, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = statusColor;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      const imageData = ctx.getImageData(0, 0, width, height);
      map.addImage(markerId, imageData, { pixelRatio: 1 });
    }
  }
}

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
      // Register custom-designed mark points in brand green palette
      registerCustomMarkers(map);

      // Add GeoJSON Source
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // 1. Selection Glow Halo (Pulsing aura for selected entity)
      map.addLayer({
        id: LAYER_SELECTION_GLOW_ID,
        type: "circle",
        source: SOURCE_ID,
        filter: ["==", ["get", "id"], ""],
        paint: {
          "circle-radius": 24,
          "circle-color": "#41ab5d",
          "circle-opacity": 0.35,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#238b45",
          "circle-stroke-opacity": 0.7,
        },
      });

      // 2. Ground Contact Shadow Layer (underneath pin tip)
      map.addLayer({
        id: LAYER_GROUND_SHADOW_ID,
        type: "circle",
        source: SOURCE_ID,
        paint: {
          "circle-radius": 5,
          "circle-color": "#00441b",
          "circle-opacity": 0.28,
        },
      });

      // 3. Custom Designed Brand Green Mark Points (GPU Symbol Layer)
      map.addLayer({
        id: LAYER_MARKERS_ID,
        type: "symbol",
        source: SOURCE_ID,
        layout: {
          "icon-image": [
            "concat",
            "custom-marker-",
            ["get", "type"],
            "-",
            ["get", "status"],
          ],
          "icon-size": 0.78,
          "icon-anchor": "bottom",
          "icon-offset": [0, 0],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      });

      // 4. Entity Names Labels Layer
      map.addLayer({
        id: LAYER_LABELS_ID,
        type: "symbol",
        source: SOURCE_ID,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-offset": [0, 0.5],
          "text-anchor": "top",
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-optional": true,
        },
        paint: {
          "text-color": "#00441b",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2.5,
        },
      });
    });

    // Handle clicks on entities
    map.on("click", LAYER_MARKERS_ID, (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
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

      // If clicked empty canvas (not entity marker), deselect entity
      const bbox: [maplibregl.PointLike, maplibregl.PointLike] = [
        [e.point.x - 5, e.point.y - 5],
        [e.point.x + 5, e.point.y + 5],
      ];
      const features = map.queryRenderedFeatures(bbox, { layers: [LAYER_MARKERS_ID] });
      if (features.length === 0 && !isPickingLocationRef.current) {
        onSelectEntityRef.current(null);
      }
    });

    // Cursor pointer when hovering over entities
    map.on("mouseenter", LAYER_MARKERS_ID, () => {
      if (!isPickingLocationRef.current) {
        map.getCanvas().style.cursor = "pointer";
      }
    });

    map.on("mouseleave", LAYER_MARKERS_ID, () => {
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

    // Dynamically update selection halo & marker size
    if (map.getLayer(LAYER_SELECTION_GLOW_ID)) {
      map.setFilter(LAYER_SELECTION_GLOW_ID, [
        "==",
        ["get", "id"],
        selectedEntityId || "",
      ]);
    }

    if (map.getLayer(LAYER_MARKERS_ID)) {
      map.setLayoutProperty(LAYER_MARKERS_ID, "icon-size", [
        "case",
        ["==", ["get", "id"], selectedEntityId || ""],
        0.95,
        0.78,
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

      {/* Brand Geospatial Legend */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-xs rounded-xl p-2.5 shadow-md border border-brand-200 text-xs hidden sm:flex flex-col gap-1.5 pointer-events-auto max-w-47.5">
        <div className="flex items-center gap-1.5 font-bold text-[11px] text-brand-900 border-b border-brand-100 pb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-600 ring-2 ring-brand-200" />
          <span>Brand Mark Points</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-zinc-700">
          <span className="flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-700" /> Vehicle
          </span>
          <span className="flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-700" /> IoT Device
          </span>
          <span className="flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-700" /> Facility
          </span>
          <span className="flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-700" /> Other
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
