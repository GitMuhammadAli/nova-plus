"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/app/store/store";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Users, UserCog, Loader2 } from "lucide-react";
import { departmentAPI, usersAPI } from "@/app/services";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { fetchDepartments, createDepartment, updateDepartment, deleteDepartment } from "@/app/store/departmentsSlice";
import { fetchCompanyUsers } from "@/app/store/usersSlice";

interface Department {
  _id: string;
  name: string;
  description?: string;
  managerId?: any;
  members?: any[];
  isActive: boolean;
}

export default function DepartmentsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { departments, isLoading } = useSelector((state: RootState) => state.departments);
  const { users } = useSelector((state: RootState) => state.users);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    managerId: "",
    memberIds: [] as string[],
  });

  useEffect(() => {
    if (user) {
      dispatch(fetchDepartments());
      dispatch(fetchCompanyUsers({}));
    }
  }, [user, dispatch]);

  const handleCreate = () => {
    setEditingDepartment(null);
    setFormData({
      name: "",
      description: "",
      managerId: "",
      memberIds: [],
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || "",
      managerId: department.managerId?._id || department.managerId || "",
      memberIds: department.members?.map((m: any) => m._id || m) || [],
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingDepartment) {
        await dispatch(updateDepartment({ id: editingDepartment._id, data: formData })).unwrap();
        toast({
          title: "Success",
          description: "Department updated successfully",
        });
      } else {
        await dispatch(createDepartment(formData)).unwrap();
        toast({
          title: "Success",
          description: "Department created successfully",
        });
      }
      setIsDialogOpen(false);
      dispatch(fetchDepartments());
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "Failed to save department",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    
    try {
      await dispatch(deleteDepartment(id)).unwrap();
      toast({
        title: "Success",
        description: "Department deleted successfully",
      });
      dispatch(fetchDepartments());
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "Failed to delete department",
        variant: "destructive",
      });
    }
  };

  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Departments</h1>
            <p className="text-muted-foreground mt-1">Manage organizational departments and teams</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            New Department
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDepartments.map((department, index) => (
              <motion.div
                key={department._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{department.name}</h3>
                      <Badge variant={department.isActive ? "default" : "secondary"}>
                        {department.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(department)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(department._id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  {department.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {department.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    {department.managerId && (
                      <div className="flex items-center gap-2 text-sm">
                        <UserCog className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Manager:</span>
                        <span className="font-medium">
                          {department.managerId.name || department.managerId.email || "N/A"}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Members:</span>
                      <span className="font-medium">
                        {department.members?.length || 0}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {filteredDepartments.length === 0 && !isLoading && (
          <Card className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No departments found</p>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Department
            </Button>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingDepartment ? "Edit Department" : "Create Department"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Department Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter department name"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter department description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Manager</Label>
                <Select
                  value={formData.managerId}
                  onValueChange={(v) => setFormData({ ...formData, managerId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Manager</SelectItem>
                    {Array.isArray(users) && users
                      .filter((u) => u.role === "manager" || u.role === "company_admin")
                      .map((u) => (
                        <SelectItem key={u._id || u.id} value={u._id || u.id}>
                          {u.name || u.email}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Members</Label>
                <Select
                  value=""
                  onValueChange={(v) => {
                    if (v && !formData.memberIds.includes(v)) {
                      setFormData({ ...formData, memberIds: [...formData.memberIds, v] });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add members" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(users) && users
                      .filter((u) => !formData.memberIds.includes(u._id || u.id))
                      .map((u) => (
                        <SelectItem key={u._id || u.id} value={u._id || u.id}>
                          {u.name || u.email}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {formData.memberIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.memberIds.map((memberId) => {
                      const member = Array.isArray(users) ? users.find((u) => (u._id || u.id) === memberId) : null;
                      return (
                        <Badge key={memberId} variant="secondary" className="gap-1">
                          {member?.name || member?.email || memberId}
                          <button
                            onClick={() =>
                              setFormData({
                                ...formData,
                                memberIds: formData.memberIds.filter((id) => id !== memberId),
                              })
                            }
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

