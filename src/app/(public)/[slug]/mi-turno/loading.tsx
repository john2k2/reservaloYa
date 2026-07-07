import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function MiTurnoLoading() {
  return (
    <div
      className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-10"
      role="status"
      aria-label="Cargando datos de tu turno"
    >
      <Skeleton className="mb-2 h-7 w-48" />
      <Skeleton className="mb-8 h-4 w-64" />
      <SkeletonCard className="h-72" />
    </div>
  );
}
