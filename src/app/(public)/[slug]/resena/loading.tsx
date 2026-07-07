import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function ResenaLoading() {
  return (
    <div
      className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10"
      role="status"
      aria-label="Cargando formulario de reseña"
    >
      <Skeleton className="mb-2 h-7 w-52" />
      <Skeleton className="mb-8 h-4 w-64" />
      <SkeletonCard className="h-56" />
    </div>
  );
}
