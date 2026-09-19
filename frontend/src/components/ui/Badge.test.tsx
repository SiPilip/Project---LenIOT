import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusBadge, TypeBadge } from "./Badge";

describe("Badge Components", () => {
  it("renders StatusBadge with correct label", () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders TypeBadge with correct label", () => {
    render(<TypeBadge type="iot_device" />);
    expect(screen.getByText("IoT Device")).toBeInTheDocument();
  });
});
