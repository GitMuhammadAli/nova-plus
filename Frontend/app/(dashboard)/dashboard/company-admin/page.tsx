"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/app/store/store";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  Shield,
  TrendingUp,
  BarChart3,
  Settings,
  Mail,
  Copy,
  Trash2,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RoleGuard } from "@/components/guards/RoleGuard";
import { usersAPI, companyAPI, inviteAPI } from "@/app/services";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { clearUser, fetchMe } from "@/app/store/authSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CompanyAdminDashboard = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalManagers: 0,
    totalRegularUsers: 0,
    recentUsers: 0,
  });
  const [companyStats, setCompanyStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<any[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "user",
    expiresInDays: 7,
  });
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userActionId, setUserActionId] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

  const computeStatsFromUsers = useCallback((usersList: any[]) => {
    const safeList = Array.isArray(usersList) ? usersList : [];
    const managers = safeList.filter((u) => u.role === "manager").length;
    const regularUsers = safeList.filter((u) => u.role === "user").length;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentUsers = safeList.filter((u) => {
      if (!u.createdAt) return false;
      const createdDate = new Date(u.createdAt);
      return createdDate > weekAgo;
    }).length;

    setStats({
      totalUsers: safeList.length,
      totalManagers: managers,
      totalRegularUsers: regularUsers,
      recentUsers,
    });
  }, []);

  const loadCompanyUsers = useCallback(
    async (companyId: string) => {
      setUsersLoading(true);
      setUserError(null);
      try {
        const usersRes = await companyAPI.getCompanyUsers(companyId, {
          limit: 1000,
        });
        const payload = Array.isArray(usersRes.data?.data)
          ? usersRes.data.data
          : Array.isArray(usersRes.data)
          ? usersRes.data
          : [];
        setCompanyUsers(payload);
        computeStatsFromUsers(payload);
      } catch (error) {
        // Silently handle error - show empty state
        setCompanyUsers([]);
        computeStatsFromUsers([]);
        setUserError("Failed to load company users");
      } finally {
        setUsersLoading(false);
      }
    },
    [computeStatsFromUsers]
  );

  useEffect(() => {
    const fetchData = async () => {
      // Wait for user to be available
      if (!user) {
        setLoading(false);
        return;
      }

      // Ensure companyId is a string
      const companyId = user.companyId?.toString() || user.companyId;
      if (!companyId) {
        // User does not have a companyId - cannot load dashboard
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch company details - interceptor will handle token refresh
        try {
          const companyRes = await companyAPI.getById(companyId);
          setCompany(companyRes.data);
        } catch (error: any) {
          // Silently handle error
          // If 401, the interceptor will handle refresh and redirect
          if (error.response?.status === 401) {
            // Don't continue with other requests if auth fails
            setLoading(false);
            return;
          }
        }

        await loadCompanyUsers(companyId);

        // Fetch company stats
        try {
          const statsRes = await companyAPI.getStats(companyId);
          setCompanyStats(statsRes.data?.stats || statsRes.data);
        } catch (err) {
          // Silently handle error - stats are non-critical
        }

        // Fetch activity
        try {
          const activityRes = await companyAPI.getActivity(companyId);
          setActivity(
            Array.isArray(activityRes?.data?.activity)
              ? activityRes.data.activity
              : []
          );
        } catch (err) {
          // Silently handle error - activity is non-critical
        }

        // Fetch invites
        try {
          const invitesRes = await inviteAPI.getCompanyInvites(companyId);
          setInvites(Array.isArray(invitesRes.data) ? invitesRes.data : []);
        } catch (err) {
          // Silently handle error - invites are non-critical
          // Non-critical, continue
        }
      } catch (error) {
        // Silently handle error - show empty state
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if user exists and has companyId
    if (user?.companyId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user, dispatch, loadCompanyUsers]);

  const handleCreateInvite = async () => {
    if (!user?.companyId) return;

    const companyId = user.companyId?.toString() || user.companyId;
    if (!companyId) return;

    setInviteSubmitting(true);
    setInviteError(null);

    try {
      await inviteAPI.createInvite({
        email: inviteForm.email || undefined,
        role: inviteForm.role,
        expiresInDays: inviteForm.expiresInDays,
      });

      // Refresh invites
      const invitesRes = await inviteAPI.getCompanyInvites(companyId);
      setInvites(Array.isArray(invitesRes.data) ? invitesRes.data : []);

      // Reset form and close dialog
      setInviteForm({ email: "", role: "user", expiresInDays: 7 });
      setShowInviteDialog(false);
    } catch (err: any) {
      setInviteError(err.response?.data?.message || "Failed to create invite");
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!userId) return;
    if (user?._id && userId === (user._id || user.id)) {
      setUserError("You cannot delete yourself.");
      return;
    }

    if (
      !confirm("Are you sure you want to remove this user from your company?")
    ) {
      return;
    }

    setUserActionId(userId);
    setUserError(null);

    try {
      await usersAPI.delete(userId);
      const updatedUsers = companyUsers.filter((u) => u._id !== userId);
      setCompanyUsers(updatedUsers);
      computeStatsFromUsers(updatedUsers);
    } catch (error: any) {
      setUserError(error.response?.data?.message || "Failed to delete user");
    } finally {
      setUserActionId(null);
    }
  };

  const normalizedSearch = userSearch.trim().toLowerCase();
  const filteredUsers = companyUsers.filter((companyUser) => {
    if (!normalizedSearch) return true;
    return (
      companyUser.name?.toLowerCase().includes(normalizedSearch) ||
      companyUser.email?.toLowerCase().includes(normalizedSearch) ||
      companyUser.role?.toLowerCase().includes(normalizedSearch)
    );
  });

  const handleRevokeInvite = async (inviteId: string) => {
    if (!user?.companyId) return;

    const companyId = user.companyId?.toString() || user.companyId;
    if (!companyId) return;

    if (!confirm("Are you sure you want to revoke this invite?")) return;

    try {
      await inviteAPI.revokeInvite(inviteId, companyId);
      // Refresh invites
      const invitesRes = await inviteAPI.getCompanyInvites(companyId);
      setInvites(Array.isArray(invitesRes.data) ? invitesRes.data : []);
    } catch (err) {
      // Error handled by toast notification
    }
  };

  const copyInviteLink = (link: string) => {
    navigator.clipboard.writeText(link);
    // You could add a toast notification here
  };

  return (
    <RoleGuard allowedRoles={["company_admin", "admin"]}>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Company Admin Dashboard 🏢
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your company: create managers & users, view projects, and
            monitor company activity.
            {company && (
              <span className="block mt-1 text-sm">
                Company: <strong>{company.name}</strong>
                {company.domain && ` (${company.domain})`}
              </span>
            )}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Users
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.totalUsers}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Managers</p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.totalManagers}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Regular Users
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.totalRegularUsers}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    New This Week
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.recentUsers}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              onClick={() => router.push("/users?create=manager")}
              className="w-full h-auto flex flex-col items-center justify-center py-6 gap-2"
            >
              <UserPlus className="w-6 h-6" />
              <span>Create Manager</span>
            </Button>
            <Button
              onClick={() => router.push("/users")}
              variant="outline"
              className="w-full h-auto flex flex-col items-center justify-center py-6 gap-2"
            >
              <Users className="w-6 h-6" />
              <span>Manage Users</span>
            </Button>
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-auto flex flex-col items-center justify-center py-6 gap-2"
                >
                  <Mail className="w-6 h-6" />
                  <span>Create Invite</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Invite</DialogTitle>
                  <DialogDescription>
                    Invite a manager or user to join your company
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {inviteError && (
                    <Alert variant="destructive">
                      <AlertDescription>{inviteError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email (optional)</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="user@example.com (leave empty for open invite)"
                      value={inviteForm.email}
                      onChange={(e) =>
                        setInviteForm({ ...inviteForm, email: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to create an open invite that anyone can use
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Role</Label>
                    <Select
                      value={inviteForm.role}
                      onValueChange={(value) =>
                        setInviteForm({ ...inviteForm, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-expires">Expires in (days)</Label>
                    <Input
                      id="invite-expires"
                      type="number"
                      min="1"
                      max="30"
                      value={inviteForm.expiresInDays}
                      onChange={(e) =>
                        setInviteForm({
                          ...inviteForm,
                          expiresInDays: parseInt(e.target.value) || 7,
                        })
                      }
                    />
                  </div>
                  <Button
                    onClick={handleCreateInvite}
                    disabled={inviteSubmitting}
                    className="w-full"
                  >
                    {inviteSubmitting ? "Creating..." : "Create Invite"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              onClick={() => router.push("/analytics")}
              variant="outline"
              className="w-full h-auto flex flex-col items-center justify-center py-6 gap-2"
            >
              <BarChart3 className="w-6 h-6" />
              <span>View Analytics</span>
            </Button>
          </div>
        </Card>

        {/* Company Users */}
        <Card className="p-6 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Company Users
              </h2>
              <p className="text-sm text-muted-foreground">
                View everyone in your company and remove access when needed.
              </p>
            </div>
            <Input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="md:w-72"
            />
          </div>
          {userError && (
            <Alert variant="destructive">
              <AlertDescription>{userError}</AlertDescription>
            </Alert>
          )}
          {usersLoading ? (
            <p className="text-muted-foreground text-sm">Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((companyUser) => {
                    const createdDate = companyUser.createdAt
                      ? new Date(companyUser.createdAt).toLocaleDateString()
                      : "—";
                    const isSelf =
                      (companyUser._id || companyUser.id) ===
                      (user?._id || user?.id);
                    const isDeleting =
                      userActionId === (companyUser._id || companyUser.id);
                    return (
                      <TableRow key={companyUser._id || companyUser.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {companyUser.name || "—"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {companyUser.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {companyUser.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{createdDate}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={isSelf || isDeleting}
                            onClick={() =>
                              handleDeleteUser(
                                companyUser._id || companyUser.id
                              )
                            }
                          >
                            {isDeleting ? (
                              "Removing..."
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* Invites Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Active Invites
            </h2>
            <Button onClick={() => setShowInviteDialog(true)} size="sm">
              <Mail className="w-4 h-4 mr-2" />
              Create Invite
            </Button>
          </div>
          {invites.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active invites</p>
          ) : (
            <div className="space-y-3">
              {invites
                .filter((inv: any) => !inv.isUsed && inv.isActive)
                .map((invite: any) => (
                  <div
                    key={invite._id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {invite.email || "Open invite"}
                        </span>
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                          {invite.role}
                        </span>
                        {new Date(invite.expiresAt) < new Date() && (
                          <span className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded">
                            Expired
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires:{" "}
                        {new Date(invite.expiresAt).toLocaleDateString()}
                      </p>
                      {(invite.inviteLink || invite.token) && (
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            value={
                              invite.inviteLink ||
                              `${
                                typeof window !== "undefined"
                                  ? window.location.origin
                                  : ""
                              }/invite/${invite.token}`
                            }
                            readOnly
                            className="text-xs h-8"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              copyInviteLink(
                                invite.inviteLink ||
                                  `${
                                    typeof window !== "undefined"
                                      ? window.location.origin
                                      : ""
                                  }/invite/${invite.token}`
                              )
                            }
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevokeInvite(invite._id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </Card>

        {/* Activity Feed */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Recent Activity
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/audit-logs")}
            >
              View All
            </Button>
          </div>
          {activity.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {activity.slice(0, 10).map((item: any, index: number) => (
                <div
                  key={item._id || index}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">
                        {item.userName || "System"}
                      </span>{" "}
                      <span>
                        {item.action ||
                          item.description ||
                          "performed an action"}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "Recently"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Info Card */}
        <Card className="p-6 bg-muted/50">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Company Admin Responsibilities
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Create and manage Managers & Users in your company</li>
            <li>• Create invites to invite team members</li>
            <li>• View all users in your company</li>
            <li>• Monitor company-wide projects and tasks</li>
            <li>• View company analytics and reports</li>
            <li>• Manage company settings and configuration</li>
          </ul>
        </Card>
      </div>
    </RoleGuard>
  );
};

export default CompanyAdminDashboard;
