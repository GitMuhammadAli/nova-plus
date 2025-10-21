"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FadeIn, StaggerContainer } from "@/components/motion"
import { Clock, User, FileText, Settings, Trash2, Edit } from "lucide-react"

export default function ActivityPage() {
  const activities = [
    {
      id: 1,
      type: "user_created",
      user: "Sarah Chen",
      action: "Created new user",
      target: "john.doe@example.com",
      timestamp: "2025-01-15T14:30:00",
      icon: User,
    },
    {
      id: 2,
      type: "automation_triggered",
      user: "System",
      action: "Automation triggered",
      target: "Daily Report Generation",
      timestamp: "2025-01-15T12:00:00",
      icon: FileText,
    },
    {
      id: 3,
      type: "settings_updated",
      user: "Marcus Johnson",
      action: "Updated settings",
      target: "Notification Preferences",
      timestamp: "2025-01-15T10:15:00",
      icon: Settings,
    },
    {
      id: 4,
      type: "user_deleted",
      user: "Elena Rodriguez",
      action: "Deleted user",
      target: "jane.smith@example.com",
      timestamp: "2025-01-14T16:45:00",
      icon: Trash2,
    },
    {
      id: 5,
      type: "report_generated",
      user: "David Park",
      action: "Generated report",
      target: "Monthly Performance Report",
      timestamp: "2025-01-14T09:30:00",
      icon: FileText,
    },
    {
      id: 6,
      type: "automation_updated",
      user: "Lisa Wang",
      action: "Updated automation",
      target: "Email Notification Workflow",
      timestamp: "2025-01-13T15:20:00",
      icon: Edit,
    },
  ]

  const getActivityColor = (type: string) => {
    switch (type) {
      case "user_created":
        return "bg-mint/10 text-mint"
      case "automation_triggered":
        return "bg-nova-indigo/10 text-nova-indigo"
      case "settings_updated":
        return "bg-sapphire/10 text-sapphire"
      case "user_deleted":
        return "bg-coral/10 text-coral"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Activity Log</h1>
        <p className="mt-2 text-muted-foreground">Track all actions and changes in your workspace</p>
      </div>

      {/* Activity Timeline */}
      <StaggerContainer className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activity.icon
          return (
            <FadeIn key={activity.id} delay={index * 0.05}>
              <Card className="p-6 hover:border-nova-indigo/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`rounded-lg p-3 ${getActivityColor(activity.type)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{activity.action}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          by <span className="font-medium">{activity.user}</span>
                        </p>
                      </div>
                      <Badge variant="outline">{activity.target}</Badge>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </Card>
            </FadeIn>
          )
        })}
      </StaggerContainer>
    </div>
  )
}
