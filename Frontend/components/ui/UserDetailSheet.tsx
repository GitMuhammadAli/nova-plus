"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Mail,
  Calendar,
  Clock,
  Edit,
  Trash2,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { motion } from "framer-motion";

import { User } from "@/types/user";

interface UserDetailSheetProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
}

export function UserDetailSheet({
  user,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: UserDetailSheetProps) {
  if (!user) return null;

  const InfoRow = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: any;
    label: string;
    value: string;
  }) => (
    <div className="flex items-start gap-3 py-3">
      <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );

  const getInitials = (name?: string) => {
    if (!name) return "NA";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  const managerName =
    typeof user.managerId === "object"
      ? user.managerId?.name || user.managerId?.email
      : undefined;

  const isActive = user.isActive !== false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>User Details</SheetTitle>
          <SheetDescription>View and manage user information</SheetDescription>
        </SheetHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6 space-y-6"
        >
          {/* User Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-xl font-semibold">
              {getInitials(user.name)}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {user.name || user.email}
              </h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2">
            <RoleBadge role={user.role} />
            <StatusBadge isActive={isActive} />
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-1">
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow
              icon={Calendar}
              label="Joined"
              value={formatDate(user.createdAt)}
            />
            <InfoRow
              icon={Clock}
              label="Last Updated"
              value={getRelativeTime(user.updatedAt)}
            />
            <InfoRow icon={Shield} label="Role" value={user.role} />
            {managerName && (
              <InfoRow icon={UserIcon} label="Manager" value={managerName} />
            )}
          </div>

          <Separator />

          {/* Activity Stats */}
          <div>
            <h4 className="font-medium mb-3">Account Information</h4>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">Account ID</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {user._id}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">Department</p>
                <p className="text-xs text-muted-foreground">
                  {user.department || "Not set"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">Location</p>
                <p className="text-xs text-muted-foreground">
                  {user.location || "Not set"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onEdit && onEdit(user)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit User
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Shield className="w-4 h-4 mr-2" />
              Manage Permissions
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                if (
                  confirm(
                    `Are you sure you want to delete ${
                      user.name || user.email
                    }?`
                  )
                ) {
                  onDelete && onDelete(user._id);
                  onOpenChange(false);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete User
            </Button>
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
