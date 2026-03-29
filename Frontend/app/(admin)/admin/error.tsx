"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin panel error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="p-4 rounded-full bg-orange-500/10">
        <AlertTriangle className="w-10 h-10 text-orange-400" />
      </div>
      <h2 className="text-xl font-semibold text-white">Something went wrong</h2>
      <p className="text-gray-400 text-sm text-center max-w-md">
        {error.message || "An unexpected error occurred in the admin panel."}
      </p>
      {error.digest && (
        <p className="text-xs text-gray-600 font-mono">
          Error ID: {error.digest}
        </p>
      )}
      <Button
        onClick={reset}
        className="bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
}
