"use client"

import type React from "react"
import { useState } from "react"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} />
      <Topbar title={title} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main content */}
      <main className="ml-64 mt-16 p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
