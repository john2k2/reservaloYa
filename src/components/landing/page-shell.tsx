import { LandingHeader } from "./header";
import { Footer } from "./footer";
import { getLandingHeaderSession } from "@/server/landing-session";

import "@/app/landing-animations.css";

interface LandingPageShellProps {
  children: React.ReactNode;
}

export async function LandingPageShell({ children }: LandingPageShellProps) {
  const session = await getLandingHeaderSession();

  return (
    <main
      id="main-content"
      className="landing-theme relative min-h-screen overflow-hidden bg-background selection:bg-foreground selection:text-background"
    >
      <LandingHeader session={session} />

      {children}

      <Footer />
    </main>
  );
}
