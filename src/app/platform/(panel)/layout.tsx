import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { PlatformShell } from "@/components/layout/platform-shell";
import { ToastProvider } from "@/components/ui/toast";
import { getAuthenticatedPlatformAdmin } from "@/server/platform-auth";

export const metadata: Metadata = {
  title: "Panel de plataforma · ReservaYa",
  robots: { index: false, follow: false },
};

export default async function PlatformPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthenticatedPlatformAdmin();

  if (!user) {
    redirect("/login");
  }

  return (
    <ToastProvider>
      <PlatformShell userEmail={String(user.email ?? "")}>
        {children}
      </PlatformShell>
    </ToastProvider>
  );
}
