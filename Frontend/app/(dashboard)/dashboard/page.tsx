"use client"

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import { motion } from 'framer-motion';
import {
  TrendingUp, Users, DollarSign, Activity,
  UserPlus, FileText, Settings, BarChart3, Mail, Zap,
  AlertCircle, CheckCircle,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from 'recharts';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';


// --- ACTIVITY FEED COMPONENT ---

interface ActivityType {
  id: string;
  type: "user" | "report" | "billing" | "system" | "success" | "alert";
  title: string;
  description: string;
  timestamp: string;
}

const activityIcons = {
  user: UserPlus,
  report: FileText,
  billing: DollarSign,
  system: Settings,
  success: CheckCircle,
  alert: AlertCircle,
};

const activityColors = {
  user: "text-primary bg-primary/20",
  report: "text-info bg-info/20",
  billing: "text-success bg-success/20",
  system: "text-muted-foreground bg-muted",
  success: "text-success bg-success/20",
  alert: "text-warning bg-warning/20",
};

const mockActivities: ActivityType[] = [
  { id: "1", type: "user", title: "New user registered", description: "Sarah Chen joined the workspace", timestamp: "2 minutes ago" },
  { id: "2", type: "report", title: "Weekly report generated", description: "Analytics report for Dec 15-22", timestamp: "1 hour ago" },
  { id: "3", type: "billing", title: "Payment received", description: "Invoice #1234 paid successfully", timestamp: "3 hours ago" },
  { id: "4", type: "success", title: "Automation completed", description: "Weekly email campaign sent to 2,456 users", timestamp: "5 hours ago" },
  { id: "5", type: "alert", title: "API rate limit warning", description: "80% of daily API quota used", timestamp: "6 hours ago" },
  { id: "6", type: "system", title: "System maintenance", description: "Scheduled maintenance completed", timestamp: "Yesterday" },
];

const ActivityFeed = () => {
  return (
    <Card className="p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <Badge variant="secondary" className="text-xs border-success text-success">
          Live
        </Badge>
      </div>

      <div className="space-y-2">
        {mockActivities.map((activity, index) => {
          const Icon = activityIcons[activity.type];
          const colorClass = activityColors[activity.type];

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-start gap-3 group hover:bg-muted/30 p-2 rounded-lg transition-colors cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0 border border-current/50`}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {activity.description}
                </p>
              </div>
              <p className="text-xs text-muted-foreground flex-shrink-0 mt-1">
                {activity.timestamp}
              </p>
            </motion.div>
          );
        })}
      </div>

      <button className="w-full mt-4 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
        View all activity →
      </button>
    </Card>
  );
}

// --- QUICK ACTIONS COMPONENT ---

type ButtonVariant = "default" | "outline" | "ghost" | "link" | "secondary" | "destructive" | null | undefined;

const actions: {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  variant?: ButtonVariant;
}[] = [
  { id: "invite", label: "Invite User", icon: UserPlus, variant: "default" },
  { id: "report", label: "Generate Report", icon: FileText, variant: "outline" },
  { id: "automation", label: "New Automation", icon: Zap, variant: "outline" },
  { id: "analytics", label: "View Analytics", icon: BarChart3, variant: "outline" },
  { id: "email", label: "Send Campaign", icon: Mail, variant: "outline" },
  { id: "settings", label: "Settings", icon: Settings, variant: "ghost" },
];

const QuickActions = () => {
  return (
    <Card className="p-6 h-full">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Quick Actions</h3>

      <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Button
                variant={action.variant}
                className="w-full h-auto flex flex-col items-center justify-center py-4 gap-2 text-center hover:scale-[1.02] transition-transform"
                onClick={() => console.log(`Action: ${action.label}`)}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{action.label}</span>
              </Button>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

// --- REVENUE CHART COMPONENT ---

const revenueData = [
  { month: "Jan", revenue: 4500, target: 4000 },
  { month: "Feb", revenue: 5200, target: 5000 },
  { month: "Mar", revenue: 4800, target: 5500 },
  { month: "Apr", revenue: 6100, target: 6000 },
  { month: "May", revenue: 7300, target: 6500 },
  { month: "Jun", revenue: 8200, target: 7500 },
  { month: "Jul", revenue: 7800, target: 8000 },
  { month: "Aug", revenue: 9100, target: 8500 },
  { month: "Sep", revenue: 8900, target: 9000 },
  { month: "Oct", revenue: 10200, target: 9500 },
  { month: "Nov", revenue: 11500, target: 10500 },
  { month: "Dec", revenue: 12800, target: 12000 },
];

const RevenueChart = () => {
  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Revenue Trend</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Monthly revenue vs target
          </p>
        </div>
        <div className="flex items-center gap-4 mt-3 sm:mt-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full text-info bg-info" />
            <span className="text-xs text-muted-foreground">Target</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={revenueData}>
          <defs>
            {/* Using CSS variables defined in AppShell for Recharts */}
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--color-info))" stopOpacity={0.5} />
              <stop offset="95%" stopColor="hsl(var(--color-info))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            itemStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            name="Actual Revenue"
          />
          <Area
            type="monotone"
            dataKey="target"
            stroke="hsl(var(--color-info))"
            strokeWidth={2}
            strokeDasharray="5 5"
            fillOpacity={1}
            fill="url(#colorTarget)"
            name="Target Revenue"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

// --- USER ACTIVITY CHART COMPONENT ---

const activityData = [
  { day: "Mon", active: 1240, new: 85 },
  { day: "Tue", active: 1380, new: 102 },
  { day: "Wed", active: 1520, new: 95 },
  { day: "Thu", active: 1650, new: 118 },
  { day: "Fri", active: 1890, new: 145 },
  { day: "Sat", active: 980, new: 68 },
  { day: "Sun", active: 1120, new: 72 },
];

const UserActivityChart = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">User Activity</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Active vs new users this week
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={activityData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="day"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            itemStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend
            wrapperStyle={{
              fontSize: "12px",
              paddingTop: '10px'
            }}
          />
          <Bar
            dataKey="active"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            name="Active Users"
          />
          <Bar
            dataKey="new"
            fill="hsl(var(--success))"
            radius={[4, 4, 0, 0]}
            name="New Users"
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// --- MAIN NEXT.JS PAGE COMPONENT (App) ---

const kpiCards = [
  { title: "Total Revenue", value: "$45,231", change: "+20.1%", icon: DollarSign, trend: "up" },
  { title: "Active Users", value: "2,345", change: "+12.5%", icon: Users, trend: "up" },
  { title: "Conversion Rate", value: "3.24%", change: "+4.2%", icon: TrendingUp, trend: "up" },
  { title: "System Health", value: "99.9%", change: "Optimal", icon: Activity, trend: "stable" },
];

const DashboardPage = () => {
  // Get user from Redux
  const { user } = useSelector((state: RootState) => state.auth);

  return (
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header with personalized greeting */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.name || 'User'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your <strong>NovaPulse</strong> workspace.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCards.map((kpi, index) => {
            const Icon = kpi.icon;
            let trendColorClass = '';
            if (kpi.trend === "up") trendColorClass = "text-success";
            else if (kpi.trend === "down") trendColorClass = "text-danger";
            else trendColorClass = "text-muted-foreground";

            return (
              <motion.div
                key={kpi.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{kpi.title}</p>
                      <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                      <p className={`text-sm mt-2 ${trendColorClass}`}>
                        {kpi.change}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <RevenueChart />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <UserActivityChart />
          </motion.div>
        </div>

        {/* Quick Actions & Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="lg:col-span-1"
          >
            <QuickActions />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            className="lg:col-span-2"
          >
            <ActivityFeed />
          </motion.div>
        </div>
      </div>
  );
}

export default DashboardPage;