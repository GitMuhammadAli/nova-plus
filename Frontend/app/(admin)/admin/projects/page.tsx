"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FolderKanban,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  ListTodo,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const PROJECT_STATUSES = ["active", "completed", "on_hold", "cancelled"];

function statusBadgeColor(status: string) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    completed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    on_hold: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
  };
  return map[status] || "bg-gray-500/15 text-gray-400 border-gray-500/20";
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/projects?${params}`);
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to fetch projects");
      }
      const data = await res.json();
      setProjects(data.projects);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setStatusCounts(data.statusCounts || {});
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchProjects();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-indigo-400" />
            Projects
          </h1>
          <p className="text-gray-400 text-sm mt-1">{total} total projects</p>
        </div>
        <Button
          onClick={fetchProjects}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {PROJECT_STATUSES.map((status) => (
          <Card key={status} className="bg-[#12121e] border-white/[0.06]">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-white">
                {statusCounts[status] || 0}
              </p>
              <p className="text-xs text-gray-400 capitalize mt-1">
                {status.replace(/_/g, " ")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-500 focus-visible:ring-indigo-500/50"
          />
        </form>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={statusFilter === "" ? "default" : "ghost"}
            size="sm"
            onClick={() => { setStatusFilter(""); setPage(1); }}
            className={statusFilter === "" ? "bg-indigo-600 text-white cursor-pointer" : "text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"}
          >
            All
          </Button>
          {PROJECT_STATUSES.map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "ghost"}
              size="sm"
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={statusFilter === status ? "bg-indigo-600 text-white capitalize cursor-pointer" : "text-gray-400 hover:text-white hover:bg-white/5 capitalize cursor-pointer"}
            >
              {status.replace(/_/g, " ")}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Table */}
      <Card className="bg-[#12121e] border-white/[0.06]">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 bg-white/[0.04]" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-transparent">
                    <TableHead className="text-gray-400">Project</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Tasks</TableHead>
                    <TableHead className="text-gray-400">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.length === 0 ? (
                    <TableRow className="border-white/[0.06]">
                      <TableCell colSpan={4} className="text-center text-gray-500 py-12">
                        No projects found
                      </TableCell>
                    </TableRow>
                  ) : (
                    projects.map((project) => (
                      <TableRow key={project._id} className="border-white/[0.06] hover:bg-white/[0.02]">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center">
                              <FolderKanban className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-200 font-medium">
                                {project.name}
                              </p>
                              {project.description && (
                                <p className="text-xs text-gray-500 truncate max-w-[300px]">
                                  {project.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize ${statusBadgeColor(project.status)}`}>
                            {(project.status || "unknown").replace(/_/g, " ")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-gray-300">
                            <ListTodo className="w-3.5 h-3.5 text-gray-500" />
                            {project.tasksCount || 0}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {project.createdAt
                            ? new Date(project.createdAt).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
