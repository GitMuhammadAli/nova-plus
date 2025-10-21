"use client"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AnimatedCard } from "@/components/motion/animated-card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit2, Eye } from "lucide-react"

const customPages = [
  { id: 1, name: "Knowledge Base", slug: "knowledge-base", type: "Documentation", status: "Published", views: 1240 },
  { id: 2, name: "Team Directory", slug: "team-directory", type: "Custom", status: "Published", views: 856 },
  { id: 3, name: "Roadmap", slug: "roadmap", type: "Custom", status: "Draft", views: 0 },
]

export default function CustomPagesPage() {
  const [pages, setPages] = useState(customPages)
  const [showNewPageForm, setShowNewPageForm] = useState(false)
  const [newPage, setNewPage] = useState({ name: "", slug: "" })

  const handleAddPage = () => {
    if (newPage.name && newPage.slug) {
      setPages([
        ...pages,
        {
          id: pages.length + 1,
          name: newPage.name,
          slug: newPage.slug,
          type: "Custom",
          status: "Draft",
          views: 0,
        },
      ])
      setNewPage({ name: "", slug: "" })
      setShowNewPageForm(false)
    }
  }

  const handleDeletePage = (id: number) => {
    setPages(pages.filter((p) => p.id !== id))
  }

  return (
    <AppLayout title="Custom Pages">
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Custom Pages</h2>
            <p className="text-muted-foreground mt-1">Create and manage custom pages in your workspace</p>
          </div>
          <Button className="gap-2" onClick={() => setShowNewPageForm(!showNewPageForm)}>
            <Plus className="w-4 h-4" />
            New Page
          </Button>
        </div>

        {/* New Page Form */}
        {showNewPageForm && (
          <AnimatedCard delay={0.1}>
            <CardHeader>
              <CardTitle>Create New Page</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Page Name</label>
                <Input
                  value={newPage.name}
                  onChange={(e) => setNewPage({ ...newPage, name: e.target.value })}
                  placeholder="e.g., FAQ, Guides, Resources"
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Page Slug</label>
                <Input
                  value={newPage.slug}
                  onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
                  placeholder="e.g., faq, guides, resources"
                  className="mt-2"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleAddPage}>Create Page</Button>
                <Button variant="outline" onClick={() => setShowNewPageForm(false)} className="bg-transparent">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </AnimatedCard>
        )}

        {/* Pages List */}
        <AnimatedCard delay={0.2}>
          <CardHeader>
            <CardTitle>Your Pages</CardTitle>
            <CardDescription>{pages.length} pages in your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pages.map((page) => (
                <div key={page.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium text-foreground">{page.name}</p>
                      <Badge variant={page.status === "Published" ? "default" : "secondary"}>{page.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">/{page.slug}</p>
                    <p className="text-xs text-muted-foreground mt-1">{page.views} views</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" title="View page">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Edit page">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDeletePage(page.id)}
                      title="Delete page"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </AnimatedCard>
      </div>
    </AppLayout>
  )
}
