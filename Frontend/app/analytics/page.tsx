"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedCard } from "@/components/motion/animated-card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Calendar, Download } from "lucide-react"

const analyticsData = {
  pageViews: [
    { date: "Mon", views: 2400, unique: 1200, bounce: 24 },
    { date: "Tue", views: 1398, unique: 1221, bounce: 22 },
    { date: "Wed", views: 9800, unique: 2290, bounce: 29 },
    { date: "Thu", views: 3908, unique: 2000, bounce: 20 },
    { date: "Fri", views: 4800, unique: 2181, bounce: 25 },
    { date: "Sat", views: 3800, unique: 2500, bounce: 18 },
    { date: "Sun", views: 4300, unique: 2100, bounce: 22 },
  ],
  topPages: [
    { page: "/dashboard", views: 12543, avgTime: "3m 24s", bounceRate: "24%" },
    { page: "/analytics", views: 8921, avgTime: "2m 15s", bounceRate: "18%" },
    { page: "/users", views: 7234, avgTime: "1m 45s", bounceRate: "32%" },
    { page: "/settings", views: 5123, avgTime: "4m 12s", bounceRate: "12%" },
    { page: "/billing", views: 3456, avgTime: "2m 30s", bounceRate: "28%" },
  ],
  deviceStats: [
    { device: "Desktop", users: 8234, percentage: 65 },
    { device: "Mobile", users: 3456, percentage: 27 },
    { device: "Tablet", users: 1234, percentage: 8 },
  ],
}

export default function AnalyticsPage() {
  return (
    <AppLayout title="Analytics">
      <div className="space-y-8">
        {/* Header with filters */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Analytics Overview</h2>
            <p className="text-muted-foreground mt-1">Track your platform performance and user behavior</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Calendar className="w-4 h-4" />
              Last 7 days
            </Button>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Page Views Chart */}
        <AnimatedCard delay={0.1}>
          <CardHeader>
            <CardTitle>Page Views & Unique Visitors</CardTitle>
            <CardDescription>Daily traffic metrics for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                views: { label: "Page Views", color: "hsl(var(--chart-1))" },
                unique: { label: "Unique Visitors", color: "hsl(var(--chart-2))" },
              }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.pageViews}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <ChartTooltip />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="var(--color-chart-1)"
                    fillOpacity={1}
                    fill="url(#colorViews)"
                  />
                  <Area
                    type="monotone"
                    dataKey="unique"
                    stroke="var(--color-chart-2)"
                    fillOpacity={0.3}
                    fill="var(--color-chart-2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </AnimatedCard>

        {/* Tabs for different views */}
        <AnimatedCard delay={0.2}>
          <CardHeader>
            <CardTitle>Detailed Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pages" className="w-full">
              <TabsList>
                <TabsTrigger value="pages">Top Pages</TabsTrigger>
                <TabsTrigger value="devices">Devices</TabsTrigger>
                <TabsTrigger value="bounce">Bounce Rate</TabsTrigger>
              </TabsList>

              {/* Top Pages Tab */}
              <TabsContent value="pages" className="space-y-4">
                <div className="space-y-3">
                  {analyticsData.topPages.map((page, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{page.page}</p>
                        <p className="text-sm text-muted-foreground">Avg. time: {page.avgTime}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{page.views.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">views</p>
                        </div>
                        <Badge variant="outline">{page.bounceRate}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Devices Tab */}
              <TabsContent value="devices" className="space-y-4">
                <div className="space-y-3">
                  {analyticsData.deviceStats.map((device, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">{device.device}</p>
                        <p className="text-sm font-semibold text-foreground">{device.users.toLocaleString()} users</p>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${device.percentage}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground">{device.percentage}% of total</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Bounce Rate Tab */}
              <TabsContent value="bounce" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Average Bounce Rate</p>
                      <p className="text-3xl font-bold text-foreground mt-2">23.4%</p>
                      <p className="text-xs text-accent mt-2">↓ 2.1% from last week</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Highest Bounce Rate</p>
                      <p className="text-3xl font-bold text-foreground mt-2">32%</p>
                      <p className="text-xs text-muted-foreground mt-2">/users page</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Lowest Bounce Rate</p>
                      <p className="text-3xl font-bold text-foreground mt-2">12%</p>
                      <p className="text-xs text-muted-foreground mt-2">/settings page</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </AnimatedCard>
      </div>
    </AppLayout>
  )
}
