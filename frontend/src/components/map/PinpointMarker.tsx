import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FaTruck, FaWifi, FaWarehouse, FaLocationDot } from "react-icons/fa6";
import type { Entity } from "../../types/entity";

export interface PinpointMarkerProps {
  entity: Entity;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Returns the react-icons Fa6 icon for an entity type.
 */
export function getCategoryIcon(type: string, size = 14): React.ReactNode {
  if (type === "vehicle") {
    return <FaTruck size={size} color="#00441b" />;
  }
  if (type === "iot_device") {
    return <FaWifi size={size} color="#00441b" />;
  }
  if (type === "facility") {
    return <FaWarehouse size={size} color="#00441b" />;
  }
  return <FaLocationDot size={size} color="#00441b" />;
}

/**
 * Returns the static SVG string for an entity category icon.
 */
export function getCategoryIconSvg(type: string, size = 14): string {
  return renderToStaticMarkup(getCategoryIcon(type, size));
}

/**
 * Returns the Tailwind background color class for an entity status badge.
 */
export function getStatusBadgeClass(status: string): string {
  if (status === "active") return "bg-[#238b45]";
  if (status === "maintenance") return "bg-[#e65100]";
  return "bg-[#737373]";
}

/**
 * Returns the hex color string for an entity status.
 */
export function getStatusColorHex(status: string): string {
  if (status === "active") return "#238b45";
  if (status === "maintenance") return "#e65100";
  return "#737373";
}

/**
 * Reusable React component for entity pinpoint markers.
 * Renders the circular brand-green head, inner disc with category icon,
 * top-right status dot, pointer needle tip, ground shadow, and name badge pill.
 */
export function PinpointMarker({
  entity,
  isSelected = false,
  onClick,
  className = "",
}: PinpointMarkerProps) {
  const statusBg = getStatusBadgeClass(entity.status);

  return (
    <div
      className={`flex flex-col items-center cursor-pointer group select-none ${
        isSelected ? "scale-115 z-40" : "scale-100 z-10"
      } ${className}`}
      style={{
        transition: "transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
      onClick={onClick}
    >
      <div className="relative flex flex-col items-center">
        {isSelected && (
          <div className="absolute -inset-2 rounded-full bg-brand-500 opacity-50 animate-ping pointer-events-none" />
        )}

        {/* Pin Teardrop Head */}
        <div className="relative w-9 h-9 rounded-full bg-linear-to-br from-brand-700 to-brand-600 p-0.5 shadow-md shadow-brand-900/35 border-2 border-white flex items-center justify-center group-hover:scale-105 transition-transform">
          {/* Inner Core Disc */}
          <div className="w-full h-full rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center shadow-inner">
            {getCategoryIcon(entity.type, 14)}
          </div>

          {/* Status Dot Bead on top-right */}
          <span
            className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ${statusBg} border-2 border-white shadow-xs`}
          />
        </div>

        {/* Pointer Needle Tip */}
        <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-brand-600 -mt-0.5" />

        {/* Ground Contact Shadow */}
        <div className="w-3.5 h-1 bg-brand-900/35 rounded-full blur-[0.5px] mt-0.5" />
      </div>

      {/* Name Label Badge underneath */}
      <div className="mt-1 px-2 py-0.5 rounded-md bg-white/95 text-brand-900 text-[10px] font-semibold tracking-tight shadow-sm border border-brand-200 max-w-32.5 truncate leading-tight group-hover:border-brand-600 group-hover:shadow-md transition-all">
        {entity.name}
      </div>
    </div>
  );
}

/**
 * Creates an HTMLDivElement containing the PinpointMarker for use with maplibregl.Marker.
 */
export function createPinpointElement(
  entity: Entity,
  isSelected: boolean,
  onClick: () => void
): HTMLDivElement {
  const container = document.createElement("div");
  container.className = `flex flex-col items-center cursor-pointer group select-none`;
  container.style.transform = isSelected ? "scale(1.15)" : "scale(1)";
  container.style.transition = "transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)";
  container.style.zIndex = isSelected ? "40" : "10";

  container.innerHTML = renderToStaticMarkup(
    <PinpointMarker entity={entity} isSelected={isSelected} />
  );

  container.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });

  return container;
}
