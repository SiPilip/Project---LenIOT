import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { FaTruck, FaWifi, FaWarehouse, FaLocationDot } from "react-icons/fa6";
import { cn } from "../../lib/utils";
import type { EntityStatus, EntityType } from "../../types/entity";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-brand-600",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-600 text-white shadow-2xs hover:bg-brand-700",
        secondary:
          "border-brand-200 bg-brand-100 text-brand-900 hover:bg-brand-200",
        destructive:
          "border-transparent bg-red-600 text-white shadow-2xs hover:bg-red-700",
        outline: "text-zinc-800 border-zinc-200 bg-white",
        // Semantic Entity Status Variants (Light Theme)
        active:
          "border-brand-200 bg-brand-50 text-brand-700",
        inactive:
          "border-zinc-200 bg-zinc-50 text-zinc-600",
        maintenance:
          "border-amber-200 bg-amber-50 text-amber-800",
        // Semantic Entity Type Variants (Light Theme)
        vehicle:
          "border-brand-200 bg-brand-50 text-brand-800",
        iot_device:
          "border-brand-300 bg-brand-100/70 text-brand-900",
        facility:
          "border-brand-200 bg-brand-50 text-brand-800",
        other:
          "border-slate-200 bg-slate-50 text-slate-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export interface StatusBadgeProps {
  status: EntityStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const labels: Record<EntityStatus, string> = {
    active: "Active",
    inactive: "Inactive",
    maintenance: "Maintenance",
  };

  const dots: Record<EntityStatus, string> = {
    active: "bg-emerald-500",
    inactive: "bg-zinc-400",
    maintenance: "bg-amber-500",
  };

  return (
    <Badge variant={status} className={cn("gap-1.5 font-medium", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[status])} />
      {labels[status]}
    </Badge>
  );
}

export interface TypeBadgeProps {
  type: EntityType;
  className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const labels: Record<EntityType, string> = {
    vehicle: "Vehicle",
    iot_device: "IoT Device",
    facility: "Facility",
    other: "Other",
  };

  const icons: Record<EntityType, React.ReactNode> = {
    vehicle: <FaTruck className="w-2.5 h-2.5 shrink-0 text-brand-700" />,
    iot_device: <FaWifi className="w-2.5 h-2.5 shrink-0 text-brand-700" />,
    facility: <FaWarehouse className="w-2.5 h-2.5 shrink-0 text-brand-700" />,
    other: <FaLocationDot className="w-2.5 h-2.5 shrink-0 text-brand-700" />,
  };

  return (
    <Badge variant={type} className={cn("gap-1 font-medium", className)}>
      {icons[type]}
      <span>{labels[type] || type}</span>
    </Badge>
  );
}

export { Badge, badgeVariants };
