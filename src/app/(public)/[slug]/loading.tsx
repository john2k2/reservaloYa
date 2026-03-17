import { Skeleton, SkeletonCard, SkeletonText } from "@/components/ui/skeleton";

export default function BusinessPageLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-6 w-32" />
          <Skeleton variant="circle" className="h-8 w-8" />
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <section className="mb-10 text-center">
            <Skeleton variant="circle" className="mx-auto mb-4 h-20 w-20" />
            <Skeleton className="mx-auto mb-3 h-8 w-64" />
            <SkeletonText lines={2} className="mx-auto max-w-md" />
          </section>

          {/* Services Grid */}
          <section>
            <Skeleton className="mb-6 h-6 w-40" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
