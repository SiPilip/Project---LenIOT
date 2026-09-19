import { describe, it, expect } from "vitest";
import { entityInputSchema } from "./entity";

describe("Frontend entityInputSchema validation", () => {
  it("validates a correct entity input", () => {
    const input = {
      name: "Fleet Truck 1",
      type: "vehicle",
      status: "active",
      description: "Logistics truck",
      latitude: -6.2088,
      longitude: 106.8456,
    };

    const result = entityInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Fleet Truck 1");
      expect(result.data.type).toBe("vehicle");
    }
  });

  it("trims name and rejects empty name", () => {
    const input = {
      name: "   ",
      type: "vehicle",
      status: "active",
      latitude: 0,
      longitude: 0,
    };

    const result = entityInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects name shorter than 3 characters", () => {
    const input = {
      name: "AB",
      type: "vehicle",
      status: "active",
      latitude: 0,
      longitude: 0,
    };

    const result = entityInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts valid attributes map", () => {
    const input = {
      name: "Weather Station Node",
      type: "iot_device",
      status: "active",
      attributes: {
        battery: 95,
        firmware: "v1.2",
      },
      latitude: 0,
      longitude: 0,
    };

    const result = entityInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects name longer than 100 characters", () => {
    const input = {
      name: "A".repeat(101),
      type: "iot_device",
      status: "active",
      latitude: 0,
      longitude: 0,
    };

    const result = entityInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid type enum", () => {
    const input = {
      name: "Boat",
      type: "invalid_type",
      status: "active",
      latitude: 0,
      longitude: 0,
    };

    const result = entityInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid status enum", () => {
    const input = {
      name: "Boat",
      type: "vehicle",
      status: "broken",
      latitude: 0,
      longitude: 0,
    };

    const result = entityInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects latitude outside -90..90", () => {
    const tooLow = entityInputSchema.safeParse({
      name: "Device",
      type: "iot_device",
      status: "active",
      latitude: -90.1,
      longitude: 0,
    });
    expect(tooLow.success).toBe(false);

    const tooHigh = entityInputSchema.safeParse({
      name: "Device",
      type: "iot_device",
      status: "active",
      latitude: 90.1,
      longitude: 0,
    });
    expect(tooHigh.success).toBe(false);
  });

  it("rejects longitude outside -180..180", () => {
    const tooLow = entityInputSchema.safeParse({
      name: "Device",
      type: "iot_device",
      status: "active",
      latitude: 0,
      longitude: -180.1,
    });
    expect(tooLow.success).toBe(false);

    const tooHigh = entityInputSchema.safeParse({
      name: "Device",
      type: "iot_device",
      status: "active",
      latitude: 0,
      longitude: 180.1,
    });
    expect(tooHigh.success).toBe(false);
  });

  it("rejects description longer than 500 characters", () => {
    const input = {
      name: "Device",
      type: "facility",
      status: "maintenance",
      description: "D".repeat(501),
      latitude: 0,
      longitude: 0,
    };

    const result = entityInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
