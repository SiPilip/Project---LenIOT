import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, AlertCircle, Loader2 } from "lucide-react";
import { entityInputSchema, type EntityInput } from "../../schemas/entity";
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
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { ApiError } from "../../api/client";

interface EntityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EntityInput) => Promise<void>;
  initialData?: Entity | null;
  pickedCoordinates?: { lat: number; lng: number } | null;
  onStartPickLocation: () => void;
  isLoading: boolean;
}

export const EntityFormModal: React.FC<EntityFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  pickedCoordinates,
  onStartPickLocation,
  isLoading,
}) => {
  const isEdit = !!initialData;
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<EntityInput>({
    resolver: zodResolver(entityInputSchema),
    defaultValues: {
      name: "",
      type: "vehicle",
      status: "active",
      description: "",
      latitude: -2.976074,
      longitude: 104.775431,
    },
  });

  // Populate form with initial data when editing or opening
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        type: initialData.type,
        status: initialData.status,
        description: initialData.description || "",
        latitude: initialData.latitude,
        longitude: initialData.longitude,
      });
    } else {
      reset({
        name: "",
        type: "vehicle",
        status: "active",
        description: "",
        latitude: -2.976074,
        longitude: 104.775431,
      });
    }
  }, [initialData, reset, isOpen]);

  // Update coordinates if picked from map
  useEffect(() => {
    if (pickedCoordinates) {
      setValue("latitude", pickedCoordinates.lat, { shouldValidate: true });
      setValue("longitude", pickedCoordinates.lng, { shouldValidate: true });
    }
  }, [pickedCoordinates, setValue]);

  const handleFormSubmit = async (data: EntityInput) => {
    setServerError(null);
    try {
      await onSubmit(data);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.details && err.details.length > 0) {
          err.details.forEach((d) => {
            setError(d.field as keyof EntityInput, {
              type: "server",
              message: d.message,
            });
          });
        } else {
          setServerError(err.message);
        }
      } else if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError("Failed to save entity. Please check your connection.");
      }
    }
  };

  const handleClose = () => {
    setServerError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md text-left">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Entity" : "Add New Entity"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update entity details and geographic position."
              : "Register a new geo-located entity into the system."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-2">
          {serverError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-xs text-red-600 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-1.5">
            <Label htmlFor="entity-name">
              Entity Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="entity-name"
              type="text"
              placeholder="e.g. Patrol Vehicle A-1"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="entity-type">
                Type <span className="text-red-500">*</span>
              </Label>
              <select
                id="entity-type"
                {...register("type")}
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 min-h-[36px]"
              >
                <option value="vehicle">Vehicle</option>
                <option value="iot_device">IoT Device</option>
                <option value="facility">Facility</option>
                <option value="other">Other</option>
              </select>
              {errors.type && (
                <p className="text-xs text-red-500">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="entity-status">
                Status <span className="text-red-500">*</span>
              </Label>
              <select
                id="entity-status"
                {...register("status")}
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 min-h-[36px]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
              {errors.status && (
                <p className="text-xs text-red-500">{errors.status.message}</p>
              )}
            </div>
          </div>

          {/* Coordinates */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>
                Coordinates <span className="text-red-500">*</span>
              </Label>
              <button
                type="button"
                onClick={onStartPickLocation}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer min-h-[32px] px-1"
              >
                <MapPin className="w-3.5 h-3.5" />
                Pick on Map
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  type="number"
                  step="any"
                  placeholder="Latitude (-90..90)"
                  {...register("latitude", { valueAsNumber: true })}
                />
                {errors.latitude && (
                  <p className="mt-1 text-xs text-red-500">{errors.latitude.message}</p>
                )}
              </div>
              <div>
                <Input
                  type="number"
                  step="any"
                  placeholder="Longitude (-180..180)"
                  {...register("longitude", { valueAsNumber: true })}
                />
                {errors.longitude && (
                  <p className="mt-1 text-xs text-red-500">{errors.longitude.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="entity-desc">Description (Optional, max 500 chars)</Label>
            <Textarea
              id="entity-desc"
              rows={3}
              placeholder="Operational notes, specifications, or identifier tag..."
              {...register("description")}
              className="resize-none"
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="min-h-[44px] sm:min-h-[36px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isLoading}
              className="min-h-[44px] sm:min-h-[36px]"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              {isEdit ? "Save Changes" : "Create Entity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
