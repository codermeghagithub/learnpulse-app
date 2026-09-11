import { Skeleton } from "@/components/ui/skeleton";

export default function TeacherLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52 rounded-md" />
          <Skeleton className="h-4 w-80 max-w-full rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-44 rounded-md border-2 border-border" />
          <Skeleton className="h-10 w-36 rounded-md border-2 border-border" />
        </div>
      </div>

      {/* Course selector and actions */}
      <div className="space-y-3">
        <Skeleton className="h-12 w-full max-w-md rounded-md border-2 border-border" />
        <div className="flex justify-end gap-2">
          <Skeleton className="h-9 w-32 rounded-md border-2 border-border" />
          <Skeleton className="h-9 w-48 rounded-md border-2 border-border" />
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border-2 border-border bg-card p-5 space-y-3 shadow-[2px_2px_0px_var(--shadow-color)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-md border-2 border-border" />
                <Skeleton className="h-4 w-28 rounded-md" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-md" />
            </div>
            <Skeleton className="h-2.5 w-full rounded-sm" />
          </div>
        ))}
      </div>

      {/* Student Roster Table Skeleton */}
      <div className="rounded-xl border-2 border-border bg-card p-6 space-y-4 shadow-[2px_2px_0px_var(--shadow-color)]">
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <Skeleton className="h-6 w-40 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-md border border-border/60"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-md border-2 border-border" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
