import { Skeleton, StatsRowSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-lg bg-surface-high animate-pulse" />
          <div className="h-4 w-56 rounded-lg bg-surface-high animate-pulse" />
        </div>
      </div>
      <StatsRowSkeleton count={3} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[400px] rounded-xl" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    </div>
  );
}
