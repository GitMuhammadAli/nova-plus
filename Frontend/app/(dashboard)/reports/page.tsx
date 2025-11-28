"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/app/store/store";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Download,
  FileText,
  Calendar,
  Loader2,
  TrendingUp,
  Users,
  Building2,
  CheckSquare,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { fetchAuditLogs } from "@/app/store/auditSlice";
import { fetchUsers } from "@/app/store/usersSlice";
import { fetchDepartments } from "@/app/store/departmentsSlice";
import { fetchProjects } from "@/app/store/projectsSlice";
import { fetchTasks } from "@/app/store/tasksSlice";

export default function ReportsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { logs } = useSelector((state: RootState) => state.audit);
  const { users } = useSelector((state: RootState) => state.users);
  const { departments } = useSelector((state: RootState) => state.departments);
  const { projects } = useSelector((state: RootState) => state.projects);
  const { tasks } = useSelector((state: RootState) => state.tasks);

  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("summary");
  const [dateRange, setDateRange] = useState("30d");

  useEffect(() => {
    if (user) {
      loadReportData();
    }
  }, [user, dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        dispatch(fetchAuditLogs({ page: 1, limit: 100 })),
        dispatch(fetchUsers({})),
        dispatch(fetchDepartments()),
        dispatch(fetchProjects({})),
        dispatch(fetchTasks({})),
      ]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: "csv" | "json" = "csv") => {
    let data: any = {};
    let filename = "";

    switch (reportType) {
      case "summary":
        data = {
          totalUsers: users.length,
          totalDepartments: departments.length,
          totalProjects: projects.length,
          totalTasks: tasks.length,
          totalAuditLogs: logs.length,
        };
        filename = `summary-report-${new Date().toISOString().split("T")[0]}`;
        break;
      case "users":
        data = users;
        filename = `users-report-${new Date().toISOString().split("T")[0]}`;
        break;
      case "audit":
        data = logs;
        filename = `audit-report-${new Date().toISOString().split("T")[0]}`;
        break;
      default:
        data = {};
    }

    if (format === "csv") {
      const csv = convertToCSV(data);
      downloadFile(csv, `${filename}.csv`, "text/csv");
    } else {
      downloadFile(
        JSON.stringify(data, null, 2),
        `${filename}.json`,
        "application/json"
      );
    }

    toast({
      title: "Exported",
      description: `Report exported as ${format.toUpperCase()}`,
    });
  };

  const convertToCSV = (data: any): string => {
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      const rows = data.map((item) =>
        headers.map((header) => item[header] || "").join(",")
      );
      return [headers.join(","), ...rows].join("\n");
    }
    return Object.entries(data)
      .map(([key, value]) => `${key},${value}`)
      .join("\n");
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summaryStats = [
    {
      label: "Total Users",
      value: users.length,
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Departments",
      value: departments.length,
      icon: Building2,
      color: "text-success",
    },
    {
      label: "Projects",
      value: projects.length,
      icon: FileText,
      color: "text-warning",
    },
    {
      label: "Tasks",
      value: tasks.length,
      icon: CheckSquare,
      color: "text-info",
    },
  ];

  return (
    <AppShell>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground mt-1">
              Generate and export comprehensive reports
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => handleExport("csv")}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport("json")}>
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>

        <Tabs
          value={reportType}
          onValueChange={setReportType}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="summary" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {summaryStats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              {stat.label}
                            </span>
                            <Icon className={`w-5 h-5 ${stat.color}`} />
                          </div>
                          <div className="text-3xl font-bold">
                            {stat.value.toLocaleString()}
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Recent Activity
                  </h3>
                  <div className="space-y-2">
                    {Array.isArray(logs) && logs.length > 0 ? (
                      logs.slice(0, 10).map((log, index) => (
                        <motion.div
                          key={log._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{log.resource}</Badge>
                            <span className="text-sm">
                              {log.description ||
                                `${log.action} ${log.resource}`}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </span>
                        </motion.div>
                      ))
                    ) : (
                      <div className="p-12 text-center">
                        <p className="text-muted-foreground">
                          No recent activity
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Users Report</h3>
                  <div className="space-y-2">
                    {!Array.isArray(users) || users.length === 0 ? (
                      <div className="p-12 text-center">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No users found</p>
                      </div>
                    ) : (
                      Array.isArray(users) &&
                      users.map((user, index) => (
                        <motion.div
                          key={user._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div>
                            <div className="font-medium">
                              {user.name || user.email}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                          <Badge variant="outline">{user.role}</Badge>
                        </motion.div>
                      ))
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="audit" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Audit Logs Report
                  </h3>
                  <div className="space-y-2">
                    {!Array.isArray(logs) || logs.length === 0 ? (
                      <div className="p-12 text-center">
                        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No audit logs found
                        </p>
                      </div>
                    ) : (
                      Array.isArray(logs) &&
                      logs.slice(0, 50).map((log, index) => (
                        <motion.div
                          key={log._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{log.resource}</Badge>
                            <span className="text-sm font-medium">
                              {log.action}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {log.description ||
                                `${log.action} ${log.resource}`}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm">
                              {log.userName || "System"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Activity Overview
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-medium">Projects</h4>
                      <div className="text-2xl font-bold">
                        {projects.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {
                          projects.filter((p: any) => p.status === "active")
                            .length
                        }{" "}
                        active
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Tasks</h4>
                      <div className="text-2xl font-bold">{tasks.length}</div>
                      <div className="text-sm text-muted-foreground">
                        {
                          tasks.filter((t: any) => t.status === "pending")
                            .length
                        }{" "}
                        pending
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </AppShell>
  );
}
