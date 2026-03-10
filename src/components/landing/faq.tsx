"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedSection } from "./animated-section";

const faqs = [
  {
    question: "¿Necesito tarjeta de crédito para probar la demo?",
    answer: "No. La demo es 100% gratuita y sin compromiso. Podés probar todo el flujo de reserva sin crear cuenta.",
  },
  {
    question: "¿Cuánto tiempo tarda estar listo mi sistema?",
    answer: "El setup inicial se completa en 48hs hábiles una vez que nos pasás los datos de tu negocio.",
  },
  {
    question: "¿Puedo modificar horarios y servicios después?",
    answer: "Sí, tenés un panel administrativo completo para gestionar todo en tiempo real.",
  },
  {
    question: "¿Qué pasa si ya tengo clientes habituales?",
    answer: "Perfecto. Podés seguir atendiendo como siempre mientras nuevos clientes usan la web. Sin obligar a nadie a cambiar.",
  },
  {
    question: "¿Hay permanencia o puedo cancelar cuando quiera?",
    answer: "No hay permanencia. El setup es único y la mensualidad se paga mes a mes. Cancelás cuando quieras sin penalización.",
  },
];

export function FAQSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className="mx-auto w-full max-w-3xl border-t border-border/40 px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:py-32">
      <AnimatedSection>
        <div className="text-center">
          <p className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Preguntas frecuentes
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter text-foreground md:text-4xl">
            ¿Tenés dudas?
          </h2>
        </div>
      </AnimatedSection>

      <div className="mt-8 sm:mt-12 space-y-2 sm:space-y-3">
        {faqs.map((faq, index) => (
          <AnimatedSection key={index} delay={index * 100}>
            <div className="rounded-xl sm:rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:border-border">
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="flex w-full cursor-pointer items-center justify-between p-4 sm:p-6 text-left text-sm sm:text-base font-medium text-foreground transition-colors hover:bg-secondary/30"
              >
                <span className="pr-4">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "size-4 sm:size-5 shrink-0 text-muted-foreground transition-transform duration-300",
                    openFaq === index && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  openFaq === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <p className="px-4 sm:px-6 pb-4 sm:pb-6 text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
