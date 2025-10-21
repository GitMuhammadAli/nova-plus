"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card } from "@/components/ui/card"

export default function Home() {
  return (
    <AppLayout title="Dashboard">
      <div className="space-y-8">
        {/* Welcome section */}
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back, John</h2>
          <p className="text-muted-foreground">Here's what's happening with your business today.</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Total Users", value: "12,543", change: "+12.5%" },
            { label: "Revenue", value: "$45,231", change: "+8.2%" },
            { label: "Conversions", value: "3,421", change: "+5.1%" },
            { label: "Active Sessions", value: "2,847", change: "+2.3%" },
          ].map((stat) => (
            <Card key={stat.label} className="p-6">
              <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mb-2">{stat.value}</p>
              <p className="text-xs text-accent font-medium">{stat.change}</p>
            </Card>
          ))}
        </div>

        {/* Recent activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              "New user registration from New York",
              "Payment processed: $1,250",
              "System backup completed successfully",
              "New feature deployed to production",
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-2 h-2 rounded-full bg-accent"></div>
                <p className="text-sm text-foreground">{activity}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
