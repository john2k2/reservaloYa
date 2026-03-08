import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { getAdminShellData } from "@/server/queries/admin";

export default async function AdminPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shellData = await getAdminShellData();

  if (!shellData) {
    redirect("/admin/login");
  }

  return (
    <AdminShell
      businessName={shellData.businessName}
      businessSlug={shellData.businessSlug}
      userEmail={shellData.userEmail}
      profileName={shellData.profileName}
      demoMode={shellData.demoMode}
    >
      {children}
    </AdminShell>
  );
}
