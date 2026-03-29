"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ScrollText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function actionColor(action: string) {
  const a = (action || "").toLowerCase();
  if (a.includes("create") || a.includes("register")) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
  if (a.includes("update") || a.includes("edit")) return "bg-blue-500/15 text-blue-400 border-blue-500/20";
  if (a.includes("delete") || a.includes("remove")) return "bg-red-500/15 text-red-400 border-red-500/20";
  if (a.includes("login") || a.includes("auth")) return "bg-indigo-500/15 text-indigo-400 border-indigo-500/20";
  if (a.includes("suspend") || a.includes("ban")) return "bg-orange-500/15 text-orange-400 border-orange-500/20";
  return "bg-gray-500/15 text-gray-400 border-gray-500/20";
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    action: "",
    resource: "",
    startDate: "",
    endDate: "",
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "30",
      });
      if (filters.action) params.set("action", filters.action);
      if (filters.resource) params.set("resource", filters.resource);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);

      const res = await fetch(`/api/admin/audit?${params}`);
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to fetch audit logs");
      }
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function handleFilterApply() {
    setPage(1);
    fetchLogs();
  }

  function handleFilterClear() {
    setFilters({ action: "", resource: "", startDate: "", endDate: "" });
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-indigo-400" />
            Audit Logs
          </h1>
          <p className="text-gray-400 text-sm mt-1">{total} total entries</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            onClick={fetchLogs}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card className="bg-[#12121e] border-white/[0.06]">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Action</label>
                <Input
                  value={filters.action}
                  onChange={(e) =>
                    setFilters({ ...filters, action: e.target.value })
                  }
                  placeholder="e.g., CREATE, UPDATE"
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-500 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Resource Type
                </label>
                <Input
                  value={filters.resource}
                  onChange={(e) =>
                    setFilters({ ...filters, resource: e.target.value })
                  }
                  placeholder="e.g., USER, PROJECT"
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-500 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                  className="bg-white/[0.04] border-white/[0.08] text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">End Date</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                  className="bg-white/[0.04] border-white/[0.08] text-white text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleFilterApply}
                size="sm"
                className="bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"
              >
                Apply Filters
              </Button>
              <Button
                onClick={handleFilterClear}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Logs */}
      <div className="space-y-2">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-16 bg-white/[0.04]" />
          ))
        ) : logs.length === 0 ? (
          <Card className="bg-[#12121e] border-white/[0.06]">
            <CardContent className="py-16 text-center">
              <ScrollText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">No audit logs found</p>
            </CardContent>
          </Card>
        ) : (
          logs.map((log) => {
            const isExpanded = expanded === log._id;
            const hasMetadata =
              log.metadata ||
              log.details ||
              log.changes ||
              log.ipAddress ||
              log.userAgent;
            return (
              <Card
                key={log._id}
                className="bg-[#12121e] border-white/[0.06] hover:border-white/[0.1] transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${actionColor(
                            log.action || log.type
                          )}`}
                        >
                          {log.action || log.type || "ACTION"}
                        </span>
                        <span className="text-sm text-gray-300">
                          {log.resource || log.resourceType || "resource"}
                        </span>
                        {log.resourceId && (
                          <span className="text-xs text-gray-500 font-mono">
                            {log.resourceId}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                        {(log.userName || log.userId || log.user?.name) && (
                          <span>
                            by {log.userName || log.user?.name || log.userId}
                          </span>
                        )}
                        <span>
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleString()
                            : "Unknown time"}
                        </span>
                        {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                      </div>

                      {/* Expandable metadata */}
                      {hasMetadata && isExpanded && (
                        <div className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                          <pre className="text-xs text-gray-400 whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(
                              log.metadata ||
                                log.details ||
                                log.changes ||
                                { ip: log.ipAddress, ua: log.userAgent },
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      )}
                    </div>

                    {hasMetadata && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setExpanded(isExpanded ? null : log._id)
                        }
                        className="shrink-0 text-gray-500 hover:text-white hover:bg-white/5 cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({total} total)
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
              disabled={page >= totalPages}
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

