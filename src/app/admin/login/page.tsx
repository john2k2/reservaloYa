import AdminLoginPage from "@/app/login/page";
import type { Metadata } from "next";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";

type AdminRouteLoginPageProps = Parameters<typeof AdminLoginPage>[0];

export const metadata: Metadata = createPrivatePageMetadata({
  title: "Ingresar a tu negocio · ReservaYa",
  path: "/admin/login",
  description: "Iniciá sesión con tu correo electrónico para gestionar tu negocio.",
});

export default async function AdminRouteLoginPage(props: AdminRouteLoginPageProps) {
  return <AdminLoginPage {...props} />;
}
