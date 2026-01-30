import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
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
import { User, UserRole, UserStatus } from "@/types/user";
import { RoleBadge } from "@/components/users/RoleBadge";
import { StatusBadge } from "@/components/users/StatusBadge";
import { UserDetailSheet } from "@/components/users/UserDetailSheet";
import { UserFormDialog } from "@/components/users/UserFormDialog";
import { DeleteUserDialog } from "@/components/users/DeleteUserDialog";
import { ExportData } from "@/components/common/ExportData";
import { Search, Plus, Filter, Users as UsersIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUsers, createUser, updateUser, deleteUser } from "@/store/usersSlice";
import { useToast } from "@/hooks/use-toast";

export default function Users() {
  const dispatch = useAppDispatch();
  const { users, isLoading } = useAppSelector((state) => state.users);
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const allUsers = users || [];

  const filteredUsers = allUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setSheetOpen(true);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleSaveUser = async (data: any) => {
    try {
      if (data.id) {
        // Update existing user
        await dispatch(updateUser({ id: data.id, userData: data })).unwrap();
        toast({
          title: "User updated",
          description: `${data.name} has been updated successfully.`,
        });
      } else {
        // Create new user
        await dispatch(createUser({
          name: data.name,
          email: data.email,
          role: data.role,
          status: data.status,
          department: data.department,
          location: data.location,
          password: data.password,
        })).unwrap();
        toast({
          title: "User created",
          description: `${data.name} has been added successfully.`,
        });
      }
      setFormDialogOpen(false);
      setEditingUser(null);
      // Refresh users list
      dispatch(fetchUsers());
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        await dispatch(deleteUser(userToDelete.id)).unwrap();
        toast({
          title: "User deleted",
          description: `${userToDelete.name} has been removed from the system.`,
          variant: "destructive",
        });
        setUserToDelete(null);
        setDeleteDialogOpen(false);
        // Refresh users list
        dispatch(fetchUsers());
      } catch (error: any) {
        toast({
          title: "Error",
          description: error?.message || "Failed to delete user. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <AppShell>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground mt-1">
              Manage team members and their permissions
            </p>
          </div>
          <Button 
            className="gap-2" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddUser();
            }}
          >
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
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold mt-1">{allUsers.length}</p>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold mt-1 text-success">
                {allUsers.filter((u) => u.status === "active").length}
              </p>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Admins</p>
              <p className="text-2xl font-bold mt-1">
                {allUsers.filter((u) => u.role === "admin").length}
              </p>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold mt-1 text-warning">
                {allUsers.filter((u) => u.status === "pending").length}
              </p>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | "all")}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as UserStatus | "all")}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <ExportData 
              data={filteredUsers} 
              filename="users-export"
              headers={["name", "email", "role", "status", "department", "location", "lastActive"]}
            />
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
                <TableHead>Department</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleUserClick(user)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center text-white text-sm font-semibold">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.status} />
                    </TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell className="text-muted-foreground">{user.location}</TableCell>
                    <TableCell className="text-muted-foreground">{user.lastActive}</TableCell>
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <UsersIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-foreground">No users found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                            ? "Try adjusting your filters"
                            : "Get started by adding your first user"}
                        </p>
                      </div>
                      {!searchQuery && roleFilter === "all" && statusFilter === "all" && (
                        <Button className="gap-2 mt-2" onClick={handleAddUser}>
                          <Plus className="w-4 h-4" />
                          Add User
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
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
        />

        {/* Delete Confirmation Dialog */}
        <DeleteUserDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          user={userToDelete}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </AppShell>
  );
}
