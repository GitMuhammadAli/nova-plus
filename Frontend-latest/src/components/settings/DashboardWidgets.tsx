import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  GripVertical, 
  DollarSign,
  Users,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart,
  Eye,
  EyeOff
} from "lucide-react";
import { motion } from "framer-motion";

interface Widget {
  id: string;
  icon: any;
  label: string;
  type: string;
  visible: boolean;
}

export function DashboardWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: "revenue", icon: DollarSign, label: "Total Revenue", type: "kpi", visible: true },
    { id: "users", icon: Users, label: "Active Users", type: "kpi", visible: true },
    { id: "conversion", icon: TrendingUp, label: "Conversion Rate", type: "kpi", visible: true },
    { id: "health", icon: Activity, label: "System Health", type: "kpi", visible: true },
    { id: "revenue-chart", icon: BarChart3, label: "Revenue Chart", type: "chart", visible: true },
    { id: "user-activity", icon: PieChart, label: "User Activity", type: "chart", visible: true },
  ]);

  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const toggleVisibility = (id: string) => {
    setWidgets(items =>
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

    const draggedIndex = widgets.findIndex(item => item.id === draggedItem);
    const targetIndex = widgets.findIndex(item => item.id === targetId);

    const newItems = [...widgets];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    setWidgets(newItems);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSave = () => {
    console.log("Saving dashboard config:", widgets);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Dashboard Widgets</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Customize your dashboard by reordering and toggling widgets
        </p>
        
        <div className="space-y-2">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              draggable
              onDragStart={() => handleDragStart(widget.id)}
              onDragOver={(e) => handleDragOver(e, widget.id)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-move transition-all ${
                draggedItem === widget.id ? "opacity-50" : ""
              }`}
            >
              <GripVertical className="w-5 h-5 text-muted-foreground shrink-0" />
              <widget.icon className="w-5 h-5 text-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{widget.label}</p>
                <p className="text-xs text-muted-foreground capitalize">{widget.type}</p>
              </div>
              <button
                onClick={() => toggleVisibility(widget.id)}
                className="p-2 hover:bg-accent rounded-md transition-colors"
              >
                {widget.visible ? (
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
        <Button onClick={handleSave}>Save Dashboard Layout</Button>
      </div>
    </motion.div>
  );
}
