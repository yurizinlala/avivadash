import { CardsGridSkeleton, StatsRowSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-28 rounded-lg bg-surface-high animate-pulse" />
          <div className="h-4 w-48 rounded-lg bg-surface-high animate-pulse" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-surface-high animate-pulse" />
      </div>
      <StatsRowSkeleton count={4} />
      <CardsGridSkeleton count={6} />
    </div>
  );
}
