import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  FileText,
  Settings,
  DollarSign,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface Activity {
  id: string;
  type: "user" | "report" | "billing" | "system" | "success" | "alert";
  title: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

const activityIcons = {
  user: UserPlus,
  report: FileText,
  billing: DollarSign,
  system: Settings,
  success: CheckCircle,
  alert: AlertCircle,
};

const activityColors = {
  user: "text-primary bg-primary-subtle",
  report: "text-info bg-info-subtle",
  billing: "text-success bg-success-subtle",
  system: "text-muted-foreground bg-muted",
  success: "text-success bg-success-subtle",
  alert: "text-warning bg-warning-subtle",
};

const mockActivities: Activity[] = [
  {
    id: "1",
    type: "user",
    title: "New user registered",
    description: "Sarah Chen joined the workspace",
    timestamp: "2 minutes ago",
    user: { name: "Sarah Chen" },
  },
  {
    id: "2",
    type: "report",
    title: "Weekly report generated",
    description: "Analytics report for Dec 15-22",
    timestamp: "1 hour ago",
  },
  {
    id: "3",
    type: "billing",
    title: "Payment received",
    description: "Invoice #1234 paid successfully",
    timestamp: "3 hours ago",
  },
  {
    id: "4",
    type: "success",
    title: "Automation completed",
    description: "Weekly email campaign sent to 2,456 users",
    timestamp: "5 hours ago",
  },
  {
    id: "5",
    type: "alert",
    title: "API rate limit warning",
    description: "80% of daily API quota used",
    timestamp: "6 hours ago",
  },
  {
    id: "6",
    type: "system",
    title: "System maintenance",
    description: "Scheduled maintenance completed",
    timestamp: "Yesterday",
  },
];

export function ActivityFeed() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <Badge variant="secondary" className="text-xs">
          Live
        </Badge>
      </div>

      <div className="space-y-4">
        {mockActivities.map((activity, index) => {
          const Icon = activityIcons[activity.type];
          const colorClass = activityColors[activity.type];

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-start gap-3 group hover:bg-muted/50 p-2 rounded-lg transition-colors cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.timestamp}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <button className="w-full mt-4 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
        View all activity →
      </button>
    </Card>
  );
}
