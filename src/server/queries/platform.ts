// Punto de entrada de compatibilidad: la implementación vive en ./platform/*.
export type {
  PlatformSubscriptionInfo,
  PlatformBusinessRow,
  PlatformUserRow,
  PlatformPaymentRow,
  PlatformHealthCheck,
  PlatformDashboardData,
  PlatformJobRunRow,
  NotificationHistoryRow,
} from "./platform/types";
export { getPlatformDashboardData } from "./platform/dashboard";
export {
  getPlatformHealthChecks,
  getPlatformJobRuns,
  getPlatformJobFailureCount,
} from "./platform/health";
export {
  getPlatformBusinessesList,
  togglePlatformBusinessActive,
  consolidateBusinessOwners,
  enableTrial,
  extendTrial,
  cancelSubscription,
  unlockBusinessSubscription,
  markSubscriptionPaid,
  generateImpersonationToken,
  resolveImpersonationToken,
} from "./platform/businesses";
export { getPlatformUsersList, togglePlatformUserActive } from "./platform/users";
export { getBusinessNotificationHistory } from "./platform/notifications";
