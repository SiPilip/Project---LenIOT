import React from "react";
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

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  entity,
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  if (!entity) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md text-left">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <DialogTitle>Delete Entity</DialogTitle>
          </div>
          <DialogDescription>
            This action is permanent and cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg text-red-800 dark:text-red-300 text-xs leading-relaxed my-2">
          Are you sure you want to permanently delete{" "}
          <strong className="font-semibold text-red-950 dark:text-red-100">
            "{entity.name}"
          </strong>{" "}
          from the map and database?
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="min-h-[44px] sm:min-h-[36px]"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="min-h-[44px] sm:min-h-[36px]"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
            Confirm Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
