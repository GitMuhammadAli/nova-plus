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
import {
  Search,
  Filter,
  Download,
  Loader2,
  Shield,
  AlertTriangle,
  Info,
  XCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { fetchAuditLogs } from "@/app/store/auditSlice";

interface AuditLog {
  _id: string;
  action: string;
  resource: string;
  resourceId?: string;
  userId?: any;
  userName?: string;
  companyId?: any;
  metadata?: any;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { logs, isLoading, pagination } = useSelector(
    (state: RootState) => state.audit
  );
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (user) {
      dispatch(
        fetchAuditLogs({
          page,
          limit: 20,
          action: actionFilter !== "all" ? actionFilter : undefined,
          resource: resourceFilter !== "all" ? resourceFilter : undefined,
        })
      );
    }
  }, [user, page, actionFilter, resourceFilter, dispatch]);

  // Search is handled client-side for now
  // useEffect(() => {
  //   const debounce = setTimeout(() => {
  //     if (page === 1) {
  //       fetchLogs();
  //     } else {
  //       setPage(1);
  //     }
  //   }, 500);

  //   return () => clearTimeout(debounce);
  // }, [search]);

  const getActionIcon = (action: string) => {
    if (action.includes("delete") || action.includes("remove")) {
      return <XCircle className="w-4 h-4 text-destructive" />;
    }
    if (action.includes("update") || action.includes("change")) {
      return <AlertTriangle className="w-4 h-4 text-warning" />;
    }
    return <Info className="w-4 h-4 text-primary" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes("delete") || action.includes("remove")) {
      return "bg-destructive/10 text-destructive border-destructive/20";
    }
    if (action.includes("update") || action.includes("change")) {
      return "bg-warning/10 text-warning border-warning/20";
    }
    return "bg-primary/10 text-primary border-primary/20";
  };

  const formatAction = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const filteredLogs = Array.isArray(logs) ? logs.filter((log) => {
    const matchesSearch =
      search === "" ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.resource?.toLowerCase().includes(search.toLowerCase()) ||
      log.description?.toLowerCase().includes(search.toLowerCase()) ||
      log.userName?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  }) : [];

  const handleExport = () => {
    const csv = [
      ["Timestamp", "Action", "Resource", "User", "Description"].join(","),
      ...logs.map((log) =>
        [
          new Date(log.createdAt).toISOString(),
          log.action,
          log.resource,
          log.userName || log.userId?.name || log.userId?.email || "System",
          log.description || `${log.action} ${log.resource}`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Audit logs exported successfully",
    });
  };

  return (
    <AppShell>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground mt-1">
              Track all system activities and changes
            </p>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="user_created">User Created</SelectItem>
              <SelectItem value="user_updated">User Updated</SelectItem>
              <SelectItem value="user_deleted">User Deleted</SelectItem>
              <SelectItem value="workflow_executed">
                Workflow Executed
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Resources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="department">Department</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="task">Task</SelectItem>
              <SelectItem value="invite">Invite</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold">Timestamp</th>
                    <th className="text-left p-4 font-semibold">Action</th>
                    <th className="text-left p-4 font-semibold">Resource</th>
                    <th className="text-left p-4 font-semibold">User</th>
                    <th className="text-left p-4 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, index) => (
                    <motion.tr
                      key={log._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4 text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span className="font-medium">
                            {formatAction(log.action)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <Badge
                          variant="outline"
                          className={getActionColor(log.action)}
                        >
                          {log.resource}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">
                        {log.userName ||
                          log.userId?.name ||
                          log.userId?.email ||
                          "System"}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {log.description || `${log.action} ${log.resource}`}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredLogs.length === 0 && logs.length > 0 && (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">
                  No logs match your filters
                </p>
              </div>
            )}

            {logs.length === 0 && (
              <div className="p-12 text-center">
                <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No audit logs found</p>
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() =>
                    setPage((p) => Math.min(pagination.pages, p + 1))
                  }
                  disabled={page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </AppShell>
  );
}
