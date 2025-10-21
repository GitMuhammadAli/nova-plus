"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FadeIn, StaggerContainer } from "@/components/motion"
import { Check, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      description: "Perfect for small teams",
      price: 29,
      features: ["Up to 5 team members", "Basic analytics", "Email support", "5GB storage", "Core automation"],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Professional",
      description: "For growing businesses",
      price: 79,
      features: [
        "Up to 25 team members",
        "Advanced analytics",
        "Priority support",
        "100GB storage",
        "Advanced automation",
        "Custom integrations",
        "API access",
      ],
      cta: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      description: "For large organizations",
      price: "Custom",
      features: [
        "Unlimited team members",
        "Custom analytics",
        "24/7 dedicated support",
        "Unlimited storage",
        "Full automation suite",
        "Custom integrations",
        "Advanced API",
        "SSO & SAML",
        "SLA guarantee",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ]

  const faqs = [
    {
      question: "Can I change plans anytime?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle.",
    },
    {
      question: "Do you offer discounts for annual billing?",
      answer: "Yes, we offer 20% discount when you pay annually instead of monthly.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, bank transfers, and wire transfers for enterprise customers.",
    },
    {
      question: "Is there a free trial?",
      answer: "Yes, all plans come with a 14-day free trial. No credit card required to start.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-balance text-4xl font-bold text-foreground sm:text-5xl">Simple, Transparent Pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the perfect plan for your team. Always flexible to scale.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <StaggerContainer className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <FadeIn key={index} delay={index * 0.1}>
                <Card
                  className={`relative flex flex-col p-8 ${
                    plan.highlighted ? "border-nova-indigo ring-1 ring-nova-indigo/20 lg:scale-105" : ""
                  }`}
                >
                  {plan.highlighted && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-nova-indigo text-white">
                      Most Popular
                    </Badge>
                  )}
                  <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                  <div className="mt-6">
                    {typeof plan.price === "number" ? (
                      <>
                        <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </>
                    ) : (
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    )}
                  </div>
                  <Link href="/register" className="mt-8 w-full">
                    <Button className="w-full" variant={plan.highlighted ? "default" : "outline"}>
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <div className="mt-8 space-y-4 border-t border-border pt-8">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-mint flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </FadeIn>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-border px-4 py-20 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
          <div className="mt-12 space-y-6">
            {faqs.map((faq, index) => (
              <FadeIn key={index} delay={index * 0.05}>
                <Card className="p-6">
                  <h3 className="font-semibold text-foreground">{faq.question}</h3>
                  <p className="mt-2 text-muted-foreground">{faq.answer}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
