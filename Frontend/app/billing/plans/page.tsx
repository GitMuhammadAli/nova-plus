"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AnimatedCard } from "@/components/motion/animated-card"
import { Check, X } from "lucide-react"

const plansData = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    description: "Perfect for getting started",
    features: [
      { name: "Up to 1,000 users", included: true },
      { name: "Basic analytics", included: true },
      { name: "Email support", included: true },
      { name: "Advanced analytics", included: false },
      { name: "Priority support", included: false },
      { name: "Custom integrations", included: false },
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    id: "professional",
    name: "Professional",
    price: 99,
    description: "For growing teams",
    features: [
      { name: "Up to 10,000 users", included: true },
      { name: "Basic analytics", included: true },
      { name: "Email support", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Priority support", included: true },
      { name: "Custom integrations", included: false },
    ],
    cta: "Current Plan",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 299,
    description: "For large organizations",
    features: [
      { name: "Unlimited users", included: true },
      { name: "Basic analytics", included: true },
      { name: "Email support", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Priority support", included: true },
      { name: "Custom integrations", included: true },
    ],
    cta: "Upgrade",
    popular: false,
  },
]

export default function PlansPage() {
  return (
    <AppLayout title="Plans">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">Choose Your Plan</h2>
          <p className="text-muted-foreground mt-2">Select the perfect plan for your needs</p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plansData.map((plan, index) => (
            <AnimatedCard key={plan.id} delay={index * 0.1} className={plan.popular ? "md:scale-105" : ""}>
              <CardHeader>
                {plan.popular && <Badge className="w-fit mb-3">Most Popular</Badge>}
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pricing */}
                <div>
                  <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                {/* CTA Button */}
                <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                  {plan.cta}
                </Button>

                {/* Features */}
                <div className="space-y-3 border-t border-border pt-6">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-accent flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={feature.included ? "text-foreground" : "text-muted-foreground"}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </AnimatedCard>
          ))}
        </div>

        {/* FAQ Section */}
        <AnimatedCard delay={0.4}>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                q: "Can I change my plan anytime?",
                a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, PayPal, and bank transfers for enterprise customers.",
              },
              {
                q: "Is there a free trial?",
                a: "Yes, all plans come with a 14-day free trial. No credit card required to get started.",
              },
              {
                q: "What happens if I cancel?",
                a: "You can cancel anytime. Your data remains accessible for 30 days after cancellation.",
              },
            ].map((faq, index) => (
              <div key={index} className="border-b border-border pb-4 last:border-0">
                <p className="font-medium text-foreground mb-2">{faq.q}</p>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </CardContent>
        </AnimatedCard>
      </div>
    </AppLayout>
  )
}
