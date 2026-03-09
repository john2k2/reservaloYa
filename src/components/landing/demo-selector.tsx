"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { demoBusinessOptions } from "@/constants/site";
import { AnimatedSection } from "./animated-section";

export function DemoSelector() {
  return (
    <>
      <AnimatedSection delay={400}>
        <div className="mt-10 grid w-full max-w-3xl gap-3 sm:grid-cols-2 mx-auto">
          {demoBusinessOptions.map((option, index) => (
            <Link
              key={option.slug}
              href={`/${option.slug}`}
              className="group rounded-2xl border border-border/70 bg-card/80 p-5 text-left transition-all duration-300 hover:border-foreground/20 hover:bg-secondary/20 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              style={{ animationDelay: `${400 + index * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{option.label}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                    {option.category}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                <ChevronRight className="size-5 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection delay={600} animation="fadeInScale">
        <div className="relative mt-16 w-full max-w-5xl mx-auto">
          <div className="pointer-events-none absolute inset-0 -top-8 z-10 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]">
              <Image
                src="/preview-desktop-view.png"
                alt="Vista del panel administrador de ReservaYa"
                width={1200}
                height={900}
                className="w-full object-cover object-top transition-transform duration-700 hover:scale-105"
                priority
              />
            </div>
            <div className="hidden overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] md:block">
              <Image
                src="/preview-mobile-view.png"
                width={900}
                height={1200}
                alt="Vista mobile de la página de reservas"
                className="w-full object-cover object-top transition-transform duration-700 hover:scale-105"
                priority
              />
            </div>
          </div>
        </div>
      </AnimatedSection>
    </>
  );
}
