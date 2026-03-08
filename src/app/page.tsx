"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  MessageCircle,
  ShieldCheck,
  Star,
  ArrowRight,
  Calendar,
  Smartphone,
  Bell,
  Users,
  X,
  Check,
  ChevronRight,
  Phone,
  Mail,
  Clock,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect } from "react";

import { SectionTitle } from "@/components/layout/section-title";
import { buttonVariants } from "@/components/ui/button-variants";
import { demoBusinessOptions, demoBusinessSlug, productName } from "@/constants/site";
import { cn } from "@/lib/utils";
import "./landing-animations.css";

const pricingItems = [
  "Landing pública profesional del negocio",
  "Reserva online con horarios en tiempo real",
  "Panel admin con agenda y clientes",
  "Recordatorios automáticos por email",
  "Soporte técnico incluido",
];

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

const steps = [
  {
    icon: Smartphone,
    title: "Tu cliente entra a tu página",
    description: "Desde Instagram, WhatsApp o Google. Ven tus servicios, precios y disponibilidad al instante.",
  },
  {
    icon: Calendar,
    title: "Elige servicio, día y horario",
    description: "Selecciona lo que necesita sin preguntar. Solo horarios reales disponibles, sin pisadas.",
  },
  {
    icon: Bell,
    title: "Recibe confirmación y recordatorios",
    description: "Email de confirmación + recordatorio 24hs antes. Menos ausencias, más orden.",
  },
];

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

// Componente para animación de entrada
function AnimatedSection({ 
  children, 
  className = "", 
  delay = 0,
  animation = "fadeInUp"
}: { 
  children: React.ReactNode; 
  className?: string; 
  delay?: number;
  animation?: "fadeInUp" | "slideInLeft" | "slideInRight" | "fadeInScale";
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const animationClass = {
    fadeInUp: "animate-fade-in-up",
    slideInLeft: "animate-slide-in-left",
    slideInRight: "animate-slide-in-right",
    fadeInScale: "animate-fade-in-scale",
  }[animation];

  return (
    <div
      ref={ref}
      className={cn(
        className,
        "opacity-0",
        isVisible && animationClass
      )}
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: "forwards"
      }}
    >
      {children}
    </div>
  );
}

import { useRef } from "react";

