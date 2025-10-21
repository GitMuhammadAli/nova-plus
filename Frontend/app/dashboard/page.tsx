"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AnimatedCard } from "@/components/motion/animated-card"
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-container"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartLegend } from "@/components/ui/chart"
import { ArrowUpRight, ArrowDownRight, TrendingUp, Users, Activity, Zap } from "lucide-react"

const dashboardData = {
  stats: [
    { label: "Total Users", value: "12,543", change: "+12.5%", trend: "up", icon: Users },
    { label: "Active Sessions", value: "3,421", change: "+8.2%", trend: "up", icon: Activity },
    { label: "Revenue", value: "$45,231", change: "+23.1%", trend: "up", icon: TrendingUp },
    { label: "Conversion Rate", value: "3.24%", change: "-2.1%", trend: "down", icon: Zap },
  ],
  chartData: [
    { name: "Jan", value: 4000, revenue: 2400 },
    { name: "Feb", value: 3000, revenue: 1398 },
    { name: "Mar", value: 2000, revenue: 9800 },
    { name: "Apr", value: 2780, revenue: 3908 },
    { name: "May", value: 1890, revenue: 4800 },
    { name: "Jun", value: 2390, revenue: 3800 },
  ],
  pieData: [
    { name: "Direct", value: 400 },
    { name: "Organic", value: 300 },
    { name: "Referral", value: 200 },
    { name: "Social", value: 100 },
  ],
  recentActivity: [
    { id: 1, user: "Sarah Johnson", action: "Signed up", time: "2 hours ago", status: "success" },
    { id: 2, user: "Mike Chen", action: "Completed purchase", time: "4 hours ago", status: "success" },
    { id: 3, user: "Emma Davis", action: "Updated profile", time: "6 hours ago", status: "info" },
    { id: 4, user: "Alex Rodriguez", action: "Cancelled subscription", time: "8 hours ago", status: "warning" },
  ],
}

const COLORS = ["#45 0.22 280", "#65 0.15 160", "#62 0.22 25", "#5 0.18 310"]

export default function DashboardPage() {
  return (
    <AppLayout title="Dashboard">
      <div className="space-y-8">
        {/* Stats Grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardData.stats.map((stat, index) => {
            const Icon = stat.icon
            const isPositive = stat.trend === "up"
            return (
              <StaggerItem key={index}>
                <AnimatedCard delay={index * 0.1}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <div className="flex items-center gap-1">
                          {isPositive ? (
                            <ArrowUpRight className="w-4 h-4 text-accent" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-destructive" />
                          )}
                          <span className={`text-xs font-medium ${isPositive ? "text-accent" : "text-destructive"}`}>
                            {stat.change}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </AnimatedCard>
              </StaggerItem>
            )
          })}
        </StaggerContainer>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line Chart */}
          <AnimatedCard className="lg:col-span-2" delay={0.4}>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue and user growth</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: { label: "Users", color: "hsl(var(--chart-1))" },
                  revenue: { label: "Revenue", color: "hsl(var(--chart-2))" },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis stroke="var(--color-muted-foreground)" />
                    <YAxis stroke="var(--color-muted-foreground)" />
                    <ChartTooltip />
                    <ChartLegend />
                    <Line type="monotone" dataKey="value" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="revenue" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </AnimatedCard>

          {/* Pie Chart */}
          <AnimatedCard delay={0.5}>
            <CardHeader>
              <CardTitle>Traffic Source</CardTitle>
              <CardDescription>Distribution by channel</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  direct: { label: "Direct", color: "hsl(var(--chart-1))" },
                  organic: { label: "Organic", color: "hsl(var(--chart-2))" },
                  referral: { label: "Referral", color: "hsl(var(--chart-3))" },
                  social: { label: "Social", color: "hsl(var(--chart-4))" },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="var(--color-chart-1)"
                      dataKey="value"
                    >
                      {dashboardData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 4) + 1}))`} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </AnimatedCard>
        </div>

        {/* Recent Activity */}
        <AnimatedCard delay={0.6}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest user actions and events</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.recentActivity.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.user}</TableCell>
                    <TableCell>{activity.action}</TableCell>
                    <TableCell className="text-muted-foreground">{activity.time}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          activity.status === "success"
                            ? "default"
                            : activity.status === "warning"
                              ? "outline"
                              : "secondary"
                        }
                      >
                        {activity.status}
                      </Badge>
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
