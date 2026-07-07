import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function ConfirmacionLoading() {
  return (
    <div
      className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-10"
      role="status"
      aria-label="Cargando confirmación de la reserva"
    >
      <Skeleton variant="circle" className="mx-auto mb-4 h-16 w-16" />
      <Skeleton className="mx-auto mb-2 h-7 w-56" />
      <Skeleton className="mx-auto mb-8 h-4 w-72" />
      <SkeletonCard className="h-64" />
    </div>
  );
}
