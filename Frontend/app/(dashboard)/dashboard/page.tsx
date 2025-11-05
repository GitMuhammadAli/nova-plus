"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import { motion } from 'framer-motion';
import {
  TrendingUp, Users, DollarSign, Activity,
  UserPlus, FileText, Settings, BarChart3, Mail, Zap,
  AlertCircle, CheckCircle, Loader2, UserMinus, Upload, Trash,
  LogIn, LogOut, Server, Edit, Plus, User,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from 'recharts';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { dashboardAPI, activityAPI } from '@/app/services';
import { DashboardSummary, DashboardStats, RecentActivity } from '@/types/dashboard';

// --- ACTIVITY FEED COMPONENT ---

const activityIconMap: Record<string, React.ComponentType<any>> = {
  UserPlus, User, UserMinus,
  Plus, Edit, CheckCircle,
  Zap, Settings, FileText,
  Upload, Trash, LogIn, LogOut, Server,
};

const getActivityTypeColor = (type: string): string => {
  if (type.includes('user')) return "text-primary bg-primary/20";
  if (type.includes('task')) return "text-info bg-info/20";
  if (type.includes('automation')) return "text-success bg-success/20";
  if (type.includes('file')) return "text-warning bg-warning/20";
  if (type.includes('report')) return "text-info bg-info/20";
  if (type.includes('settings')) return "text-muted-foreground bg-muted";
  if (type.includes('system')) return "text-muted-foreground bg-muted";
  return "text-muted-foreground bg-muted";
};

const formatTimeAgo = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
};

interface ActivityFeedProps {
  activities: RecentActivity[];
  loading: boolean;
}

const ActivityFeed = ({ activities, loading }: ActivityFeedProps) => {
  if (loading) {
    return (
      <Card className="p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <Badge variant="secondary" className="text-xs border-success text-success">
            Live
          </Badge>
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-2 rounded-lg animate-pulse">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const getIcon = (iconName?: string) => {
    const IconComponent = iconName && activityIconMap[iconName] ? activityIconMap[iconName] : Activity;
    return IconComponent;
  };

  return (
    <Card className="p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <Badge variant="secondary" className="text-xs border-success text-success">
          Live
        </Badge>
      </div>

      <div className="space-y-2">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
        ) : (
          activities.map((activity, index) => {
            const Icon = getIcon(activity.icon);
            const colorClass = getActivityTypeColor(activity.type);

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
                    {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.description || activity.target || activity.user?.name || 'System'}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground flex-shrink-0 mt-1">
                  {formatTimeAgo(activity.timestamp)}
                </p>
              </motion.div>
            );
          })
        )}
      </div>

      <button className="w-full mt-4 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
        View all activity →
      </button>
    </Card>
  );
};

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
};

// --- USER ACTIVITY CHART COMPONENT ---

interface UserActivityChartProps {
  stats: DashboardStats | null;
  loading: boolean;
}

const UserActivityChart = ({ stats, loading }: UserActivityChartProps) => {
  if (loading || !stats) {
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
        <div className="h-[300px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  // Transform stats for the chart - combine user growth and activity trend
  const chartData = stats.userGrowth.map((point, index) => ({
    day: point.label || new Date(point.date).toLocaleDateString('en-US', { weekday: 'short' }),
    active: point.value,
    new: stats.activityTrend[index]?.value || 0,
  }));

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">User Activity</h3>
          <p className="text-sm text-muted-foreground mt-1">
            User growth and activity trends
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
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
            name="User Growth"
          />
          <Bar
            dataKey="new"
            fill="hsl(var(--success))"
            radius={[4, 4, 0, 0]}
            name="Activity"
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

// --- MAIN NEXT.JS PAGE COMPONENT (App) ---

const DashboardPage = () => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to role-specific dashboard
  useEffect(() => {
    if (user) {
      const role = user.role?.toLowerCase();
      if (role === 'super_admin' || role === 'superadmin') {
        router.replace('/dashboard/super-admin');
      } else if (role === 'company_admin' || role === 'admin') {
        router.replace('/dashboard/company-admin');
      } else if (role === 'manager') {
        router.replace('/dashboard/manager');
      } else if (role === 'user') {
        router.replace('/dashboard/user');
      }
    }
  }, [user, router]);

  // Show loading while redirecting
  if (user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [summaryRes, statsRes, activitiesRes] = await Promise.all([
          dashboardAPI.getSummary().catch(err => ({ data: null, error: err })),
          dashboardAPI.getStats('30d').catch(err => ({ data: null, error: err })),
          activityAPI.getRecent(10).catch(err => ({ data: null, error: err })),
        ]);

        if (summaryRes.data) setSummary(summaryRes.data);
        if (statsRes.data) setStats(statsRes.data);
        if (activitiesRes.data) setActivities(activitiesRes.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatGrowth = (growth: number): string => {
    const sign = growth >= 0 ? '+' : '';
    return `${sign}${growth.toFixed(1)}%`;
  };

  const kpiCards = summary
    ? [
        {
          title: "Total Revenue",
          value: formatCurrency(summary.revenue.total),
          change: formatGrowth(summary.revenue.growth),
          icon: DollarSign,
          trend: summary.revenue.growth >= 0 ? "up" : "down",
        },
        {
          title: "Active Users",
          value: formatNumber(summary.users.active),
          change: formatGrowth(summary.users.growth),
          icon: Users,
          trend: summary.users.growth >= 0 ? "up" : "down",
        },
        {
          title: "Total Users",
          value: formatNumber(summary.users.total),
          change: formatGrowth(summary.users.growth),
          icon: TrendingUp,
          trend: summary.users.growth >= 0 ? "up" : "down",
        },
        {
          title: "Total Activity",
          value: formatNumber(summary.activity.total),
          change: formatGrowth(summary.activity.growth),
          icon: Activity,
          trend: summary.activity.growth >= 0 ? "up" : "down",
        },
      ]
    : [];

  if (loading && !summary) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <Card className="p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Error loading dashboard</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

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
        {loading && !summary ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-8 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/3" />
            </Card>
          ))
        ) : (
          kpiCards.map((kpi, index) => {
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
          })
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <UserActivityChart stats={stats} loading={loading} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          {/* Placeholder for second chart - can be added later */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Task Completion</h3>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : stats?.taskCompletion && stats.taskCompletion.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.taskCompletion}>
                  <defs>
                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="label"
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
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTasks)"
                    name="Tasks Completed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No task data available
              </div>
            )}
          </Card>
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
          <ActivityFeed activities={activities} loading={loading} />
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
