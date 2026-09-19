import { useState } from "react";
import { MapPin, Calendar, Clock, Edit3, Trash2, Layers, Code2, ChevronDown, ChevronUp } from "lucide-react";
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

export const EntityDetailModal = ({
  entity,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: EntityDetailModalProps) => {
  const [showRawJson, setShowRawJson] = useState(false);

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

  const attributes = entity.attributes || {};
  const attributeEntries = Object.entries(attributes);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md text-left bg-white border border-brand-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <TypeBadge type={entity.type} />
            <StatusBadge status={entity.status} />
          </div>
          <DialogTitle className="text-xl text-zinc-900 font-semibold">{entity.name}</DialogTitle>
          <DialogDescription className="text-zinc-500 text-xs">
            Detailed geospatial entity information, dynamic metadata, and timestamps.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 my-2">
          {/* Description */}
          <div className="p-3 bg-brand-50/60 rounded-lg border border-brand-100">
            <p className="text-xs font-semibold text-brand-700 mb-1">
              Description
            </p>
            <p className="text-xs text-zinc-700 leading-relaxed">
              {entity.description || "No description provided."}
            </p>
          </div>

          {/* Coordinates Details */}
          <div className="p-3 bg-brand-50/60 rounded-lg border border-brand-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 mb-2">
              <MapPin className="w-3.5 h-3.5 text-brand-600" />
              <span>Geographic Coordinates</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-zinc-500 block text-[11px]">Latitude</span>
                <span className="text-zinc-900 font-medium">
                  {entity.latitude}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">Longitude</span>
                <span className="text-zinc-900 font-medium">
                  {entity.longitude}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Attributes Section */}
          <div className="p-3 bg-brand-50/60 rounded-lg border border-brand-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                <Code2 className="w-3.5 h-3.5 text-brand-600" />
                <span>Dynamic Attributes (JSON)</span>
              </div>
              {attributeEntries.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="text-[11px] text-brand-600 hover:text-brand-700 flex items-center gap-0.5 font-medium cursor-pointer"
                >
                  <span>{showRawJson ? "Key-Value" : "Raw JSON"}</span>
                  {showRawJson ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>

            {attributeEntries.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No custom attributes defined.</p>
            ) : showRawJson ? (
              <pre className="p-2.5 bg-zinc-900 text-emerald-400 rounded-md font-mono text-[11px] overflow-x-auto max-h-40 leading-relaxed">
                {JSON.stringify(attributes, null, 2)}
              </pre>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {attributeEntries.map(([key, val]) => (
                  <div key={key} className="p-2 bg-white rounded border border-brand-100">
                    <span className="text-zinc-500 block text-[10px] font-mono capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="text-zinc-900 font-medium font-mono truncate block">
                      {typeof val === "object" ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timestamps & ID */}
          <div className="space-y-1.5 text-xs text-zinc-500 pt-2 border-t border-brand-100">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="text-zinc-500">ID:</span>
              <span className="font-mono text-[11px] text-zinc-700 truncate">
                {entity.id}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Created:</span>
              <span className="text-zinc-700 font-medium">
                {formatDate(entity.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Updated:</span>
              <span className="text-zinc-700 font-medium">
                {formatDate(entity.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between gap-2 pt-2 border-t border-brand-100">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onClose();
              onDelete(entity);
            }}
            className="min-h-11 sm:min-h-9"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span>Delete</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="min-h-11 sm:min-h-9 border-zinc-300 text-zinc-700"
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
              className="min-h-11 sm:min-h-9 bg-brand-600 hover:bg-brand-700 text-white"
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
