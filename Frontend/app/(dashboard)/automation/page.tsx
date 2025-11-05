"use client"

import { useState } from "react"
import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AnimatedCard } from "@/components/motion/animated-card"
import { Plus, Play, Pause, Trash2, Edit2 } from "lucide-react"

const automationsData = [
  {
    id: 1,
    name: "Welcome Email Campaign",
    description: "Send welcome email to new users",
    trigger: "User Signup",
    actions: 3,
    status: "active",
    runs: 1234,
    lastRun: "2 hours ago",
  },
  {
    id: 2,
    name: "Inactive User Reminder",
    description: "Remind users who haven't logged in for 7 days",
    trigger: "Schedule (Weekly)",
    actions: 2,
    status: "active",
    runs: 156,
    lastRun: "1 day ago",
  },
  {
    id: 3,
    name: "Payment Failed Recovery",
    description: "Send retry payment notification",
    trigger: "Payment Failed",
    actions: 4,
    status: "paused",
    runs: 89,
    lastRun: "3 days ago",
  },
  {
    id: 4,
    name: "Subscription Renewal",
    description: "Auto-renew subscriptions and send confirmation",
    trigger: "Schedule (Monthly)",
    actions: 5,
    status: "active",
    runs: 567,
    lastRun: "5 hours ago",
  },
]

export default function AutomationPage() {
  const [automations, setAutomations] = useState(automationsData)

  const toggleStatus = (id: number) => {
    setAutomations(
      automations.map((auto) =>
        auto.id === id ? { ...auto, status: auto.status === "active" ? "paused" : "active" } : auto,
      ),
    )
  }

  return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Automation Builder</h2>
            <p className="text-muted-foreground mt-1">Create and manage automated workflows</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Automation
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnimatedCard delay={0.1}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Active Automations</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {automations.filter((a) => a.status === "active").length}
              </p>
            </CardContent>
          </AnimatedCard>

          <AnimatedCard delay={0.2}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Runs</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {automations.reduce((sum, a) => sum + a.runs, 0).toLocaleString()}
              </p>
            </CardContent>
          </AnimatedCard>

          <AnimatedCard delay={0.3}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-3xl font-bold text-foreground mt-2">98.5%</p>
            </CardContent>
          </AnimatedCard>
        </div>

        {/* Automations List */}
        <div className="space-y-4">
          {automations.map((automation, index) => (
            <AnimatedCard key={automation.id} delay={0.4 + index * 0.1}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{automation.name}</h3>
                      <Badge variant={automation.status === "active" ? "default" : "secondary"}>
                        {automation.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{automation.description}</p>
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Trigger: </span>
                        <span className="font-medium text-foreground">{automation.trigger}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Actions: </span>
                        <span className="font-medium text-foreground">{automation.actions}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Runs: </span>
                        <span className="font-medium text-foreground">{automation.runs.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last run: </span>
                        <span className="font-medium text-foreground">{automation.lastRun}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleStatus(automation.id)}
                      title={automation.status === "active" ? "Pause" : "Resume"}
                    >
                      {automation.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button variant="outline" size="icon">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-destructive bg-transparent">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </AnimatedCard>
          ))}
        </div>
      </div>
  )
}
