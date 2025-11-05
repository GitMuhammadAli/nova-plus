"use client"

import type React from "react"

import { useState } from "react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AnimatedCard } from "@/components/motion/animated-card"
import { GripVertical, Eye, EyeOff, Trash2, Settings } from "lucide-react"

interface Widget {
  id: string
  title: string
  type: "chart" | "stats" | "table" | "activity" | "metrics"
  visible: boolean
  size: "small" | "medium" | "large"
}

export default function CustomizeDashboardPage() {
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: "1", title: "Revenue Overview", type: "chart", visible: true, size: "large" },
    { id: "2", title: "Key Metrics", type: "stats", visible: true, size: "medium" },
    { id: "3", title: "Recent Activity", type: "activity", visible: true, size: "medium" },
    { id: "4", title: "User Analytics", type: "chart", visible: true, size: "large" },
    { id: "5", title: "Top Performers", type: "table", visible: false, size: "large" },
    { id: "6", title: "System Health", type: "metrics", visible: true, size: "small" },
  ])

  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)
  const [editingWidget, setEditingWidget] = useState<string | null>(null)

  const handleToggleVisibility = (id: string) => {
    setWidgets(widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)))
  }

  const handleDeleteWidget = (id: string) => {
    setWidgets(widgets.filter((w) => w.id !== id))
  }

  const handleDragStart = (id: string) => {
    setDraggedWidget(id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetId: string) => {
    if (!draggedWidget || draggedWidget === targetId) return

    const draggedIndex = widgets.findIndex((w) => w.id === draggedWidget)
    const targetIndex = widgets.findIndex((w) => w.id === targetId)

    const newWidgets = [...widgets]
    const [draggedWidgetObj] = newWidgets.splice(draggedIndex, 1)
    newWidgets.splice(targetIndex, 0, draggedWidgetObj)

    setWidgets(newWidgets)
    setDraggedWidget(null)
  }

  const handleChangeSize = (id: string, newSize: Widget["size"]) => {
    setWidgets(widgets.map((w) => (w.id === id ? { ...w, size: newSize } : w)))
  }

  const visibleWidgets = widgets.filter((w) => w.visible)
  const hiddenWidgets = widgets.filter((w) => !w.visible)

  return (
      <div className="space-y-8 max-w-6xl">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-foreground">Customize Dashboard</h2>
          <p className="text-muted-foreground mt-1">Reorder widgets, change sizes, and manage visibility</p>
        </div>

        {/* Active Widgets */}
        <AnimatedCard delay={0.1}>
          <CardHeader>
            <CardTitle>Active Widgets</CardTitle>
            <CardDescription>Drag to reorder, adjust size, or hide widgets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {visibleWidgets.map((widget) => (
                <div
                  key={widget.id}
                  draggable
                  onDragStart={() => handleDragStart(widget.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(widget.id)}
                  className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-move"
                >
                  <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />

                  <div className="flex-1">
                    <p className="font-medium text-foreground">{widget.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">Type: {widget.type}</p>
                  </div>

                  {/* Size Controls */}
                  <div className="flex items-center gap-2">
                    <select
                      value={widget.size}
                      onChange={(e) => handleChangeSize(widget.id, e.target.value as Widget["size"])}
                      className="px-2 py-1 text-sm border border-border rounded-lg bg-background text-foreground"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleVisibility(widget.id)}
                      title="Hide widget"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Widget settings">
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDeleteWidget(widget.id)}
                      title="Remove widget"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </AnimatedCard>

        {/* Hidden Widgets */}
        {hiddenWidgets.length > 0 && (
          <AnimatedCard delay={0.2}>
            <CardHeader>
              <CardTitle>Hidden Widgets</CardTitle>
              <CardDescription>Widgets that are hidden from your dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {hiddenWidgets.map((widget) => (
                  <div
                    key={widget.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">{widget.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">Type: {widget.type}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleVisibility(widget.id)}
                      className="bg-transparent gap-2"
                    >
                      <EyeOff className="w-4 h-4" />
                      Show
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </AnimatedCard>
        )}

        {/* Layout Preview */}
        <AnimatedCard delay={0.3}>
          <CardHeader>
            <CardTitle>Layout Preview</CardTitle>
            <CardDescription>How your dashboard will look</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {visibleWidgets.map((widget) => (
                <div
                  key={widget.id}
                  className={`p-4 border border-border rounded-lg bg-muted/30 ${
                    widget.size === "large" ? "col-span-2" : widget.size === "medium" ? "col-span-1" : "col-span-1"
                  }`}
                >
                  <p className="font-medium text-foreground text-sm">{widget.title}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {widget.size === "large" ? "2 columns" : widget.size === "medium" ? "1 column" : "1 column (small)"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </AnimatedCard>

        {/* Save Changes */}
        <div className="flex gap-3">
          <Button>Save Layout</Button>
          <Button variant="outline" className="bg-transparent">
            Reset to Default
          </Button>
        </div>
      </div>
  )
}
