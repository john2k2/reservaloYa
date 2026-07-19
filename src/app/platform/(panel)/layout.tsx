import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { PlatformShell } from "@/components/layout/platform-shell";
import { ToastProvider } from "@/components/ui/toast";
import { getAuthenticatedPlatformAdmin } from "@/server/platform-auth";
import { countSupportThreadsNeedingReply } from "@/server/support-inbox";
import { getPlatformJobFailureCount } from "@/server/queries/platform";

export const metadata: Metadata = {
  title: "Panel de plataforma · ReservaYa",
  robots: { index: false, follow: false },
};

export default async function PlatformPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthenticatedPlatformAdmin();

  if (!user) {
    redirect("/login");
  }

  let needsReplyCount = 0;
  let jobFailureCount = 0;
  try {
    [needsReplyCount, jobFailureCount] = await Promise.all([
      countSupportThreadsNeedingReply(),
      getPlatformJobFailureCount(),
    ]);
  } catch {
    needsReplyCount = 0;
    jobFailureCount = 0;
  }

  return (
    <ToastProvider>
      <PlatformShell
        userEmail={String(user.email ?? "")}
        needsReplyCount={needsReplyCount}
        jobFailureCount={jobFailureCount}
      >
        {children}
      </PlatformShell>
    </ToastProvider>
  );
}
