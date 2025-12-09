"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/app/store/store"
import { AppShell } from "@/components/layout/AppShell"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { webhookAPI } from "@/app/services"
import { toast } from "@/hooks/use-toast"
import { Plus, Trash2, Edit2, Send, Loader2, ExternalLink } from "lucide-react"

interface Webhook {
  _id: string
  url: string
  events: string[]
  isActive: boolean
  lastAttemptAt?: string
  lastStatus?: string
  retries: number
  createdAt: string
}

export default function WebhooksPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewWebhookForm, setShowNewWebhookForm] = useState(false)
  const [newWebhook, setNewWebhook] = useState({ url: "", events: [] as string[] })
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null)
  const [logsOpen, setLogsOpen] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const fetchWebhooks = async () => {
    setLoading(true)
    try {
      const response = await webhookAPI.getAll()
      const data = response.data || response
      setWebhooks(Array.isArray(data) ? data : data?.webhooks || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load webhooks",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const availableEvents = [
    "task.created",
    "task.updated",
    "task.deleted",
    "project.created",
    "project.updated",
    "user.created",
    "user.updated",
    "invoice.paid",
    "webhook.test",
  ]

  const handleAddWebhook = async () => {
    if (newWebhook.url && newWebhook.events.length > 0) {
      try {
        await webhookAPI.create({
          url: newWebhook.url,
          events: newWebhook.events,
          isActive: true,
          retries: 3,
        })
        toast({
          title: "Success",
          description: "Webhook created successfully",
        })
        setNewWebhook({ url: "", events: [] })
        setShowNewWebhookForm(false)
        fetchWebhooks()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to create webhook",
          variant: "destructive",
        })
      }
    }
  }

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return
    try {
      await webhookAPI.delete(id)
      toast({
        title: "Success",
        description: "Webhook deleted successfully",
      })
      fetchWebhooks()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete webhook",
        variant: "destructive",
      })
    }
  }

  const handleTestWebhook = async (id: string) => {
    try {
      await webhookAPI.test(id)
      toast({
        title: "Success",
        description: "Test webhook sent",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to test webhook",
        variant: "destructive",
      })
    }
  }

  const handleViewLogs = async (id: string) => {
    setSelectedWebhook(webhooks.find((w) => w._id === id) || null)
    setLogsOpen(true)
    setLoadingLogs(true)
    try {
      const response = await webhookAPI.getLogs(id, 50)
      const data = response.data || response
      setLogs(Array.isArray(data) ? data : data?.logs || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load logs",
        variant: "destructive",
      })
    } finally {
      setLoadingLogs(false)
    }
  }

  const handleToggleEvent = (event: string) => {
    setNewWebhook((prev) => ({
      ...prev,
      events: prev.events.includes(event) ? prev.events.filter((e) => e !== event) : [...prev.events, event],
    }))
  }

  return (
    <AppShell>
      <div className="p-8 space-y-6">
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
          <div className="border rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">Create New Webhook</h3>
            <div>
              <label className="text-sm font-medium">Webhook URL</label>
              <Input
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                placeholder="https://example.com/webhooks/events"
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-3">Events to Subscribe</label>
              <div className="grid grid-cols-2 gap-3">
                {availableEvents.map((event) => (
                  <label key={event} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={newWebhook.events.includes(event)}
                      onCheckedChange={() => handleToggleEvent(event)}
                    />
                    <span className="text-sm">{event}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleAddWebhook}>Create Webhook</Button>
              <Button variant="outline" onClick={() => setShowNewWebhookForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Webhooks List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {webhooks.length === 0 ? (
              <div className="p-12 text-center border rounded-lg">
                <p className="text-muted-foreground">No webhooks configured</p>
              </div>
            ) : (
              webhooks.map((webhook) => (
                <div key={webhook._id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                          {webhook.url}
                        </code>
                        <Badge variant={webhook.isActive ? "default" : "secondary"}>
                          {webhook.isActive ? "Active" : "Inactive"}
                        </Badge>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        title="View logs"
                        onClick={() => handleViewLogs(webhook._id)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Test webhook"
                        onClick={() => handleTestWebhook(webhook._id)}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDeleteWebhook(webhook._id)}
                        title="Delete webhook"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                    <span>
                      Last attempt: {webhook.lastAttemptAt ? new Date(webhook.lastAttemptAt).toLocaleString() : "Never"}
                    </span>
                    <span>Status: {webhook.lastStatus || "N/A"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Webhook Events Reference */}
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Available Events</h3>
          <p className="text-sm text-muted-foreground mb-4">Events you can subscribe to</p>
          <div className="space-y-3">
            {[
              { event: "task.created", description: "Triggered when a new task is created" },
              { event: "task.updated", description: "Triggered when a task is updated" },
              { event: "project.created", description: "Triggered when a new project is created" },
              { event: "user.created", description: "Triggered when a new user is created" },
              { event: "invoice.paid", description: "Triggered when an invoice is paid" },
            ].map((item, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <p className="font-medium text-sm">{item.event}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Logs Dialog */}
        {logsOpen && selectedWebhook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Webhook Delivery Logs</h3>
                <Button variant="ghost" onClick={() => setLogsOpen(false)}>Close</Button>
              </div>
              {loadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No logs found</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={log.status === "success" ? "default" : "destructive"}>
                          {log.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{log.event}</p>
                      {log.errorMessage && (
                        <p className="text-xs text-destructive mt-1">{log.errorMessage}</p>
                      )}
                      {log.statusCode && (
                        <p className="text-xs text-muted-foreground">Status: {log.statusCode}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
