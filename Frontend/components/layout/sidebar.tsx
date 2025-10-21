"use client"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = true }: SidebarProps) {
  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: "📊" },
    { label: "Analytics", href: "/analytics", icon: "📈" },
    { label: "Users", href: "/users", icon: "👥" },
    { label: "Automation", href: "/automation", icon: "⚙️" },
    { label: "Billing", href: "/billing", icon: "💳" },
    { label: "Settings", href: "/settings", icon: "⚙️" },
  ]

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-300 z-40",
        !isOpen && "-translate-x-full",
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-8 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-lg">
          N
        </div>
        <span className="font-bold text-lg">NovaPulse</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-6 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-accent/10">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-xs font-bold">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">John Doe</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">john@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
