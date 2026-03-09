"use client";

import { Star } from "lucide-react";
import { productName } from "@/constants/site";
import { AnimatedSection } from "./animated-section";

export function SocialProof() {
  return (
    <AnimatedSection animation="fadeInUp">
      <section className="mx-auto w-full max-w-6xl border-y border-border/40 bg-gradient-to-r from-secondary/30 via-background to-secondary/30 px-6 py-12">
        <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
          <div className="flex -space-x-2">
            {["M", "L", "A", "C"].map((letter, i) => (
              <div
                key={i}
                className="flex size-10 items-center justify-center rounded-full border-2 border-background bg-foreground text-sm font-bold text-background transition-transform hover:scale-110 hover:z-10"
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                {letter}
              </div>
            ))}
          </div>
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center gap-1 sm:justify-start">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="size-4 fill-yellow-400 text-yellow-400 animate-pulse-subtle"
                  style={{ animationDelay: `${star * 100}ms` }}
                />
              ))}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">+50 negocios</span> ya ordenaron sus turnos con {productName}
            </p>
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}
