import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type OnboardingStatusBannerProps = {
  title: string;
  description: string;
  href: string;
  actionLabel?: string;
  secondaryAction?: ReactNode;
};

export function OnboardingStatusBanner({
  title,
  description,
  href,
  actionLabel = "Ver pagina",
  secondaryAction,
}: OnboardingStatusBannerProps) {
  return (
    <section className="w-full rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-400/10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="text-base font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={href}
            target="_blank"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 gap-2")}
          >
            {actionLabel}
            <ExternalLink aria-hidden="true" className="size-4" />
          </Link>
          {secondaryAction}
        </div>
      </div>
    </section>
  );
}
