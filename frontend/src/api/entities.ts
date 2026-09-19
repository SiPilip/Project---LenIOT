import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type { EntityInput } from "../schemas/entity";

export const ENTITIES_QUERY_KEY = ["entities"] as const;

export function useEntities() {
  return useQuery({
    queryKey: ENTITIES_QUERY_KEY,
    queryFn: () => api.getEntities(),
  });
}

export function useEntity(id: string | null) {
  return useQuery({
    queryKey: [...ENTITIES_QUERY_KEY, id],
    queryFn: () => (id ? api.getEntity(id) : null),
    enabled: !!id,
  });
}

export function useCreateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EntityInput) => api.createEntity(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTITIES_QUERY_KEY });
    },
  });
}

export function useUpdateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EntityInput }) =>
      api.updateEntity(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ENTITIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...ENTITIES_QUERY_KEY, data.id] });
    },
  });
}

export function useDeleteEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteEntity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTITIES_QUERY_KEY });
    },
  });
}
