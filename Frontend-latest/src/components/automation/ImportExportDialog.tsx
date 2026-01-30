import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Workflow } from "@/types/automation";
import { Download, Upload, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ImportExportDialogProps {
  open: boolean;
  onClose: () => void;
  currentWorkflow?: Workflow;
  onImport: (workflow: Workflow) => void;
}

export function ImportExportDialog({ open, onClose, currentWorkflow, onImport }: ImportExportDialogProps) {
  const [importText, setImportText] = useState("");
  const [copied, setCopied] = useState(false);

  const exportData = currentWorkflow ? JSON.stringify(currentWorkflow, null, 2) : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Workflow exported successfully"
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the text manually",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    if (!currentWorkflow) return;
    
    const blob = new Blob([exportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentWorkflow.name.replace(/\s+/g, "-").toLowerCase()}-workflow.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Workflow exported",
      description: "File downloaded successfully"
    });
  };

  const handleImport = () => {
    try {
      const workflow = JSON.parse(importText);
      
      // Basic validation
      if (!workflow.name || !workflow.nodes || !workflow.connections) {
        throw new Error("Invalid workflow format");
      }
      
      // Generate new ID for imported workflow
      const importedWorkflow: Workflow = {
        ...workflow,
        id: `workflow-${Date.now()}`,
        status: "inactive",
        createdAt: new Date(),
        updatedAt: new Date(),
        runCount: 0
      };
      
      onImport(importedWorkflow);
      toast({
        title: "Workflow imported",
        description: "You can now edit and activate it"
      });
      onClose();
      setImportText("");
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Invalid workflow format. Please check your JSON.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportText(content);
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import / Export Workflow</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Export your workflow as JSON to share or back it up
              </p>
              
              <Textarea
                value={exportData}
                readOnly
                className="font-mono text-xs h-[300px]"
                placeholder="No workflow to export"
              />
              
              <div className="flex gap-2">
                <Button onClick={handleCopy} variant="outline" className="flex-1">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
                <Button onClick={handleDownload} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download JSON
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="import" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Import a workflow from JSON or upload a file
              </p>
              
              <div className="flex gap-2 mb-2">
                <Button variant="outline" className="flex-1" asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload JSON File
                    <input
                      id="file-upload"
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </Button>
              </div>
              
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="font-mono text-xs h-[300px]"
                placeholder="Paste workflow JSON here..."
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleImport} disabled={!importText.trim()}>
                Import Workflow
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
