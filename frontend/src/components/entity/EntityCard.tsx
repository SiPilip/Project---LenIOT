import { MapPin, Edit3, Trash2, ChevronRight, Tag } from "lucide-react";
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

export const EntityCard = ({
  entity,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: EntityCardProps) => {
  const attrCount = entity.attributes ? Object.keys(entity.attributes).length : 0;

  return (
    <Card
      onClick={() => onSelect(entity.id)}
      className={cn(
        "cursor-pointer transition-all hover:shadow-xs active:scale-[0.99] text-left border rounded-xl bg-white",
        isSelected
          ? "border-brand-500 bg-brand-50/70 ring-1 ring-brand-500 shadow-xs"
          : "border-brand-100/90 hover:border-brand-300"
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-zinc-900 text-xs sm:text-sm truncate">
              {entity.name}
            </h4>
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              <TypeBadge type={entity.type} />
              <StatusBadge status={entity.status} />
              {attrCount > 0 && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-brand-100/60 text-brand-700 border border-brand-200/80">
                  <Tag className="w-2.5 h-2.5" />
                  {attrCount}
                </span>
              )}
            </div>
          </div>
          <ChevronRight
            className={cn(
              "w-4 h-4 transition-transform text-zinc-400 shrink-0 mt-0.5",
              isSelected && "rotate-90 text-brand-700"
            )}
          />
        </div>

        {entity.description && (
          <p className="mt-2 text-xs text-zinc-600 line-clamp-2 leading-relaxed">
            {entity.description}
          </p>
        )}

        <div className="mt-2.5 pt-2 border-t border-brand-100/70 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1 font-mono text-[11px] text-zinc-600">
            <MapPin className="w-3 h-3 text-brand-600 shrink-0" />
            <span>
              {entity.latitude.toFixed(4)}, {entity.longitude.toFixed(4)}
            </span>
          </div>

          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(entity)}
              className="h-7 w-7 p-0 text-zinc-500 hover:text-brand-700 hover:bg-brand-50 rounded-md"
              aria-label="Edit entity"
              title="Edit entity"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(entity)}
              className="h-7 w-7 p-0 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-md"
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
