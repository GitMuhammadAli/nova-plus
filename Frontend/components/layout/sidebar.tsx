"use client"

import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings, 
  Zap,
  FileText,
  CreditCard,
  Shield,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

// Define all navigation items with role-based access
const allNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", roles: ['admin', 'manager', 'user'] },
  { icon: Users, label: "Users", path: "/users", roles: ['admin', 'manager'] },
  { icon: FolderKanban, label: "Projects", path: "/projects", roles: ['manager'] },
  { icon: FileText, label: "My Tasks", path: "/tasks", roles: ['user'] },
  { icon: BarChart3, label: "Analytics", path: "/analytics", roles: ['admin', 'manager'] },
  { icon: Zap, label: "NovaFlow", path: "/automation", roles: ['admin', 'manager'] },
  { icon: FileText, label: "Reports", path: "/reports", roles: ['admin', 'manager'] },
  { icon: CreditCard, label: "Billing", path: "/billing", roles: ['admin'] },
  { icon: Shield, label: "Audit Logs", path: "/audit-logs", roles: ['admin'] },
  { icon: Settings, label: "Settings", path: "/settings", roles: ['admin', 'manager', 'user'] },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);
  const userRole = user?.role?.toLowerCase() || '';

  // Filter nav items based on user role
  const navItems = allNavItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
     className="h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-40 shrink-0"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg text-sidebar-foreground">NovaPulse</span>
          </motion.div>
        )}
        
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Toggle Button */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-sidebar-foreground" />
          )}
        </button>
      </div>
    </motion.aside>
  );
}