// Contador animado
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const duration = 2000;
          const increment = target / (duration / 16);
          
          const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return (
    <span ref={ref} className="metric-number">
      {count}{suffix}
    </span>
  );
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main
      id="main-content"
      className="relative min-h-screen overflow-hidden bg-background selection:bg-black selection:text-white"
    >
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 subtle-grid opacity-30 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
      <div className="pointer-events-none absolute inset-0 gradient-mesh" />
      
      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-gradient-to-br from-gray-200/50 to-transparent blur-3xl animate-float" />
      <div className="pointer-events-none absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-gradient-to-bl from-gray-200/40 to-transparent blur-3xl animate-float delay-500" />

      {/* Header */}
      <header className="fixed top-0 z-50 w-full transition-all duration-300 bg-background/80 backdrop-blur-md border-b border-transparent">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 md:px-8">
          <div className="flex items-center gap-2">
            <span className="font-sans text-lg font-bold tracking-tight text-foreground">
              {productName}
            </span>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a
              href="#como-funciona"
              className="inline-flex h-11 items-center transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              Cómo funciona
            </a>
            <a
              href="#beneficios"
              className="inline-flex h-11 items-center transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              Beneficios
            </a>
            <a
              href="#precios"
              className="inline-flex h-11 items-center transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              Precios
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/admin/login"
              className="hidden h-11 items-center justify-center rounded-md border border-border/80 px-4 text-sm font-medium text-foreground transition-all hover:bg-secondary/50 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:inline-flex"
            >
              Ingresar
            </Link>
            <Link
              href={`/${demoBusinessSlug}`}
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "h-11 rounded-md px-5 font-medium shadow-sm transition-all hover:shadow-lg hover:scale-105 btn-shine"
              )}
            >
              Probar demo gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-4 pb-16 pt-32 text-center sm:px-6 lg:px-8">
        <AnimatedSection delay={0}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/30 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-all hover:bg-secondary/50 hover:scale-105 cursor-default">
            <CheckCircle2 aria-hidden="true" className="size-3.5 text-green-600" />
            <span>Setup en 48hs · Primer mes gratis</span>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={100}>
          <h1 className="max-w-[900px] text-4xl font-bold tracking-tighter text-foreground sm:text-6xl lg:text-[4rem] leading-[1.1]">
            Tu negocio reserva turnos solo.{" "}
            <span className="text-muted-foreground">Vos trabajás tranquilo.</span>
          </h1>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <p className="mx-auto mt-6 max-w-[600px] text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Página de reservas + Agenda + Recordatorios automáticos para barberías y estéticas.{" "}
            <span className="font-medium text-foreground">Sin vivir pegado al WhatsApp.</span>
          </p>
        </AnimatedSection>

        <AnimatedSection delay={300}>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={`/${demoBusinessSlug}`}
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 rounded-full px-8 text-base shadow-lg transition-all hover:shadow-xl hover:scale-105 hover:-translate-y-0.5 btn-shine"
              )}
            >
              Probar demo gratis
              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="https://wa.me/541155550199"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 rounded-full px-6 text-base transition-all hover:bg-secondary hover:scale-105"
              )}
            >
              Hablar por WhatsApp
            </a>
          </div>
        </AnimatedSection>

        {/* Demo Selector Cards */}
        <AnimatedSection delay={400}>
          <div className="mt-10 grid w-full max-w-3xl gap-3 sm:grid-cols-2">
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

        {/* Preview Images */}
        <AnimatedSection delay={600} animation="fadeInScale">
          <div className="relative mt-16 w-full max-w-5xl">
            <div className="pointer-events-none absolute inset-0 -top-8 z-10 bg-gradient-to-t from-background via-transparent to-transparent" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]">
                <Image
                  src="/preview-desktop-view.png"
                  alt="Vista del panel administrador de ReservaYa"
                  width={1200}
                  height={900}
                  className="w-full object-cover object-top transition-transform duration-700 hover:scale-105"
                />
              </div>
              <div className="hidden overflow-hidden rounded-2xl border border-border/60 bg-white shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] md:block">
                <Image
                  src="/preview-mobile-view.png"
                  width={900}
                  height={1200}
                  alt="Vista mobile de la página de reservas"
                  className="w-full object-cover object-top transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Social Proof */}
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
                  <Star key={star} className="size-4 fill-yellow-400 text-yellow-400 animate-pulse-subtle" style={{ animationDelay: `${star * 100}ms` }} />
                ))}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">+50 negocios</span> ya ordenaron sus turnos con ReservaYa
              </p>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* How it Works */}
      <section id="como-funciona" className="mx-auto w-full max-w-6xl px-6 py-24 md:py-32">
        <AnimatedSection>
          <SectionTitle
            eyebrow="Cómo funciona"
            title="Tu cliente reserva en 3 pasos."
            description="Sin apps que descargar, sin registros complejos. Simple para ellos, poderoso para vos."
          />
        </AnimatedSection>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <AnimatedSection key={step.title} delay={index * 150} animation={index === 0 ? "slideInLeft" : index === 2 ? "slideInRight" : "fadeInUp"}>
              <article className="group relative flex flex-col items-center text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-foreground text-background shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl">
                  <step.icon className="size-7 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
                </div>
                <div className="mt-6 flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-bold transition-colors group-hover:bg-foreground group-hover:text-background">
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                </div>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </article>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={500}>
          <div className="mt-12 text-center">
            <Link
              href={`/${demoBusinessSlug}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 rounded-full px-8 transition-all hover:bg-foreground hover:text-background hover:scale-105"
              )}
            >
              Probar el flujo de reserva
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </div>
        </AnimatedSection>
      </section>

      {/* Before vs After */}
      <section id="beneficios" className="mx-auto w-full max-w-6xl border-t border-border/40 px-6 py-24 md:py-32">
        <AnimatedSection>
          <div className="text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Antes vs Después
            </p>
            <h2 className="text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
              Menos caos, más control.
            </h2>
          </div>
        </AnimatedSection>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Before */}
          <AnimatedSection delay={100} animation="slideInLeft">
            <div className="group rounded-2xl border border-destructive/20 bg-gradient-to-br from-destructive/5 to-destructive/10 p-8 transition-all duration-300 hover:shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-destructive/20 transition-transform group-hover:scale-110">
                  <X className="size-5 text-destructive" />
                </div>
                <span className="font-semibold text-destructive">Antes</span>
              </div>
              <ul className="space-y-4">
                {[
                  "WhatsApp explotado de mensajes",
                  "Turnos pisados o olvidados",
                  "Respondiendo a toda hora",
                  "Clientes que no avisan si cancelan",
                  "Sin imagen profesional online",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-muted-foreground transition-all hover:translate-x-1">
                    <X className="mt-0.5 size-4 shrink-0 text-destructive/60" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>

          {/* After */}
          <AnimatedSection delay={200} animation="slideInRight">
            <div className="group rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10 p-8 transition-all duration-300 hover:shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-green-500/20 transition-transform group-hover:scale-110">
                  <Check className="size-5 text-green-600" />
                </div>
                <span className="font-semibold text-green-600">Con ReservaYa</span>
              </div>
              <ul className="space-y-4">
                {[
                  "Página profesional de reservas",
                  "Agenda organizada automáticamente",
                  "Reservas 24/7 sin tu intervención",
                  "Recordatorios automáticos por email",
                  "Presencia digital de primer nivel",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-foreground transition-all hover:translate-x-1">
                    <Check className="mt-0.5 size-4 shrink-0 text-green-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Time Calculator */}
      <section className="mx-auto w-full max-w-6xl border-t border-border/40 px-6 py-24 md:py-32">
        <AnimatedSection animation="fadeInScale">
          <div className="rounded-3xl bg-gradient-to-br from-foreground via-foreground to-gray-800 p-8 text-background sm:p-12 md:p-16 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white blur-3xl animate-float" />
              <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-gray-400 blur-3xl animate-float delay-500" />
            </div>
            
            <div className="relative mx-auto max-w-2xl text-center">
              <Clock className="mx-auto size-10 animate-pulse-subtle" />
              <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
                ¿Cuánto tiempo perdés respondiendo mensajes?
              </h2>
              <p className="mt-4 text-lg text-background/70">
                Si respondés <span className="font-semibold text-background">10 mensajes</span> de turnos por día...
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 hover:scale-105">
                  <div className="text-4xl font-bold">
                    <AnimatedCounter target={30} />
                  </div>
                  <div className="mt-1 text-sm text-background/60">minutos por día</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 hover:scale-105">
                  <div className="text-4xl font-bold">
                    <AnimatedCounter target={15} />
                  </div>
                  <div className="mt-1 text-sm text-background/60">horas por mes</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 hover:scale-105">
                  <div className="text-4xl font-bold">
                    <AnimatedCounter target={180} />
                  </div>
                  <div className="mt-1 text-sm text-background/60">horas por año</div>
                </div>
              </div>

              <p className="mt-8 text-background/70">
                Tiempo que podrías dedicar a{" "}
                <span className="font-semibold text-background">atender más clientes</span> o simplemente{" "}
                <span className="font-semibold text-background">descansar</span>.
              </p>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Target Audience */}
      <section className="mx-auto w-full max-w-6xl border-t border-border/40 px-6 py-24 md:py-32">
        <AnimatedSection>
          <div className="text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              ¿Para quién es?
            </p>
            <h2 className="text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
              Diseñado para tu tipo de negocio.
            </h2>
          </div>
        </AnimatedSection>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <AnimatedSection delay={100} animation="slideInLeft">
            <div className="group flex items-start gap-4 rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent p-6 transition-all duration-300 hover:shadow-lg hover:border-green-500/40">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-green-500/20 transition-all group-hover:scale-110 group-hover:bg-green-500/30">
                <Check className="size-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Ideal para</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li className="transition-all hover:translate-x-1 hover:text-foreground">• Barberías y peluquerías</li>
                  <li className="transition-all hover:translate-x-1 hover:text-foreground">• Centros de estética y skincare</li>
                  <li className="transition-all hover:translate-x-1 hover:text-foreground">• Spas y masajes</li>
                  <li className="transition-all hover:translate-x-1 hover:text-foreground">• Tatuadores y piercers</li>
                  <li className="transition-all hover:translate-x-1 hover:text-foreground">• Profesionales por turno</li>
                </ul>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={200} animation="slideInRight">
            <div className="group flex items-start gap-4 rounded-2xl border border-muted bg-gradient-to-br from-secondary/30 to-transparent p-6 opacity-70 transition-all duration-300 hover:shadow-md">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary transition-all group-hover:scale-110">
                <Clock className="size-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Próximamente</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>• Consultorios médicos</li>
                  <li>• Dentistas y odontólogos</li>
                  <li>• Nutricionistas</li>
                  <li>• Kinesiólogos</li>
                  <li>• Gimnasios y entrenadores</li>
                </ul>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto w-full max-w-6xl border-t border-border/40 px-6 py-24 md:py-32">
        <AnimatedSection>
          <SectionTitle
            eyebrow="Beneficios"
            title="Todo lo que necesitás, nada que no."
            description="Características pensadas para resolver problemas reales de negocios como el tuyo."
          />
        </AnimatedSection>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Clock3,
              title: "Disponibilidad 24/7",
              description: "Tus reservas quedan siempre abiertas, incluso cuando tú estás ocupado o el local cerrado.",
            },
            {
              icon: MessageCircle,
              title: "Menos mensajes",
              description: "Elimina el interminable ida y vuelta de preguntas sobre horarios o precios por WhatsApp.",
            },
            {
              icon: ShieldCheck,
              title: "Fácil de usar",
              description: "Interfaz instintiva tanto para tus clientes al reservar, como para ti al administrar.",
            },
            {
              icon: Bell,
              title: "Recordatorios automáticos",
              description: "Emails automáticos 24hs antes del turno. Menos ausencias, mejor ocupación.",
            },
            {
              icon: Users,
              title: "Base de clientes",
              description: "Historial completo de cada cliente, preferencias y reservas anteriores.",
            },
            {
              icon: Smartphone,
              title: "100% responsive",
              description: "Tus clientes reservan desde cualquier dispositivo sin descargar apps.",
            },
          ].map((feature, index) => (
            <AnimatedSection key={feature.title} delay={index * 100}>
              <article className="group flex flex-col items-start">
                <div className="flex size-12 items-center justify-center rounded-xl border border-border/60 bg-secondary/30 transition-all duration-300 group-hover:bg-foreground group-hover:text-background group-hover:scale-110">
                  <feature.icon className="size-5 text-foreground group-hover:text-background" strokeWidth={1.5} />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground transition-colors">
                  {feature.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto w-full max-w-6xl border-t border-border/40 px-6 py-24 md:py-32">
        <AnimatedSection>
          <div className="text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Testimonios
            </p>
            <h2 className="text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
              Lo que dicen quienes ya lo usan.
            </h2>
          </div>
        </AnimatedSection>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <AnimatedSection key={testimonial.author} delay={index * 150} animation={index === 0 ? "slideInLeft" : "slideInRight"}>
              <article className="group rounded-2xl border border-border/60 bg-card p-8 transition-all duration-300 hover:shadow-lg hover:border-border">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="size-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mt-4 text-lg leading-relaxed text-card-foreground">
                  {`"${testimonial.quote}"`}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-full bg-foreground text-lg font-bold text-background transition-transform group-hover:scale-110">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </article>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="mx-auto w-full max-w-6xl border-t border-border/40 px-6 py-24 md:py-32">
        <AnimatedSection>
          <div className="flex flex-col items-center text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Precios
            </p>
            <h2 className="text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
              Setup liviano, mensualidad simple.
            </h2>
            <p className="mt-4 max-w-[600px] text-lg text-muted-foreground">
              Modelo de facturación directo y transparente. Sin sorpresas ni costos ocultos.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={200} animation="fadeInScale">
          <div className="mt-12 flex justify-center">
            <div className="relative w-full max-w-md rounded-3xl border border-border/60 bg-gradient-to-b from-background to-secondary/20 p-8 shadow-lg md:p-10 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-foreground to-gray-700 px-4 py-1 text-xs font-bold uppercase tracking-wide text-background shadow-lg">
                Plan recomendado
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Plan Inicio</p>
                <div className="mt-4 flex items-baseline text-5xl font-bold tracking-tighter">
                  $150
                  <span className="ml-2 text-lg font-medium tracking-normal text-muted-foreground">
                    USD
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">setup único</p>
                <div className="mt-4 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  + $20 USD / mes
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {pricingItems.map((item, index) => (
                  <div key={item} className="flex items-start gap-3 transition-all hover:translate-x-1" style={{ transitionDelay: `${index * 50}ms` }}>
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-3">
                <Link
                  href={`/${demoBusinessSlug}`}
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "h-12 w-full rounded-full font-medium transition-all hover:scale-105 btn-shine"
                  )}
                >
                  Comenzar prueba gratis
                </Link>
                <p className="text-center text-xs text-muted-foreground">
                  Primer mes gratis. Cancelás cuando quieras.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl border-t border-border/40 px-6 py-24 md:py-32">
        <AnimatedSection>
          <div className="text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Preguntas frecuentes
            </p>
            <h2 className="text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
              ¿Tenés dudas?
            </h2>
          </div>
        </AnimatedSection>

        <div className="mt-12 space-y-3">
          {faqs.map((faq, index) => (
            <AnimatedSection key={index} delay={index * 100}>
              <div className="rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:border-border">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full cursor-pointer items-center justify-between p-6 text-left font-medium text-foreground transition-colors hover:bg-secondary/30"
                >
                  {faq.question}
                  <ChevronDown 
                    className={cn(
                      "size-5 shrink-0 text-muted-foreground transition-transform duration-300",
                      openFaq === index && "rotate-180"
                    )} 
                  />
                </button>
                <div 
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    openFaq === index ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <p className="px-6 pb-6 text-muted-foreground">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <AnimatedSection animation="fadeInScale">
          <div className="rounded-3xl bg-gradient-to-br from-foreground via-foreground to-gray-800 p-8 text-background sm:p-12 md:p-16 relative overflow-hidden">
            {/* Animated background blobs */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/5 blur-3xl animate-float" />
              <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-white/5 blur-3xl animate-float delay-500" />
            </div>
            
            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Empezá a ordenar tus turnos hoy.
              </h2>
              <p className="mt-4 text-lg text-background/70">
                Probá la demo gratis. Sin tarjeta. Sin compromiso. En 2 minutos ves cómo funciona.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={`/${demoBusinessSlug}`}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 rounded-full bg-background px-8 text-base text-foreground hover:bg-background/90 transition-all hover:scale-105 btn-shine"
                  )}
                >
                  Probar demo gratis
                  <ArrowRight className="ml-2 size-4" />
                </Link>
                <a
                  href="https://wa.me/541155550199"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-12 rounded-full border-background/20 bg-transparent px-6 text-base text-background hover:bg-background/10 transition-all hover:scale-105"
                  )}
                >
                  Hablar por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer id="contacto" className="border-t border-border/40 bg-gradient-to-b from-secondary/20 to-background">
        <div className="mx-auto max-w-6xl px-6 py-12 md:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Brand */}
            <div>
              <span className="font-sans text-lg font-bold tracking-tight text-foreground">
                {productName}
              </span>
              <p className="mt-3 text-sm text-muted-foreground">
                Página de reservas + Agenda + Recordatorios para barberías y estéticas.
              </p>
            </div>

            {/* Links */}
            <div>
              <p className="font-semibold text-foreground">Links</p>
              <div className="mt-4 flex flex-col gap-2">
                <Link href={`/${demoBusinessSlug}`} className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:translate-x-1">
                  Demo pública
                </Link>
                <Link href="/admin/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:translate-x-1">
                  Panel administrador
                </Link>
                <a href="#precios" className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:translate-x-1">
                  Precios
                </a>
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="font-semibold text-foreground">Contacto</p>
              <div className="mt-4 space-y-3">
                <a
                  href="https://wa.me/541155550199"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:translate-x-1"
                >
                  <Phone className="size-4" />
                  +54 11 5555 0199
                </a>
                <a
                  href="mailto:hola@reservaya.demo"
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:translate-x-1"
                >
                  <Mail className="size-4" />
                  hola@reservaya.demo
                </a>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="size-4" />
                  Lun-Vie 9:00 a 18:00
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {productName}. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="transition-colors hover:text-foreground">Términos</a>
              <a href="#" className="transition-colors hover:text-foreground">Privacidad</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
