import React, { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import { renderToStaticMarkup } from "react-dom/server";
import { FaTruck, FaWifi, FaWarehouse, FaLocationDot } from "react-icons/fa6";
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

function getCategoryIconSvg(type: string): string {
  if (type === "vehicle") {
    return renderToStaticMarkup(<FaTruck className="w-3.5 h-3.5 text-[#00441b]" />);
  }
  if (type === "iot_device") {
    return renderToStaticMarkup(<FaWifi className="w-3.5 h-3.5 text-[#00441b]" />);
  }
  if (type === "facility") {
    return renderToStaticMarkup(<FaWarehouse className="w-3.5 h-3.5 text-[#00441b]" />);
  }
  return renderToStaticMarkup(<FaLocationDot className="w-3.5 h-3.5 text-[#00441b]" />);
}

function getStatusBadgeClass(status: string): string {
  if (status === "active") return "bg-emerald-500";
  if (status === "maintenance") return "bg-amber-500";
  return "bg-slate-400";
}

function createPinpointElement(
  entity: Entity,
  isSelected: boolean,
  onClick: () => void
): HTMLDivElement {
  const container = document.createElement("div");
  container.className = "flex flex-col items-center cursor-pointer group select-none";
  container.style.transform = isSelected ? "scale(1.15)" : "scale(1)";
  container.style.transition = "transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)";
  container.style.zIndex = isSelected ? "40" : "10";

  const iconSvg = getCategoryIconSvg(entity.type);
  const statusBg = getStatusBadgeClass(entity.status);

  container.innerHTML = `
    <div class="relative flex flex-col items-center">
      ${
        isSelected
          ? `<div class="absolute -inset-2 rounded-full bg-[#41ab5d] opacity-50 animate-ping pointer-events-none"></div>`
          : ""
      }
      
      <!-- Pin Teardrop Head -->
      <div class="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#006d2c] to-[#238b45] p-0.5 shadow-md shadow-[#00441b]/35 border-2 border-white flex items-center justify-center group-hover:scale-105 transition-transform">
        <!-- Inner Core Disc -->
        <div class="w-full h-full rounded-full bg-[#f7fcf5] border border-[#c7e9c0] flex items-center justify-center shadow-inner">
          ${iconSvg}
        </div>

        <!-- Status Dot Bead on top-right -->
        <span class="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ${statusBg} border-2 border-white shadow-xs"></span>
      </div>

      <!-- Pointer Needle Tip -->
      <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-[#238b45] -mt-0.5"></div>

      <!-- Ground Contact Shadow -->
      <div class="w-3.5 h-1 bg-[#00441b]/35 rounded-full blur-[0.5px] mt-0.5"></div>
    </div>

    <!-- Name Label Badge underneath -->
    <div class="mt-1 px-2 py-0.5 rounded-md bg-white/95 text-[#00441b] text-[10px] font-semibold tracking-tight shadow-sm border border-[#c7e9c0] max-w-[130px] truncate leading-tight group-hover:border-[#238b45] group-hover:shadow-md transition-all">
      ${entity.name}
    </div>
  `;

  container.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });

  return container;
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
  const markersMapRef = useRef<Map<string, maplibregl.Marker>>(new Map());

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

    // Handle map click for location picking or background deselect
    map.on("click", (e: maplibregl.MapMouseEvent) => {
      if (isPickingLocationRef.current && onMapClickCoordinatesRef.current) {
        const lat = Number(e.lngLat.lat.toFixed(6));
        const lng = Number(e.lngLat.lng.toFixed(6));
        onMapClickCoordinatesRef.current(lat, lng);
        return;
      }

      // Background deselect if not clicking a marker
      onSelectEntityRef.current(null);
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

  // Synchronize pinpoint markers whenever entities or selectedEntityId changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentMarkers = markersMapRef.current;
    const nextEntityIds = new Set(entities.map((e) => e.id));

    // Remove markers that no longer exist
    for (const [id, marker] of currentMarkers.entries()) {
      if (!nextEntityIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    }

    // Add or update pinpoint markers
    entities.forEach((entity) => {
      const isSelected = entity.id === selectedEntityId;

      // Re-create marker element to guarantee fresh reactive state
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
  }, [entities, selectedEntityId]);

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

      {/* Brand Geospatial Legend */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-xs rounded-xl p-2.5 shadow-md border border-brand-200 text-xs hidden sm:flex flex-col gap-1.5 pointer-events-auto max-w-47.5">
        <div className="flex items-center gap-1.5 font-bold text-[11px] text-brand-900 border-b border-brand-100 pb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-600 ring-2 ring-brand-200" />
          <span>Brand Mark Points</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-zinc-700">
          <span className="flex items-center gap-1 font-medium">
            <FaTruck className="w-3 h-3 text-[#006d2c]" /> Vehicle
          </span>
          <span className="flex items-center gap-1 font-medium">
            <FaWifi className="w-3 h-3 text-[#006d2c]" /> IoT Device
          </span>
          <span className="flex items-center gap-1 font-medium">
            <FaWarehouse className="w-3 h-3 text-[#006d2c]" /> Facility
          </span>
          <span className="flex items-center gap-1 font-medium">
            <FaLocationDot className="w-3 h-3 text-[#006d2c]" /> Other
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
