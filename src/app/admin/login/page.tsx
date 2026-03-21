import { redirect } from "next/navigation";

import AdminLoginPage from "@/app/login/page";
import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import { isDemoModeEnabled } from "@/lib/runtime";

type AdminRouteLoginPageProps = Parameters<typeof AdminLoginPage>[0];

export default async function AdminRouteLoginPage(props: AdminRouteLoginPageProps) {
  if (!isPocketBaseConfigured() && isDemoModeEnabled()) {
    redirect("/admin/dashboard");
  }

  return <AdminLoginPage {...props} />;
}
