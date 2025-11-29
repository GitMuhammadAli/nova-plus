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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Users, UserCog, Loader2, Trash2, UserPlus } from "lucide-react";
import { teamAPI, usersAPI } from "@/app/services";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { fetchCompanyUsers } from "@/app/store/usersSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Team {
  _id: string;
  name: string;
  manager: {
    _id: string;
    name: string;
    email: string;
  };
  members: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
}

interface Manager {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function TeamsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { users } = useSelector((state: RootState) => state.users);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    managerId: "",
    memberIds: [] as string[],
  });

  // Get managers from users
  const managers: Manager[] = Array.isArray(users)
    ? users.filter((u) => (u.role || "").toLowerCase() === "manager")
    : [];

  useEffect(() => {
    if (user) {
      dispatch(fetchCompanyUsers({}));
      loadTeams();
    }
  }, [user, dispatch]);

  const loadTeams = async () => {
    setIsLoading(true);
    try {
      const response = await teamAPI.getAll();
      const teamsData = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
        ? response.data
        : [];
      setTeams(teamsData);
    } catch (error: any) {
      console.error("Failed to load teams:", error);
      toast({
        title: "Error",
        description: "Failed to load teams",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!formData.name || !formData.managerId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await teamAPI.create({
        name: formData.name,
        managerId: formData.managerId,
        memberIds: formData.memberIds,
      });
      toast({
        title: "Success",
        description: "Team created successfully",
      });
      setIsDialogOpen(false);
      setFormData({ name: "", managerId: "", memberIds: [] });
      loadTeams();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to create team",
        variant: "destructive",
      });
    }
  };

  const handleAddMember = async (teamId: string, userId: string) => {
    try {
      await teamAPI.addMember(teamId, { userId });
      toast({
        title: "Success",
        description: "Member added successfully",
      });
      loadTeams();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to add member",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    try {
      await teamAPI.removeMember(teamId, memberId);
      toast({
        title: "Success",
        description: "Member removed successfully",
      });
      loadTeams();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;

    try {
      await teamAPI.delete(teamId);
      toast({
        title: "Success",
        description: "Team deleted successfully",
      });
      loadTeams();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to delete team",
        variant: "destructive",
      });
    }
  };

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(search.toLowerCase()) ||
    team.manager?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Get available users (not already in team)
  const getAvailableUsers = (team: Team | null) => {
    if (!team) return users.filter((u) => (u.role || "").toLowerCase() === "user");
    const memberIds = team.members?.map((m) => m._id) || [];
    return users.filter(
      (u) =>
        (u.role || "").toLowerCase() === "user" && !memberIds.includes(u._id)
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Teams</h1>
            <p className="text-muted-foreground mt-1">
              Manage teams and their members
            </p>
          </div>
          <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Team
          </Button>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search teams by name or manager..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </Card>

        {/* Teams List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTeams.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No teams found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first team to get started
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredTeams.map((team) => (
              <motion.div
                key={team._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{team.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UserCog className="w-4 h-4" />
                        <span>
                          Manager: {team.manager?.name || "Unknown"}
                        </span>
                        <span className="mx-2">•</span>
                        <Users className="w-4 h-4" />
                        <span>{team.members?.length || 0} members</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTeam(team._id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Members Table */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Team Members</Label>
                      <Select
                        onValueChange={(userId) => handleAddMember(team._id, userId)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Add member" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableUsers(team).map((user) => (
                            <SelectItem key={user._id} value={user._id}>
                              {user.name || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {team.members && team.members.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {team.members.map((member) => (
                            <TableRow key={member._id}>
                              <TableCell>{member.name || "Unknown"}</TableCell>
                              <TableCell>{member.email}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveMember(team._id, member._id)
                                  }
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No members yet. Add members using the dropdown above.
                      </p>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Team Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Development Team"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager">Manager</Label>
                <Select
                  value={formData.managerId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, managerId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager._id} value={manager._id}>
                        {manager.name || manager.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTeam}>Create Team</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

