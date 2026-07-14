import { confirmEmailVerificationAction } from "@/app/login/actions";
import type { Metadata } from "next";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "Verificar email · ReservaYa",
  path: "/admin/verify-email",
});

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;

  await confirmEmailVerificationAction(params.token ?? "");

  return null;
}
