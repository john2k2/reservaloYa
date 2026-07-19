import { Skeleton } from "@/components/ui/skeleton";

export default function PlatformConsultaDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Skeleton className="mb-3 h-4 w-32" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-2 h-4 w-64" />
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-5 w-24 rounded-md" />
          <Skeleton className="h-5 w-28 rounded-md" />
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={`rounded-xl px-4 py-3 ${i % 2 === 0 ? "mr-8" : "ml-8"}`}
          >
            <Skeleton className="mb-2 h-3 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-1.5 h-4 w-2/3" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
        <Skeleton className="mb-2.5 h-4 w-20" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="mt-3 flex justify-between">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
