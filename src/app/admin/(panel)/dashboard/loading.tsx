import { Skeleton, SkeletonCard, SkeletonText } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <SkeletonText lines={1} className="w-64" />
        </div>
        <Skeleton className="h-5 w-32" />
      </div>

      <SkeletonCard className="h-20" />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="h-32" />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <SkeletonCard className="h-96" />
        <SkeletonCard className="h-96" />
      </div>
    </div>
  );
}
