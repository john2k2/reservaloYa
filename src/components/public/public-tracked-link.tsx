"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";

import { sendPublicAnalyticsEvent } from "@/components/public/public-analytics-client";

type PublicTrackedLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & {
  businessSlug: string;
  eventName: "booking_cta_clicked";
  href: string;
  pagePath: string;
  children: ReactNode;
};

export function PublicTrackedLink({
  businessSlug,
  eventName,
  pagePath,
  onClick,
  children,
  ...props
}: Readonly<PublicTrackedLinkProps>) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        sendPublicAnalyticsEvent({
          businessSlug,
          eventName,
          pagePath,
        });
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}
