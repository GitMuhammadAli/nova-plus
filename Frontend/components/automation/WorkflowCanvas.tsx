"use client"

import { useState, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize, Save, X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Workflow, WorkflowNode as WorkflowNodeType, WorkflowConnection } from "@/types/automation";
import { NodePalette } from "./NodePalette";
import { NodeConfigDialog } from "./NodeConfigDialog";
import { ConditionalBranch, ConditionalBranchData } from "./ConditionalBranch";
import { WorkflowExecutionLog, WorkflowExecution } from "./WorkflowExecutionLog";
import { WorkflowEngine } from "@/lib/workflowEngine";
import { toast } from "@/hooks/use-toast";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomNode } from "./CustomNode";

const nodeTypes = {
  custom: CustomNode,
};

interface WorkflowCanvasProps {
  workflow: Workflow | null;
  onClose: () => void;
  onSave: (workflow: Workflow) => void;
}

// Convert our workflow nodes to React Flow nodes
const convertToReactFlowNodes = (nodes: WorkflowNodeType[]): Node[] => {
  return nodes.map(node => ({
    id: node.id,
    type: 'custom',
    position: node.position,
    data: {
      ...node,
      label: node.triggerType || node.actionType || '',
    },
  }));
};

// Convert our workflow connections to React Flow edges
const convertToReactFlowEdges = (connections: WorkflowConnection[]): Edge[] => {
  return connections.map(conn => ({
    id: conn.id,
    source: conn.source,
    target: conn.target,
    type: conn.conditions && conn.conditions.length > 0 ? 'default' : 'smoothstep',
    animated: true,
    style: { 
      stroke: conn.conditions && conn.conditions.length > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
      strokeWidth: 2,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: conn.conditions && conn.conditions.length > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
    },
    data: {
      conditions: conn.conditions,
      logic: conn.logic,
    },
  }));
};

// Convert React Flow data back to our format
const convertFromReactFlow = (nodes: Node[], edges: Edge[]): { nodes: WorkflowNodeType[], connections: WorkflowConnection[] } => {
  const workflowNodes: WorkflowNodeType[] = nodes.map(node => ({
    id: node.id,
    type: node.data.type as "trigger" | "action",
    ...(node.data.type === "trigger" ? { triggerType: node.data.triggerType as any } : { actionType: node.data.actionType as any }),
    config: (node.data.config || {}) as Record<string, any>,
    position: node.position,
  }));

  const workflowConnections: WorkflowConnection[] = edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    conditions: edge.data?.conditions as any,
    logic: edge.data?.logic as "AND" | "OR" | undefined,
  }));

  return { nodes: workflowNodes, connections: workflowConnections };
};

