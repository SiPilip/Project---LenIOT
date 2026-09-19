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
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const attributes = entity.attributes || {};
  const attributeEntries = Object.entries(attributes);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md w-full bg-white border border-brand-200 shadow-2xl p-4 sm:p-5 rounded-2xl gap-3">
        {/* Compact Header: Badges + Title */}
        <DialogHeader className="pr-6 space-y-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <TypeBadge type={entity.type} />
            <StatusBadge status={entity.status} />
          </div>
          <DialogTitle className="text-lg font-bold text-zinc-900 tracking-tight">
            {entity.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Geospatial entity details for {entity.name}
          </DialogDescription>

          {/* Coordinates Bar */}
          <div className="flex items-center gap-1.5 text-xs text-brand-800 bg-brand-50 border border-brand-200/90 px-2.5 py-1 rounded-md font-mono font-medium mt-2 w-fit">
            <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>
              {entity.latitude.toFixed(6)}, {entity.longitude.toFixed(6)}
            </span>
          </div>
        </DialogHeader>

        {/* Description (if provided) */}
        {entity.description ? (
          <div className="text-xs text-zinc-700 bg-zinc-50 border border-zinc-200/80 rounded-lg p-2.5 leading-relaxed">
            {entity.description}
          </div>
        ) : (
          <p className="text-xs text-zinc-400 italic">No description provided.</p>
        )}

        {/* Dynamic Attributes Section */}
        <div className="bg-brand-50/40 border border-brand-100 rounded-lg p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-900">
              <Code2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span>Attributes</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-brand-100 text-brand-700 font-medium">
                {attributeEntries.length}
              </span>
            </div>

            {attributeEntries.length > 0 && (
              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-[11px] font-medium text-brand-700 hover:text-brand-900 flex items-center gap-0.5 cursor-pointer"
              >
                <span>{showRawJson ? "Show Grid" : "Show JSON"}</span>
                {showRawJson ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {attributeEntries.length === 0 ? (
            <p className="text-xs text-zinc-400 italic mt-1.5">No custom attributes defined.</p>
          ) : showRawJson ? (
            <pre className="mt-2 p-2.5 bg-zinc-900 text-emerald-400 rounded-md font-mono text-[11px] overflow-x-auto max-h-36 leading-relaxed">
              {JSON.stringify(attributes, null, 2)}
            </pre>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 mt-2 max-h-36 overflow-y-auto pr-0.5">
              {attributeEntries.map(([key, val]) => (
                <div
                  key={key}
                  className="p-1.5 px-2 bg-white rounded border border-brand-100 text-xs shadow-2xs"
                >
                  <span className="text-zinc-500 block text-[10px] font-mono font-medium truncate capitalize">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="text-zinc-800 font-semibold font-mono text-[11px] truncate block">
                    {typeof val === "object" ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compact Metadata Strip (ID, Created, Updated) */}
        <div className="pt-2 border-t border-zinc-100 flex flex-col gap-1 text-[11px] text-zinc-500">
          <div className="flex items-center justify-between gap-2">
            <span className="text-zinc-400 flex items-center gap-1 font-mono">
              <Layers className="w-3 h-3 shrink-0" />
              <span>ID:</span>
            </span>
            <span className="font-mono text-zinc-700 font-medium truncate select-all">
              {entity.id}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-zinc-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
              <span>Created: {formatDate(entity.createdAt)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
              <span>Updated: {formatDate(entity.updatedAt)}</span>
            </span>
          </div>
        </div>

        {/* Compact Footer Actions */}
        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between gap-2 pt-2 border-t border-zinc-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onClose();
              onDelete(entity);
            }}
            className="h-8.5 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span>Delete</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8.5 px-3 text-xs border-zinc-200 text-zinc-700 hover:bg-zinc-50"
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
              className="h-8.5 px-3.5 text-xs bg-brand-600 hover:bg-brand-700 text-white shadow-xs font-medium"
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
