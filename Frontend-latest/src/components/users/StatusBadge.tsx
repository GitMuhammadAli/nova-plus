import { Badge } from "@/components/ui/badge";
import { UserStatus } from "@/types/user";

interface StatusBadgeProps {
  status: UserStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    active: {
      label: "Active",
      className: "bg-success-subtle text-success border-success/20",
    },
    inactive: {
      label: "Inactive",
      className: "bg-muted text-muted-foreground border-border",
    },
    pending: {
      label: "Pending",
      className: "bg-warning-subtle text-warning border-warning/20",
    },
  };

  const { label, className } = config[status];

  return <Badge className={className}>{label}</Badge>;
}
