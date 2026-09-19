import React from "react";
import { MapPin, Edit3, Trash2, ChevronRight } from "lucide-react";
import type { Entity } from "../../types/entity";
import { StatusBadge, TypeBadge } from "../ui/Badge";

interface EntityCardProps {
  entity: Entity;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (entity: Entity) => void;
  onDelete: (entity: Entity) => void;
}

export const EntityCard: React.FC<EntityCardProps> = ({
  entity,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      onClick={() => onSelect(entity.id)}
      className={`group p-4 rounded-xl border transition-all cursor-pointer text-left ${
        isSelected
          ? "bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm"
          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate">
            {entity.name}
          </h4>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <TypeBadge type={entity.type} />
            <StatusBadge status={entity.status} />
          </div>
        </div>
        <ChevronRight
          className={`w-4 h-4 transition-transform text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 ${
            isSelected ? "rotate-90 text-indigo-600 dark:text-indigo-400" : ""
          }`}
        />
      </div>

      {entity.description && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
          {entity.description}
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1 font-mono text-[11px]">
          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
          <span>
            {entity.latitude.toFixed(4)}, {entity.longitude.toFixed(4)}
          </span>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(entity)}
            className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Edit entity"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(entity)}
            className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Delete entity"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
