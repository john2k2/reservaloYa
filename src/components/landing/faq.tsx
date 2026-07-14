"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { landingSeoFaqs } from "@/constants/site";
import { cn } from "@/lib/utils";
import { AnimatedSection } from "./animated-section";

export function FAQSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="mx-auto w-full max-w-3xl border-t border-rule px-4 py-12 sm:px-6 sm:py-16 lg:py-20"
    >
      <AnimatedSection>
        <div className="text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:mb-4 sm:text-sm">
            Preguntas frecuentes
          </p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            ¿Tenés dudas?
          </h2>
        </div>
      </AnimatedSection>

      <div className="mt-8 divide-y divide-rule border-y border-rule sm:mt-12">
        {landingSeoFaqs.map((faq, index) => {
          const isOpen = openFaq === index;
          return (
            <div key={faq.question}>
              <button
                type="button"
                onClick={() => setOpenFaq(isOpen ? null : index)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left text-base font-medium text-foreground transition-colors hover:text-sello focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-expanded={isOpen}
              >
                <span className="pr-2">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "size-5 shrink-0 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-180 text-sello"
                  )}
                  aria-hidden="true"
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200 ease-out",
                  isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <p className="pb-5 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
