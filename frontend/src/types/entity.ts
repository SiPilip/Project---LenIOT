import type { EntityInput, EntityStatus, EntityType } from "../schemas/entity";

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  status: EntityStatus;
  description?: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

export type { EntityInput, EntityStatus, EntityType };

export interface ApiRawEntity {
  id: string;
  name: string;
  type: EntityType;
  status: EntityStatus;
  description?: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}
