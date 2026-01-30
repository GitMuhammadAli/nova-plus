"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Table Skeleton - For loading states on data tables
 */
export function TableSkeleton({
  columns = 4,
  rows = 5,
  className,
}: {
  columns?: number;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Header */}
      <div className="flex gap-4 pb-4 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={`header-${i}`}
            className={cn("h-4", i === 0 ? "w-32" : "w-24")}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 items-center py-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className={cn(
                "h-4",
                colIndex === 0 ? "w-40" : colIndex === columns - 1 ? "w-20" : "w-28"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Card Skeleton - For loading states on cards
 */
export function CardSkeleton({
  className,
  showHeader = true,
  showFooter = false,
}: {
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-6 space-y-4",
        className
      )}
    >
      {showHeader && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
      )}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      {showFooter && (
        <div className="flex justify-end gap-2 pt-4">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      )}
    </div>
  );
}

/**
 * Stats Card Skeleton - For dashboard stats cards
 */
export function StatsCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-16 mt-2" />
      <Skeleton className="h-3 w-20 mt-2" />
    </div>
  );
}

/**
 * Dashboard Skeleton - Full dashboard loading state
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={`stat-${i}`} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        <CardSkeleton showHeader showFooter />
        <CardSkeleton showHeader />
      </div>

      {/* Table */}
      <CardSkeleton className="p-0">
        <div className="p-6">
          <TableSkeleton />
        </div>
      </CardSkeleton>
    </div>
  );
}

/**
 * List Skeleton - For loading states on lists
 */
export function ListSkeleton({
  items = 5,
  showAvatar = false,
  className,
}: {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={`list-item-${i}`} className="flex items-center gap-4 p-3">
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}

/**
 * Form Skeleton - For loading states on forms
 */
export function FormSkeleton({
  fields = 4,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={`field-${i}`} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

/**
 * Profile Skeleton - For user profile loading states
 */
export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`profile-field-${i}`} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Sidebar Skeleton - For sidebar loading state
 */
export function SidebarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 p-4", className)}>
      {/* Logo */}
      <Skeleton className="h-8 w-32 mb-8" />
      
      {/* Nav items */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={`nav-${i}`} className="flex items-center gap-3 py-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
      
      {/* Bottom section */}
      <div className="pt-8 mt-auto">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Page Header Skeleton
 */
export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

/**
 * Chart Skeleton - For charts and graphs
 */
export function ChartSkeleton({
  height = 300,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <Skeleton style={{ height }} className="w-full rounded-lg" />
    </div>
  );
}

