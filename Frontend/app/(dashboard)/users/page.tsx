"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, fetchMyUsers, createUser, createUserByAdmin, createUserByManager, updateUser, deleteUser } from "@/app/store/usersSlice";
import { AppDispatch, RootState } from "@/app/store/store";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Filter, Users, UserCheck, ShieldCheck, Clock } from "lucide-react";

type UserRole = "ADMIN" | "MANAGER" | "EDITOR" | "USER" | "VIEWER" | "all";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "EDITOR" | "USER" | "VIEWER" | string;
  createdAt?: string;
  updatedAt?: string;
}

export default function UsersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { users, isLoading, error } = useSelector((state: RootState) => state.users);
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Get current user role
  const currentUserRole = currentUser?.role?.toLowerCase() || '';

  useEffect(() => {
    // Fetch users based on role
    if (currentUserRole === 'admin' || currentUserRole === 'superadmin') {
      dispatch(fetchUsers({})); // Admin gets all users
    } else if (currentUserRole === 'manager') {
      dispatch(fetchMyUsers({})); // Manager gets only their users
    } else {
      dispatch(fetchUsers({})); // Fallback to regular fetch
    }
  }, [dispatch, currentUserRole]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || (user.role as string) === roleFilter;
    return matchesSearch && matchesRole;
  });

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
    setEditingUser(null);
    setFormDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormDialogOpen(true);
    setSheetOpen(false);
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find((u) => u._id === userId);
    if (user) {
      setUserToDelete(user);
      setDeleteDialogOpen(true);
    }
  };

  const handleSaveUser = async (data: any) => {
    try {
      if (data._id) {
        // Update existing user
        await dispatch(updateUser({ id: data._id, data })).unwrap();
        toast({
          title: "User updated",
          description: `${data.name} has been updated successfully.`,
        });
      } else {
        // Create new user based on current user's role
        if (currentUserRole === 'admin' || currentUserRole === 'superadmin') {
          // Admin can create managers or users
          await dispatch(createUserByAdmin({
            name: data.name,
            email: data.email,
            password: data.password,
            role: data.role || 'USER',
            managerId: data.managerId,
          })).unwrap();
          toast({
            title: "User created",
            description: `${data.name} has been added successfully.`,
          });
        } else if (currentUserRole === 'manager') {
          // Manager can only create users
          await dispatch(createUserByManager({
            name: data.name,
            email: data.email,
            password: data.password,
            department: data.department,
            location: data.location,
          })).unwrap();
          toast({
            title: "User created",
            description: `${data.name} has been added to your team.`,
          });
        } else {
          // Fallback to regular create (shouldn't happen for non-admin/manager)
          await dispatch(createUser(data)).unwrap();
          toast({
            title: "User created",
            description: `${data.name} has been added successfully.`,
          });
        }
      }
      setFormDialogOpen(false);
      setEditingUser(null);
      // Refresh users list based on role
      if (currentUserRole === 'admin' || currentUserRole === 'superadmin') {
        dispatch(fetchUsers({}));
      } else if (currentUserRole === 'manager') {
        dispatch(fetchMyUsers({}));
      } else {
        dispatch(fetchUsers({}));
      }
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
        // Refresh users list based on role
        if (currentUserRole === 'admin' || currentUserRole === 'superadmin') {
          dispatch(fetchUsers({}));
        } else if (currentUserRole === 'manager') {
          dispatch(fetchMyUsers({}));
        } else {
          dispatch(fetchUsers({}));
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error?.message || "Failed to delete user. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const getInitials = (name: string) => {
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

  const getRoleCount = (role: string) => {
    return users.filter(u => u.role === role).length;
  };

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

  // Don't show error messages - always show the UI with empty state if needed
  // Errors are handled silently, users will just see empty state

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage team members and their permissions
          </p>
        </div>
        <Button className="gap-2" onClick={handleAddUser}>
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  {users.length}
                </p>
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
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold mt-1">
                  {getRoleCount('ADMIN')}
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
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recent</p>
                <p className="text-2xl font-bold mt-1">
                  {users.filter(u => {
                    if (!u.createdAt) return false;
                    const daysDiff = (Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24);
                    return daysDiff <= 7;
                  }).length}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
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
            onValueChange={(v) => setRoleFilter(v as UserRole)}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="EDITOR">Editor</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="VIEWER">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!users || users.length === 0) ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
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
              filteredUsers.map((user, index) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleUserClick(user)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role as "ADMIN" | "MANAGER" | "EDITOR" | "USER" | "VIEWER"} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge isActive={true} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.updatedAt)}
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

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