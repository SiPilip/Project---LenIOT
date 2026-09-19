import React, { useState, useMemo } from "react";
import { Search, Plus, SlidersHorizontal, MapPinOff, Loader2 } from "lucide-react";
import type { Entity, EntityStatus, EntityType } from "../../types/entity";
import { EntityCard } from "./EntityCard";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface EntityListProps {
  entities: Entity[];
  selectedEntityId: string | null;
  onSelectEntity: (id: string) => void;
  onAddEntity: () => void;
  onEditEntity: (entity: Entity) => void;
  onDeleteEntity: (entity: Entity) => void;
  isLoading: boolean;
}

export const EntityList: React.FC<EntityListProps> = ({
  entities,
  selectedEntityId,
  onSelectEntity,
  onAddEntity,
  onEditEntity,
  onDeleteEntity,
  isLoading,
}) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<EntityType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<EntityStatus | "all">("all");

  const filteredEntities = useMemo(() => {
    return entities.filter((e) => {
      const matchesSearch =
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(search.toLowerCase()));

      const matchesType = typeFilter === "all" || e.type === typeFilter;
      const matchesStatus = statusFilter === "all" || e.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [entities, search, typeFilter, statusFilter]);

  return (
    <aside className="w-full md:w-96 h-full flex flex-col bg-zinc-50/80 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 z-10 shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Geo Entity Manager
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {entities.length} {entities.length === 1 ? "entity" : "entities"} tracked
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={onAddEntity}
            className="gap-1.5 min-h-[40px] md:min-h-[36px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entity</span>
          </Button>
        </div>

        {/* Search bar */}
        <div className="mt-3 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search entities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Filters */}
        <div className="mt-2.5 flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 text-zinc-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as EntityType | "all")}
            aria-label="Filter by type"
            className="flex-1 py-1.5 px-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[36px]"
          >
            <option value="all">All Types</option>
            <option value="vehicle">Vehicle</option>
            <option value="iot_device">IoT Device</option>
            <option value="facility">Facility</option>
            <option value="other">Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EntityStatus | "all")}
            aria-label="Filter by status"
            className="flex-1 py-1.5 px-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[36px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Entity list / scroll area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-400 gap-2">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            <p className="text-xs">Loading entities...</p>
          </div>
        ) : filteredEntities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-center px-4">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 mb-3">
              <MapPinOff className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              No entities found
            </h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs">
              {search || typeFilter !== "all" || statusFilter !== "all"
                ? "Try clearing your filters or search query."
                : "Get started by adding your first geo-located entity."}
            </p>
            {entities.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAddEntity}
                className="mt-4 gap-1.5 min-h-[44px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Entity</span>
              </Button>
            )}
          </div>
        ) : (
          filteredEntities.map((entity) => (
            <EntityCard
              key={entity.id}
              entity={entity}
              isSelected={entity.id === selectedEntityId}
              onSelect={onSelectEntity}
              onEdit={onEditEntity}
              onDelete={onDeleteEntity}
            />
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-500 flex items-center justify-between">
        <span>MapLibre GL + OpenStreetMap</span>
        <span className="font-mono text-[11px]">v1.0.0</span>
      </div>
    </aside>
  );
};
