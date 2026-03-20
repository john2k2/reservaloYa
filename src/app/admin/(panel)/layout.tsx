import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { ToastProvider } from "@/components/ui/toast";
import { getAdminShellData } from "@/server/queries/admin";
import { getAuthenticatedPlatformAdmin } from "@/server/platform-auth";

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
