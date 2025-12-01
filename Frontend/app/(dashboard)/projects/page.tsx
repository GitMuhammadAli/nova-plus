"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RoleGuard } from "@/components/guards/RoleGuard";
import { Plus, Search, Edit, Trash2, Calendar, Users, Loader2, RefreshCw } from "lucide-react";
import { projectAPI, usersAPI } from "@/app/services";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface Project {
  _id: string;
  name: string;
  description?: string;
  status: "active" | "completed" | "on_hold" | "cancelled";
  startDate?: string;
  endDate?: string;
  assignedUsers?: any[];
  createdBy?: any;
}

interface User {
  _id: string;
  name?: string;
  email: string;
}

export default function ProjectsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active" as const,
    startDate: "",
    endDate: "",
    assignedUserIds: [] as string[],
  });

  const currentUserRole = user?.role?.toLowerCase() || '';
  const normalizedRole = currentUserRole === 'company_admin' ? 'admin' : currentUserRole;
  const canCreateEdit = normalizedRole === 'admin' || normalizedRole === 'manager' || normalizedRole === 'superadmin';

  useEffect(() => {
    if (user) {
      fetchProjects();
      if (canCreateEdit) {
        fetchUsers();
      }
    }
  }, [user]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchProjects();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await projectAPI.findAll();
      const data = response.data || response;
      setProjects(Array.isArray(data) ? data : (data?.data || []));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      let response;
      if (currentUserRole === 'company_admin') {
        response = await usersAPI.getCompanyUsers({ limit: 1000 });
      } else if (normalizedRole === 'admin') {
        response = await usersAPI.getAll({ limit: 1000 });
      } else if (normalizedRole === 'manager') {
        response = await usersAPI.getMyUsers({ limit: 1000 });
      } else {
        response = await usersAPI.getAll({ limit: 1000 });
      }
      
      const data = response.data || response;
      const usersList = Array.isArray(data) ? data : (data?.data || []);
      setAvailableUsers(usersList);
    } catch (error: any) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreate = () => {
    if (!canCreateEdit) {
      toast({
        title: "Access Denied",
        description: "Only managers and admins can create projects",
        variant: "destructive",
      });
      return;
    }
    setEditingProject(null);
    setFormData({
      name: "",
      description: "",
      status: "active",
      startDate: "",
      endDate: "",
      assignedUserIds: [],
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (project: Project) => {
    if (!canCreateEdit) {
      toast({
        title: "Access Denied",
        description: "Only managers and admins can edit projects",
        variant: "destructive",
      });
      return;
    }
    setEditingProject(project);
    const assignedIds = project.assignedUsers?.map((u: any) => 
      typeof u === 'object' ? u._id : u
    ) || [];
    setFormData({
      name: project.name,
      description: project.description || "",
      status: project.status,
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
      assignedUserIds: assignedIds,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!canCreateEdit) return;
    
    try {
      const payload: any = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
      };
      
      if (formData.startDate) payload.startDate = formData.startDate;
      if (formData.endDate) payload.endDate = formData.endDate;
      if (formData.assignedUserIds.length > 0) {
        payload.assignedUserIds = formData.assignedUserIds;
      }

      if (editingProject) {
        await projectAPI.update(editingProject._id, payload);
        toast({
          title: "Success",
          description: "Project updated successfully",
        });
      } else {
        await projectAPI.create(payload);
        toast({
          title: "Success",
          description: "Project created successfully",
        });
      }
      setIsDialogOpen(false);
      fetchProjects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save project",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!canCreateEdit) {
      toast({
        title: "Access Denied",
        description: "Only managers and admins can delete projects",
        variant: "destructive",
      });
      return;
    }
    
    if (!confirm("Are you sure you want to delete this project?")) return;
    
    try {
      await projectAPI.delete(id);
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      fetchProjects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const toggleUserAssignment = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedUserIds: prev.assignedUserIds.includes(userId)
        ? prev.assignedUserIds.filter(id => id !== userId)
        : [...prev.assignedUserIds, userId]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border-success/20";
      case "completed":
        return "bg-primary/10 text-primary border-primary/20";
      case "on_hold":
        return "bg-warning/10 text-warning border-warning/20";
      case "cancelled":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground mt-1">Manage your projects and track progress</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchProjects} title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </Button>
            {canCreateEdit && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
                      <Badge variant="outline" className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    {canCreateEdit && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(project)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(project._id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {project.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {project.assignedUsers && project.assignedUsers.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{project.assignedUsers.length} assigned</span>
                      </div>
                    )}
                    {project.startDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(project.startDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {filteredProjects.length === 0 && !loading && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No projects found</p>
            {canCreateEdit && (
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Project
              </Button>
            )}
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle>{editingProject ? "Edit Project" : "Create Project"}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
              <div className="space-y-2">
                <Label>Project Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assign Users</Label>
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : (
                  <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                    {availableUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No users available</p>
                    ) : (
                      <div className="space-y-2">
                        {availableUsers.map((user) => (
                          <div key={user._id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`user-${user._id}`}
                              checked={formData.assignedUserIds.includes(user._id)}
                              onCheckedChange={() => toggleUserAssignment(user._id)}
                            />
                            <label
                              htmlFor={`user-${user._id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {user.name || user.email}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="px-6 py-4 border-t bg-muted/50">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!formData.name.trim()}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
