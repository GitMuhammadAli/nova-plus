"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoleGuard } from "@/components/guards/RoleGuard";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  CheckCircle2,
  Loader2,
  RefreshCw,
  User as UserIcon,
} from "lucide-react";
import { taskAPI, projectAPI, usersAPI } from "@/app/services";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { User } from "@/types/user";

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "done" | "cancelled";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  assignedTo?: any;
  assignedBy?: any;
  projectId?: any;
}

interface Project {
  _id: string;
  name: string;
}

export default function TasksPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { permissions, hasPermission } = useRolePermissions();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending" as const,
    priority: "medium" as const,
    dueDate: "",
    projectId: "",
    assignedTo: "",
  });

  const canCreateEdit =
    hasPermission("canCreateTasks") || hasPermission("canEditTasks");
  const canSeeAll = hasPermission("canViewAllTasks"); // Managers/admins see all tasks, users see only their own

  useEffect(() => {
    if (user) {
      fetchTasks();
      if (canCreateEdit) {
        fetchProjects();
        fetchUsers();
      }
    }
  }, [user]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTasks();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = canSeeAll
        ? await taskAPI.getAll({})
        : await taskAPI.getMyTasks();
      const data = response.data || response;
      setTasks(Array.isArray(data) ? data : data?.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await projectAPI.findAll();
      const data = response.data || response;
      const projectsList = Array.isArray(data) ? data : data?.data || [];
      setProjects(projectsList);
    } catch (error: any) {
      // Silently handle error - projects will see empty state
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      let response;
      if (currentUserRole === "company_admin") {
        response = await usersAPI.getCompanyUsers({ limit: 1000 });
      } else if (normalizedRole === "admin") {
        response = await usersAPI.getAll({ limit: 1000 });
      } else if (normalizedRole === "manager") {
        response = await usersAPI.getMyUsers({ limit: 1000 });
      } else {
        response = await usersAPI.getAll({ limit: 1000 });
      }

      const data = response.data || response;
      const usersList = Array.isArray(data) ? data : data?.data || [];
      setAvailableUsers(usersList);
    } catch (error: any) {
      // Silently handle error - users will see empty state
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreate = () => {
    if (!hasPermission("canCreateTasks")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create tasks",
        variant: "destructive",
      });
      return;
    }
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      dueDate: "",
      projectId: "",
      assignedTo: user?._id || "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    const projectId =
      typeof task.projectId === "object"
        ? task.projectId?._id
        : task.projectId || "";
    const assignedTo =
      typeof task.assignedTo === "object"
        ? task.assignedTo?._id
        : task.assignedTo || "";
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
      projectId: projectId,
      assignedTo: assignedTo,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!hasPermission("canCreateTasks") && !editingTask) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create tasks",
        variant: "destructive",
      });
      return;
    }
    if (editingTask && !hasPermission("canEditTasks")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit tasks",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
      };

      if (formData.dueDate) payload.dueDate = formData.dueDate;
      if (formData.projectId) payload.projectId = formData.projectId;
      if (formData.assignedTo) payload.assignedTo = formData.assignedTo;

      if (editingTask) {
        await taskAPI.update(editingTask._id, payload);
        toast({
          title: "Success",
          description: "Task updated successfully",
        });
      } else {
        await taskAPI.create(payload);
        toast({
          title: "Success",
          description: "Task created successfully",
        });
      }
      setIsDialogOpen(false);
      fetchTasks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save task",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await taskAPI.updateStatus(taskId, newStatus);
      toast({
        title: "Success",
        description: "Task status updated",
      });
      fetchTasks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!hasPermission("canDeleteTasks")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete tasks",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await taskAPI.delete(id);
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
      fetchTasks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-success/10 text-success border-success/20";
      case "in_progress":
        return "bg-primary/10 text-primary border-primary/20";
      case "pending":
        return "bg-warning/10 text-warning border-warning/20";
      case "cancelled":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/10 text-destructive";
      case "medium":
        return "bg-warning/10 text-warning";
      case "low":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {canSeeAll ? "All Tasks" : "My Tasks"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and track your tasks
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchTasks}
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            {permissions.canCreateTasks && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{task.title}</h3>
                        <Badge
                          variant="outline"
                          className={getStatusColor(task.status)}
                        >
                          {task.status.replace("_", " ")}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getPriorityColor(task.priority)}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {task.assignedTo && (
                          <div className="flex items-center gap-1">
                            <UserIcon className="w-4 h-4" />
                            <span>
                              {typeof task.assignedTo === "object"
                                ? task.assignedTo?.name ||
                                  task.assignedTo?.email ||
                                  "Unknown"
                                : "Assigned"}
                            </span>
                          </div>
                        )}
                        {task.projectId && (
                          <div className="flex items-center gap-1">
                            <span>
                              Project:{" "}
                              {typeof task.projectId === "object"
                                ? task.projectId?.name || "Unknown"
                                : "Unknown"}
                            </span>
                          </div>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={task.status}
                        onValueChange={(v) => handleStatusChange(task._id, v)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(task)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {permissions.canDeleteTasks && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(task._id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {filteredTasks.length === 0 && !loading && (
          <Card className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No tasks found</p>
            {permissions.canCreateTasks && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Task
              </Button>
            )}
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle>
                {editingTask ? "Edit Task" : "Create Task"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
              <div className="space-y-2">
                <Label>Task Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v: any) =>
                      setFormData({ ...formData, status: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(v: any) =>
                      setFormData({ ...formData, priority: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {permissions.canCreateTasks && (
                <>
                  <div className="space-y-2">
                    <Label>Project (Optional)</Label>
                    <Select
                      value={formData.projectId}
                      onValueChange={(v) =>
                        setFormData({ ...formData, projectId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">No Project</SelectItem>
                        {loadingProjects ? (
                          <SelectItem value="loading" disabled>
                            Loading projects...
                          </SelectItem>
                        ) : (
                          projects.map((project) => (
                            <SelectItem key={project._id} value={project._id}>
                              {project.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assign To *</Label>
                    <Select
                      value={formData.assignedTo}
                      onValueChange={(v) =>
                        setFormData({ ...formData, assignedTo: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingUsers ? (
                          <SelectItem value="loading" disabled>
                            Loading users...
                          </SelectItem>
                        ) : (
                          availableUsers.map((user) => (
                            <SelectItem key={user._id} value={user._id}>
                              {user.name || user.email}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter className="px-6 py-4 border-t bg-muted/50">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  !formData.title.trim() ||
                  (permissions.canCreateTasks && !formData.assignedTo)
                }
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
