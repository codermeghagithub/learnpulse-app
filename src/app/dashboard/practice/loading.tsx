import { Skeleton } from "@/components/ui/skeleton";

export default function PracticeLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b-2 border-border/40">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32 rounded-xs border-2 border-border" />
          <Skeleton className="h-8 w-52 rounded-md" />
          <Skeleton className="h-4 w-72 max-w-full rounded-md" />
        </div>
        <Skeleton className="h-10 w-44 rounded-md border-2 border-border" />
      </div>

      {/* Course selector skeleton */}
      <Skeleton className="h-12 w-full max-w-md rounded-md border-2 border-border" />

      {/* Question Card Skeleton */}
      <div className="rounded-xl p-6 sm:p-8 space-y-6 border-2 border-border bg-card shadow-[3px_3px_0px_var(--shadow-color)]">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28 rounded-xs" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        <div className="space-y-3 py-2">
          <Skeleton className="h-6 w-full rounded-md" />
          <Skeleton className="h-6 w-4/5 rounded-md" />
        </div>

        {/* 4 Option Buttons */}
        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4 rounded-md border-2 border-border bg-background"
            >
              <Skeleton className="h-6 w-6 rounded-md shrink-0" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
            </div>
          ))}
        </div>

        {/* Action button */}
        <div className="pt-4 flex justify-end">
          <Skeleton className="h-11 w-36 rounded-md border-2 border-border" />
        </div>
      </div>
    </div>
  );
}
