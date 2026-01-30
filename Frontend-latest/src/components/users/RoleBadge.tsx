import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types/user";
import { Shield, ShieldCheck, User } from "lucide-react";

interface RoleBadgeProps {
  role: UserRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = {
    admin: {
      label: "Admin",
      variant: "default" as const,
      icon: ShieldCheck,
    },
    moderator: {
      label: "Moderator",
      variant: "secondary" as const,
      icon: Shield,
    },
    user: {
      label: "User",
      variant: "outline" as const,
      icon: User,
    },
  };

  const { label, variant, icon: Icon } = config[role];

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}
