import type { ApiErrorResponse, ApiRawEntity, Entity, EntityInput } from "../types/entity";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export class ApiError extends Error {
  code: string;
  details?: { field: string; message: string }[];
  status: number;

  constructor(status: number, message: string, code = "API_ERROR", details?: { field: string; message: string }[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Maps backend snake_case JSON representation to frontend camelCase Entity.
 * Single source of mapping in the frontend as mandated by AGENTS.md.
 */
export function mapRawToEntity(raw: ApiRawEntity): Entity {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    status: raw.status,
    description: raw.description,
    attributes: raw.attributes || {},
    latitude: raw.latitude,
    longitude: raw.longitude,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (response.status === 204) {
    return {} as T;
  }

  let body: any = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    const errorBody = body as ApiErrorResponse | null;
    const code = errorBody?.error?.code || `HTTP_${response.status}`;
    const message = errorBody?.error?.message || response.statusText || "Request failed";
    const details = errorBody?.error?.details;
    throw new ApiError(response.status, message, code, details);
  }

  return body as T;
}

export const api = {
  async getEntities(): Promise<Entity[]> {
    const res = await request<{ data: ApiRawEntity[] }>("/entities");
    return res.data.map(mapRawToEntity);
  },

  async getEntity(id: string): Promise<Entity> {
    const res = await request<{ data: ApiRawEntity }>(`/entities/${id}`);
    return mapRawToEntity(res.data);
  },

  async createEntity(input: EntityInput): Promise<Entity> {
    const res = await request<{ data: ApiRawEntity }>("/entities", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return mapRawToEntity(res.data);
  },

  async updateEntity(id: string, input: EntityInput): Promise<Entity> {
    const res = await request<{ data: ApiRawEntity }>(`/entities/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    return mapRawToEntity(res.data);
  },

  async deleteEntity(id: string): Promise<void> {
    await request<void>(`/entities/${id}`, {
      method: "DELETE",
    });
  },
};
