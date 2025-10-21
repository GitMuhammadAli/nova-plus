"use client"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AnimatedCard } from "@/components/motion/animated-card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit2, Send } from "lucide-react"

interface Webhook {
  id: string
  url: string
  events: string[]
  status: "active" | "inactive"
  lastTriggered: string
  deliveries: number
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: "1",
      url: "https://example.com/webhooks/user-events",
      events: ["user.created", "user.updated", "user.deleted"],
      status: "active",
      lastTriggered: "5 minutes ago",
      deliveries: 1240,
    },
    {
      id: "2",
      url: "https://example.com/webhooks/automation",
      events: ["automation.triggered", "automation.completed"],
      status: "active",
      lastTriggered: "2 hours ago",
      deliveries: 856,
    },
  ])

  const [showNewWebhookForm, setShowNewWebhookForm] = useState(false)
  const [newWebhook, setNewWebhook] = useState({ url: "", events: [] })

  const availableEvents = [
    "user.created",
    "user.updated",
    "user.deleted",
    "automation.triggered",
    "automation.completed",
    "report.generated",
    "integration.connected",
  ]

  const handleAddWebhook = () => {
    if (newWebhook.url && newWebhook.events.length > 0) {
      setWebhooks([
        ...webhooks,
        {
          id: Date.now().toString(),
          url: newWebhook.url,
          events: newWebhook.events,
          status: "active",
          lastTriggered: "Never",
          deliveries: 0,
        },
      ])
      setNewWebhook({ url: "", events: [] })
      setShowNewWebhookForm(false)
    }
  }

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter((w) => w.id !== id))
  }

  const handleToggleEvent = (event: string) => {
    setNewWebhook((prev) => ({
      ...prev,
      events: prev.events.includes(event) ? prev.events.filter((e) => e !== event) : [...prev.events, event],
    }))
  }

  return (
    <AppLayout title="Webhooks">
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Webhooks</h2>
            <p className="text-muted-foreground mt-1">Receive real-time events from NovaPulse</p>
          </div>
          <Button className="gap-2" onClick={() => setShowNewWebhookForm(!showNewWebhookForm)}>
            <Plus className="w-4 h-4" />
            New Webhook
          </Button>
        </div>

        {/* New Webhook Form */}
        {showNewWebhookForm && (
          <AnimatedCard delay={0.1}>
            <CardHeader>
              <CardTitle>Create New Webhook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Webhook URL</label>
                <Input
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  placeholder="https://example.com/webhooks/events"
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-3">Events to Subscribe</label>
                <div className="grid grid-cols-2 gap-3">
                  {availableEvents.map((event) => (
                    <label key={event} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newWebhook.events.includes(event)}
                        onChange={() => handleToggleEvent(event)}
                        className="w-4 h-4 rounded border-border"
                      />
                      <span className="text-sm text-foreground">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleAddWebhook}>Create Webhook</Button>
                <Button variant="outline" onClick={() => setShowNewWebhookForm(false)} className="bg-transparent">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </AnimatedCard>
        )}

        {/* Webhooks List */}
        <AnimatedCard delay={0.2}>
          <CardHeader>
            <CardTitle>Your Webhooks</CardTitle>
            <CardDescription>{webhooks.length} webhooks configured</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                          {webhook.url}
                        </code>
                        <Badge variant={webhook.status === "active" ? "default" : "secondary"}>{webhook.status}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" title="Test webhook">
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Edit webhook">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        title="Delete webhook"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                    <span>Last triggered: {webhook.lastTriggered}</span>
                    <span>{webhook.deliveries} total deliveries</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </AnimatedCard>

        {/* Webhook Events Reference */}
        <AnimatedCard delay={0.3}>
          <CardHeader>
            <CardTitle>Available Events</CardTitle>
            <CardDescription>Events you can subscribe to</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { event: "user.created", description: "Triggered when a new user is created" },
                { event: "user.updated", description: "Triggered when a user profile is updated" },
                { event: "automation.triggered", description: "Triggered when an automation workflow starts" },
                { event: "report.generated", description: "Triggered when a report is generated" },
              ].map((item, index) => (
                <div key={index} className="p-3 border border-border rounded-lg">
                  <p className="font-medium text-foreground text-sm">{item.event}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </AnimatedCard>
      </div>
    </AppLayout>
  )
}
