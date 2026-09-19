import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge, StatusBadge, TypeBadge } from "./badge";

describe("Shadcn Badge Components", () => {
  it("renders base Badge correctly", () => {
    render(<Badge variant="default">Test Tag</Badge>);
    expect(screen.getByText("Test Tag")).toBeInTheDocument();
  });

  it("renders StatusBadge with correct label", () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders TypeBadge with correct label", () => {
    render(<TypeBadge type="iot_device" />);
    expect(screen.getByText("IoT Device")).toBeInTheDocument();
  });
});
