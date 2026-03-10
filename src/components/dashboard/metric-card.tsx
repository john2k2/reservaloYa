import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}

export function MetricCard({ label, value, hint, icon: Icon }: MetricCardProps) {
  return (
    <article className="rounded-xl border border-border/60 bg-background p-4 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-foreground/20 hover:scale-[1.01] cursor-pointer">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
        <Icon aria-hidden="true" className="size-4 sm:size-5 text-muted-foreground transition-transform duration-200 group-hover:scale-110" />
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </div>
    </article>
  );
}
