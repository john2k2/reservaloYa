"use client";

import { Star } from "lucide-react";
import { AnimatedSection } from "./animated-section";

const testimonials = [
  {
    quote: "Antes respondía lo mismo todo el día. Ahora la mayoría entra, reserva y listo. Me devolvió horas de mi tiempo.",
    author: "Matías Gómez",
    role: "Barbero independiente",
    avatar: "M",
  },
  {
    quote: "La página se entiende en segundos. Mis clientes ya no se pierden con el proceso y llegan más puntuales.",
    author: "Luca Sosa",
    role: "Cliente frecuente convertido en fan",
    avatar: "L",
  },
];

export function TestimonialsSection() {
  return (
    <section className="mx-auto w-full max-w-6xl border-t border-border/40 px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:py-32">
      <AnimatedSection>
        <div className="text-center">
          <p className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Testimonios
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter text-foreground md:text-4xl">
            Lo que dicen quienes ya lo usan.
          </h2>
        </div>
      </AnimatedSection>

      <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-6 md:grid-cols-2">
        {testimonials.map((testimonial, index) => (
          <AnimatedSection
            key={testimonial.author}
            delay={index * 150}
            animation={index === 0 ? "slideInLeft" : "slideInRight"}
          >
            <article className="group rounded-xl sm:rounded-2xl border border-border/60 bg-card p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:border-border">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="size-3.5 sm:size-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg leading-relaxed text-card-foreground">{`"${testimonial.quote}"`}</p>
              <div className="mt-4 sm:mt-6 flex items-center gap-3">
                <div className="flex size-10 sm:size-12 items-center justify-center rounded-full bg-foreground text-base sm:text-lg font-bold text-background transition-transform group-hover:scale-110">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm sm:text-base">{testimonial.author}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </article>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
