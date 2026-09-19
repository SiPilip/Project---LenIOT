import React from "react";
import { AlertTriangle } from "lucide-react";
import type { Entity } from "../../types/entity";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

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
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Entity" maxWidth="sm">
      <div className="space-y-4 text-left">
        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg text-red-700 dark:text-red-300">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-xs leading-relaxed">
            Are you sure you want to delete{" "}
            <strong className="font-semibold text-red-900 dark:text-red-200">
              "{entity.name}"
            </strong>
            ? This action cannot be undone.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} isLoading={isLoading}>
            Confirm Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
};
