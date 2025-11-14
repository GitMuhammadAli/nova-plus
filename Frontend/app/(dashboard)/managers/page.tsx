"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { fetchCompanyUsers, createUserByAdmin, updateUser, deleteUser } from "@/app/store/usersSlice";
import { RoleGuard } from "@/components/guards/RoleGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserFormDialog } from "@/components/ui/UserFormDialog";
import { DeleteUserDialog } from "@/components/ui/DeleteUserDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Users, ShieldCheck, UserMinus, Plus, MoreHorizontal } from "lucide-react";

interface ManagerUser {
  _id: string;
  name?: string;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const ManagersPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { users, isLoading } = useSelector((state: RootState) => state.users);
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const { toast } = useToast();

  const managers = users.filter((user) => (user.role || "").toLowerCase() === "manager");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<ManagerUser | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [managerToDelete, setManagerToDelete] = useState<ManagerUser | null>(null);

  const refreshManagers = () => {
    dispatch(fetchCompanyUsers({}));
  };

  useEffect(() => {
    if (currentUser?.role?.toLowerCase() === "company_admin") {
      refreshManagers();
    }
  }, [dispatch, currentUser]);

  const handleAddManager = () => {
    setSelectedManager(null);
    setFormOpen(true);
  };

  const getInitials = (name?: string) => {
    if (!name) return "MG";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSaveManager = async (data: any) => {
    try {
      if (data._id) {
        await dispatch(
          updateUser({
            id: data._id,
            data: {
              name: data.name,
              email: data.email,
              department: data.department,
              location: data.location,
              isActive: data.status ? data.status === "active" : undefined,
            },
          })
        ).unwrap();
        toast({ title: "Manager updated", description: `${data.name} has been updated.` });
      } else {
        await dispatch(
          createUserByAdmin({
            name: data.name,
            email: data.email,
            password: data.password,
            role: "MANAGER",
            department: data.department,
            location: data.location,
          })
        ).unwrap();
        toast({ title: "Manager created", description: `${data.name} has been added.` });
      }
      setFormOpen(false);
      setSelectedManager(null);
      refreshManagers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save manager.",
        variant: "destructive",
      });
    }
  };

  const handleDemote = async (manager: ManagerUser) => {
    try {
      await dispatch(updateUser({ id: manager._id, data: { role: "USER" } })).unwrap();
      toast({
        title: "Manager demoted",
        description: `${manager.name || manager.email} is now a user.`,
      });
      refreshManagers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update manager.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteManager = (manager: ManagerUser) => {
    setManagerToDelete(manager);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteManager = async () => {
    if (!managerToDelete) return;
    try {
      await dispatch(deleteUser(managerToDelete._id)).unwrap();
      toast({
        title: "Manager removed",
        description: `${managerToDelete.name || managerToDelete.email} has been removed.`,
      });
      setDeleteDialogOpen(false);
      setManagerToDelete(null);
      refreshManagers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to remove manager.",
        variant: "destructive",
      });
    }
  };

  const totalManagers = managers.length;
  const activeManagers = managers.filter((m) => m.isActive !== false).length;

  return (
    <RoleGuard allowedRoles={['company_admin', 'admin']}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Managers</h1>
            <p className="text-muted-foreground mt-1">
              Promote leaders, assign responsibilities, and keep your org chart clean.
            </p>
          </div>
          <Button className="gap-2" onClick={handleAddManager}>
            <Plus className="w-4 h-4" />
            Add Manager
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Managers</p>
              <p className="text-2xl font-bold mt-1">{totalManagers}</p>
            </div>
            <Users className="w-10 h-10 text-primary/70" />
          </Card>
          <Card className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Managers</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{activeManagers}</p>
            </div>
            <ShieldCheck className="w-10 h-10 text-green-500/70" />
          </Card>
          <Card className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Needs Attention</p>
              <p className="text-2xl font-bold mt-1 text-destructive">
                {totalManagers - activeManagers}
              </p>
            </div>
            <UserMinus className="w-10 h-10 text-destructive/70" />
          </Card>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Loading managers...
                  </TableCell>
                </TableRow>
              ) : managers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ShieldCheck className="w-10 h-10" />
                      <p>No managers yet</p>
                      <p className="text-sm">Promote a user to start building your leadership team.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                managers.map((manager, index) => (
                  <motion.tr
                    key={manager._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center font-semibold">
                          {getInitials(manager.name)}
                        </div>
                        <div>
                          <p className="font-medium">{manager.name || "Unnamed Manager"}</p>
                          <p className="text-sm text-muted-foreground">{manager.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge isActive={manager.isActive !== false} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(manager.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDemote(manager)}>
                            Demote to User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteManager(manager)}>
                            Remove Manager
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <UserFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          user={selectedManager}
          onSave={handleSaveManager}
          currentUserRole="company_admin"
          defaultRole="MANAGER"
        />

        <DeleteUserDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          user={managerToDelete}
          onConfirm={confirmDeleteManager}
        />
      </div>
    </RoleGuard>
  );
};

export default ManagersPage;

