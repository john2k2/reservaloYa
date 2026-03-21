import * as Sentry from "@sentry/nextjs";

import { getSharedSentryOptions } from "@/lib/monitoring/sentry";

const sentryDsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  ...getSharedSentryOptions(sentryDsn),
});
