import { useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { WorkflowList } from "@/components/automation/WorkflowList";
import { WorkflowCanvas } from "@/components/automation/WorkflowCanvas";
import { WorkflowTemplates } from "@/components/automation/WorkflowTemplates";
import { ImportExportDialog } from "@/components/automation/ImportExportDialog";
import { mockWorkflows, Workflow } from "@/types/automation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Play, Activity, FileJson } from "lucide-react";

export default function Automation() {
  const [workflows, setWorkflows] = useState(mockWorkflows);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  const handleEdit = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setIsCanvasOpen(true);
  };

  const handleCreate = () => {
    setSelectedWorkflow(null);
    setIsCanvasOpen(true);
  };

  const handleSave = (workflow: Workflow) => {
    setWorkflows(prev => {
      const existing = prev.find(w => w.id === workflow.id);
      if (existing) {
        return prev.map(w => w.id === workflow.id ? workflow : w);
      }
      return [...prev, workflow];
    });
    setIsCanvasOpen(false);
  };

  const handleUseTemplate = (template: Workflow) => {
    const newWorkflow = {
      ...template,
      id: `workflow-${Date.now()}`,
      status: "inactive" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      runCount: 0
    };
    setSelectedWorkflow(newWorkflow);
    setIsCanvasOpen(true);
  };

  const handleImport = (workflow: Workflow) => {
    setWorkflows([...workflows, workflow]);
  };

  const activeWorkflows = workflows.filter(w => w.status === "active").length;
  const totalRuns = workflows.reduce((sum, w) => sum + w.runCount, 0);

  return (
    <AppShell>
      {isCanvasOpen ? (
        <WorkflowCanvas
          workflow={selectedWorkflow}
          onClose={() => setIsCanvasOpen(false)}
          onSave={handleSave}
        />
      ) : (
        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">NovaFlow</h1>
                <p className="text-muted-foreground mt-1">
                  Visual automation builder for your workflows
                </p>
              </div>
              <Button variant="outline" onClick={() => setIsImportExportOpen(true)}>
                <FileJson className="h-4 w-4 mr-2" />
                Import / Export
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{workflows.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {activeWorkflows} active
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
                    <Play className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalRuns}</div>
                    <p className="text-xs text-muted-foreground">
                      All-time executions
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Nodes</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(workflows.reduce((sum, w) => sum + w.nodes.length, 0) / workflows.length).toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Per workflow
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <Tabs defaultValue="workflows" className="w-full">
              <TabsList>
                <TabsTrigger value="workflows">My Workflows</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
              </TabsList>
              
              <TabsContent value="workflows" className="mt-6">
                <WorkflowList
                  workflows={workflows}
                  onEdit={handleEdit}
                  onCreate={handleCreate}
                />
              </TabsContent>
              
              <TabsContent value="templates" className="mt-6">
                <WorkflowTemplates onUseTemplate={handleUseTemplate} />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      )}

      <ImportExportDialog
        open={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        currentWorkflow={selectedWorkflow || undefined}
        onImport={handleImport}
      />
    </AppShell>
  );
}
