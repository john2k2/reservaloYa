interface RoutePlaceholderProps {
  title: string;
  description: string;
  checklist: string[];
}

export function RoutePlaceholder({
  title,
  description,
  checklist,
}: RoutePlaceholderProps) {
  return (
    <section className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-[0_24px_80px_rgba(20,33,26,0.08)]">
      <div className="max-w-2xl space-y-4">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
          Base lista
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-base leading-7 text-muted-foreground">{description}</p>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {checklist.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
