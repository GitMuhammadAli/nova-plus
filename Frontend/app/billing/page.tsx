"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AnimatedCard } from "@/components/motion/animated-card"
import { Check, Download, AlertCircle } from "lucide-react"

const billingData = {
  currentPlan: {
    name: "Professional",
    price: 99,
    billing: "monthly",
    status: "active",
    nextBillingDate: "2024-11-20",
    features: ["Up to 10,000 users", "Advanced analytics", "Priority support", "Custom integrations"],
  },
  invoices: [
    { id: "INV-001", date: "2024-10-20", amount: 99.0, status: "paid", dueDate: "2024-10-20" },
    { id: "INV-002", date: "2024-09-20", amount: 99.0, status: "paid", dueDate: "2024-09-20" },
    { id: "INV-003", date: "2024-08-20", amount: 99.0, status: "paid", dueDate: "2024-08-20" },
    { id: "INV-004", date: "2024-07-20", amount: 99.0, status: "paid", dueDate: "2024-07-20" },
  ],
  paymentMethod: {
    type: "card",
    brand: "Visa",
    last4: "4242",
    expiry: "12/26",
  },
}

export default function BillingPage() {
  return (
    <AppLayout title="Billing">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-foreground">Billing & Subscription</h2>
          <p className="text-muted-foreground mt-1">Manage your subscription and payment methods</p>
        </div>

        {/* Current Plan */}
        <AnimatedCard delay={0.1}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your active subscription</CardDescription>
              </div>
              <Badge>{billingData.currentPlan.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Plan Name</p>
                <p className="text-2xl font-bold text-foreground mt-1">{billingData.currentPlan.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Billing Cycle</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  ${billingData.currentPlan.price}
                  <span className="text-lg text-muted-foreground">/{billingData.currentPlan.billing}</span>
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <p className="text-sm font-medium text-foreground mb-3">Included Features</p>
              <ul className="space-y-2">
                {billingData.currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-accent" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border pt-6">
              <p className="text-sm text-muted-foreground">Next Billing Date</p>
              <p className="text-lg font-semibold text-foreground mt-1">{billingData.currentPlan.nextBillingDate}</p>
            </div>

            <div className="flex gap-3">
              <Button>Upgrade Plan</Button>
              <Button variant="outline" className="bg-transparent">
                Change Plan
              </Button>
              <Button variant="outline" className="text-destructive bg-transparent">
                Cancel Subscription
              </Button>
            </div>
          </CardContent>
        </AnimatedCard>

        {/* Payment Method */}
        <AnimatedCard delay={0.2}>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Your default payment method</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border border-border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {billingData.paymentMethod.brand.substring(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{billingData.paymentMethod.brand}</p>
                    <p className="text-sm text-muted-foreground">ending in {billingData.paymentMethod.last4}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Expires</p>
                  <p className="font-medium text-foreground">{billingData.paymentMethod.expiry}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="bg-transparent">
                Update Payment Method
              </Button>
              <Button variant="outline" className="bg-transparent">
                Add Payment Method
              </Button>
            </div>
          </CardContent>
        </AnimatedCard>

        {/* Billing Alert */}
        <div className="p-4 border border-accent/50 bg-accent/5 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-accent mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Payment Reminder</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your next payment of $99.00 is due on {billingData.currentPlan.nextBillingDate}
            </p>
          </div>
        </div>

        {/* Invoices */}
        <AnimatedCard delay={0.3}>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>Your billing history</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingData.invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="default">{invoice.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </AnimatedCard>
      </div>
    </AppLayout>
  )
}
