import { Skeleton } from "@/components/ui/skeleton";

export default function CompaniesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-white/[0.04]" />
        <Skeleton className="h-4 w-32 bg-white/[0.04]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 bg-white/[0.04]" />
        ))}
      </div>
      <Skeleton className="h-96 bg-white/[0.04]" />
    </div>
  );
}
