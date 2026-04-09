import { Skeleton, StatsRowSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-24 rounded-lg bg-surface-high animate-pulse" />
          <div className="h-4 w-52 rounded-lg bg-surface-high animate-pulse" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-surface-high animate-pulse" />
      </div>
      <StatsRowSkeleton count={3} />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <Skeleton className="h-[500px] rounded-xl" />
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    </div>
  );
}
