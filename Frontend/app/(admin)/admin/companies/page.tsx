"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Users,
  FolderKanban,
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

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/companies?${params}`);
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to fetch companies");
      }
      const data = await res.json();
      setCompanies(data.companies);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchCompanies();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-400" />
            Companies
          </h1>
          <p className="text-gray-400 text-sm mt-1">{total} total companies</p>
        </div>
        <Button
          onClick={fetchCompanies}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#12121e] border-white/[0.06]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-purple-500/10">
              <Building2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{total}</p>
              <p className="text-xs text-gray-400">Total Companies</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#12121e] border-white/[0.06]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {companies.reduce((sum, c) => sum + (c.usersCount || 0), 0)}
              </p>
              <p className="text-xs text-gray-400">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#12121e] border-white/[0.06]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-blue-500/10">
              <FolderKanban className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {companies.reduce((sum, c) => sum + (c.projectsCount || 0), 0)}
              </p>
              <p className="text-xs text-gray-400">Total Projects</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies..."
          className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-500 focus-visible:ring-indigo-500/50"
        />
      </form>

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
                    <TableHead className="text-gray-400">Company</TableHead>
                    <TableHead className="text-gray-400">Domain</TableHead>
                    <TableHead className="text-gray-400">Users</TableHead>
                    <TableHead className="text-gray-400">Projects</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.length === 0 ? (
                    <TableRow className="border-white/[0.06]">
                      <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                        No companies found
                      </TableCell>
                    </TableRow>
                  ) : (
                    companies.map((company) => {
                      const isActive =
                        company.isActive !== false && company.status !== "inactive";
                      return (
                        <TableRow key={company._id} className="border-white/[0.06] hover:bg-white/[0.02]">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/20 flex items-center justify-center text-xs font-medium text-purple-300">
                                {(company.name || "C")[0]?.toUpperCase()}
                              </div>
                              <span className="text-sm text-gray-200 font-medium">
                                {company.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-400">
                            {company.domain || "N/A"}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-300 font-medium">
                              {company.usersCount || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-300 font-medium">
                              {company.projectsCount || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Active
                              </span>
                            ) : (
                              <Badge variant="destructive" className="text-[11px]">
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {company.createdAt
                              ? new Date(company.createdAt).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                      );
                    })
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
