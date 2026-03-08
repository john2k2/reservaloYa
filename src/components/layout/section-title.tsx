interface SectionTitleProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function SectionTitle({
  eyebrow,
  title,
  description,
}: SectionTitleProps) {
  return (
    <div className="max-w-2xl space-y-4">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
        {eyebrow}
      </p>
      <h2 className="font-display text-3xl font-semibold leading-[1.05] text-foreground sm:text-4xl">
        {title}
      </h2>
      <p className="text-base leading-7 text-muted-foreground text-pretty sm:text-lg">
        {description}
      </p>
    </div>
  );
}
