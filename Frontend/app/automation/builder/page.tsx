"use client"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AnimatedCard } from "@/components/motion/animated-card"
import { ArrowRight, Plus, Trash2 } from "lucide-react"

const triggerOptions = [
  { id: "signup", label: "User Signup", icon: "👤" },
  { id: "purchase", label: "Purchase Made", icon: "💳" },
  { id: "schedule", label: "Schedule", icon: "📅" },
  { id: "webhook", label: "Webhook", icon: "🔗" },
]

const actionOptions = [
  { id: "email", label: "Send Email", icon: "📧" },
  { id: "sms", label: "Send SMS", icon: "📱" },
  { id: "slack", label: "Send Slack Message", icon: "💬" },
  { id: "webhook", label: "Call Webhook", icon: "🔗" },
  { id: "delay", label: "Add Delay", icon: "⏱️" },
]

export default function AutomationBuilderPage() {
  const [automationName, setAutomationName] = useState("")
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null)
  const [actions, setActions] = useState<string[]>([])

  const addAction = (actionId: string) => {
    setActions([...actions, actionId])
  }

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
  }

  return (
    <AppLayout title="Create Automation">
      <div className="space-y-8 max-w-4xl">
        {/* Name Input */}
        <AnimatedCard delay={0.1}>
          <CardHeader>
            <CardTitle>Automation Name</CardTitle>
            <CardDescription>Give your automation a descriptive name</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="e.g., Welcome Email Campaign"
              value={automationName}
              onChange={(e) => setAutomationName(e.target.value)}
            />
          </CardContent>
        </AnimatedCard>

        {/* Trigger Selection */}
        <AnimatedCard delay={0.2}>
          <CardHeader>
            <CardTitle>Select Trigger</CardTitle>
            <CardDescription>Choose what event starts this automation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {triggerOptions.map((trigger) => (
                <button
                  key={trigger.id}
                  onClick={() => setSelectedTrigger(trigger.id)}
                  className={`p-4 border-2 rounded-lg transition-all text-left ${
                    selectedTrigger === trigger.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-2xl">{trigger.icon}</span>
                  <p className="font-medium text-foreground mt-2">{trigger.label}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </AnimatedCard>

        {/* Actions Selection */}
        {selectedTrigger && (
          <AnimatedCard delay={0.3}>
            <CardHeader>
              <CardTitle>Add Actions</CardTitle>
              <CardDescription>Choose what happens when the trigger fires</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Trigger to Actions Flow */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{triggerOptions.find((t) => t.id === selectedTrigger)?.icon}</span>
                  <span className="font-medium text-foreground">
                    {triggerOptions.find((t) => t.id === selectedTrigger)?.label}
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  {actions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {actions.map((actionId, index) => {
                        const action = actionOptions.find((a) => a.id === actionId)
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary rounded-full"
                          >
                            <span>{action?.icon}</span>
                            <span className="text-sm font-medium text-foreground">{action?.label}</span>
                            <button
                              onClick={() => removeAction(index)}
                              className="ml-1 text-destructive hover:text-destructive/80"
                            >
                              ×
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No actions added yet</span>
                  )}
                </div>
              </div>

              {/* Available Actions */}
              <div>
                <p className="text-sm font-medium text-foreground mb-3">Available Actions</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {actionOptions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => addAction(action.id)}
                      className="p-3 border border-border rounded-lg hover:bg-muted transition-colors text-left flex items-center gap-3"
                    >
                      <span className="text-xl">{action.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{action.label}</p>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </AnimatedCard>
        )}

        {/* Actions Summary */}
        {actions.length > 0 && (
          <AnimatedCard delay={0.4}>
            <CardHeader>
              <CardTitle>Actions Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {actions.map((actionId, index) => {
                  const action = actionOptions.find((a) => a.id === actionId)
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{action?.icon}</span>
                        <p className="font-medium text-foreground">{action?.label}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAction(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </AnimatedCard>
        )}

        {/* Save Button */}
        <div className="flex gap-3">
          <Button className="flex-1">Save Automation</Button>
          <Button variant="outline" className="flex-1 bg-transparent">
            Cancel
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
