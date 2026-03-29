"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Shield,
  Ban,
  CheckCircle2,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const ROLES = ["SUPER_ADMIN", "COMPANY_ADMIN", "MANAGER", "USER"];

function roleBadgeColor(role: string) {
  const map: Record<string, string> = {
    SUPER_ADMIN: "bg-red-500/15 text-red-400 border-red-500/20",
    COMPANY_ADMIN: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    MANAGER: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    USER: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  };
  return map[role] || map.USER;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to fetch users");
      }
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleSuspend(userId: string, suspend: boolean) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspended: suspend }),
      });
      if (!res.ok) throw new Error("Failed to update user");
      toast.success(suspend ? "User suspended" : "User activated");
      fetchUsers();
    } catch {
      toast.error("Failed to update user");
    }
  }

  async function handleRoleChange(userId: string, role: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      toast.success(`Role updated to ${role}`);
      fetchUsers();
    } catch {
      toast.error("Failed to update role");
    }
  }

  async function handleDelete(userId: string, userName: string) {
    if (!confirm(`Delete user "${userName}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete user");
      toast.success("User deleted");
      fetchUsers();
    } catch {
      toast.error("Failed to delete user");
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            User Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {total} total users
          </p>
        </div>
        <Button
          onClick={fetchUsers}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-500 focus-visible:ring-indigo-500/50"
          />
        </form>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={roleFilter === "" ? "default" : "ghost"}
            size="sm"
            onClick={() => { setRoleFilter(""); setPage(1); }}
            className={roleFilter === "" ? "bg-indigo-600 text-white cursor-pointer" : "text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"}
          >
            All
          </Button>
          {ROLES.map((role) => (
            <Button
              key={role}
              variant={roleFilter === role ? "default" : "ghost"}
              size="sm"
              onClick={() => { setRoleFilter(role); setPage(1); }}
              className={roleFilter === role ? "bg-indigo-600 text-white cursor-pointer" : "text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"}
            >
              {role.replace(/_/g, " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Error state */}
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
                    <TableHead className="text-gray-400">Name</TableHead>
                    <TableHead className="text-gray-400">Email</TableHead>
                    <TableHead className="text-gray-400">Role</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Created</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow className="border-white/[0.06]">
                      <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => {
                      const isSuspended =
                        user.suspended || user.isSuspended || user.status === "suspended";
                      return (
                        <TableRow key={user._id} className="border-white/[0.06] hover:bg-white/[0.02]">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-xs font-medium text-indigo-300">
                                {(user.name || user.email || "?")[0]?.toUpperCase()}
                              </div>
                              <span className="text-sm text-gray-200 font-medium">
                                {user.name || "No name"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-400">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${roleBadgeColor(user.role)}`}>
                              {user.role || "USER"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {isSuspended ? (
                              <Badge variant="destructive" className="text-[11px]">
                                Suspended
                              </Badge>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Active
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="bg-[#1a1a2e] border-white/[0.08] text-gray-200"
                              >
                                <DropdownMenuLabel className="text-gray-400">
                                  Change Role
                                </DropdownMenuLabel>
                                {ROLES.map((role) => (
                                  <DropdownMenuItem
                                    key={role}
                                    onClick={() => handleRoleChange(user._id, role)}
                                    className="cursor-pointer"
                                  >
                                    <Shield className="w-3.5 h-3.5 mr-2" />
                                    {role.replace(/_/g, " ")}
                                    {user.role === role && (
                                      <CheckCircle2 className="w-3 h-3 ml-auto text-emerald-400" />
                                    )}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator className="bg-white/[0.06]" />
                                <DropdownMenuItem
                                  onClick={() => handleSuspend(user._id, !isSuspended)}
                                  className="cursor-pointer"
                                >
                                  {isSuspended ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-400" />
                                      Activate User
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="w-3.5 h-3.5 mr-2 text-orange-400" />
                                      Suspend User
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(user._id, user.name || user.email)}
                                  variant="destructive"
                                  className="cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
