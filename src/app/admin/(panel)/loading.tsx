import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function AdminPanelLoading() {
  return (
    <div className="flex min-h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden w-56 flex-col border-r border-border/60 bg-secondary/20 xl:flex">
        {/* Logo */}
        <div className="px-4 py-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-4 h-3 w-16" />
          <Skeleton className="mt-2 h-4 w-36" />
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1 px-2 py-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </nav>

        {/* Footer */}
        <div className="space-y-2 border-t border-border/60 p-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex min-h-12 items-center justify-between border-b border-border/60 px-4 py-1.5 lg:px-6 xl:hidden">
          <div className="flex items-center gap-4">
            <div>
              <Skeleton className="h-3 w-12" />
              <Skeleton className="mt-1 h-5 w-40" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 xl:p-8">
          <div className="mx-auto max-w-7xl space-y-4 2xl:max-w-[1600px]">
            <SkeletonCard className="h-[calc(100vh-8rem)]" />
          </div>
        </main>
      </div>
    </div>
  );
}
