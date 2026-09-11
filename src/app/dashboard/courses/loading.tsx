import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b-2 border-border/40">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-36 rounded-xs border-2 border-border" />
          <Skeleton className="h-8 w-56 rounded-md" />
          <Skeleton className="h-4 w-80 max-w-full rounded-md" />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Skeleton className="h-10 w-full sm:w-80 rounded-md border-2 border-border" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-md border-2 border-border" />
          <Skeleton className="h-9 w-24 rounded-md border-2 border-border" />
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-xl p-5 sm:p-6 space-y-4 border-2 border-border bg-card shadow-[2px_2px_0px_var(--shadow-color)]"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-20 rounded-xs" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-6 w-48 rounded-md" />
            <Skeleton className="h-4 w-32 rounded-md" />
            <div className="flex items-center gap-4 pt-2 border-t border-border/40">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
            </div>
            <div className="pt-2">
              <Skeleton className="h-10 w-full rounded-md border-2 border-border" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