export function WorkflowCanvas({ workflow, onClose, onSave }: WorkflowCanvasProps) {
  const [name, setName] = useState(workflow?.name || "New Workflow");
  const [description, setDescription] = useState(workflow?.description || "");
  const [nodes, setNodes, onNodesChange] = useNodesState(
    convertToReactFlowNodes(workflow?.nodes || [])
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    convertToReactFlowEdges(workflow?.connections || [])
  );
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeType | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isBranchConfigOpen, setIsBranchConfigOpen] = useState(false);
  const [executionLog, setExecutionLog] = useState<WorkflowExecution | null>(null);
  const [isExecutionLogOpen, setIsExecutionLogOpen] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(var(--muted-foreground))',
        },
      };
      setEdges((eds) => addEdge(edge, eds));
      toast({
        title: "Connection created",
        description: "Nodes connected successfully",
      });
    },
    [setEdges]
  );

  const handleSave = () => {
    const { nodes: workflowNodes, connections: workflowConnections } = convertFromReactFlow(nodes, edges);
    const savedWorkflow: Workflow = {
      id: workflow?.id || `wf${Date.now()}`,
      name,
      description,
      status: workflow?.status || "draft",
      nodes: workflowNodes,
      connections: workflowConnections,
      runCount: workflow?.runCount || 0,
      createdAt: workflow?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    onSave(savedWorkflow);
    toast({
      title: "Workflow saved",
      description: "Your workflow has been saved successfully",
    });
  };

  const handleTest = async () => {
    const { nodes: workflowNodes, connections: workflowConnections } = convertFromReactFlow(nodes, edges);
    const testWorkflow: Workflow = {
      id: workflow?.id || `wf${Date.now()}`,
      name,
      description,
      status: "draft",
      nodes: workflowNodes,
      connections: workflowConnections,
      runCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const engine = new WorkflowEngine(testWorkflow);
    
    toast({
      title: "Testing workflow",
      description: "Executing workflow...",
    });

    const execution = await engine.execute({ testData: "Sample trigger data" });
    setExecutionLog(execution);
    setIsExecutionLogOpen(true);

    toast({
      title: execution.status === "completed" ? "Test completed" : "Test failed",
      description: `Executed ${execution.steps.length} steps`,
      variant: execution.status === "failed" ? "destructive" : "default",
    });
  };

  const addNode = (type: "trigger" | "action", nodeType: string) => {
    const newNode: Node = {
      id: `n${Date.now()}`,
      type: 'custom',
      position: { x: 250, y: 250 + nodes.length * 30 },
      data: {
        id: `n${Date.now()}`,
        type,
        ...(type === "trigger" ? { triggerType: nodeType } : { actionType: nodeType }),
        config: {},
        label: nodeType,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const workflowNode: WorkflowNodeType = {
      id: node.id,
      type: node.data.type as "trigger" | "action",
      ...(node.data.type === "trigger" ? { triggerType: node.data.triggerType as any } : { actionType: node.data.actionType as any }),
      config: (node.data.config || {}) as Record<string, any>,
      position: node.position,
    };
    setSelectedNode(workflowNode);
    setIsConfigOpen(true);
  }, []);

  const handleSaveNodeConfig = (config: Record<string, any>) => {
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode.id
            ? { ...node, data: { ...node.data, config } }
            : node
        )
      );
    }
  };

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setIsBranchConfigOpen(true);
  }, []);

  const handleSaveBranchConfig = (data: ConditionalBranchData) => {
    if (selectedEdge) {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === selectedEdge.id
            ? {
                ...edge,
                data: { conditions: data.conditions, logic: data.logic },
                type: 'default',
                style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: 'hsl(var(--primary))',
                },
              }
            : edge
        )
      );
      toast({
        title: "Conditional branch configured",
        description: "Connection updated with conditions",
      });
    }
    setIsBranchConfigOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex-1 space-y-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xl font-bold border-0 bg-transparent focus-visible:ring-0 p-0 h-auto"
              placeholder="Workflow Name"
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm text-muted-foreground border-0 bg-transparent focus-visible:ring-0 p-0 resize-none h-auto min-h-0"
              placeholder="Workflow description..."
              rows={1}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleTest} size="sm" className="gap-2">
              <Play className="h-4 w-4" />
              Test
            </Button>
            <Button onClick={handleSave} size="sm" className="gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button variant="ghost" onClick={onClose} size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Node Palette */}
        <NodePalette onAddNode={addNode} />

        {/* React Flow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-muted/30"
          >
            <Controls />
            <MiniMap />
            <Background gap={12} size={1} />
          </ReactFlow>
        </div>
      </div>

      <NodeConfigDialog
        node={selectedNode}
        open={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={handleSaveNodeConfig}
      />

      <Dialog open={isBranchConfigOpen} onOpenChange={setIsBranchConfigOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure Conditional Branch</DialogTitle>
          </DialogHeader>
          <ConditionalBranch
            data={
              selectedEdge?.data
                ? {
                    logic: (selectedEdge.data.logic as "AND" | "OR") || "AND",
                    conditions: (selectedEdge.data.conditions || []) as any,
                  }
                : undefined
            }
            onSave={handleSaveBranchConfig}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isExecutionLogOpen} onOpenChange={setIsExecutionLogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Workflow Execution Log</DialogTitle>
          </DialogHeader>
          {executionLog && <WorkflowExecutionLog execution={executionLog} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
