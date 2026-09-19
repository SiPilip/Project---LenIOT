import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, AlertCircle } from "lucide-react";
import { entityInputSchema, type EntityInput } from "../../schemas/entity";
import type { Entity } from "../../types/entity";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? "Edit Entity" : "Add New Entity"}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-left">
        {serverError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-xs text-red-600 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Name Field */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Entity Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Patrol Vehicle A-1"
            {...register("name")}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Type & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register("type")}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
            >
              <option value="vehicle">Vehicle</option>
              <option value="iot_device">IoT Device</option>
              <option value="facility">Facility</option>
              <option value="other">Other</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-xs text-red-500">{errors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register("status")}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-xs text-red-500">{errors.status.message}</p>
            )}
          </div>
        </div>

        {/* Coordinates */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Coordinates <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={onStartPickLocation}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              Pick on Map
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="number"
                step="any"
                placeholder="Latitude (-90..90)"
                {...register("latitude", { valueAsNumber: true })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
              />
              {errors.latitude && (
                <p className="mt-1 text-xs text-red-500">{errors.latitude.message}</p>
              )}
            </div>
            <div>
              <input
                type="number"
                step="any"
                placeholder="Longitude (-180..180)"
                {...register("longitude", { valueAsNumber: true })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
              />
              {errors.longitude && (
                <p className="mt-1 text-xs text-red-500">{errors.longitude.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Description (Optional, max 500 chars)
          </label>
          <textarea
            rows={3}
            placeholder="Operational notes, specifications, or identifier tag..."
            {...register("description")}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100 resize-none"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            {isEdit ? "Save Changes" : "Create Entity"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
