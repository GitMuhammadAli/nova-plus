"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FadeIn, StaggerContainer } from "@/components/motion"
import { ArrowRight, Zap, BarChart3, Users, Workflow, Shield } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Built for speed with optimized performance and instant load times",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time insights and comprehensive reporting dashboards",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Seamless teamwork with role-based access and permissions",
    },
    {
      icon: Workflow,
      title: "Automation",
      description: "Automate workflows and save hours of manual work",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security with encryption and compliance",
    },
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CEO at TechStart",
      content: "NovaPulse transformed how we manage our operations. Highly recommended.",
    },
    {
      name: "Marcus Johnson",
      role: "Operations Lead at Scale Inc",
      content: "The automation features alone saved us 20 hours per week.",
    },
    {
      name: "Elena Rodriguez",
      role: "Founder at DataFlow",
      content: "Best investment we made for our team. Exceptional support too.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-nova-indigo to-nova-indigo/60" />
              <span className="text-xl font-bold text-foreground">NovaPulse</span>
            </div>
            <div className="hidden items-center gap-8 md:flex">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </Link>
            </div>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <Badge className="mb-4 bg-nova-indigo/10 text-nova-indigo hover:bg-nova-indigo/20">
              Welcome to NovaPulse
            </Badge>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              The Modern Admin Platform for Growing Teams
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-6 text-balance text-lg text-muted-foreground">
              Streamline operations, automate workflows, and make data-driven decisions with NovaPulse. Built for teams
              that demand excellence.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                  Learn More
                </Button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
              Powerful Features for Modern Teams
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to manage, analyze, and grow your business
            </p>
          </div>

          <StaggerContainer className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <FadeIn key={index} delay={index * 0.1}>
                  <Card className="p-6 hover:border-nova-indigo/50 transition-colors">
                    <Icon className="h-8 w-8 text-nova-indigo" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-muted-foreground">{feature.description}</p>
                  </Card>
                </FadeIn>
              )
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="border-t border-border px-4 py-20 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">Loved by Teams Worldwide</h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <FadeIn key={index} delay={index * 0.1}>
                <Card className="p-6">
                  <p className="text-muted-foreground italic">"{testimonial.content}"</p>
                  <div className="mt-4">
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Ready to Transform Your Operations?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join hundreds of teams already using NovaPulse to streamline their workflows.
          </p>
          <Link href="/register">
            <Button size="lg" className="mt-8">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-nova-indigo to-nova-indigo/60" />
                <span className="font-bold text-foreground">NovaPulse</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">The modern admin platform for growing teams.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Product</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Company</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Legal</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 NovaPulse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
