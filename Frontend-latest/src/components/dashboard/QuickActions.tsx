import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  FileText,
  Zap,
  Settings,
  BarChart3,
  Mail,
} from "lucide-react";

const actions = [
  {
    id: "invite",
    label: "Invite User",
    icon: UserPlus,
    variant: "default" as const,
  },
  {
    id: "report",
    label: "Generate Report",
    icon: FileText,
    variant: "outline" as const,
  },
  {
    id: "automation",
    label: "New Automation",
    icon: Zap,
    variant: "outline" as const,
  },
  {
    id: "analytics",
    label: "View Analytics",
    icon: BarChart3,
    variant: "outline" as const,
  },
  {
    id: "email",
    label: "Send Campaign",
    icon: Mail,
    variant: "outline" as const,
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    variant: "ghost" as const,
  },
];

export function QuickActions() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Button
                variant={action.variant}
                className="w-full h-auto flex flex-col items-center justify-center py-4 gap-2 hover:scale-105 transition-transform"
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{action.label}</span>
              </Button>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
