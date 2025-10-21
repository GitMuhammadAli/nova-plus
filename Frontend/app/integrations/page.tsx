"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FadeIn, StaggerContainer } from "@/components/motion"
import { Zap, Plus, Settings, Trash2 } from "lucide-react"

export default function IntegrationsPage() {
  const integrations = [
    {
      id: 1,
      name: "Slack",
      description: "Send notifications and updates to Slack channels",
      status: "Connected",
      icon: "🔔",
    },
    {
      id: 2,
      name: "Zapier",
      description: "Connect with 5000+ apps through Zapier",
      status: "Connected",
      icon: "⚡",
    },
    {
      id: 3,
      name: "Google Sheets",
      description: "Sync data with Google Sheets automatically",
      status: "Available",
      icon: "📊",
    },
    {
      id: 4,
      name: "Stripe",
      description: "Manage payments and subscriptions",
      status: "Available",
      icon: "💳",
    },
    {
      id: 5,
      name: "GitHub",
      description: "Track deployments and code changes",
      status: "Available",
      icon: "🔗",
    },
    {
      id: 6,
      name: "Salesforce",
      description: "Sync customer data with Salesforce",
      status: "Available",
      icon: "👥",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Integrations</h1>
          <p className="mt-2 text-muted-foreground">Connect NovaPulse with your favorite tools and services</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Browse Integrations
        </Button>
      </div>

      {/* Connected Integrations */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Connected</h2>
        <StaggerContainer className="grid gap-6 md:grid-cols-2">
          {integrations
            .filter((i) => i.status === "Connected")
            .map((integration, index) => (
              <FadeIn key={integration.id} delay={index * 0.1}>
                <Card className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{integration.icon}</div>
                      <div>
                        <h3 className="font-semibold text-foreground">{integration.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{integration.description}</p>
                      </div>
                    </div>
                    <Badge className="bg-mint/10 text-mint">Connected</Badge>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <Button size="sm" variant="outline" className="bg-transparent flex-1">
                      <Settings className="mr-2 h-4 w-4" />
                      Configure
                    </Button>
                    <Button size="sm" variant="outline" className="bg-transparent">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </FadeIn>
            ))}
        </StaggerContainer>
      </div>

      {/* Available Integrations */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Available</h2>
        <StaggerContainer className="grid gap-6 md:grid-cols-2">
          {integrations
            .filter((i) => i.status === "Available")
            .map((integration, index) => (
              <FadeIn key={integration.id} delay={index * 0.1}>
                <Card className="p-6 hover:border-nova-indigo/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{integration.icon}</div>
                      <div>
                        <h3 className="font-semibold text-foreground">{integration.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{integration.description}</p>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" className="mt-6 w-full">
                    <Zap className="mr-2 h-4 w-4" />
                    Connect
                  </Button>
                </Card>
              </FadeIn>
            ))}
        </StaggerContainer>
      </div>
    </div>
  )
}
