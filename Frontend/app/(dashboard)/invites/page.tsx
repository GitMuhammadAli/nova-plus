"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { fetchCompanyInvites, createInvite, revokeInvite, clearError } from "@/app/store/invitesSlice";
import { fetchUsers, deleteUser } from "@/app/store/usersSlice";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Mail,
  Plus,
  Copy,
  Trash2,
  UserX,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  UserPlus,
} from "lucide-react";

interface Invite {
  _id: string;
  token: string;
  email?: string;
  role: string;
  isUsed: boolean;
  isActive: boolean;
  usedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  usedAt?: string;
  expiresAt: string;
  createdAt: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  inviteLink?: string;
}

export default function InvitesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { invites, isLoading, error } = useSelector((state: RootState) => state.invites);
  const { users } = useSelector((state: RootState) => state.users);
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const { toast } = useToast();
  const { permissions, hasPermission } = useRolePermissions();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "used" | "unused" | "expired">("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [newInvite, setNewInvite] = useState({
    email: "",
    role: "user",
    expiresInDays: 7,
  });

  const companyId = currentUser?.companyId;

  useEffect(() => {
    if (companyId && hasPermission('canViewInvites')) {
      dispatch(fetchCompanyInvites(companyId));
      dispatch(fetchUsers({}));
    }
  }, [dispatch, companyId, hasPermission]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!companyId || !hasPermission('canViewInvites')) return;
    const interval = setInterval(() => {
      dispatch(fetchCompanyInvites(companyId));
    }, 30000);
    return () => clearInterval(interval);
  }, [companyId, dispatch, hasPermission]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      dispatch(clearError());
    }
  }, [error, toast, dispatch]);

  // Ensure invites is always an array
  const invitesArray = Array.isArray(invites) ? invites : [];

  const filteredInvites = invitesArray.filter((invite) => {
    const matchesSearch =
      (invite.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      invite.role.toLowerCase().includes(searchQuery.toLowerCase());
    
    const now = new Date();
    const expiresAt = new Date(invite.expiresAt);
    const isExpired = expiresAt < now;

    let matchesStatus = true;
    if (statusFilter === "used") {
      matchesStatus = invite.isUsed;
    } else if (statusFilter === "unused") {
      matchesStatus = !invite.isUsed && !isExpired && invite.isActive;
    } else if (statusFilter === "expired") {
      matchesStatus = isExpired && !invite.isUsed;
    }

    return matchesSearch && matchesStatus;
  });

  const handleCreateInvite = async () => {
    if (!hasPermission('canCreateInvites')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create invites",
        variant: "destructive",
      });
      return;
    }
    if (!companyId) {
      toast({
        title: "Error",
        description: "Company ID not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await dispatch(
        createInvite({
          email: newInvite.email || undefined,
          role: newInvite.role,
          expiresInDays: newInvite.expiresInDays,
          companyId: companyId,
        })
      ).unwrap();

      toast({
        title: "Success",
        description: "Invite created successfully",
      });

      setCreateDialogOpen(false);
      setNewInvite({ email: "", role: "user", expiresInDays: 7 });
      
      // Refresh invites list
      dispatch(fetchCompanyInvites(companyId));
    } catch (err: any) {
      console.error("Create invite error:", err);
      toast({
        title: "Error",
        description: err || "Failed to create invite",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInvite = async () => {
    if (!hasPermission('canRevokeInvites')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to revoke invites",
        variant: "destructive",
      });
      return;
    }
    if (!selectedInvite) {
      toast({
        title: "Error",
        description: "No invite selected",
        variant: "destructive",
      });
      return;
    }

    if (!companyId) {
      toast({
        title: "Error",
        description: "Company ID not found",
        variant: "destructive",
      });
      return;
    }

    if (isLoading) {
      return; // Prevent multiple simultaneous operations
    }

    try {
      console.log("Deleting invite:", { inviteId: selectedInvite._id, companyId });
      const result = await dispatch(revokeInvite({ inviteId: selectedInvite._id, companyId })).unwrap();
      console.log("Delete invite result:", result);
      
      toast({
        title: "Success",
        description: "Invite deleted successfully",
      });

      setDeleteDialogOpen(false);
      setSelectedInvite(null);
      
      // Refresh invites list to get updated data from server
      setTimeout(() => {
        dispatch(fetchCompanyInvites(companyId));
      }, 500);
    } catch (err: any) {
      console.error("Delete invite error:", err);
      const errorMessage = err?.response?.data?.message || err || "Failed to delete invite";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "No user selected",
        variant: "destructive",
      });
      return;
    }

    if (isLoading) {
      return; // Prevent multiple simultaneous operations
    }

    try {
      console.log("Deleting user:", selectedUser._id);
      const result = await dispatch(deleteUser(selectedUser._id)).unwrap();
      console.log("Delete user result:", result);
      
      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      setDeleteUserDialogOpen(false);
      setSelectedUser(null);
      
      // Refresh users and invites
      if (companyId) {
        setTimeout(() => {
          dispatch(fetchUsers({}));
          dispatch(fetchCompanyInvites(companyId));
        }, 500);
      }
    } catch (err: any) {
      console.error("Delete user error:", err);
      const errorMessage = err?.response?.data?.message || err || "Failed to delete user";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const copyInviteLink = (invite: Invite) => {
    const link = invite.inviteLink || `${window.location.origin}/register?token=${invite.token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard",
    });
  };

  const getStatusBadge = (invite: Invite) => {
    const now = new Date();
    const expiresAt = new Date(invite.expiresAt);
    const isExpired = expiresAt < now;

    if (invite.isUsed) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Used
        </Badge>
      );
    } else if (isExpired) {
      return (
        <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    } else if (!invite.isActive) {
      return (
        <Badge variant="secondary">
          <XCircle className="w-3 h-3 mr-1" />
          Revoked
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-500">
          <Clock className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }
  };

  const stats = {
    total: invitesArray.length,
    used: invitesArray.filter((i) => i.isUsed).length,
    unused: invitesArray.filter((i) => !i.isUsed && new Date(i.expiresAt) > new Date() && i.isActive !== false).length,
    expired: invitesArray.filter((i) => !i.isUsed && new Date(i.expiresAt) < new Date()).length,
  };

  // Debug: Log invites to console
  useEffect(() => {
    console.log('Invites page - Redux state:', { 
      invitesCount: invitesArray.length, 
      invites, 
      isLoading, 
      error,
      companyId 
    });
  }, [invitesArray.length, invites, isLoading, error, companyId]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invite Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage invites and users who joined via invites
          </p>
        </div>
        {permissions.canCreateInvites && (
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Invite
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Invites</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Mail className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-blue-500">{stats.unused}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Used</p>
              <p className="text-2xl font-bold text-green-500">{stats.used}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Expired</p>
              <p className="text-2xl font-bold text-orange-500">{stats.expired}</p>
            </div>
            <XCircle className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unused">Active</SelectItem>
              <SelectItem value="used">Used</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Invites Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Used By</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading invites...
                </TableCell>
              </TableRow>
            ) : filteredInvites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No invites found
                </TableCell>
              </TableRow>
            ) : (
              filteredInvites.map((invite) => (
                <TableRow key={invite._id}>
                  <TableCell>
                    {invite.email || (
                      <span className="text-muted-foreground italic">No email</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {invite.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(invite)}</TableCell>
                  <TableCell>
                    {new Date(invite.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(invite.expiresAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {invite.isUsed && invite.usedBy ? (
                      <div className="flex items-center gap-2">
                        <span>{invite.usedBy.name || invite.usedBy.email}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const user = users.find((u) => u._id === invite.usedBy?._id);
                            if (user) {
                              setSelectedUser(user);
                              setDeleteUserDialogOpen(true);
                            }
                          }}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {!invite.isUsed && invite.isActive && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyInviteLink(invite)}
                            className="h-8 w-8 p-0"
                            title="Copy invite link"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          {permissions.canCreateInvites && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const { inviteAPI } = await import("@/app/services");
                                  await inviteAPI.resendInvite(invite._id);
                                  toast({
                                    title: "Success",
                                    description: "Invite resent successfully",
                                  });
                                  if (companyId) {
                                    dispatch(fetchCompanyInvites(companyId));
                                  }
                                } catch (error: any) {
                                  toast({
                                    title: "Error",
                                    description: error?.response?.data?.message || "Failed to resend invite",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="h-8 w-8 p-0"
                              title="Resend invite"
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
                      {permissions.canRevokeInvites && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInvite(invite);
                            setDeleteDialogOpen(true);
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Delete invite"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Invite Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Invite</DialogTitle>
            <DialogDescription>
              Create an invite link to invite users to join your company
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={newInvite.email}
                onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for open invite (anyone with the link can join)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={newInvite.role}
                onValueChange={(value) => setNewInvite({ ...newInvite, role: value })}
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
              <Label htmlFor="expiresInDays">Expires In (Days)</Label>
              <Input
                id="expiresInDays"
                type="number"
                min="1"
                max="365"
                value={newInvite.expiresInDays}
                onChange={(e) =>
                  setNewInvite({ ...newInvite, expiresInDays: parseInt(e.target.value) || 7 })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvite}>Create Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Invite Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invite</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invite? This action cannot be undone.
              {selectedInvite?.isUsed && (
                <span className="block mt-2 text-destructive">
                  Note: This invite has already been used. Deleting it will not remove the user.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvite} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteUserDialogOpen} onOpenChange={setDeleteUserDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user{" "}
              <strong>{selectedUser?.name || selectedUser?.email}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

