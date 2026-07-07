import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function AvailabilityLoading() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <SkeletonCard className="h-[420px]" />
        <SkeletonCard className="h-[420px]" />
      </div>
    </div>
  );
}
