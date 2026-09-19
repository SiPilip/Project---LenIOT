import { z } from "zod";

export const entityTypeEnum = z.enum(["vehicle", "iot_device", "facility", "other"]);
export const entityStatusEnum = z.enum(["active", "inactive", "maintenance"]);

export const entityInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required and must be between 1 and 100 characters")
    .max(100, "Name must not exceed 100 characters"),
  type: entityTypeEnum,
  status: entityStatusEnum,
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional()
    .or(z.literal("")),
  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
});

export type EntityInput = z.infer<typeof entityInputSchema>;
export type EntityType = z.infer<typeof entityTypeEnum>;
export type EntityStatus = z.infer<typeof entityStatusEnum>;
