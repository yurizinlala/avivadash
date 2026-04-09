import { Skeleton, StatsRowSkeleton } from "@/components/ui/skeleton";

export default function CellMapLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <Skeleton className="h-[calc(100vh-14rem)] w-full rounded-2xl" />
    </div>
  );
}
