import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function PlatformConsolaLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />

      <SkeletonCard className="h-40">
        <Skeleton className="mb-3 h-3 w-32" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </SkeletonCard>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/60 px-6 py-4">
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="divide-y divide-border/40">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-6 py-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-3 w-24 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
