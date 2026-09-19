import React from "react";
import type { EntityStatus, EntityType } from "../../types/entity";

interface StatusBadgeProps {
  status: EntityStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const styles: Record<EntityStatus, { bg: string; dot: string; label: string }> = {
    active: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
      dot: "bg-emerald-500",
      label: "Active",
    },
    inactive: {
      bg: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
      dot: "bg-zinc-400",
      label: "Inactive",
    },
    maintenance: {
      bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
      dot: "bg-amber-500",
      label: "Maintenance",
    },
  };

  const current = styles[status] || styles.inactive;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
};

interface TypeBadgeProps {
  type: EntityType;
  className?: string;
}

export const TypeBadge: React.FC<TypeBadgeProps> = ({ type, className = "" }) => {
  const labels: Record<EntityType, string> = {
    vehicle: "Vehicle",
    iot_device: "IoT Device",
    facility: "Facility",
    other: "Other",
  };

  const colors: Record<EntityType, string> = {
    vehicle: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    iot_device: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    facility: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    other: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[type] || colors.other} ${className}`}
    >
      {labels[type] || type}
    </span>
  );
};
