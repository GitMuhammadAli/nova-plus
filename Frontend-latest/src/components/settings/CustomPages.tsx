import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Trash2, 
  FileText,
  ExternalLink,
  Edit
} from "lucide-react";
import { motion } from "framer-motion";

interface CustomPage {
  id: string;
  name: string;
  path: string;
  icon: string;
}

export function CustomPages() {
  const [pages, setPages] = useState<CustomPage[]>([
    { id: "1", name: "Documentation", path: "/docs", icon: "FileText" },
    { id: "2", name: "Support", path: "/support", icon: "MessageCircle" },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newPage, setNewPage] = useState({ name: "", path: "", icon: "FileText" });

  const handleAddPage = () => {
    if (newPage.name && newPage.path) {
      setPages([...pages, { ...newPage, id: Date.now().toString() }]);
      setNewPage({ name: "", path: "", icon: "FileText" });
      setIsAdding(false);
    }
  };

  const handleDeletePage = (id: string) => {
    setPages(pages.filter(page => page.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Custom Pages</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add custom pages to your navigation
            </p>
          </div>
          <Button onClick={() => setIsAdding(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Page
          </Button>
        </div>

        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4 p-4 rounded-lg border bg-accent/20"
          >
            <div className="space-y-3">
              <div>
                <Label htmlFor="page-name">Page Name</Label>
                <Input
                  id="page-name"
                  value={newPage.name}
                  onChange={(e) => setNewPage({ ...newPage, name: e.target.value })}
                  placeholder="e.g., Documentation"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="page-path">Path</Label>
                <Input
                  id="page-path"
                  value={newPage.path}
                  onChange={(e) => setNewPage({ ...newPage, path: e.target.value })}
                  placeholder="e.g., /docs"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddPage} size="sm">
                  Add Page
                </Button>
                <Button onClick={() => setIsAdding(false)} variant="ghost" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="space-y-2">
          {pages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No custom pages yet</p>
            </div>
          ) : (
            pages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{page.name}</p>
                    <p className="text-xs text-muted-foreground">{page.path}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePage(page.id)}
                  >
                    <Trash2 className="w-4 h-4 text-danger" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </motion.div>
  );
}
