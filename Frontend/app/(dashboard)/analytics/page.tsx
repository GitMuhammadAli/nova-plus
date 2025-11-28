"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  Activity,
  DollarSign,
  Download,
  Calendar,
  Loader2,
} from "lucide-react";
import { analyticsAPI } from "@/app/services";
import { useToast } from "@/hooks/use-toast";

interface TrafficDataPoint {
  date: string;
  visitors: number;
  pageviews: number;
  sessions: number;
}

interface DeviceData {
  name: string;
  value: number;
  color: string;
}

interface ConversionData {
  stage: string;
  count: number;
  rate: number;
}

interface TopPageData {
  page: string;
  views: number;
  avgTime: string;
}

interface AnalyticsStats {
  totalVisitors: number;
  avgSessionDuration: string;
  conversionRate: number;
  revenue: number;
  trafficData: TrafficDataPoint[];
  deviceData: DeviceData[];
  conversionData: ConversionData[];
  topPages: TopPageData[];
  period: string;
  growth: {
    visitors: number;
    sessions: number;
    conversion: number;
    revenue: number;
  };
}

export default function Analytics() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("6m");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);

  // Track page visit
  useEffect(() => {
    if (user) {
      const trackVisit = async () => {
        try {
          await analyticsAPI.trackVisit({
            page: "/analytics",
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            device: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
              ? "mobile"
              : "desktop",
          });
        } catch (error) {
          // Silent fail - don't interrupt user experience
          console.error("Failed to track visit:", error);
        }
      };
      trackVisit();
    }
  }, [user]);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const response = await analyticsAPI.getStats(timeRange);
        if (response.data) {
          setStats(response.data);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description:
            error.response?.data?.message || "Failed to load analytics",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange, user, toast]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!user || !stats) return;

    const interval = setInterval(async () => {
      try {
        const response = await analyticsAPI.getStats(timeRange);
        if (response.data) {
          setStats(response.data);
        }
      } catch (error) {
        // Silent fail for auto-refresh
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [timeRange, user, stats]);

  const handleExport = () => {
    if (!stats) return;

    const dataStr = JSON.stringify(stats, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-${timeRange}-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Analytics data exported successfully",
    });
  };

  // Safe stats access with defaults
  const safeStats = (stats as AnalyticsStats) || {};
  const totalVisitors = safeStats.totalVisitors ?? 0;
  const avgSessionDuration = safeStats.avgSessionDuration || "0m 0s";
  const conversionRate = safeStats.conversionRate ?? 0;
  const revenue = safeStats.revenue ?? 0;
  const growth = safeStats.growth || {};

  const statsCards = [
    {
      label: "Total Visitors",
      value: totalVisitors.toLocaleString(),
      change: growth.visitors ? `+${growth.visitors.toFixed(1)}%` : "0%",
      icon: Users,
      trend: "up",
    },
    {
      label: "Avg. Session Duration",
      value: avgSessionDuration,
      change: growth.sessions ? `+${growth.sessions.toFixed(1)}%` : "0%",
      icon: Activity,
      trend: "up",
    },
    {
      label: "Conversion Rate",
      value: `${conversionRate.toFixed(1)}%`,
      change: growth.conversion ? `+${growth.conversion.toFixed(1)}%` : "0%",
      icon: TrendingUp,
      trend: "up",
    },
    {
      label: "Revenue",
      value: `$${revenue.toLocaleString()}`,
      change: growth.revenue ? `+${growth.revenue.toFixed(1)}%` : "0%",
      icon: DollarSign,
      trend: "up",
    },
  ];

  if (loading && !stats) {
    return (
      <AppShell>
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!stats) {
    return (
      <AppShell>
        <div className="p-8">
          <Card className="p-6">
            <p className="text-muted-foreground">No analytics data available</p>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Track your performance metrics and insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="3m">Last 3 months</SelectItem>
                <SelectItem value="6m">Last 6 months</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </span>
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-success flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.change} from last period
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="traffic" className="space-y-6">
          <TabsList>
            <TabsTrigger value="traffic">Traffic</TabsTrigger>
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="pages">Top Pages</TabsTrigger>
          </TabsList>

          {/* Traffic Tab */}
          <TabsContent value="traffic" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Traffic Overview</h3>
              {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={stats?.trafficData || []}>
                    <defs>
                      <linearGradient id="visitors" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="pageviews"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--success))"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--success))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="visitors"
                      stroke="hsl(var(--primary))"
                      fill="url(#visitors)"
                      name="Visitors"
                    />
                    <Area
                      type="monotone"
                      dataKey="pageviews"
                      stroke="hsl(var(--success))"
                      fill="url(#pageviews)"
                      name="Page Views"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>
          </TabsContent>

          {/* Conversion Tab */}
          <TabsContent value="conversion" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
              {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={stats?.conversionData || []}
                      layout="vertical"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        type="number"
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis
                        dataKey="stage"
                        type="category"
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="hsl(var(--primary))"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-4 gap-4">
                    {(stats?.conversionData || []).map((item) => (
                      <div key={item.stage} className="text-center">
                        <div className="text-2xl font-bold">
                          {item.rate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.stage}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Device Distribution
                </h3>
                {loading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={
                          stats?.deviceData?.map(({ name, value, color }) => ({
                            name,
                            value,
                            color,
                          })) || []
                        }
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: {
                          name?: string;
                          payload?: { value?: number };
                        }) =>
                          `${props.name}: ${
                            props.payload &&
                            typeof props.payload.value === "number"
                              ? props.payload.value
                              : ""
                          }%`
                        }
                        outerRadius={100}
                        dataKey="value"
                      >
                        {(stats?.deviceData || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Device Stats</h3>
                <div className="space-y-4">
                  {(stats?.deviceData || []).map((device) => (
                    <div
                      key={device.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: device.color }}
                        />
                        <span className="font-medium">{device.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{device.value}%</div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round(
                            (device.value / 100) * (stats?.totalVisitors || 0)
                          ).toLocaleString()}{" "}
                          users
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Top Pages Tab */}
          <TabsContent value="pages" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Top Performing Pages
              </h3>
              {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-3">
                  {(stats?.topPages || []).length > 0 ? (
                    (stats?.topPages || []).map((page, index) => (
                      <div
                        key={page.page}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-muted-foreground w-8">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{page.page}</div>
                            <div className="text-sm text-muted-foreground">
                              Avg. time: {page.avgTime}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">
                            {page.views.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            views
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No page data available yet
                    </p>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
