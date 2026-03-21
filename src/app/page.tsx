import {
  LandingHeader,
  HeroSection,
  DemoSelector,
  HowItWorksSection,
  PricingSection,
  FAQSection,
  CTASection,
  Footer,
} from "@/components/landing";

import "./landing-animations.css";

export default function Home() {
  return (
    <main
      id="main-content"
      className="relative min-h-screen overflow-hidden bg-background selection:bg-foreground selection:text-background"
    >
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 subtle-grid opacity-30 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
      <div className="pointer-events-none absolute inset-0 gradient-mesh" />

      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-gradient-to-br from-gray-200/50 to-transparent blur-3xl animate-float" />
      <div className="pointer-events-none absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-gradient-to-bl from-gray-200/40 to-transparent blur-3xl animate-float delay-500" />

      <LandingHeader />

      <HeroSection />
      <DemoSelector />
      <HowItWorksSection />
      <PricingSection />
      <FAQSection />
      <CTASection />

      <Footer />
    </main>
  );
}
