"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Loader2, Mail, Webhook, Workflow, FileText } from "lucide-react";
import { queueAPI } from "@/app/services";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole } from "@/types/user";

interface QueueStats {
  email: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
  webhook: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
  workflow: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
  report: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
}

export default function JobsPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await queueAPI.getStats();
      const data = response.data?.data?.stats || response.data?.stats || response.data;
      setStats(data);
      setLastUpdated(new Date());
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch queue stats",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getQueueIcon = (queueName: string) => {
    switch (queueName) {
      case "email":
        return <Mail className="w-5 h-5" />;
      case "webhook":
        return <Webhook className="w-5 h-5" />;
      case "workflow":
        return <Workflow className="w-5 h-5" />;
      case "report":
        return <FileText className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getTotalJobs = (queue: QueueStats[keyof QueueStats]) => {
    return (
      queue.waiting +
      queue.active +
      queue.completed +
      queue.failed +
      queue.delayed +
      queue.paused
    );
  };

  const queues = stats
    ? [
        { name: "Email", key: "email" as const, stats: stats.email },
        { name: "Webhook", key: "webhook" as const, stats: stats.webhook },
        { name: "Workflow", key: "workflow" as const, stats: stats.workflow },
        { name: "Report", key: "report" as const, stats: stats.report },
      ]
    : [];

  return (
    <RoleGuard requiredRoles={[UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER]}>
      <div className="space-y-6 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Job Queue Status</h1>
            <p className="text-muted-foreground mt-1">
              Monitor background job processing across all queues
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <p className="text-sm text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
            <Button onClick={fetchStats} variant="outline" disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Queue Stats Grid */}
        {isLoading && !stats ? (
          <Card className="p-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Loading queue statistics...</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {queues.map((queue) => {
              const total = getTotalJobs(queue.stats);
              const isHealthy = queue.stats.failed < 10 && queue.stats.waiting < 100;

              return (
                <Card key={queue.key} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getQueueIcon(queue.key)}
                      <h3 className="text-xl font-semibold">{queue.name}</h3>
                    </div>
                    {isHealthy ? (
                      <Badge className="bg-green-500 hover:bg-green-600">Healthy</Badge>
                    ) : (
                      <Badge variant="destructive">Attention Needed</Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Jobs</span>
                      <span className="font-semibold">{total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Waiting</span>
                      <Badge variant="outline">{queue.stats.waiting}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active</span>
                      <Badge className="bg-blue-500 hover:bg-blue-600">
                        {queue.stats.active}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Completed</span>
                      <Badge className="bg-green-500 hover:bg-green-600">
                        {queue.stats.completed}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Failed</span>
                      <Badge variant="destructive">{queue.stats.failed}</Badge>
                    </div>
                    {queue.stats.delayed > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Delayed</span>
                        <Badge variant="secondary">{queue.stats.delayed}</Badge>
                      </div>
                    )}
                    {queue.stats.paused > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Paused</span>
                        <Badge variant="secondary">{queue.stats.paused}</Badge>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {total > 0 && (
                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>
                          {Math.round(
                            (queue.stats.completed / total) * 100
                          )}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${(queue.stats.completed / total) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        {stats && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {Object.values(stats).reduce(
                    (sum, queue) => sum + queue.waiting + queue.active,
                    0
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {Object.values(stats).reduce((sum, queue) => sum + queue.completed, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {Object.values(stats).reduce((sum, queue) => sum + queue.failed, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {Object.values(stats).reduce(
                    (sum, queue) =>
                      sum +
                      queue.waiting +
                      queue.active +
                      queue.completed +
                      queue.failed +
                      queue.delayed +
                      queue.paused,
                    0
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </RoleGuard>
  );
}

