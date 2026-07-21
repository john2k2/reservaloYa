// Punto de entrada de compatibilidad: la implementación vive en ./booking-notifications/*.
export type { BookingEmailResult } from "./booking-notifications/email-core";
export {
  getAvailableReminderChannels,
  hasReminderProviderConfigured,
  isTwilioConfigured,
  sendBookingReminderEmail,
  sendBookingReminderWhatsApp,
} from "./booking-notifications/reminders";
export type { ReminderChannel, ReminderResult, ReminderInput } from "./booking-notifications/reminders";
export {
  sendBookingConfirmationEmail,
  sendBusinessNotificationEmail,
  sendBookingConfirmationWhatsApp,
} from "./booking-notifications/confirmation";
export type { BookingConfirmationData } from "./booking-notifications/confirmation";
export {
  sendTrialEndingEmail,
  sendDunningEmail,
  sendSubscriptionSuspendedEmail,
} from "./booking-notifications/billing";
export {
  sendPostBookingFollowUpEmail,
  sendPostBookingFollowUpWhatsApp,
} from "./booking-notifications/follow-up";
export { sendWaitlistAvailabilityEmail } from "./booking-notifications/waitlist";
