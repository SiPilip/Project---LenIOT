import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PinpointMarker, createPinpointElement } from "./PinpointMarker";
import type { Entity } from "../../types/entity";

const mockEntity: Entity = {
  id: "test-entity-1",
  name: "Rumah Sakit IoT",
  type: "iot_device",
  status: "active",
  description: "Sensors monitoring system",
  latitude: -2.9835,
  longitude: 104.7565,
  createdAt: "2026-09-19T00:00:00Z",
  updatedAt: "2026-09-19T00:00:00Z",
};

describe("PinpointMarker Component", () => {
  it("renders entity name correctly in the badge label", () => {
    render(<PinpointMarker entity={mockEntity} />);
    expect(screen.getByText("Rumah Sakit IoT")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<PinpointMarker entity={mockEntity} onClick={handleClick} />);
    fireEvent.click(screen.getByText("Rumah Sakit IoT"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("creates a DOM element via createPinpointElement", () => {
    const handleClick = vi.fn();
    const el = createPinpointElement(mockEntity, false, handleClick);
    expect(el).toBeInstanceOf(HTMLDivElement);
    expect(el.innerHTML).toContain("Rumah Sakit IoT");

    el.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
