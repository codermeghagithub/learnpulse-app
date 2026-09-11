import { Skeleton } from "@/components/ui/skeleton";

export default function GapLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-150">
      {/* Back button */}
      <Skeleton className="h-9 w-32 rounded-md border-2 border-border" />

      {/* Header */}
      <div className="rounded-xl border-2 border-border bg-card p-6 space-y-4 shadow-[2px_2px_0px_var(--shadow-color)]">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32 rounded-xs" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-8 w-64 rounded-md" />
        <Skeleton className="h-4 w-full max-w-xl rounded-md" />
        <div className="pt-2 flex gap-3">
          <Skeleton className="h-10 w-36 rounded-md border-2 border-border" />
          <Skeleton className="h-10 w-36 rounded-md border-2 border-border" />
        </div>
      </div>

      {/* Prerequisite Chain Skeletons */}
      <div className="space-y-4 pt-4">
        <Skeleton className="h-6 w-48 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border-2 border-border bg-card p-5 space-y-3 shadow-[2px_2px_0px_var(--shadow-color)]"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-36 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-2.5 w-full rounded-sm" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
