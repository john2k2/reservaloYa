import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function ServicesLoading() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <SkeletonCard className="h-[420px]" />

        {/* Services List */}
        <SkeletonCard className="overflow-hidden p-0">
          <div className="border-b border-border/60 px-5 py-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-2 h-3 w-64" />
          </div>
          <div className="divide-y divide-border/60">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <Skeleton className="mb-2 h-5 w-48" />
                    <Skeleton className="h-4 w-64" />
                    <div className="mt-3 flex gap-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-col">
                    <Skeleton className="h-8 w-16 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
}
