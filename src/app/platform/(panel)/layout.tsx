import { redirect } from "next/navigation";

import { PlatformShell } from "@/components/layout/platform-shell";
import { ToastProvider } from "@/components/ui/toast";
import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import { getAuthenticatedPlatformAdmin } from "@/server/platform-auth";

export default async function PlatformPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!isPocketBaseConfigured()) {
    redirect("/admin/login");
  }

  const user = await getAuthenticatedPlatformAdmin();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <ToastProvider>
      <PlatformShell userEmail={String(user.email ?? "")}>
        {children}
      </PlatformShell>
    </ToastProvider>
  );
}
