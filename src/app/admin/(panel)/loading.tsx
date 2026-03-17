import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function AdminPanelLoading() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-background lg:flex">
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-border px-4">
          <Skeleton className="h-6 w-32" />
        </div>
        
        {/* Nav items */}
        <nav className="flex-1 space-y-1 p-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </nav>
        
        {/* Footer */}
        <div className="border-t border-border p-3">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-border px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Skeleton variant="circle" className="h-8 w-8 lg:hidden" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton variant="circle" className="h-8 w-8" />
            <Skeleton variant="circle" className="h-8 w-8" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <SkeletonCard className="h-[calc(100vh-8rem)]" />
        </main>
      </div>
    </div>
  );
}
