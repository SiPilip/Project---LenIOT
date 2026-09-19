import React from "react";
import { MapPin, Edit3, Trash2, ChevronRight } from "lucide-react";
import type { Entity } from "../../types/entity";
import { StatusBadge, TypeBadge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

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
    <Card
      onClick={() => onSelect(entity.id)}
      className={cn(
        "cursor-pointer transition-all hover:shadow-md active:scale-[0.99] text-left",
        isSelected
          ? "border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20 dark:bg-indigo-950/30"
          : "hover:border-zinc-300 dark:hover:border-zinc-700"
      )}
    >
      <CardContent className="p-4">
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
            className={cn(
              "w-4 h-4 transition-transform text-zinc-400 shrink-0",
              isSelected && "rotate-90 text-indigo-600 dark:text-indigo-400"
            )}
          />
        </div>

        {entity.description && (
          <p className="mt-2.5 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
            {entity.description}
          </p>
        )}

        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>
              {entity.latitude.toFixed(4)}, {entity.longitude.toFixed(4)}
            </span>
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(entity)}
              className="h-8 w-8 p-0 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 min-h-[36px] min-w-[36px]"
              aria-label="Edit entity"
              title="Edit entity"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(entity)}
              className="h-8 w-8 p-0 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 min-h-[36px] min-w-[36px]"
              aria-label="Delete entity"
              title="Delete entity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
