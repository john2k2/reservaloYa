"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedSection } from "./animated-section";

const faqs = [
  {
    question: "¿Necesito tarjeta de crédito para ver el producto en acción?",
    answer: "No. Podés revisar el flujo público completo sin dejar tarjeta y hablar con nosotros antes de activar tu cuenta.",
  },
  {
    question: "¿Cuánto tiempo tarda estar listo mi sistema?",
    answer: "La configuración inicial de tu negocio se completa en 48hs hábiles. El costo de ese setup es único y no se repite.",
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
    <section id="faq" className="mx-auto w-full max-w-3xl border-t border-border/40 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
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

      <div className="mt-8 sm:mt-12 space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="rounded-xl border border-border/60 bg-card overflow-hidden"
          >
            <button
              onClick={() => setOpenFaq(openFaq === index ? null : index)}
              className="flex w-full cursor-pointer items-center justify-between p-5 text-left text-base font-medium text-foreground transition-colors hover:bg-secondary/20"
            >
              <span className="pr-4">{faq.question}</span>
              <ChevronDown
                className={cn(
                  "size-5 shrink-0 text-muted-foreground transition-transform duration-200",
                  openFaq === index && "rotate-180"
                )}
              />
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-200 ease-out",
                openFaq === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <p className="px-5 pb-5 text-sm text-muted-foreground">
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
