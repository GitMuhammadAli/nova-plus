"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Server,
  Database,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Cpu,
  Wifi,
} from "lucide-react";
import { api } from "@/lib/api";

interface SystemStatus {
  status: string;
  version: string;
  environment: string;
  uptime: { seconds: number; human: string };
  startedAt: string;
  services: {
    mongodb: { status: string };
    redis: { status: string };
  };
  memory: {
    heapUsed: string;
    heapTotal: string;
    rss: string;
    external: string;
  };
  runtime: {
    nodeVersion: string;
    platform: string;
    pid: number;
  };
  timestamp: string;
}

export default function SystemStatusPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/health/status");
      setStatus(response.data?.data || response.data);
      setLastRefreshed(new Date());
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch system status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const getStatusIcon = (s: string) => {
    if (s === "up" || s === "healthy") return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (s === "degraded") return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = (s: string) => {
    if (s === "up" || s === "healthy")
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Operational</Badge>;
    if (s === "degraded")
      return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Degraded</Badge>;
    return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Down</Badge>;
  };

  const parseMemoryMB = (memStr: string): number => {
    return parseFloat(memStr.replace("MB", ""));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            System Status
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor the health and performance of NovaPulse services
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={fetchStatus} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      {status && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusIcon(status.status)}
              <div>
                <h2 className="text-xl font-semibold">
                  {status.status === "healthy" ? "All Systems Operational" : "Service Degradation Detected"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Version {status.version} &middot; {status.environment} environment
                </p>
              </div>
            </div>
            {getStatusBadge(status.status)}
          </div>
        </Card>
      )}

      {/* Services Grid */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* API Server */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">API Server</h3>
              </div>
              {getStatusBadge("healthy")}
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Uptime</span>
                <span className="font-medium text-foreground">{status.uptime.human}</span>
              </div>
              <div className="flex justify-between">
                <span>PID</span>
                <span className="font-medium text-foreground">{status.runtime.pid}</span>
              </div>
              <div className="flex justify-between">
                <span>Started</span>
                <span className="font-medium text-foreground">
                  {new Date(status.startedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>

          {/* MongoDB */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">MongoDB</h3>
              </div>
              {getStatusBadge(status.services.mongodb.status)}
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Connection</span>
                <span className="font-medium text-foreground">
                  {status.services.mongodb.status === "up" ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Type</span>
                <span className="font-medium text-foreground">Primary</span>
              </div>
            </div>
          </Card>

          {/* Redis */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Wifi className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Redis</h3>
              </div>
              {getStatusBadge(status.services.redis.status)}
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Connection</span>
                <span className="font-medium text-foreground">
                  {status.services.redis.status === "up" ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Use</span>
                <span className="font-medium text-foreground">Cache & Sessions</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Memory & Runtime */}
      {status && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Memory Usage */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <HardDrive className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Memory Usage</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Heap Used</span>
                  <span className="font-medium">
                    {status.memory.heapUsed} / {status.memory.heapTotal}
                  </span>
                </div>
                <Progress
                  value={
                    (parseMemoryMB(status.memory.heapUsed) / parseMemoryMB(status.memory.heapTotal)) * 100
                  }
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">RSS (Total)</span>
                  <span className="font-medium">{status.memory.rss}</span>
                </div>
                <Progress value={Math.min((parseMemoryMB(status.memory.rss) / 500) * 100, 100)} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">External</span>
                  <span className="font-medium">{status.memory.external}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Runtime Info */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Cpu className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Runtime Information</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Node.js Version</span>
                <span className="font-medium">{status.runtime.nodeVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform</span>
                <span className="font-medium capitalize">{status.runtime.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Environment</span>
                <Badge variant="outline" className="capitalize">
                  {status.environment}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">API Version</span>
                <span className="font-medium">v{status.version}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Server Time</span>
                <span className="font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(status.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !status && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
