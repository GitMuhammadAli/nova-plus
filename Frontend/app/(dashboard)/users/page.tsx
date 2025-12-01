"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, fetchMyUsers, fetchCompanyUsers, createUser, createUserByAdmin, createUserByManager, updateUser, deleteUser } from "@/app/store/usersSlice";
import { AppDispatch, RootState } from "@/app/store/store";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { normalizeRole as normalizeRoleUtil } from "@/lib/roles-config";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserDetailSheet } from "@/components/ui/UserDetailSheet";
import { UserFormDialog } from "@/components/ui/UserFormDialog";
import { DeleteUserDialog } from "@/components/ui/DeleteUserDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Filter, Users, UserCheck, ShieldCheck, Clock, MoreHorizontal, RefreshCw, TrendingUp, UserX, ChevronLeft, ChevronRight } from "lucide-react";

type UserRoleFilter = "ADMIN" | "MANAGER" | "EDITOR" | "USER" | "VIEWER" | "COMPANY_ADMIN" | "SUPER_ADMIN" | "SUPERADMIN" | "all";

interface User {
  _id: string;
  name?: string;
  email: string;
  role: string;
  isActive?: boolean;
  managerId?: any;
  department?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export default function UsersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { users, isLoading, error } = useSelector((state: RootState) => state.users);
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const { toast } = useToast();
  const { permissions, hasPermission, isAdmin, isManager } = useRolePermissions();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "managers" | "employees" | "invited" | "disabled">("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const currentUserRole = currentUser?.role || '';
  const normalizedRole = normalizeRoleUtil(currentUserRole);

  useEffect(() => {
    if (normalizedRole === 'company_admin' || normalizedRole === 'super_admin') {
      dispatch(fetchCompanyUsers({}));
    } else if (normalizedRole === 'manager') {
      dispatch(fetchMyUsers({}));
    } else {
      dispatch(fetchUsers({}));
    }
  }, [dispatch, normalizedRole]);

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (normalizedRole === 'company_admin' || normalizedRole === 'super_admin') {
        dispatch(fetchCompanyUsers({}));
      } else if (normalizedRole === 'manager') {
        dispatch(fetchMyUsers({}));
      } else {
        dispatch(fetchUsers({}));
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [normalizedRole, dispatch]);

  const managersList = users.filter((user) => normalizeRoleUtil(user.role) === "manager");
  const totalActiveUsers = users.filter((user) => user.isActive !== false).length;
  const inactiveUsers = users.filter((user) => user.isActive === false).length;
  const adminCountUsers = users.filter((user) => {
    const r = normalizeRoleUtil(user.role);
    return r === "company_admin" || r === "super_admin";
  }).length;
  const regularUsersCount = users.filter((user) => {
    const r = normalizeRoleUtil(user.role);
    return r === "user" || r === "viewer" || r === "editor";
  }).length;
  const recentUsersCount = users.filter((user) => {
    if (!user.createdAt) return false;
    const daysDiff = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  }).length;
  
  // Calculate users with managers assigned
  const usersWithManagers = users.filter((u) => {
    const managerId = typeof u.managerId === 'object' ? u.managerId?._id : u.managerId;
    return managerId && managerId !== '';
  }).length;

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      roleFilter === "all" ||
      normalizeRoleUtil(user.role) === normalizeRoleUtil(roleFilter);
    
    // Tab filtering
    let matchesTab = true;
    if (activeTab === "managers") {
      matchesTab = normalizeRoleUtil(user.role) === "manager";
    } else if (activeTab === "employees") {
      matchesTab = normalizeRoleUtil(user.role) === "user" || normalizeRoleUtil(user.role) === "editor" || normalizeRoleUtil(user.role) === "viewer";
    } else if (activeTab === "disabled") {
      matchesTab = user.isActive === false;
    } else if (activeTab === "invited") {
      // Users created via invite (check if they have a createdBy field that's not themselves)
      matchesTab = user.createdBy && user.createdBy !== user._id;
    }
    
    return matchesSearch && matchesRole && matchesTab;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Select all on current page
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(selectedUsers);
      paginatedUsers.forEach(user => newSelected.add(user._id));
      setSelectedUsers(newSelected);
    } else {
      const newSelected = new Set(selectedUsers);
      paginatedUsers.forEach(user => newSelected.delete(user._id));
      setSelectedUsers(newSelected);
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to delete.",
        variant: "destructive",
      });
      return;
    }
    if (!confirm(`Are you sure you want to delete ${selectedUsers.size} user(s)?`)) return;

    try {
      const deletePromises = Array.from(selectedUsers).map(userId => 
        dispatch(deleteUser(userId)).unwrap()
      );
      await Promise.all(deletePromises);
      toast({
        title: "Success",
        description: `${selectedUsers.size} user(s) deleted successfully.`,
      });
      setSelectedUsers(new Set());
      refreshUsersList();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete users",
        variant: "destructive",
      });
    }
  };

  const handleBulkActivate = async () => {
    if (selectedUsers.size === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to activate.",
        variant: "destructive",
      });
      return;
    }

    try {
      const activatePromises = Array.from(selectedUsers).map(userId => {
        const user = users.find(u => u._id === userId);
        if (user) {
          return dispatch(updateUser({ id: userId, data: { isActive: true } })).unwrap();
        }
      });
      await Promise.all(activatePromises);
      toast({
        title: "Success",
        description: `${selectedUsers.size} user(s) activated successfully.`,
      });
      setSelectedUsers(new Set());
      refreshUsersList();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to activate users",
        variant: "destructive",
      });
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedUsers.size === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to deactivate.",
        variant: "destructive",
      });
      return;
    }

    try {
      const deactivatePromises = Array.from(selectedUsers).map(userId => {
        const user = users.find(u => u._id === userId);
        if (user) {
          return dispatch(updateUser({ id: userId, data: { isActive: false } })).unwrap();
        }
      });
      await Promise.all(deactivatePromises);
      toast({
        title: "Success",
        description: `${selectedUsers.size} user(s) deactivated successfully.`,
      });
      setSelectedUsers(new Set());
      refreshUsersList();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to deactivate users",
        variant: "destructive",
      });
    }
  };

  const handleUserClick = (user: any) => {
    // Type assertion for role compatibility
    const typedUser: User = {
      ...user,
      role: user.role as "ADMIN" | "MANAGER" | "EDITOR" | "USER" | "VIEWER" | string,
    };
    setSelectedUser(typedUser);
    setSheetOpen(true);
  };

  const handleAddUser = () => {
    if (!hasPermission('canCreateUsers')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create users",
        variant: "destructive",
      });
      return;
    }
    setEditingUser(null);
    setFormDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    if (!hasPermission('canEditUsers')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit users",
        variant: "destructive",
      });
      return;
    }
    setEditingUser(user);
    setFormDialogOpen(true);
    setSheetOpen(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (!hasPermission('canDeleteUsers')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete users",
        variant: "destructive",
      });
      return;
    }
    const user = users.find((u) => u._id === userId);
    if (user) {
      setUserToDelete(user);
      setDeleteDialogOpen(true);
    }
  };

  const handlePromoteDemote = async (user: User, targetRole: "MANAGER" | "USER") => {
    if (!user?._id || !hasPermission('canEditUsers')) return;
    if (normalizeRoleUtil(user.role) === normalizeRoleUtil(targetRole)) return;
    try {
      await dispatch(updateUser({ id: user._id, data: { role: targetRole } })).unwrap();
      toast({
        title: "Success",
        description: `${user.name || user.email} is now ${targetRole === "MANAGER" ? "a manager" : "a user"}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (user: User) => {
    if (!user?._id || !hasPermission('canEditUsers')) return;
    try {
      await dispatch(updateUser({ id: user._id, data: { isActive: user.isActive === false } })).unwrap();
      toast({
        title: "Success",
        description: `${user.name || user.email} has been ${user.isActive === false ? "activated" : "deactivated"}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const handleExportUsers = () => {
    if (!users.length) {
      toast({
        title: "No users",
        description: "There are no users to export yet.",
      });
      return;
    }
    const headers = ["Name", "Email", "Role", "Status", "Manager", "Created"];
    const rows = users.map((user) => {
      const manager =
        typeof user.managerId === "object"
          ? user.managerId?.name || user.managerId?.email || ""
          : "";
      return [
        `"${user.name || ""}"`,
        `"${user.email}"`,
        `"${user.role}"`,
        `"${user.isActive === false ? "Inactive" : "Active"}"`,
        `"${manager}"`,
        `"${user.createdAt || ""}"`,
      ].join(",");
    });
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `company-users-${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const refreshUsersList = () => {
    if (normalizedRole === 'company_admin' || normalizedRole === 'super_admin') {
      dispatch(fetchCompanyUsers({}));
    } else if (normalizedRole === 'manager') {
      dispatch(fetchMyUsers({}));
    } else {
      dispatch(fetchUsers({}));
    }
  };

  const handleSaveUser = async (data: any) => {
    try {
      const basePayload = {
        name: data.name,
        email: data.email,
        role: data.role,
        managerId: data.managerId || undefined,
        department: data.department || undefined,
        location: data.location || undefined,
        isActive: data.status ? data.status === 'active' : undefined,
      };

      if (data._id) {
        const updatePayload: any = { ...basePayload };
        if (data.password) {
          updatePayload.password = data.password;
        }
        await dispatch(updateUser({ id: data._id, data: updatePayload })).unwrap();
        toast({
          title: "User updated",
          description: `${data.name} has been updated successfully.`,
        });
      } else {
        if (permissions.canCreateUsers) {
          // Use the appropriate create method based on role
          if (normalizedRole === 'company_admin' || normalizedRole === 'super_admin') {
            await dispatch(createUserByAdmin({
              name: basePayload.name,
              email: basePayload.email,
              password: data.password,
              role: basePayload.role || 'USER',
              managerId: basePayload.managerId,
              department: basePayload.department,
              location: basePayload.location,
            })).unwrap();
            toast({
              title: "User created",
              description: `${data.name} has been added successfully.`,
            });
          } else if (normalizedRole === 'manager') {
            await dispatch(createUserByManager({
              name: basePayload.name,
              email: basePayload.email,
              password: data.password,
              department: basePayload.department,
              location: basePayload.location,
            })).unwrap();
            toast({
              title: "User created",
              description: `${data.name} has been added to your team.`,
            });
          } else {
            // Fallback for other roles with create permission
            await dispatch(createUser({ ...basePayload, password: data.password })).unwrap();
            toast({
              title: "User created",
              description: `${data.name} has been added successfully.`,
            });
          }
        } else {
          toast({
            title: "Access Denied",
            description: "You don't have permission to create users.",
            variant: "destructive",
          });
        }
      }
      setFormDialogOpen(false);
      setEditingUser(null);
      refreshUsersList();
    } catch (error: any) {
      // Check if it's an authentication error (401 Unauthorized)
      const isAuthError = error?.response?.status === 401 || 
                         error?.message?.includes('token') || 
                         error?.message?.includes('401') || 
                         error?.message?.includes('Unauthorized') ||
                         error?.message?.includes('Invalid or expired token');
      
      if (isAuthError) {
        // Don't show error toast - API interceptor will handle redirect
        // Just clear the dialog
        setFormDialogOpen(false);
        setEditingUser(null);
        // API interceptor will automatically redirect to login
        return;
      } else {
        toast({
          title: "Error",
          description: error?.message || "Failed to save user. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        await dispatch(deleteUser(userToDelete._id)).unwrap();
        toast({
          title: "User deleted",
          description: `${userToDelete.name} has been removed from the system.`,
          variant: "destructive",
        });
        setUserToDelete(null);
        setDeleteDialogOpen(false);
        refreshUsersList();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error?.message || "Failed to delete user. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "NP";
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRoleCount = (roles: string[]) => {
    const normalizedTargets = roles.map((r) => normalizeRoleUtil(r));
    return users.filter((u) => normalizedTargets.includes(normalizeRoleUtil(u.role))).length;
  };

  const totalActive = totalActiveUsers;
  const adminCount = adminCountUsers;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage team members and their permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={refreshUsersList} title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
          {permissions.canCreateUsers && (
            <Button className="gap-2" onClick={handleAddUser}>
              <Plus className="w-4 h-4" />
              Add User
            </Button>
          )}
          <Button variant="outline" onClick={handleExportUsers}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold mt-1">{users.length}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {totalActive}
                </p>
                {inactiveUsers > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">{inactiveUsers} inactive</p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Managers</p>
                <p className="text-2xl font-bold mt-1">
                  {managersList.length}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">With Managers</p>
                <p className="text-2xl font-bold mt-1">
                  {usersWithManagers}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {users.length - usersWithManagers} unassigned
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recent (7d)</p>
                <p className="text-2xl font-bold mt-1">
                  {recentUsersCount}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v as typeof activeTab);
        setCurrentPage(1); // Reset to first page when changing tabs
      }}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({users.length})</TabsTrigger>
          <TabsTrigger value="managers">Managers ({managersList.length})</TabsTrigger>
          <TabsTrigger value="employees">Employees ({regularUsersCount})</TabsTrigger>
          <TabsTrigger value="invited">Invited ({users.filter(u => u.createdBy && u.createdBy !== u._id).length})</TabsTrigger>
          <TabsTrigger value="disabled">Disabled ({inactiveUsers})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-4">
          {/* Filters and Bulk Actions */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select 
            value={roleFilter} 
            onValueChange={(v) => setRoleFilter(v as UserRoleFilter)}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="COMPANY_ADMIN">Company Admin</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="EDITOR">Editor</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="VIEWER">Viewer</SelectItem>
            </SelectContent>
          </Select>
              {selectedUsers.size > 0 && permissions.canDeleteUsers && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleBulkActivate}>
                    Activate ({selectedUsers.size})
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleBulkDeactivate}>
                    Deactivate ({selectedUsers.size})
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                    Delete ({selectedUsers.size})
                  </Button>
                </div>
              )}
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
                  {permissions.canDeleteUsers && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUsers.has(u._id))}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                  )}
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!users || users.length === 0) ? (
              <TableRow>
                    <TableCell colSpan={permissions.canDeleteUsers ? 8 : 7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="w-12 h-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No users yet</p>
                    <p className="text-sm text-muted-foreground">Users will appear here once they register</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="w-12 h-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No users match your filters</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setRoleFilter('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user, index) => {
                const managerLabel =
                  typeof user.managerId === "object"
                    ? user.managerId?.name || user.managerId?.email
                    : "";
                return (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleUserClick(user)}
                  >
                    {permissions.canDeleteUsers && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedUsers.has(user._id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedUsers);
                            if (checked) {
                              newSelected.add(user._id);
                            } else {
                              newSelected.delete(user._id);
                            }
                            setSelectedUsers(newSelected);
                          }}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <p className="font-medium">{user.name || "Unnamed User"}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={(user.role || "").toUpperCase()} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge isActive={user.isActive !== false} />
                    </TableCell>
                    <TableCell>
                      {managerLabel ? (
                        <span className="text-sm text-foreground">{managerLabel}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      {(permissions.canEditUsers || permissions.canDeleteUsers) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {permissions.canEditUsers && (
                            <DropdownMenuItem
                              onClick={(event) => {
                                event.stopPropagation();
                                handleEditUser(user);
                              }}
                            >
                              Edit User
                            </DropdownMenuItem>
                            )}
                            {normalizeRoleUtil(user.role) !== "manager" && (
                              <DropdownMenuItem
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handlePromoteDemote(user, "MANAGER");
                                }}
                              >
                                Promote to Manager
                              </DropdownMenuItem>
                            )}
                            {normalizeRoleUtil(user.role) === "manager" && (
                              <DropdownMenuItem
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handlePromoteDemote(user, "USER");
                                }}
                              >
                                Demote to User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(event) => {
                                event.stopPropagation();
                                handleToggleActive(user);
                              }}
                            >
                              {user.isActive === false ? "Activate User" : "Deactivate User"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteUser(user._id);
                              }}
                            >
                              Remove User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleUserClick(user);
                          }}
                        >
                          View
                        </Button>
                      )}
                    </TableCell>
                  </motion.tr>
                );
              })
            )}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Select value={itemsPerPage.toString()} onValueChange={(v) => {
              setItemsPerPage(Number(v));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </Card>
        </TabsContent>
      </Tabs>

      {/* User Detail Sheet */}
      <UserDetailSheet
        user={selectedUser}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
      />

      {/* User Form Dialog */}
      <UserFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        user={editingUser}
        onSave={handleSaveUser}
        currentUserRole={currentUserRole}
        managers={managersList}
        defaultRole={(editingUser?.role?.toUpperCase() as string) || "USER"}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={userToDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}