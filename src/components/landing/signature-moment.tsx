"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, MessageCircle, Calendar, Clock, Bell, ArrowRight } from "lucide-react";

const steps = [
  {
    id: "chaos",
    title: "Antes",
    subtitle: "El caos de WhatsApp",
    items: [
      { icon: MessageCircle, text: "¿Tenés turno a las 3?", delay: 0 },
      { icon: MessageCircle, text: "No, a las 4 mejor", delay: 500 },
      { icon: MessageCircle, text: "¿Y el precio?", delay: 1000 },
      { icon: MessageCircle, text: "¿Me confirmás?", delay: 1500 },
    ],
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    headerBg: "bg-amber-100",
    headerText: "text-amber-900",
  },
  {
    id: "transform",
    title: "Después",
    subtitle: "Con ReservaYa",
    items: [
      { icon: Calendar, text: "Turno reservado", delay: 0 },
      { icon: Clock, text: "Recordatorio enviado", delay: 400 },
      { icon: Bell, text: "Cliente notificado", delay: 800 },
      { icon: CheckCircle2, text: "¡Listo!", delay: 1200 },
    ],
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
    headerBg: "bg-primary/10",
    headerText: "text-primary",
  },
];

export function SignatureMoment() {
  const [activeStep, setActiveStep] = useState(0);
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
      setVisibleItems([]);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const currentStep = steps[activeStep];
    currentStep.items.forEach((item, index) => {
      setTimeout(() => {
        setVisibleItems((prev) => [...prev, index]);
      }, item.delay);
    });
  }, [activeStep]);

  const currentStep = steps[activeStep];

  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />
      
      <div className="relative">
        <div className="text-center mb-16">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary mb-4">
            La diferencia
          </p>
          <h2 className="font-display text-4xl font-semibold leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
            Dejá el caos atrás
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground max-w-xl mx-auto">
            Vos dedicáte a lo que mejor hacés. Nosotros nos ocupamos de la organización.
          </p>
        </div>

        {/* Side by side comparison */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {steps.map((step, stepIndex) => (
            <div
              key={step.id}
              className={cn(
                "relative rounded-3xl border-2 p-6 sm:p-8 transition-all duration-700",
                step.borderColor,
                step.bgColor,
                activeStep === stepIndex 
                  ? "opacity-100 scale-100 shadow-2xl" 
                  : "opacity-40 scale-95"
              )}
            >
              {/* Header */}
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6",
                step.headerBg
              )}>
                {step.id === "chaos" ? (
                  <MessageCircle className={cn("w-4 h-4", step.headerText)} />
                ) : (
                  <CheckCircle2 className={cn("w-4 h-4", step.headerText)} />
                )}
                <span className={cn("text-sm font-semibold", step.headerText)}>
                  {step.subtitle}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-3">
                {step.items.map((item, index) => {
                  const Icon = item.icon;
                  const isVisible = activeStep === stepIndex 
                    ? visibleItems.includes(index) 
                    : true;
                  
                  return (
                    <div
                      key={`${step.id}-${index}`}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border transition-all duration-500",
                        isVisible 
                          ? "opacity-100 translate-x-0" 
                          : "opacity-0 -translate-x-4",
                        step.id === "chaos" ? "border-amber-100" : "border-primary/10"
                      )}
                    >
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
                        step.id === "chaos" ? "bg-amber-100" : "bg-primary/10"
                      )}>
                        <Icon className={cn("w-5 h-5", step.color)} />
                      </div>
                      <span className={cn("text-sm font-medium", step.color)}>
                        {item.text}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Step indicator */}
              <div className="mt-6 flex items-center gap-2">
                <div className={cn(
                  "h-2 rounded-full transition-all duration-500",
                  activeStep === stepIndex ? "w-8 bg-primary" : "w-2 bg-border"
                )} />
                <span className="text-xs text-muted-foreground">
                  {step.id === "chaos" ? "Antes" : "Después"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Arrow between on desktop */}
        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-background border-2 border-primary/20 rounded-full p-3 shadow-xl">
            <ArrowRight className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>
    </section>
  );
}