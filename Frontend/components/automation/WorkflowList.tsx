"use client"

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Edit, Trash2, Plus, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Workflow } from "@/types/automation";
import { toast } from "@/hooks/use-toast";
import { workflowAPI } from "@/app/services";

interface WorkflowListProps {
  workflows: Workflow[];
  onEdit: (workflow: Workflow) => void;
  onCreate: () => void;
  onRefresh: () => void;
}

export function WorkflowList({ workflows, onEdit, onCreate, onRefresh }: WorkflowListProps) {
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const toggleStatus = async (id: string) => {
    setLoading(prev => ({ ...prev, [id]: true }));
    try {
      await workflowAPI.toggleStatus(id);
      toast({
        title: "Status updated",
        description: "Workflow status has been changed",
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    
    setLoading(prev => ({ ...prev, [id]: true }));
    try {
      await workflowAPI.delete(id);
      toast({
        title: "Workflow deleted",
        description: "The workflow has been removed",
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete workflow",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const duplicateWorkflow = async (workflow: Workflow) => {
    setLoading(prev => ({ ...prev, [workflow.id]: true }));
    try {
      const response = await workflowAPI.duplicate(workflow.id);
      toast({
        title: "Workflow duplicated",
        description: "A copy has been created",
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to duplicate workflow",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [workflow.id]: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border-success/20";
      case "inactive":
        return "bg-muted text-muted-foreground border-border";
      case "draft":
        return "bg-warning/10 text-warning border-warning/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Workflows</h2>
          <p className="text-muted-foreground text-sm">Manage your automation workflows</p>
        </div>
        <Button onClick={onCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      <div className="grid gap-4">
        {localWorkflows.map((workflow, index) => (
          <motion.div
            key={workflow.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      <Badge variant="outline" className={getStatusColor(workflow.status)}>
                        {workflow.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{workflow.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleStatus(workflow.id)}
                      title={workflow.status === "active" ? "Pause" : "Activate"}
                      disabled={loading[workflow.id]}
                    >
                      {workflow.status === "active" ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => duplicateWorkflow(workflow)}
                      title="Duplicate"
                      disabled={loading[workflow.id]}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(workflow)}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteWorkflow(workflow.id)}
                      title="Delete"
                      disabled={loading[workflow.id]}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Nodes:</span>
                    <span className="font-medium">{workflow.nodes.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Runs:</span>
                    <span className="font-medium">{workflow.runCount}</span>
                  </div>
                  {workflow.lastRun && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Last run:</span>
                      <span className="font-medium">
                        {new Date(workflow.lastRun).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
