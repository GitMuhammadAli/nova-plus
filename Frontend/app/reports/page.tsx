"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { FadeIn, StaggerContainer } from "@/components/motion"
import { BarChart3, Download, Filter, TrendingUp } from "lucide-react"

export default function ReportsPage() {
  const reports = [
    {
      id: 1,
      name: "Monthly Performance Report",
      description: "Comprehensive overview of key metrics and performance indicators",
      lastGenerated: "2025-01-15",
      frequency: "Monthly",
      status: "Ready",
    },
    {
      id: 2,
      name: "User Activity Report",
      description: "Detailed breakdown of user engagement and activity patterns",
      lastGenerated: "2025-01-14",
      frequency: "Weekly",
      status: "Ready",
    },
    {
      id: 3,
      name: "Revenue Analysis",
      description: "Financial performance and revenue trends analysis",
      lastGenerated: "2025-01-10",
      frequency: "Monthly",
      status: "Ready",
    },
    {
      id: 4,
      name: "Automation Efficiency Report",
      description: "Metrics on automation usage and time saved",
      lastGenerated: "2025-01-12",
      frequency: "Weekly",
      status: "Ready",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <p className="mt-2 text-muted-foreground">Generate and manage comprehensive reports for your business</p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground">Report Type</label>
            <Select>
              <option>All Reports</option>
              <option>Performance</option>
              <option>Financial</option>
              <option>User Activity</option>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground">Date Range</label>
            <Select>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>Last Year</option>
              <option>Custom Range</option>
            </Select>
          </div>
          <Button variant="outline" className="bg-transparent">
            <Filter className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
        </div>
      </Card>

      {/* Reports Grid */}
      <StaggerContainer className="grid gap-6 md:grid-cols-2">
        {reports.map((report, index) => (
          <FadeIn key={report.id} delay={index * 0.1}>
            <Card className="p-6 hover:border-nova-indigo/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-nova-indigo/10 p-3">
                    <BarChart3 className="h-6 w-6 text-nova-indigo" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{report.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{report.description}</p>
                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Generated: {new Date(report.lastGenerated).toLocaleDateString()}</span>
                      <Badge variant="outline">{report.frequency}</Badge>
                    </div>
                  </div>
                </div>
                <Badge className="bg-mint/10 text-mint">{report.status}</Badge>
              </div>
              <div className="mt-6 flex gap-2">
                <Button size="sm" className="flex-1">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View
                </Button>
                <Button size="sm" variant="outline" className="bg-transparent">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </FadeIn>
        ))}
      </StaggerContainer>
    </div>
  )
}
