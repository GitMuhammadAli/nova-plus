import { Skeleton } from "@/components/ui/skeleton";

export default function UsersLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 bg-white/[0.04]" />
        <Skeleton className="h-4 w-32 bg-white/[0.04]" />
      </div>
      <Skeleton className="h-10 w-full max-w-md bg-white/[0.04]" />
      <Skeleton className="h-96 bg-white/[0.04]" />
    </div>
  );
}
