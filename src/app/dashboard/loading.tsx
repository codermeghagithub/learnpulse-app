import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b-2 border-border/40">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-44 rounded-xs border-2 border-border" />
          <Skeleton className="h-8 w-64 rounded-md" />
          <Skeleton className="h-4 w-96 max-w-full rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-48 rounded-md border-2 border-border" />
        </div>
      </div>

      {/* Course Selector Skeleton */}
      <Skeleton className="h-12 w-full max-w-md rounded-md border-2 border-border" />

      {/* 4-Stat Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl p-5 sm:p-6 space-y-3.5 border-2 border-border bg-card shadow-[2px_2px_0px_var(--shadow-color)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-md border-2 border-border" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div className="pt-1 flex items-baseline gap-2">
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-3 w-16 rounded-md" />
            </div>
            <Skeleton className="h-2.5 w-full rounded-sm" />
            <div className="flex justify-between pt-1">
              <Skeleton className="h-3 w-24 rounded-md" />
              <Skeleton className="h-3 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Concept Sections Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-36 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl p-5 space-y-3 border-2 border-border bg-card shadow-[2px_2px_0px_var(--shadow-color)]"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-48 rounded-md" />
              <Skeleton className="h-2 w-full rounded-sm" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-md border-2 border-border" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
