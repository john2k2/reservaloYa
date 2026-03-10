import { Quote, ShieldCheck, Star } from "lucide-react";

type Testimonial = {
  quote: string;
  author: string;
  detail: string;
  avatar?: string | null;
};

type TestimonialsSectionProps = {
  accentColor: string;
  testimonials: Testimonial[];
};

export function TestimonialsSection({
  accentColor,
  testimonials,
}: TestimonialsSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
          Testimonios
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Lo que dicen nuestros clientes
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          La confianza no sale de promesas vacias. Sale de una experiencia clara, rapida y facil de repetir.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm">
            <Star className="size-4 fill-current" style={{ color: accentColor }} />
            Experiencia entendible desde el primer vistazo
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm">
            <ShieldCheck className="size-4" style={{ color: accentColor }} />
            Reprogramacion simple sin llamadas cruzadas
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {testimonials.map((testimonial) => (
          <article
            key={testimonial.author}
            className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-center justify-between gap-4">
              <Quote aria-hidden="true" className="size-8" style={{ color: accentColor }} />
              <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                <Star className="size-3 fill-current" style={{ color: accentColor }} />
                Confianza real
              </div>
            </div>
            <p className="mt-5 text-lg leading-8 text-card-foreground">{testimonial.quote}</p>
            <div className="mt-6 flex items-center gap-4">
              {testimonial.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  className="size-14 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <div
                  className="flex size-14 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {testimonial.author.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-bold text-foreground">{testimonial.author}</p>
                <p className="text-sm text-muted-foreground">{testimonial.detail}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
