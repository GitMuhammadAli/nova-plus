"use client"

import { Card } from "@/components/ui/card"
import { FadeIn, StaggerContainer } from "@/components/motion"
import {
  BarChart3,
  Zap,
  Users,
  Workflow,
  Shield,
  Globe,
  Smartphone,
  Lock,
  Gauge,
  Layers,
  Bell,
  GitBranch,
} from "lucide-react"

export default function FeaturesPage() {
  const features = [
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description:
        "Real-time dashboards with customizable metrics, trends, and insights to drive data-driven decisions.",
    },
    {
      icon: Workflow,
      title: "Workflow Automation",
      description: "Build complex automations without code. Trigger actions based on events and conditions.",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Seamless teamwork with role-based access, permissions, and activity tracking.",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption, SSO, SAML, and compliance with SOC 2, GDPR, and HIPAA.",
    },
    {
      icon: Globe,
      title: "Global Infrastructure",
      description: "Deploy globally with 99.99% uptime SLA and automatic failover across regions.",
    },
    {
      icon: Smartphone,
      title: "Mobile Ready",
      description: "Fully responsive design works seamlessly on desktop, tablet, and mobile devices.",
    },
    {
      icon: Lock,
      title: "Data Privacy",
      description: "Your data is encrypted at rest and in transit. Full control over data retention and deletion.",
    },
    {
      icon: Gauge,
      title: "Performance",
      description: "Lightning-fast load times with optimized queries and intelligent caching.",
    },
    {
      icon: Layers,
      title: "Integrations",
      description: "Connect with 500+ apps via native integrations, webhooks, and REST API.",
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Customizable alerts via email, SMS, Slack, and in-app notifications.",
    },
    {
      icon: GitBranch,
      title: "Version Control",
      description: "Track changes, audit logs, and rollback capabilities for all configurations.",
    },
    {
      icon: Zap,
      title: "API First",
      description: "Comprehensive REST and GraphQL APIs for complete programmatic access.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-balance text-4xl font-bold text-foreground sm:text-5xl">
            Powerful Features Built for Scale
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to manage, automate, and grow your business.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <StaggerContainer className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <FadeIn key={index} delay={index * 0.05}>
                  <Card className="p-6 hover:border-nova-indigo/50 transition-colors">
                    <Icon className="h-10 w-10 text-nova-indigo" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-muted-foreground">{feature.description}</p>
                  </Card>
                </FadeIn>
              )
            })}
          </StaggerContainer>
        </div>
      </section>
    </div>
  )
}
