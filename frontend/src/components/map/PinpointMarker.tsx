import React from "react";
import { FaTruck, FaWifi, FaWarehouse, FaLocationDot } from "react-icons/fa6";
import type { Entity } from "../../types/entity";

export interface PinpointMarkerProps {
  entity: Entity;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Returns the react-icons Fa6 icon for an entity type in React JSX.
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
 * Returns the pure SVG string for an entity category icon without requiring react-dom/server.
 * This avoids bundling SSR runtime code into the client Vite bundle.
 */
export function getCategoryIconSvg(type: string, size = 14): string {
  if (type === "vehicle") {
    return `<svg stroke="currentColor" fill="#00441b" stroke-width="0" viewBox="0 0 640 512" height="${size}" width="${size}" xmlns="http://www.w3.org/2000/svg"><path d="M48 0C21.5 0 0 21.5 0 48L0 368c0 26.5 21.5 48 48 48l16 0c0 53 43 96 96 96s96-43 96-96l128 0c0 53 43 96 96 96s96-43 96-96l32 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-32 0 0-144c0-8.8-3.5-17.2-9.4-23l-81.4-81.4C463.3 83.5 454.9 80 446.1 80L384 80 384 48c0-26.5-21.5-48-48-48L48 0zM432 144l46.1 0L520 185.9l0 38.1-88 0 0-80zM160 464a48 48 0 1 1 0-96 48 48 0 1 1 0 96zm320 0a48 48 0 1 1 0-96 48 48 0 1 1 0 96z"></path></svg>`;
  }
  if (type === "iot_device") {
    return `<svg stroke="currentColor" fill="#00441b" stroke-width="0" viewBox="0 0 640 512" height="${size}" width="${size}" xmlns="http://www.w3.org/2000/svg"><path d="M54.2 201.9C128.8 134.2 227.1 96 320 96s191.2 38.2 265.8 105.9c13.1 11.9 33.2 11.1 45.1-2c11.9-13.1 11.1-33.2-2-45.1C539.1 72.7 433.2 32 320 32S100.9 72.7 11.1 154.8c-13.1 11.9-13.9 32-2 45.1s32 13.9 45.1 2zM211.2 344.2C241.8 316.4 279.6 304 320 304s78.2 12.4 108.8 40.2c13.1 11.9 33.2 11.1 45.1-2s11.1-33.2-2-45.1C427.6 256.7 375.4 240 320 240s-107.6 16.7-151.9 57.1c-13.1 11.9-13.9 32-2 45.1s32 13.9 45.1 2zm-78.5-71.1C183.4 227.3 249.7 208 320 208s136.6 19.3 187.3 65.1c13.1 11.9 33.2 11.1 45.1-2s11.1-33.2-2-45.1C488.2 169.5 407.9 144 320 144s-168.2 25.5-230.4 82c-13.1 11.9-13.9 32-2 45.1s32 13.9 45.1 2zM320 480a48 48 0 1 0 0-96 48 48 0 1 0 0 96z"></path></svg>`;
  }
  if (type === "facility") {
    return `<svg stroke="currentColor" fill="#00441b" stroke-width="0" viewBox="0 0 640 512" height="${size}" width="${size}" xmlns="http://www.w3.org/2000/svg"><path d="M504 352c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32l0 160 128 0 0-160zm64 0l0 160 40 0c17.7 0 32-14.3 32-32l0-174.4c0-17-6.7-33.3-18.7-45.3L512 211.2l0 108.8c35.3 0 64 28.7 64 64zM304 448l-64 0 0-64 64 0 0 64zm0-96l-64 0 0-64 64 0 0 64zm0-96l-64 0 0-64 64 0 0 64zm64-96l0 64-32 0 0-64 32 0zm-128 0l0 64-64 0 0-64 64 0zm-96 0l0 64-32 0 0-64 32 0zm0 96l32 0 0 64-32 0 0-64zm32 96l0 64-32 0 0-64 32 0zm-32 96l32 0 0 64-40 0c-17.7 0-32-14.3-32-32l0-174.4c0-17 6.7-33.3 18.7-45.3L128 211.2l0 108.8c-35.3 0-64 28.7-64 64l0 128 40 0 0-64zm160 64l-64 0 0-64 64 0 0 64zm160-256l0 256-32 0 0-256 32 0zM320 32c7.7 0 15 2.7 20.8 7.7L628.7 287.9c13.7 11.7 15.3 32 3.5 45.7s-32 15.3-45.7 3.5L320 95.8 53.5 337.1c-13.7 11.7-33.9 10.2-45.7-3.5s-10.2-33.9 3.5-45.7L299.2 39.7c5.8-5 13.1-7.7 20.8-7.7z"></path></svg>`;
  }
  return `<svg stroke="currentColor" fill="#00441b" stroke-width="0" viewBox="0 0 384 512" height="${size}" width="${size}" xmlns="http://www.w3.org/2000/svg"><path d="M192 0C86 0 0 86 0 192c0 77.4 46.1 144.1 112 173.3L192 512l80-146.7C337.9 336.1 384 269.4 384 192 384 86 298 0 192 0zm0 256a64 64 0 1 1 0-128 64 64 0 1 1 0 128z"></path></svg>`;
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
      <div className="relative flex flex-col items-center pin-head-wrapper">
        {isSelected && (
          <div className="pin-ping absolute -inset-2 rounded-full bg-brand-500 opacity-50 animate-ping pointer-events-none" />
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
      <div className="pin-name mt-1 px-2 py-0.5 rounded-md bg-white/95 text-brand-900 text-[10px] font-semibold tracking-tight shadow-sm border border-brand-200 max-w-32.5 truncate leading-tight group-hover:border-brand-600 group-hover:shadow-md transition-all">
        {entity.name}
      </div>
    </div>
  );
}

/**
 * Creates an HTMLDivElement containing the PinpointMarker for use with maplibregl.Marker.
 * Uses lightweight HTML string interpolation with pure SVGs, completely removing react-dom/server.
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

  const statusBg = getStatusBadgeClass(entity.status);
  const iconSvg = getCategoryIconSvg(entity.type, 14);
  const escapedName = escapeHtml(entity.name);

  container.innerHTML = `
    <div class="relative flex flex-col items-center pin-head-wrapper">
      ${
        isSelected
          ? `<div class="pin-ping absolute -inset-2 rounded-full bg-brand-500 opacity-50 animate-ping pointer-events-none"></div>`
          : ""
      }
      <div class="relative w-9 h-9 rounded-full bg-linear-to-br from-brand-700 to-brand-600 p-0.5 shadow-md shadow-brand-900/35 border-2 border-white flex items-center justify-center group-hover:scale-105 transition-transform">
        <div class="w-full h-full rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center shadow-inner">
          ${iconSvg}
        </div>
        <span class="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ${statusBg} border-2 border-white shadow-xs"></span>
      </div>
      <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-brand-600 -mt-0.5"></div>
      <div class="w-3.5 h-1 bg-brand-900/35 rounded-full blur-[0.5px] mt-0.5"></div>
    </div>
    <div class="pin-name mt-1 px-2 py-0.5 rounded-md bg-white/95 text-brand-900 text-[10px] font-semibold tracking-tight shadow-sm border border-brand-200 max-w-32.5 truncate leading-tight group-hover:border-brand-600 group-hover:shadow-md transition-all">
      ${escapedName}
    </div>
  `;

  container.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });

  return container;
}

/**
 * Updates an existing pinpoint marker DOM element in-place to avoid full recreation.
 */
export function updatePinpointElement(
  container: HTMLElement,
  entity: Entity,
  isSelected: boolean
): void {
  container.style.transform = isSelected ? "scale(1.15)" : "scale(1)";
  container.style.zIndex = isSelected ? "40" : "10";

  const headWrapper = container.querySelector(".pin-head-wrapper");
  const existingPing = container.querySelector(".pin-ping");

  if (isSelected) {
    if (!existingPing && headWrapper) {
      const ping = document.createElement("div");
      ping.className =
        "pin-ping absolute -inset-2 rounded-full bg-brand-500 opacity-50 animate-ping pointer-events-none";
      headWrapper.prepend(ping);
    }
  } else if (existingPing) {
    existingPing.remove();
  }

  const nameEl = container.querySelector(".pin-name");
  if (nameEl && nameEl.textContent !== entity.name) {
    nameEl.textContent = entity.name;
  }
}

