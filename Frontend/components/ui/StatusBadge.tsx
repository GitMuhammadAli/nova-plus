"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  isActive?: boolean;
  status?: "active" | "inactive" | "pending" | "suspended";
  className?: string;
}

const statusConfig = {
  active: {
    label: "Active",
    variant: "default" as const,
    icon: CheckCircle2,
    colorClass: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  inactive: {
    label: "Inactive",
    variant: "secondary" as const,
    icon: XCircle,
    colorClass: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  },
  pending: {
    label: "Pending",
    variant: "outline" as const,
    icon: Clock,
    colorClass: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  },
  suspended: {
    label: "Suspended",
    variant: "destructive" as const,
    icon: XCircle,
    colorClass: "bg-red-500/10 text-red-600 border-red-500/20",
  },
};

export function StatusBadge({
  isActive,
  status,
  className,
}: StatusBadgeProps) {
  // Determine status based on props
  let finalStatus: "active" | "inactive" | "pending" | "suspended";
  
  if (status) {
    finalStatus = status;
  } else if (isActive === false) {
    finalStatus = "inactive";
  } else {
    finalStatus = "active";
  }

  const config = statusConfig[finalStatus];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "inline-flex items-center gap-1.5 font-medium",
        config.colorClass,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

