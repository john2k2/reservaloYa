import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <Skeleton variant="circle" className="h-12 w-12" />
        </div>

        {/* Form Card */}
        <SkeletonCard className="space-y-6">
          {/* Title */}
          <div className="text-center">
            <Skeleton className="mx-auto mb-2 h-6 w-32" />
            <Skeleton className="mx-auto h-4 w-48" />
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Button */}
          <Skeleton className="h-10 w-full" />
        </SkeletonCard>
      </div>
    </div>
  );
}
