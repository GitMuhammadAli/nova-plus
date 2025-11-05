"use client"

import { useState } from "react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AnimatedCard } from "@/components/motion/animated-card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit2, Copy } from "lucide-react"

interface CustomField {
  id: string
  name: string
  type: "text" | "email" | "number" | "date" | "select" | "checkbox"
  required: boolean
  description: string
}

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<CustomField[]>([
    {
      id: "1",
      name: "Department",
      type: "select",
      required: true,
      description: "User department",
    },
    {
      id: "2",
      name: "Employee ID",
      type: "text",
      required: true,
      description: "Unique employee identifier",
    },
    {
      id: "3",
      name: "Start Date",
      type: "date",
      required: false,
      description: "Employment start date",
    },
  ])

  const [showNewFieldForm, setShowNewFieldForm] = useState(false)
  const [newField, setNewField] = useState<Partial<CustomField>>({
    name: "",
    type: "text",
    required: false,
    description: "",
  })

  const handleAddField = () => {
    if (newField.name) {
      setFields([
        ...fields,
        {
          id: Date.now().toString(),
          name: newField.name || "",
          type: (newField.type as CustomField["type"]) || "text",
          required: newField.required || false,
          description: newField.description || "",
        },
      ])
      setNewField({ name: "", type: "text", required: false, description: "" })
      setShowNewFieldForm(false)
    }
  }

  const handleDeleteField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id))
  }

  const fieldTypes = ["text", "email", "number", "date", "select", "checkbox"]

  return (
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Custom Fields</h2>
            <p className="text-muted-foreground mt-1">Add custom fields to your forms and tables</p>
          </div>
          <Button className="gap-2" onClick={() => setShowNewFieldForm(!showNewFieldForm)}>
            <Plus className="w-4 h-4" />
            New Field
          </Button>
        </div>

        {/* New Field Form */}
        {showNewFieldForm && (
          <AnimatedCard delay={0.1}>
            <CardHeader>
              <CardTitle>Create Custom Field</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Field Name</label>
                <Input
                  value={newField.name || ""}
                  onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                  placeholder="e.g., Department, Team, Location"
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Field Type</label>
                <select
                  value={newField.type || "text"}
                  onChange={(e) => setNewField({ ...newField, type: e.target.value as CustomField["type"] })}
                  className="w-full mt-2 p-2 border border-border rounded-lg bg-background text-foreground"
                >
                  {fieldTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <Input
                  value={newField.description || ""}
                  onChange={(e) => setNewField({ ...newField, description: e.target.value })}
                  placeholder="Describe this field"
                  className="mt-2"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={newField.required || false}
                  onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                  className="w-4 h-4 rounded border-border cursor-pointer"
                />
                <label htmlFor="required" className="text-sm font-medium text-foreground cursor-pointer">
                  Required field
                </label>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleAddField}>Create Field</Button>
                <Button variant="outline" onClick={() => setShowNewFieldForm(false)} className="bg-transparent">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </AnimatedCard>
        )}

        {/* Fields List */}
        <AnimatedCard delay={0.2}>
          <CardHeader>
            <CardTitle>Your Custom Fields</CardTitle>
            <CardDescription>{fields.length} fields available</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fields.map((field) => (
                <div key={field.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium text-foreground">{field.name}</p>
                      <Badge variant="outline">{field.type}</Badge>
                      {field.required && <Badge variant="secondary">Required</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{field.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" title="Duplicate field">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Edit field">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDeleteField(field.id)}
                      title="Delete field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </AnimatedCard>

        {/* Field Usage */}
        <AnimatedCard delay={0.3}>
          <CardHeader>
            <CardTitle>Field Usage</CardTitle>
            <CardDescription>Where these fields are being used</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "User Profile Form", fields: 3, status: "Active" },
                { name: "Employee Directory", fields: 2, status: "Active" },
                { name: "Onboarding Form", fields: 1, status: "Draft" },
              ].map((usage, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{usage.name}</p>
                    <p className="text-sm text-muted-foreground">{usage.fields} fields used</p>
                  </div>
                  <Badge variant={usage.status === "Active" ? "default" : "secondary"}>{usage.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </AnimatedCard>
      </div>
  )
}
