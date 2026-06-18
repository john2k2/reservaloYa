import AdminLoginPage from "@/app/login/page";
import type { Metadata } from "next";

type AdminRouteLoginPageProps = Parameters<typeof AdminLoginPage>[0];

export const metadata: Metadata = {
  title: "Ingresar a tu negocio · ReservaYa",
  description: "Iniciá sesión con tu correo electrónico para gestionar tu negocio.",
  robots: { index: false, follow: false },
};

export default async function AdminRouteLoginPage(props: AdminRouteLoginPageProps) {
  return <AdminLoginPage {...props} />;
}
