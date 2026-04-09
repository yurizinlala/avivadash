import { TableSkeleton, StatsRowSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-lg bg-surface-high animate-pulse" />
          <div className="h-4 w-56 rounded-lg bg-surface-high animate-pulse" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-surface-high animate-pulse" />
      </div>
      <StatsRowSkeleton count={1} />
      <TableSkeleton rows={10} />
    </div>
  );
}
