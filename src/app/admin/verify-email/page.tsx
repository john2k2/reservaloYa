import { confirmEmailVerificationAction } from "@/app/login/actions";

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;

  await confirmEmailVerificationAction(params.token ?? "");

  return null;
}
