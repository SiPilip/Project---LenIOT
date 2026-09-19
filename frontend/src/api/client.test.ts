import { describe, it, expect } from "vitest";
import { mapRawToEntity } from "./client";
import type { ApiRawEntity } from "../types/entity";

describe("mapRawToEntity", () => {
  it("correctly maps snake_case JSON fields to camelCase TypeScript entity", () => {
    const raw: ApiRawEntity = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Sensor 01",
      type: "iot_device",
      status: "active",
      description: "Temperature sensor",
      latitude: -6.1754,
      longitude: 106.8272,
      created_at: "2026-09-19T10:00:00Z",
      updated_at: "2026-09-19T10:30:00Z",
    };

    const entity = mapRawToEntity(raw);

    expect(entity.id).toBe(raw.id);
    expect(entity.name).toBe(raw.name);
    expect(entity.type).toBe("iot_device");
    expect(entity.status).toBe("active");
    expect(entity.description).toBe("Temperature sensor");
    expect(entity.latitude).toBe(-6.1754);
    expect(entity.longitude).toBe(106.8272);
    expect(entity.createdAt).toBe("2026-09-19T10:00:00Z");
    expect(entity.updatedAt).toBe("2026-09-19T10:30:00Z");
  });
});
