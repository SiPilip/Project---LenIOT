import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, AlertCircle, Loader2, Code2 } from "lucide-react";
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

export const EntityFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  pickedCoordinates,
  onStartPickLocation,
  isLoading,
}: EntityFormModalProps) => {
  const isEdit = !!initialData;
  const [serverError, setServerError] = useState<string | null>(null);
  const [attributesJson, setAttributesJson] = useState<string>("{}");
  const [jsonError, setJsonError] = useState<string | null>(null);

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
      setAttributesJson(
        initialData.attributes && Object.keys(initialData.attributes).length > 0
          ? JSON.stringify(initialData.attributes, null, 2)
          : "{}"
      );
    } else {
      reset({
        name: "",
        type: "vehicle",
        status: "active",
        description: "",
        latitude: -2.976074,
        longitude: 104.775431,
      });
      setAttributesJson("{}");
    }
    setServerError(null);
    setJsonError(null);
  }, [initialData, reset, isOpen]);

  // Update coordinates if picked from map
  useEffect(() => {
    if (pickedCoordinates) {
      setValue("latitude", pickedCoordinates.lat, { shouldValidate: true });
      setValue("longitude", pickedCoordinates.lng, { shouldValidate: true });
    }
  }, [pickedCoordinates, setValue]);

  // Attribute Presets
  const applyPreset = (presetType: "vehicle" | "iot_device" | "facility" | "clear") => {
    setJsonError(null);
    if (presetType === "vehicle") {
      setAttributesJson(
        JSON.stringify(
          {
            license_plate: "BG 8421 LN",
            fuel_level_pct: 82,
            speed_kmh: 55,
            driver_name: "Rahmat Hidayat",
          },
          null,
          2
        )
      );
    } else if (presetType === "iot_device") {
      setAttributesJson(
        JSON.stringify(
          {
            battery_pct: 95,
            water_temp_c: 28.4,
            dissolved_oxygen: 6.2,
            firmware_version: "v3.1.2",
          },
          null,
          2
        )
      );
    } else if (presetType === "facility") {
      setAttributesJson(
        JSON.stringify(
          {
            capacity_sqm: 4500,
            facility_manager: "Ir. Hendra Wijaya",
            dock_doors: 12,
            operating_hours: "24/7",
          },
          null,
          2
        )
      );
    } else {
      setAttributesJson("{}");
    }
  };

  const handleFormSubmit = async (data: EntityInput) => {
    setServerError(null);
    setJsonError(null);

    // Parse attributes JSON
    let parsedAttrs: Record<string, unknown> = {};
    if (attributesJson.trim()) {
      try {
        parsedAttrs = JSON.parse(attributesJson);
        if (typeof parsedAttrs !== "object" || Array.isArray(parsedAttrs) || parsedAttrs === null) {
          setJsonError("Attributes must be a valid JSON object (key-value pairs).");
          return;
        }
      } catch (err: unknown) {
        setJsonError(err instanceof Error ? `JSON syntax error: ${err.message}` : "Invalid JSON");
        return;
      }
    }

    data.attributes = parsedAttrs;

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
    setJsonError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-115 w-full bg-white border border-brand-200/90 shadow-xl p-4 sm:p-5 rounded-2xl gap-2.5 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pr-6 space-y-0.5 pb-2 border-b border-zinc-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-zinc-900 tracking-tight">
              {isEdit ? "Edit Entity" : "Add New Entity"}
            </DialogTitle>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 uppercase tracking-wider">
              {isEdit ? "Edit" : "New"}
            </span>
          </div>
          <DialogDescription className="text-[11px] text-zinc-500">
            {isEdit
              ? "Update coordinates, operational status, and attributes."
              : "Specify location, classification, and metadata properties."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-2.5 mt-1">
          {serverError && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-1">
            <Label htmlFor="entity-name" className="text-zinc-700 text-[11px] font-medium">
              Entity Name (min 3 chars) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="entity-name"
              type="text"
              placeholder="e.g. Logistics Truck Alpha-01"
              {...register("name")}
              className="h-8 text-xs"
            />
            {errors.name && (
              <p className="text-[10px] text-red-600 font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="entity-type" className="text-zinc-700 text-[11px] font-medium">
                Type / Category <span className="text-red-500">*</span>
              </Label>
              <select
                id="entity-type"
                {...register("type")}
                className="flex h-8 w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-600 focus-visible:border-brand-600 cursor-pointer"
              >
                <option value="vehicle">Vehicle</option>
                <option value="iot_device">IoT Device</option>
                <option value="facility">Facility</option>
                <option value="other">Other</option>
              </select>
              {errors.type && (
                <p className="text-[10px] text-red-600 font-medium">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="entity-status" className="text-zinc-700 text-[11px] font-medium">
                Status <span className="text-red-500">*</span>
              </Label>
              <select
                id="entity-status"
                {...register("status")}
                className="flex h-8 w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-600 focus-visible:border-brand-600 cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
              {errors.status && (
                <p className="text-[10px] text-red-600 font-medium">{errors.status.message}</p>
              )}
            </div>
          </div>

          {/* Coordinates */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-700 text-[11px] font-medium">
                Geographic Coordinates <span className="text-red-500">*</span>
              </Label>
              <button
                type="button"
                onClick={onStartPickLocation}
                className="text-[10px] font-semibold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
              >
                <MapPin className="w-3 h-3 text-brand-600" />
                Pick on Map
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  type="number"
                  step="any"
                  placeholder="Latitude (-90..90)"
                  {...register("latitude", { valueAsNumber: true })}
                  className="h-8 text-xs font-mono"
                />
                {errors.latitude && (
                  <p className="mt-0.5 text-[10px] text-red-600 font-medium">{errors.latitude.message}</p>
                )}
              </div>
              <div>
                <Input
                  type="number"
                  step="any"
                  placeholder="Longitude (-180..180)"
                  {...register("longitude", { valueAsNumber: true })}
                  className="h-8 text-xs font-mono"
                />
                {errors.longitude && (
                  <p className="mt-0.5 text-[10px] text-red-600 font-medium">{errors.longitude.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="entity-desc" className="text-zinc-700 text-[11px] font-medium">
              Description <span className="text-zinc-400 font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="entity-desc"
              rows={2}
              placeholder="Operational notes, specifications, or identifier tags..."
              {...register("description")}
              className="resize-none text-xs p-1.5 min-h-11 h-11"
            />
            {errors.description && (
              <p className="text-[10px] text-red-600 font-medium">{errors.description.message}</p>
            )}
          </div>

          {/* Dynamic Attributes JSON Editor */}
          <div className="space-y-1.5 p-2 bg-brand-50/30 border border-brand-100/90 rounded-lg">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-900">
                <Code2 className="w-3.5 h-3.5 text-brand-600" />
                <span>Attributes (JSON)</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyPreset("vehicle")}
                  className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 cursor-pointer transition-colors"
                >
                  Vehicle
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("iot_device")}
                  className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 cursor-pointer transition-colors"
                >
                  IoT
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("facility")}
                  className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 cursor-pointer transition-colors"
                >
                  Facility
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("clear")}
                  className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50 cursor-pointer transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            <textarea
              value={attributesJson}
              onChange={(e) => {
                setAttributesJson(e.target.value);
                setJsonError(null);
              }}
              rows={2}
              className="w-full font-mono text-[11px] p-1.5 rounded border border-zinc-200 bg-white text-zinc-900 shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-600 focus-visible:border-brand-600 h-16 resize-none leading-relaxed"
              placeholder='{\n  "battery_level": 94\n}'
            />
            {jsonError ? (
              <p className="text-[10px] text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{jsonError}</span>
              </p>
            ) : (
              <p className="text-[10px] text-zinc-400 font-mono">Valid JSON key-value format</p>
            )}
          </div>

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="h-8 px-3 text-xs border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={isLoading}
              className="h-8 px-3.5 text-xs bg-brand-600 hover:bg-brand-700 text-white shadow-xs font-medium"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              {isEdit ? "Save Changes" : "Create Entity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
