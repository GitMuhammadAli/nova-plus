import { Skeleton } from "@/components/ui/skeleton";

export default function SystemLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-white/[0.04]" />
        <Skeleton className="h-4 w-32 bg-white/[0.04]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-44 bg-white/[0.04]" />
        ))}
      </div>
      <Skeleton className="h-32 bg-white/[0.04]" />
      <Skeleton className="h-32 bg-white/[0.04]" />
    </div>
  );
}
