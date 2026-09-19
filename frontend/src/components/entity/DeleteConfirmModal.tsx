import { AlertTriangle, Loader2 } from "lucide-react";
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

interface DeleteConfirmModalProps {
  entity: Entity | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export const DeleteConfirmModal = ({
  entity,
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: DeleteConfirmModalProps) => {
  if (!entity) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md w-full bg-white border border-brand-200 shadow-2xl p-4 sm:p-5 rounded-2xl gap-3">
        <DialogHeader className="pr-6 space-y-0.5">
          <div className="flex items-center gap-1.5 text-red-600">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <DialogTitle className="text-base font-bold text-zinc-900">Delete Entity</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-500">
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="p-2.5 bg-red-50/80 border border-red-200/80 rounded-lg text-red-800 text-xs leading-relaxed my-1">
          Are you sure you want to delete{" "}
          <strong className="font-semibold text-red-950">
            "{entity.name}"
          </strong>{" "}
          from the map and database?
        </div>

        <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2 border-t border-zinc-100">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="h-8.5 px-3 text-xs border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className="h-8.5 px-3.5 text-xs bg-red-600 hover:bg-red-700 text-white font-medium"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
