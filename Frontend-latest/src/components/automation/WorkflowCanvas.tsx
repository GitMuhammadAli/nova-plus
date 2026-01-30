import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, Maximize, Save, X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Workflow, WorkflowNode, WorkflowConnection } from "@/types/automation";
import { WorkflowNodeComponent } from "./WorkflowNodeComponent";
import { NodePalette } from "./NodePalette";
import { NodeConfigDialog } from "./NodeConfigDialog";
import { ConnectionLine } from "./ConnectionLine";
import { toast } from "@/hooks/use-toast";

interface WorkflowCanvasProps {
  workflow: Workflow | null;
  onClose: () => void;
  onSave: (workflow: Workflow) => void;
}

export function WorkflowCanvas({ workflow, onClose, onSave }: WorkflowCanvasProps) {
  const [name, setName] = useState(workflow?.name || "New Workflow");
  const [description, setDescription] = useState(workflow?.description || "");
  const [nodes, setNodes] = useState<WorkflowNode[]>(workflow?.nodes || []);
  const [connections, setConnections] = useState<WorkflowConnection[]>(workflow?.connections || []);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string; position: { x: number; y: number } } | null>(null);
  const [tempConnectionEnd, setTempConnectionEnd] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    const savedWorkflow: Workflow = {
      id: workflow?.id || `wf${Date.now()}`,
      name,
      description,
      status: workflow?.status || "draft",
      nodes,
      connections,
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

  const handleTest = () => {
    toast({
      title: "Testing workflow",
      description: `Testing "${name}" with ${nodes.length} nodes and ${connections.length} connections`,
    });
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else if (connectionStart && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setTempConnectionEnd({
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setConnectionStart(null);
    setTempConnectionEnd(null);
  };

  const addNode = (type: "trigger" | "action", nodeType: string) => {
    // Calculate position in canvas space, with slight offset for each new node
    const baseX = (400 - pan.x) / zoom;
    const baseY = (200 - pan.y) / zoom;
    const offset = nodes.length * 30; // Offset each new node slightly
    
    const newNode: WorkflowNode = {
      id: `n${Date.now()}`,
      type,
      ...(type === "trigger" ? { triggerType: nodeType as any } : { actionType: nodeType as any }),
      config: {},
      position: { x: baseX + offset, y: baseY + offset },
    };
    setNodes(prev => [...prev, newNode]);
  };

  const updateNodePosition = (id: string, position: { x: number; y: number }) => {
    setNodes(prev =>
      prev.map(node => (node.id === id ? { ...node, position } : node))
    );
  };

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(node => node.id !== id));
    setConnections(prev => prev.filter(conn => conn.source !== id && conn.target !== id));
  };

  const handleConnectionStart = (nodeId: string, position: { x: number; y: number }) => {
    setConnectionStart({ nodeId, position });
  };

  const handleConnectionEnd = (targetNodeId: string) => {
    if (connectionStart && connectionStart.nodeId !== targetNodeId) {
      const newConnection: WorkflowConnection = {
        id: `c${Date.now()}`,
        source: connectionStart.nodeId,
        target: targetNodeId,
      };
      setConnections(prev => [...prev, newConnection]);
      toast({
        title: "Connection created",
        description: "Nodes connected successfully",
      });
    }
    setConnectionStart(null);
    setTempConnectionEnd(null);
  };

  const deleteConnection = (id: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== id));
  };

  const handleConfigureNode = (node: WorkflowNode) => {
    setSelectedNode(node);
    setIsConfigOpen(true);
  };

  const handleSaveNodeConfig = (config: Record<string, any>) => {
    if (selectedNode) {
      setNodes(prev =>
        prev.map(node => (node.id === selectedNode.id ? { ...node, config } : node))
      );
    }
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
            <Button variant="outline" onClick={handleResetZoom} size="sm">
              <Maximize className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleZoomOut} size="sm">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" onClick={handleZoomIn} size="sm">
              <ZoomIn className="h-4 w-4" />
            </Button>
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

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 overflow-hidden bg-muted/30 relative cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid Pattern */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
              `,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
            }}
          />

          {/* Nodes */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          >
            <AnimatePresence>
              {nodes.map((node) => (
                <WorkflowNodeComponent
                  key={node.id}
                  node={node}
                  zoom={zoom}
                  pan={pan}
                  onPositionChange={(pos) => updateNodePosition(node.id, pos)}
                  onDelete={() => deleteNode(node.id)}
                  onConfigure={() => handleConfigureNode(node)}
                  onConnectionStart={handleConnectionStart}
                  onConnectionEnd={handleConnectionEnd}
                  isConnecting={connectionStart?.nodeId === node.id}
                />
              ))}
            </AnimatePresence>

            {/* Connections */}
            <svg className="absolute inset-0 pointer-events-auto" style={{ width: "100%", height: "100%" }}>
              <AnimatePresence>
                {connections.map((conn) => {
                  const sourceNode = nodes.find(n => n.id === conn.source);
                  const targetNode = nodes.find(n => n.id === conn.target);
                  if (!sourceNode || !targetNode) return null;

                  const x1 = sourceNode.position.x + 256;
                  const y1 = sourceNode.position.y + 50;
                  const x2 = targetNode.position.x;
                  const y2 = targetNode.position.y + 50;

                  return (
                    <ConnectionLine
                      key={conn.id}
                      id={conn.id}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      onDelete={() => deleteConnection(conn.id)}
                      isActive={true}
                    />
                  );
                })}
                
                {/* Temporary connection line while dragging */}
                {connectionStart && tempConnectionEnd && (
                  <ConnectionLine
                    id="temp"
                    x1={connectionStart.position.x}
                    y1={connectionStart.position.y}
                    x2={tempConnectionEnd.x}
                    y2={tempConnectionEnd.y}
                    isActive={false}
                  />
                )}
              </AnimatePresence>
            </svg>
          </div>
        </div>
      </div>

      <NodeConfigDialog
        node={selectedNode}
        open={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={handleSaveNodeConfig}
      />
    </div>
  );
}
