"use client"

import { useState } from "react"

interface TopbarProps {
  title?: string
  onMenuClick?: () => void
}

export function Topbar({ title = "Dashboard", onMenuClick }: TopbarProps) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-background border-b border-border flex items-center justify-between px-8 z-30">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors">
          ☰
        </button>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-muted rounded-lg border border-border">
          <span className="text-muted-foreground">🔍</span>
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none w-48"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="p-2 hover:bg-muted rounded-lg transition-colors relative"
          >
            🔔<span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </button>
          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-lg text-sm text-foreground">New user signup: Sarah Johnson</div>
                <div className="p-3 bg-muted rounded-lg text-sm text-foreground">System update completed</div>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <button className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
            JD
          </div>
          <span className="hidden sm:inline text-sm font-medium text-foreground">John</span>
        </button>
      </div>
    </header>
  )
}
