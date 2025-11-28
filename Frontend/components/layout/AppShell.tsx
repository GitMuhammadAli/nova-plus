"use client";

import { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

/**
 * AppShell - Simple wrapper component for page content
 * The actual layout (Sidebar, Topbar) is handled by the dashboard layout
 */
export function AppShell({ children }: AppShellProps) {
  return <>{children}</>;
}

