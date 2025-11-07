"use client"

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Edit, Trash2, Plus, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Workflow } from "@/types/automation";
import { toast } from "@/hooks/use-toast";

interface WorkflowListProps {
  workflows: Workflow[];
  onEdit: (workflow: Workflow) => void;
  onCreate: () => void;
}

export function WorkflowList({ workflows, onEdit, onCreate }: WorkflowListProps) {
  const [localWorkflows, setLocalWorkflows] = useState(workflows);

  const toggleStatus = (id: string) => {
    setLocalWorkflows(prev =>
      prev.map(w =>
        w.id === id
          ? { ...w, status: w.status === "active" ? "inactive" : "active" as const }
          : w
      )
    );
    toast({
      title: "Status updated",
      description: "Workflow status has been changed",
    });
  };

  const deleteWorkflow = (id: string) => {
    setLocalWorkflows(prev => prev.filter(w => w.id !== id));
    toast({
      title: "Workflow deleted",
      description: "The workflow has been removed",
    });
  };

  const duplicateWorkflow = (workflow: Workflow) => {
    const newWorkflow = {
      ...workflow,
      id: `wf${Date.now()}`,
      name: `${workflow.name} (Copy)`,
      status: "draft" as const,
      runCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setLocalWorkflows(prev => [...prev, newWorkflow]);
    toast({
      title: "Workflow duplicated",
      description: "A copy has been created",
    });
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
                    >
                      <Trash2 className="h-4 w-4 text-danger" />
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
