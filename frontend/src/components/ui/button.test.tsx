import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button } from "./button";

describe("Shadcn Button Component", () => {
  it("renders with default variant and label", () => {
    render(<Button>Click Me</Button>);
    const btn = screen.getByRole("button", { name: "Click Me" });
    expect(btn).toBeInTheDocument();
  });

  it("renders with destructive variant", () => {
    render(<Button variant="destructive">Delete Item</Button>);
    const btn = screen.getByRole("button", { name: "Delete Item" });
    expect(btn).toBeInTheDocument();
  });
});
