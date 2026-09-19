import React from "react";
import { MapPin, Calendar, Clock, Edit3, Trash2, Layers } from "lucide-react";
import type { Entity } from "../../types/entity";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { StatusBadge, TypeBadge } from "../ui/badge";

interface EntityDetailModalProps {
  entity: Entity | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (entity: Entity) => void;
  onDelete: (entity: Entity) => void;
}

export const EntityDetailModal: React.FC<EntityDetailModalProps> = ({
  entity,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!entity) return null;

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "medium",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md text-left">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <TypeBadge type={entity.type} />
            <StatusBadge status={entity.status} />
          </div>
          <DialogTitle className="text-xl">{entity.name}</DialogTitle>
          <DialogDescription>
            Detailed entity metadata and spatial location.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 my-2">
          {/* Description */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-100 dark:border-zinc-800">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
              Description
            </p>
            <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed">
              {entity.description || "No description provided."}
            </p>
          </div>

          {/* Coordinates Details */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
              <MapPin className="w-4 h-4 text-indigo-500" />
              <span>Geographic Coordinates</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-zinc-400 block text-[11px]">Latitude</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                  {entity.latitude}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[11px]">Longitude</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                  {entity.longitude}
                </span>
              </div>
            </div>
          </div>

          {/* Timestamps & ID */}
          <div className="space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="text-zinc-400">ID:</span>
              <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300 truncate">
                {entity.id}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Created:</span>
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                {formatDate(entity.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Updated:</span>
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                {formatDate(entity.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onClose();
              onDelete(entity);
            }}
            className="min-h-[44px] sm:min-h-[36px]"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span>Delete</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="min-h-[44px] sm:min-h-[36px]"
            >
              Close
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(entity);
              }}
              className="min-h-[44px] sm:min-h-[36px]"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" />
              <span>Edit</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
