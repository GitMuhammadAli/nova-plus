"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  Database,
  Server,
  MemoryStick,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HardDrive,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function StatusIcon({ status }: { status: string }) {
  if (status === "connected" || status === "healthy") {
    return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
  }
  if (status === "degraded" || status === "unknown") {
    return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
  }
  return <XCircle className="w-5 h-5 text-red-400" />;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
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
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
        map[status] || map.unknown
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full animate-pulse ${
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

function MemoryBar({
  label,
  used,
  total,
}: {
  label: string;
  used: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-sm text-gray-300 font-medium">
          {used}MB / {total}MB
        </span>
      </div>
      <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pct > 80
              ? "bg-red-500"
              : pct > 60
              ? "bg-yellow-500"
              : "bg-indigo-500"
          }`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{pct}% used</p>
    </div>
  );
}

export default function AdminSystemPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/system");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to fetch health data");
      }
      const data = await res.json();
      setHealth(data);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  if (loading && !health) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-400" />
            System Health
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-44 bg-white/[0.04]" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !health) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertTriangle className="w-12 h-12 text-orange-400" />
        <h2 className="text-lg font-semibold text-white">
          Failed to load system health
        </h2>
        <p className="text-gray-400 text-sm">{error}</p>
        <Button onClick={fetchHealth} variant="outline" className="cursor-pointer border-white/10 text-gray-300 hover:bg-white/5">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!health) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-400" />
            System Health
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Last checked: {new Date(health.timestamp).toLocaleString()}
          </p>
        </div>
        <Button
          onClick={fetchHealth}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Service status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* MongoDB */}
        <Card className="bg-[#12121e] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              MongoDB
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Status</span>
              <StatusBadge status={health.mongodb.status} />
            </div>
            {health.mongodb.details?.version && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Version</span>
                <span className="text-sm text-gray-300">
                  {health.mongodb.details.version}
                </span>
              </div>
            )}
            {health.mongodb.details?.uptime && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Uptime</span>
                <span className="text-sm text-gray-300">
                  {Math.round(health.mongodb.details.uptime / 3600)}h
                </span>
              </div>
            )}
            {health.mongodb.dbStats && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Collections</span>
                  <span className="text-sm text-gray-300">
                    {health.mongodb.dbStats.collections}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Data Size</span>
                  <span className="text-sm text-gray-300">
                    {health.mongodb.dbStats.dataSize}MB
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Indexes</span>
                  <span className="text-sm text-gray-300">
                    {health.mongodb.dbStats.indexes} ({health.mongodb.dbStats.indexSize}MB)
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Redis */}
        <Card className="bg-[#12121e] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-red-400" />
              Redis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Status</span>
              <StatusBadge status={health.redis.status} />
            </div>
            <p className="text-xs text-gray-500">
              Status reported via NestJS backend health endpoint
            </p>
          </CardContent>
        </Card>

        {/* NestJS Backend */}
        <Card className="bg-[#12121e] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" />
              NestJS Backend
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Status</span>
              <StatusBadge status={health.backend.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">URL</span>
              <span className="text-xs text-gray-300 font-mono">
                {health.backend.url}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Memory */}
      <Card className="bg-[#12121e] border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <MemoryStick className="w-4 h-4 text-purple-400" />
            Memory Usage (Next.js Process)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MemoryBar
              label="Heap Memory"
              used={health.memory.heapUsed}
              total={health.memory.heapTotal}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-2xl font-bold text-white">
                  {health.memory.rss}MB
                </p>
                <p className="text-xs text-gray-400 mt-1">RSS Memory</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-2xl font-bold text-white">
                  {health.memory.external}MB
                </p>
                <p className="text-xs text-gray-400 mt-1">External</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment Config */}
      <Card className="bg-[#12121e] border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-400" />
            Environment Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(health.environment || {}).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
              >
                <span className="text-sm text-gray-400 font-mono text-xs">
                  {key}
                </span>
                {typeof value === "boolean" ? (
                  value ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )
                ) : (
                  <span className="text-xs text-gray-300">{String(value)}</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
