"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Building2,
  FolderKanban,
  ListTodo,
  Activity,
  Shield,
  Clock,
  AlertTriangle,
  Database,
  Server,
  MemoryStick,
  RefreshCw,
  ScrollText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  users: {
    total: number;
    byRole: Record<string, number>;
    activeLastWeek: number;
    suspended: number;
  };
  companies: { total: number; active: number; withBilling: number };
  projects: { total: number; byStatus: Record<string, number> };
  tasks: {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  };
  system: {
    mongodb: string;
    redis: string;
    memory: { rss: number; heapUsed: number; heapTotal: number };
    backend: string;
  };
  recentAuditLogs: any[];
  recentActiveUsers: any[];
  timestamp: string;
}

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  color = "indigo",
}: {
  title: string;
  value: number | string;
  icon: any;
  subtitle?: string;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/20 text-indigo-400",
    mint: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400",
    coral: "from-orange-500/20 to-orange-600/10 border-orange-500/20 text-orange-400",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400",
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400",
  };
  const c = colorMap[color] || colorMap.indigo;

  return (
    <Card className={`bg-gradient-to-br ${c.split(" ").slice(0, 2).join(" ")} border ${c.split(" ")[2]} bg-[#12121e]`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {title}
            </p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${c.split(" ").slice(0, 2).join(" ")}`}>
            <Icon className={`w-5 h-5 ${c.split(" ").pop()}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HealthBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    connected: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    healthy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    disconnected: "bg-red-500/15 text-red-400 border-red-500/20",
    unreachable: "bg-red-500/15 text-red-400 border-red-500/20",
    error: "bg-red-500/15 text-red-400 border-red-500/20",
    unknown: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    degraded: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        colorMap[status] || colorMap.unknown
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === "connected" || status === "healthy"
            ? "bg-emerald-400"
            : status === "unknown" || status === "degraded"
            ? "bg-yellow-400"
            : "bg-red-400"
        }`}
      />
      {status}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-28 bg-white/[0.04]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 bg-white/[0.04]" />
        <Skeleton className="h-64 bg-white/[0.04]" />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to fetch stats");
      }
      const data = await res.json();
      setStats(data);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Loading system overview...</p>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertTriangle className="w-12 h-12 text-orange-400" />
        <h2 className="text-lg font-semibold text-white">Failed to load dashboard</h2>
        <p className="text-gray-400 text-sm">{error}</p>
        <Button onClick={fetchStats} variant="outline" className="cursor-pointer border-white/10 text-gray-300 hover:bg-white/5">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            System overview and metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            Updated {new Date(stats.timestamp).toLocaleTimeString()}
          </span>
          <Button
            onClick={fetchStats}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.users.total}
          icon={Users}
          subtitle={`${stats.users.activeLastWeek} active this week`}
          color="indigo"
        />
        <StatCard
          title="Companies"
          value={stats.companies.total}
          icon={Building2}
          subtitle={`${stats.companies.active} active`}
          color="purple"
        />
        <StatCard
          title="Projects"
          value={stats.projects.total}
          icon={FolderKanban}
          subtitle={`${stats.projects.byStatus?.active || 0} active`}
          color="mint"
        />
        <StatCard
          title="Tasks"
          value={stats.tasks.total}
          icon={ListTodo}
          subtitle={`${stats.tasks.byStatus?.done || stats.tasks.byStatus?.completed || 0} completed`}
          color="blue"
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Suspended Users"
          value={stats.users.suspended}
          icon={AlertTriangle}
          color="coral"
        />
        <StatCard
          title="With Billing"
          value={stats.companies.withBilling}
          icon={Building2}
          subtitle="Companies with billing"
          color="mint"
        />
        <StatCard
          title="Active (7d)"
          value={stats.users.activeLastWeek}
          icon={Activity}
          color="indigo"
        />
        <StatCard
          title="User Roles"
          value={Object.keys(stats.users.byRole).length}
          icon={Shield}
          subtitle={Object.entries(stats.users.byRole)
            .map(([r, c]) => `${r}: ${c}`)
            .join(", ")}
          color="purple"
        />
      </div>

      {/* Bottom sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <Card className="bg-[#12121e] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 flex items-center gap-2">
                <Database className="w-3.5 h-3.5" /> MongoDB
              </span>
              <HealthBadge status={stats.system.mongodb} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 flex items-center gap-2">
                <Database className="w-3.5 h-3.5" /> Redis
              </span>
              <HealthBadge status={stats.system.redis} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 flex items-center gap-2">
                <Server className="w-3.5 h-3.5" /> Backend
              </span>
              <HealthBadge status={stats.system.backend} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 flex items-center gap-2">
                <MemoryStick className="w-3.5 h-3.5" /> Memory
              </span>
              <span className="text-xs text-gray-300">
                {stats.system.memory.heapUsed}MB / {stats.system.memory.heapTotal}MB
              </span>
            </div>
          </CardContent>
        </Card>

        {/* User Roles Distribution */}
        <Card className="bg-[#12121e] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Users by Role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {Object.entries(stats.users.byRole).length === 0 ? (
              <p className="text-sm text-gray-500">No role data available</p>
            ) : (
              Object.entries(stats.users.byRole).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="text-xs border-white/10 text-gray-300"
                  >
                    {role}
                  </Badge>
                  <span className="text-sm font-medium text-white">{count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Task Status Distribution */}
        <Card className="bg-[#12121e] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-indigo-400" />
              Tasks by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {Object.entries(stats.tasks.byStatus).length === 0 ? (
              <p className="text-sm text-gray-500">No task data available</p>
            ) : (
              Object.entries(stats.tasks.byStatus).map(([status, count]) => {
                const statusColors: Record<string, string> = {
                  todo: "text-gray-400",
                  pending: "text-yellow-400",
                  in_progress: "text-blue-400",
                  review: "text-purple-400",
                  done: "text-emerald-400",
                  completed: "text-emerald-400",
                  cancelled: "text-red-400",
                };
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`text-sm capitalize ${statusColors[status] || "text-gray-400"}`}>
                      {status.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-medium text-white">{count}</span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Audit Logs */}
        <Card className="bg-[#12121e] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-indigo-400" />
              Recent Audit Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentAuditLogs.length === 0 ? (
              <p className="text-sm text-gray-500">No audit logs found</p>
            ) : (
              <div className="space-y-2">
                {stats.recentAuditLogs.slice(0, 5).map((log: any, i: number) => (
                  <div
                    key={log._id || i}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-300 truncate">
                        {log.action || log.type || "Action"}{" "}
                        <span className="text-gray-500">
                          on {log.resource || log.resourceType || "resource"}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString()
                          : "Unknown time"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Active Users */}
        <Card className="bg-[#12121e] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Recently Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActiveUsers.length === 0 ? (
              <p className="text-sm text-gray-500">No user activity found</p>
            ) : (
              <div className="space-y-2">
                {stats.recentActiveUsers.slice(0, 5).map((user: any, i: number) => (
                  <div
                    key={user._id || i}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-xs font-medium text-indigo-300">
                      {(user.name || user.email || "?")[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-300 truncate">
                        {user.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-white/10 text-gray-400 shrink-0"
                    >
                      {user.role || "user"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

