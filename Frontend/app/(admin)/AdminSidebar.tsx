"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  ListTodo,
  ScrollText,
  Activity,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/companies", label: "Companies", icon: Building2 },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/tasks", label: "Tasks", icon: ListTodo },
  { href: "/admin/audit", label: "Audit Logs", icon: ScrollText },
  { href: "/admin/system", label: "System Health", icon: Activity },
];

export function AdminSidebar({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              Novapulse
            </h1>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-indigo-400/70 uppercase">
              System Admin
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
              )}
            >
              <item.icon className={cn("w-4 h-4", active && "text-indigo-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/[0.06] space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </Link>
        <AdminLogoutButton variant="mobile" />
      </div>
    </>
  );

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-[#0e0e1a] border-r border-white/[0.06] shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-[#0e0e1a] border-r border-white/[0.06] transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#0e0e1a] border-b border-white/[0.06]">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-gray-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-white">
              Admin Panel
            </span>
          </div>
          <div className="ml-auto">
            <AdminLogoutButton variant="desktop" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
