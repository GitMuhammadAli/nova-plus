"use client"

import type React from "react"

import { useState } from "react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AnimatedCard } from "@/components/motion/animated-card"
import { Badge } from "@/components/ui/badge"
import { GripVertical, Eye, EyeOff, Plus } from "lucide-react"

interface NavItem {
  id: string
  label: string
  icon: string
  visible: boolean
  custom?: boolean
}

export default function SidebarConfigPage() {
  const [navItems, setNavItems] = useState<NavItem[]>([
    { id: "dashboard", label: "Dashboard", icon: "📊", visible: true },
    { id: "analytics", label: "Analytics", icon: "📈", visible: true },
    { id: "users", label: "Users", icon: "👥", visible: true },
    { id: "automation", label: "Automation", icon: "⚙️", visible: true },
    { id: "billing", label: "Billing", icon: "💳", visible: true },
    { id: "settings", label: "Settings", icon: "⚙️", visible: true },
  ])

  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  const handleToggleVisibility = (id: string) => {
    setNavItems(navItems.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item)))
  }

  const handleDragStart = (id: string) => {
    setDraggedItem(id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetId: string) => {
    if (!draggedItem || draggedItem === targetId) return

    const draggedIndex = navItems.findIndex((item) => item.id === draggedItem)
    const targetIndex = navItems.findIndex((item) => item.id === targetId)

    const newItems = [...navItems]
    const [draggedItemObj] = newItems.splice(draggedIndex, 1)
    newItems.splice(targetIndex, 0, draggedItemObj)

    setNavItems(newItems)
    setDraggedItem(null)
  }

  return (
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Sidebar Configuration</h2>
            <p className="text-muted-foreground mt-1">Customize your navigation sidebar</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Custom Item
          </Button>
        </div>

        {/* Navigation Items */}
        <AnimatedCard delay={0.1}>
          <CardHeader>
            <CardTitle>Navigation Items</CardTitle>
            <CardDescription>Drag to reorder, toggle visibility, or customize items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {navItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(item.id)}
                  className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-move"
                >
                  <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.label}</p>
                    {item.custom && (
                      <Badge variant="outline" className="mt-1">
                        Custom
                      </Badge>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleVisibility(item.id)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title={item.visible ? "Hide item" : "Show item"}
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
          </CardContent>
        </AnimatedCard>

        {/* Hidden Items */}
        <AnimatedCard delay={0.2}>
          <CardHeader>
            <CardTitle>Hidden Items</CardTitle>
            <CardDescription>Items that are hidden from your sidebar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {navItems.filter((item) => !item.visible).length > 0 ? (
                navItems
                  .filter((item) => !item.visible)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <p className="font-medium text-foreground">{item.label}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleVisibility(item.id)}
                        className="bg-transparent"
                      >
                        Show
                      </Button>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No hidden items</p>
              )}
            </div>
          </CardContent>
        </AnimatedCard>

        {/* Save Changes */}
        <div className="flex gap-3">
          <Button>Save Configuration</Button>
          <Button variant="outline" className="bg-transparent">
            Reset to Default
          </Button>
        </div>
      </div>
  )
}
