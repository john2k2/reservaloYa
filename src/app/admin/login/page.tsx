import AdminLoginPage from "@/app/login/page";

type AdminRouteLoginPageProps = Parameters<typeof AdminLoginPage>[0];

export default async function AdminRouteLoginPage(props: AdminRouteLoginPageProps) {
  return <AdminLoginPage {...props} />;
}
