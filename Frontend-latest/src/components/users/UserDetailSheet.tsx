import { User } from "@/types/user";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RoleBadge } from "./RoleBadge";
import { StatusBadge } from "./StatusBadge";
import {
  Mail,
  MapPin,
  Calendar,
  Clock,
  Activity,
  Edit,
  Trash2,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";

interface UserDetailSheetProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
}

export function UserDetailSheet({ user, open, onOpenChange, onEdit, onDelete }: UserDetailSheetProps) {
  if (!user) return null;

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div className="flex items-start gap-3 py-3">
      <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>User Details</SheetTitle>
          <SheetDescription>
            View and manage user information
          </SheetDescription>
        </SheetHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6 space-y-6"
        >
          {/* User Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center text-white text-xl font-semibold">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.department}</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2">
            <RoleBadge role={user.role} />
            <StatusBadge status={user.status} />
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-1">
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={MapPin} label="Location" value={user.location} />
            <InfoRow icon={Calendar} label="Joined" value={new Date(user.joinedAt).toLocaleDateString()} />
            <InfoRow icon={Clock} label="Last Active" value={user.lastActive} />
            <InfoRow icon={Activity} label="Sessions" value={`${user.sessions} sessions`} />
          </div>

          <Separator />

          {/* Activity Stats */}
          <div>
            <h4 className="font-medium mb-3">Recent Activity</h4>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">Last login</p>
                <p className="text-xs text-muted-foreground">{user.lastActive}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">Total sessions</p>
                <p className="text-xs text-muted-foreground">{user.sessions} sessions</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            {onEdit && (
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  onEdit(user);
                  onOpenChange(false);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit User
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="outline" 
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => {
                  onDelete(user);
                  onOpenChange(false);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete User
              </Button>
            )}
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
