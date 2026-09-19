import React from "react";
import { MapPin, Calendar, Clock, Edit3, Trash2, Layers } from "lucide-react";
import type { Entity } from "../../types/entity";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { StatusBadge, TypeBadge } from "../ui/Badge";

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
    <Modal isOpen={isOpen} onClose={onClose} title="Entity Details" maxWidth="md">
      <div className="space-y-4 text-left">
        {/* Title and Badges */}
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {entity.name}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <TypeBadge type={entity.type} />
            <StatusBadge status={entity.status} />
          </div>
        </div>

        {/* Description */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
            Description
          </p>
          <p className="text-sm text-zinc-700 dark:text-zinc-200">
            {entity.description || "No description provided."}
          </p>
        </div>

        {/* Coordinates Details */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
            <MapPin className="w-4 h-4 text-indigo-500" />
            <span>Geographic Coordinates</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-zinc-400 block">Latitude:</span>
              <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                {entity.latitude}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block">Longitude:</span>
              <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                {entity.longitude}
              </span>
            </div>
          </div>
        </div>

        {/* Timestamps & ID */}
        <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400">ID:</span>
            <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
              {entity.id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>Created:</span>
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">
              {formatDate(entity.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Last Updated:</span>
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">
              {formatDate(entity.updatedAt)}
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              onClose();
              onDelete(entity);
            }}
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(entity);
              }}
              icon={<Edit3 className="w-3.5 h-3.5" />}
            >
              Edit
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
