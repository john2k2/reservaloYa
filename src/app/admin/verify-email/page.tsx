import { confirmEmailVerificationAction } from "@/app/login/actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verificar email · ReservaYa",
  robots: { index: false, follow: false },
};

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;

  await confirmEmailVerificationAction(params.token ?? "");

  return null;
}
