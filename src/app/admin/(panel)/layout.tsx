import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";

import { AdminShell } from "@/components/layout/admin-shell";
import { AdminToastReader } from "@/components/layout/admin-toast-reader";
import { ToastProvider } from "@/components/ui/toast";
import { getAdminShellData } from "@/server/queries/admin";
import { getAuthenticatedPlatformAdmin } from "@/server/platform-auth";

export const metadata: Metadata = {
  title: "Panel de administración · ReservaYa",
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shellData = await getAdminShellData();

  if (!shellData) {
    // Si es superadmin sin negocio asignado, mandarlo a su panel
    const platformAdmin = await getAuthenticatedPlatformAdmin();
    if (platformAdmin) {
      redirect("/platform/dashboard");
    }
    redirect("/login");
  }

  if (shellData.subscriptionExpired) {
    redirect("/admin/subscription");
  }

  return (
    <ToastProvider>
      <Suspense>
        <AdminToastReader />
      </Suspense>
      <AdminShell
        businessName={shellData.businessName}
        businessSlug={shellData.businessSlug}
        userEmail={shellData.userEmail}
        userRole={shellData.userRole ?? "staff"}
        userVerified={shellData.userVerified ?? true}
        profileName={shellData.profileName}
        demoMode={shellData.demoMode}
      >
        {children}
      </AdminShell>
    </ToastProvider>
  );
}
