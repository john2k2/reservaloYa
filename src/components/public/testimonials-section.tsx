import { Quote, ShieldCheck, Star } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Testimonial = {
  quote: string;
  author: string;
  detail: string;
  avatar?: string | null;
};

type TestimonialsSectionProps = {
  accentColor: string;
  testimonials: Testimonial[];
  mobileVisibleCount?: number;
};

export function TestimonialsSection({
  accentColor,
  testimonials,
  mobileVisibleCount = 1,
}: TestimonialsSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <div className="mb-6 text-center sm:mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest sm:text-sm" style={{ color: accentColor }}>
          Testimonios
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground sm:mt-3 sm:text-3xl md:text-4xl">
          Lo que más valoran después de reservar
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:mt-4 sm:text-base sm:leading-7">
          La confianza no sale de promesas vacías. Sale de una experiencia clara, rápida y fácil de repetir.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-6 sm:gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-2 text-xs font-medium text-foreground shadow-sm sm:px-4 sm:text-sm">
            <Star className="size-3.5 fill-current sm:size-4" style={{ color: accentColor }} />
            Simple desde el primer vistazo
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm sm:inline-flex">
            <ShieldCheck className="size-4" style={{ color: accentColor }} />
            Reprogramación sin llamadas cruzadas
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {testimonials.map((testimonial, index) => (
          <article
            key={testimonial.author}
            className={cn(
              "rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl sm:p-8",
              index >= mobileVisibleCount ? "hidden lg:block" : ""
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <Quote aria-hidden="true" className="size-6 sm:size-8" style={{ color: accentColor }} />
              <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground sm:text-xs">
                <Star className="size-3 fill-current" style={{ color: accentColor }} />
                Confianza real
              </div>
            </div>
            <p className="mt-4 text-base leading-7 text-card-foreground sm:mt-5 sm:text-lg sm:leading-8">
              {testimonial.quote}
            </p>
            <div className="mt-5 flex items-center gap-4 sm:mt-6">
              {testimonial.avatar ? (
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  width={56}
                  height={56}
                  className="size-12 rounded-full object-cover ring-2 ring-border sm:size-14"
                />
              ) : (
                <div
                  className="flex size-12 items-center justify-center rounded-full text-base font-bold text-white sm:size-14 sm:text-lg"
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
