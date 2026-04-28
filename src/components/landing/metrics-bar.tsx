"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface Metric {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
}

const metrics: Metric[] = [
  { label: "Negocios activos", value: 5, suffix: "" },
  { label: "Reservas gestionadas", value: 4, suffix: "+" },
  { label: "Usuarios registrados", value: 4, suffix: "" },
  { label: "Satisfacción", value: 100, suffix: "%" },
];

function AnimatedNumber({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const steps = 60;
          const increment = value / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
              setDisplayValue(value);
              clearInterval(timer);
            } else {
              setDisplayValue(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{displayValue}{suffix}
    </span>
  );
}

export function MetricsBar() {
  return (
    <section className="border-y border-border/40 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
          {metrics.map((metric, index) => (
            <div key={metric.label} className={cn("text-center", index > 1 && "hidden sm:block")}>
              <p className="text-3xl sm:text-4xl font-bold text-foreground font-display">
                <AnimatedNumber value={metric.value} suffix={metric.suffix} prefix={metric.prefix} />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}