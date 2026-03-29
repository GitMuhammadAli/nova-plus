"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";

interface AdminLogoutButtonProps {
  variant?: "desktop" | "mobile";
  className?: string;
}

export function AdminLogoutButton({
  variant = "desktop",
  className = "",
}: AdminLogoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
    } catch {
      // Ignore errors, redirect anyway
    }
    router.push("/admin/login");
  }

  if (variant === "mobile") {
    return (
      <button
        onClick={handleLogout}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors w-full ${className}`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <LogOut className="w-4 h-4" />
        )}
        Logout
      </button>
    );
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={loading}
      variant="ghost"
      size="sm"
      className={`text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <LogOut className="w-4 h-4" />
      )}
      <span className="hidden lg:inline">Logout</span>
    </Button>
  );
}
