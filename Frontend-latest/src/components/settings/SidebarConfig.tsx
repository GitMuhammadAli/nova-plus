import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  GripVertical, 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Zap,
  FileText,
  CreditCard,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";
import { motion } from "framer-motion";

interface NavItem {
  id: string;
  icon: any;
  label: string;
  visible: boolean;
}

export function SidebarConfig() {
  const [navItems, setNavItems] = useState<NavItem[]>([
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", visible: true },
    { id: "users", icon: Users, label: "Users", visible: true },
    { id: "analytics", icon: BarChart3, label: "Analytics", visible: true },
    { id: "automation", icon: Zap, label: "NovaFlow", visible: true },
    { id: "reports", icon: FileText, label: "Reports", visible: true },
    { id: "billing", icon: CreditCard, label: "Billing", visible: true },
    { id: "settings", icon: Settings, label: "Settings", visible: true },
  ]);

  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const toggleVisibility = (id: string) => {
    setNavItems(items =>
      items.map(item =>
        item.id === id ? { ...item, visible: !item.visible } : item
      )
    );
  };

  const handleDragStart = (id: string) => {
    setDraggedItem(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = navItems.findIndex(item => item.id === draggedItem);
    const targetIndex = navItems.findIndex(item => item.id === targetId);

    const newItems = [...navItems];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    setNavItems(newItems);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSave = () => {
    console.log("Saving sidebar config:", navItems);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Navigation Items</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Drag to reorder, toggle to show/hide navigation items
        </p>
        
        <div className="space-y-2">
          {navItems.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(item.id)}
              onDragOver={(e) => handleDragOver(e, item.id)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-move transition-all ${
                draggedItem === item.id ? "opacity-50" : ""
              }`}
            >
              <GripVertical className="w-5 h-5 text-muted-foreground shrink-0" />
              <item.icon className="w-5 h-5 text-foreground shrink-0" />
              <span className="text-sm font-medium text-foreground flex-1">
                {item.label}
              </span>
              <button
                onClick={() => toggleVisibility(item.id)}
                className="p-2 hover:bg-accent rounded-md transition-colors"
              >
                {item.visible ? (
                  <Eye className="w-4 h-4 text-foreground" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Navigation</Button>
      </div>
    </motion.div>
  );
}
