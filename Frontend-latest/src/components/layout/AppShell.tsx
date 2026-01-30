import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen w-full bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <Topbar sidebarCollapsed={sidebarCollapsed} />
      
      <main
        className="pt-16 transition-all duration-200"
        style={{ marginLeft: sidebarCollapsed ? 64 : 256 }}
      >
        {children}
      </main>
    </div>
  );
}
