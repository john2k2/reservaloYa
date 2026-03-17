import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function ServicesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Services List */}
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} className="h-28">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton className="mb-2 h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex gap-2">
                <Skeleton variant="circle" className="h-8 w-8" />
                <Skeleton variant="circle" className="h-8 w-8" />
              </div>
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
