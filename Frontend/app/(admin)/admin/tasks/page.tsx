"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ListTodo,
  RefreshCw,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
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

const STATUS_COLORS: Record<string, string> = {
  todo: "#6b7280",
  pending: "#eab308",
  in_progress: "#3b82f6",
  review: "#a855f7",
  done: "#22c55e",
  completed: "#22c55e",
  cancelled: "#ef4444",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  urgent: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
  none: "#6b7280",
};

export default function AdminTasksPage() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
      });
      const res = await fetch(`/api/admin/tasks?${params}`);
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to fetch tasks");
      }
      const result = await res.json();
      setData(result);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-indigo-400" />
            Tasks Overview
          </h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 bg-white/[0.04]" />
          <Skeleton className="h-80 bg-white/[0.04]" />
        </div>
        <Skeleton className="h-64 bg-white/[0.04]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertTriangle className="w-12 h-12 text-orange-400" />
        <h2 className="text-lg font-semibold text-white">Failed to load tasks</h2>
        <p className="text-gray-400 text-sm">{error}</p>
        <Button onClick={fetchTasks} variant="outline" className="cursor-pointer border-white/10 text-gray-300 hover:bg-white/5">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const statusChartData = Object.entries(data.statusCounts || {}).map(
    ([name, value]) => ({
      name: name.replace(/_/g, " "),
      value: value as number,
      fill: STATUS_COLORS[name] || "#6b7280",
    })
  );

  const priorityChartData = Object.entries(data.priorityCounts || {}).map(
    ([name, value]) => ({
      name,
      count: value as number,
      fill: PRIORITY_COLORS[name] || "#6b7280",
    })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-indigo-400" />
            Tasks Overview
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {data.total} total tasks, {data.overdue} overdue
          </p>
        </div>
        <Button
          onClick={fetchTasks}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-[#12121e] border-white/[0.06]">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{data.total}</p>
            <p className="text-xs text-gray-400">Total Tasks</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121e] border-white/[0.06]">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {(data.statusCounts?.done || 0) + (data.statusCounts?.completed || 0)}
            </p>
            <p className="text-xs text-gray-400">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121e] border-white/[0.06]">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">
              {data.statusCounts?.in_progress || 0}
            </p>
            <p className="text-xs text-gray-400">In Progress</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121e] border-orange-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">{data.overdue}</p>
            <p className="text-xs text-gray-400">Overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <Card className="bg-[#12121e] border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-300">
              Task Distribution by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusChartData.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-12">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={false}
                  >
                    {statusChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a2e",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "8px",
                      color: "#e5e7eb",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Task Priority Distribution */}
        <Card className="bg-[#12121e] border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-300">
              Task Distribution by Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            {priorityChartData.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-12">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={priorityChartData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                  />
                  <YAxis
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a2e",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "8px",
                      color: "#e5e7eb",
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {priorityChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent tasks table */}
      <Card className="bg-[#12121e] border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-300">
            Recent Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.06] hover:bg-transparent">
                  <TableHead className="text-gray-400">Task</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Priority</TableHead>
                  <TableHead className="text-gray-400">Due Date</TableHead>
                  <TableHead className="text-gray-400">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data.tasks || []).length === 0 ? (
                  <TableRow className="border-white/[0.06]">
                    <TableCell colSpan={5} className="text-center text-gray-500 py-12">
                      No tasks found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.tasks.map((task: any) => {
                    const isOverdue =
                      task.dueDate &&
                      new Date(task.dueDate) < new Date() &&
                      !["done", "completed", "cancelled"].includes(task.status);
                    return (
                      <TableRow key={task._id} className="border-white/[0.06] hover:bg-white/[0.02]">
                        <TableCell>
                          <p className="text-sm text-gray-200 font-medium truncate max-w-[250px]">
                            {task.title || task.name || "Untitled"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize"
                            style={{
                              backgroundColor: `${STATUS_COLORS[task.status] || "#6b7280"}20`,
                              color: STATUS_COLORS[task.status] || "#6b7280",
                            }}
                          >
                            {(task.status || "unknown").replace(/_/g, " ")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize"
                            style={{
                              backgroundColor: `${PRIORITY_COLORS[task.priority] || "#6b7280"}20`,
                              color: PRIORITY_COLORS[task.priority] || "#6b7280",
                            }}
                          >
                            {task.priority || "none"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {isOverdue && (
                              <Clock className="w-3.5 h-3.5 text-orange-400" />
                            )}
                            <span
                              className={`text-sm ${
                                isOverdue ? "text-orange-400" : "text-gray-500"
                              }`}
                            >
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString()
                                : "No due date"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {task.createdAt
                            ? new Date(task.createdAt).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {(data.totalPages || 1) > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {data.totalPages} ({data.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= (data.totalPages || 1)}
              onClick={() => setPage(page + 1)}
              className="text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
