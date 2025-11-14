"use client";

import { Badge } from "@/components/ui/badge";
import { Shield, UserCog, Edit3, User, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

type UserRole = "ADMIN" | "MANAGER" | "EDITOR" | "USER" | "VIEWER" | "COMPANY_ADMIN" | "SUPER_ADMIN" | "SUPERADMIN";

interface RoleBadgeProps {
  role: UserRole | string;
  className?: string;
}

const roleConfig: Record<
  UserRole,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "accent"; icon: any; colorClass: string }
> = {
  ADMIN: {
    label: "Admin",
    variant: "destructive",
    icon: Shield,
    colorClass: "bg-red-500/10 text-red-600 border-red-500/20",
  },
  MANAGER: {
    label: "Manager",
    variant: "accent",
    icon: UserCog,
    colorClass: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
  EDITOR: {
    label: "Editor",
    variant: "default",
    icon: Edit3,
    colorClass: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  USER: {
    label: "User",
    variant: "secondary",
    icon: User,
    colorClass: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  VIEWER: {
    label: "Viewer",
    variant: "outline",
    icon: Eye,
    colorClass: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  },
  COMPANY_ADMIN: {
    label: "Company Admin",
    variant: "destructive",
    icon: Shield,
    colorClass: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  },
  SUPER_ADMIN: {
    label: "Super Admin",
    variant: "destructive",
    icon: Shield,
    colorClass: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  },
  SUPERADMIN: {
    label: "Super Admin",
    variant: "destructive",
    icon: Shield,
    colorClass: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  // Normalize role to uppercase for lookup
  const normalizedRole = (typeof role === 'string' ? role.toUpperCase() : role) as UserRole;
  const config = roleConfig[normalizedRole] || roleConfig.USER;
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

