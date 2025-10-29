"use client"

import { useState } from "react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AnimatedCard } from "@/components/motion/animated-card"
import { Badge } from "@/components/ui/badge"
import { Copy, Eye, EyeOff, Trash2, Plus, RefreshCw } from "lucide-react"

interface APIKey {
  id: string
  name: string
  key: string
  lastUsed: string
  created: string
  status: "active" | "inactive"
}

export default function APISettingsPage() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: "1",
      name: "Production API Key",
      key: "process.env.STRIPE_SECRET_KEY",
      lastUsed: "2 hours ago",
      created: "2024-01-15",
      status: "active",
    },
    {
      id: "2",
      name: "Development API Key",
      key: "process.env.STRIPE_SECRET_KEY",
      lastUsed: "30 minutes ago",
      created: "2024-01-10",
      status: "active",
    },
  ])

  const [showNewKeyForm, setShowNewKeyForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  const handleAddKey = () => {
    if (newKeyName) {
      const newKey: APIKey = {
        id: Date.now().toString(),
        name: newKeyName,
        key: `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        lastUsed: "Never",
        created: new Date().toISOString().split("T")[0],
        status: "active",
      }
      setApiKeys([...apiKeys, newKey])
      setNewKeyName("")
      setShowNewKeyForm(false)
    }
  }

  const handleDeleteKey = (id: string) => {
    setApiKeys(apiKeys.filter((k) => k.id !== id))
  }

  const handleToggleVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(id)) {
      newVisible.delete(id)
    } else {
      newVisible.add(id)
    }
    setVisibleKeys(newVisible)
  }

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
  }

  return (
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">API Settings</h2>
            <p className="text-muted-foreground mt-1">Manage your API keys and integrations</p>
          </div>
          <Button className="gap-2" onClick={() => setShowNewKeyForm(!showNewKeyForm)}>
            <Plus className="w-4 h-4" />
            Generate Key
          </Button>
        </div>

        {/* API Documentation */}
        <AnimatedCard delay={0.1}>
          <CardHeader>
            <CardTitle>API Documentation</CardTitle>
            <CardDescription>Learn how to use the NovaPulse API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm font-medium text-foreground mb-2">Base URL</p>
              <code className="text-xs text-muted-foreground">https://api.novapulse.io/v1</code>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="bg-transparent">
                View Documentation
              </Button>
              <Button variant="outline" className="bg-transparent">
                API Reference
              </Button>
            </div>
          </CardContent>
        </AnimatedCard>

        {/* New API Key Form */}
        {showNewKeyForm && (
          <AnimatedCard delay={0.2}>
            <CardHeader>
              <CardTitle>Generate New API Key</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Key Name</label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production, Development, Testing"
                  className="mt-2"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleAddKey}>Generate Key</Button>
                <Button variant="outline" onClick={() => setShowNewKeyForm(false)} className="bg-transparent">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </AnimatedCard>
        )}

        {/* API Keys List */}
        <AnimatedCard delay={0.3}>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>{apiKeys.length} active keys</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-foreground">{apiKey.name}</p>
                        <p className="text-xs text-muted-foreground">Created {apiKey.created}</p>
                      </div>
                      <Badge variant={apiKey.status === "active" ? "default" : "secondary"}>{apiKey.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" title="Regenerate key">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDeleteKey(apiKey.id)}
                        title="Delete key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <code className="text-xs text-muted-foreground flex-1 truncate">
                      {visibleKeys.has(apiKey.id) ? apiKey.key : "•".repeat(apiKey.key.length)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleVisibility(apiKey.id)}
                      title={visibleKeys.has(apiKey.id) ? "Hide key" : "Show key"}
                    >
                      {visibleKeys.has(apiKey.id) ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleCopyKey(apiKey.key)} title="Copy key">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">Last used: {apiKey.lastUsed}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </AnimatedCard>

        {/* Rate Limits */}
        <AnimatedCard delay={0.4}>
          <CardHeader>
            <CardTitle>Rate Limits</CardTitle>
            <CardDescription>Your current API usage and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Requests per minute", current: 450, limit: 1000 },
              { name: "Requests per day", current: 45000, limit: 100000 },
              { name: "Concurrent connections", current: 12, limit: 50 },
            ].map((limit, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">{limit.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {limit.current} / {limit.limit}
                  </p>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(limit.current / limit.limit) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </CardContent>
        </AnimatedCard>
      </div>
  )
}
