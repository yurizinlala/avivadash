"use client";

import React from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton" className={cn(
        "animate-pulse rounded-xl bg-surface-high",
        className
      )}
      {...props}
    />
  );
}

/* ─── Dashboard Skeleton ─── */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-card p-5 shadow-ambient space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-card p-6 shadow-ambient space-y-4">
          <Skeleton className="h-5 w-36" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-card p-6 shadow-ambient space-y-4">
          <Skeleton className="h-5 w-36" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Table / List Skeleton ─── */
function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="rounded-xl bg-card shadow-ambient overflow-hidden animate-in fade-in-0 duration-300">
      {/* Header */}
      <div className="hidden md:grid grid-cols-6 gap-4 px-5 py-3 bg-surface-low">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-20" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-border/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24 md:hidden" />
            </div>
            <Skeleton className="hidden md:block h-5 w-20 rounded-md" />
            <Skeleton className="hidden md:block h-4 w-28" />
            <Skeleton className="hidden md:block h-4 w-24" />
            <Skeleton className="hidden md:block h-5 w-16 rounded-md" />
          </div>
        ))}
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 bg-surface-low">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-32" />
      </div>
    </div>
  );
}

/* ─── Cards Grid Skeleton ─── */
function CardsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in-0 duration-300">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl bg-card p-5 shadow-ambient space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-7 w-7 rounded-full" />
            ))}
            <Skeleton className="h-7 w-7 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

/* ─── Stats Row Skeleton ─── */
function StatsRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in-0 duration-300">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl bg-card p-5 shadow-ambient space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-12" />
        </div>
      ))}
    </div>
  );
}

export {
  Skeleton,
  DashboardSkeleton,
  TableSkeleton,
  CardsGridSkeleton,
  StatsRowSkeleton,
};
