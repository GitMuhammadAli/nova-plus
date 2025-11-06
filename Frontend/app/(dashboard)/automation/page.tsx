"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkflowList } from "@/components/automation/WorkflowList"
import { WorkflowCanvas } from "@/components/automation/WorkflowCanvas"
import { WorkflowTemplates } from "@/components/automation/WorkflowTemplates"
import { ImportExportDialog } from "@/components/automation/ImportExportDialog"
import { Workflow } from "@/types/automation"
import { Button } from "@/components/ui/button"
import { Download, Upload, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AnimatedCard } from "@/components/motion/animated-card"

// Mock data - replace with actual API calls
const initialWorkflows: Workflow[] = [
  {
    id: "wf1",
    name: "Welcome Email Campaign",
    description: "Send welcome email to new users",
    status: "active",
    nodes: [
      {
        id: "node-1",
        type: "trigger",
        triggerType: "user_created",
        config: {},
        position: { x: 100, y: 100 }
      },
      {
        id: "node-2",
        type: "action",
        actionType: "send_email",
        config: { template: "welcome", subject: "Welcome to our platform!" },
        position: { x: 400, y: 100 }
      }
    ],
    connections: [
      { id: "conn-1", source: "node-1", target: "node-2" }
    ],
    runCount: 1234,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    lastRun: new Date("2024-01-20")
  },
  {
    id: "wf2",
    name: "Inactive User Reminder",
    description: "Remind users who haven't logged in for 7 days",
    status: "active",
    nodes: [
      {
        id: "node-1",
        type: "trigger",
        triggerType: "schedule",
        config: { scheduleType: "daily", scheduleValue: "09:00" },
        position: { x: 100, y: 100 }
      },
      {
        id: "node-2",
        type: "action",
        actionType: "send_email",
        config: { template: "notification", subject: "We miss you!" },
        position: { x: 400, y: 100 }
      }
    ],
    connections: [
      { id: "conn-1", source: "node-1", target: "node-2" }
    ],
    runCount: 156,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-18"),
    lastRun: new Date("2024-01-19")
  },
  {
    id: "wf3",
    name: "Payment Failed Recovery",
    description: "Send retry payment notification",
    status: "inactive",
    nodes: [
      {
        id: "node-1",
        type: "trigger",
        triggerType: "payment_received",
        config: {},
        position: { x: 100, y: 100 }
      },
      {
        id: "node-2",
        type: "action",
        actionType: "send_email",
        config: { template: "notification", subject: "Payment failed" },
        position: { x: 400, y: 100 }
      }
    ],
    connections: [
      { id: "conn-1", source: "node-1", target: "node-2" }
    ],
    runCount: 89,
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-17"),
    lastRun: new Date("2024-01-17")
  }
]

export default function AutomationPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [isCanvasOpen, setIsCanvasOpen] = useState(false)
  const [isImportExportOpen, setIsImportExportOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"list" | "templates">("list")

  const handleCreateWorkflow = () => {
    const newWorkflow: Workflow = {
      id: `wf${Date.now()}`,
      name: "New Workflow",
      description: "",
      status: "draft",
      nodes: [],
      connections: [],
      runCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setSelectedWorkflow(newWorkflow)
    setIsCanvasOpen(true)
  }

  const handleEditWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setIsCanvasOpen(true)
  }

  const handleSaveWorkflow = (workflow: Workflow) => {
    setWorkflows(prev => {
      const existingIndex = prev.findIndex(w => w.id === workflow.id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = workflow
        return updated
      }
      return [...prev, workflow]
    })
    setIsCanvasOpen(false)
    setSelectedWorkflow(null)
  }

  const handleUseTemplate = (template: Workflow) => {
    const newWorkflow: Workflow = {
      ...template,
      id: `wf${Date.now()}`,
      name: `${template.name} (Copy)`,
      status: "draft",
      runCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setSelectedWorkflow(newWorkflow)
    setIsCanvasOpen(true)
  }

  const handleImportWorkflow = (workflow: Workflow) => {
    setWorkflows(prev => [...prev, workflow])
    setIsImportExportOpen(false)
  }

  const activeCount = workflows.filter(w => w.status === "active").length
  const totalRuns = workflows.reduce((sum, w) => sum + w.runCount, 0)

  if (isCanvasOpen && selectedWorkflow) {
    return (
      <WorkflowCanvas
        workflow={selectedWorkflow}
        onClose={() => {
          setIsCanvasOpen(false)
          setSelectedWorkflow(null)
        }}
        onSave={handleSaveWorkflow}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Automation Builder</h2>
          <p className="text-muted-foreground mt-1">Create and manage automated workflows</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsImportExportOpen(true)}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button onClick={handleCreateWorkflow} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Workflow
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatedCard delay={0.1}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Workflows</p>
            <p className="text-3xl font-bold text-foreground mt-2">{activeCount}</p>
          </CardContent>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Workflows</p>
            <p className="text-3xl font-bold text-foreground mt-2">{workflows.length}</p>
          </CardContent>
        </AnimatedCard>

        <AnimatedCard delay={0.3}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Runs</p>
            <p className="text-3xl font-bold text-foreground mt-2">
              {totalRuns.toLocaleString()}
            </p>
          </CardContent>
        </AnimatedCard>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "list" | "templates")}>
        <TabsList>
          <TabsTrigger value="list">My Workflows</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <WorkflowList
            workflows={workflows}
            onEdit={handleEditWorkflow}
            onCreate={handleCreateWorkflow}
          />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <WorkflowTemplates onUseTemplate={handleUseTemplate} />
        </TabsContent>
      </Tabs>

      {/* Import/Export Dialog */}
      <ImportExportDialog
        open={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        currentWorkflow={selectedWorkflow || undefined}
        onImport={handleImportWorkflow}
      />
    </div>
  )
}
