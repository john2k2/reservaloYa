import type {
  BookingRecord,
  BookingStatus,
  BusinessRecord,
  CustomerRecord,
  ServiceRecord,
} from "@/server/supabase-domain";
import type { BookingPaymentUpdateInput } from "@/server/payments-domain";

export interface JoinedBookingConfirmation {
  id: string;
  confirmationCode?: string;
  bookingDate: string;
  startTime: string;
  endTime?: string;
  status: BookingStatus;
  notes?: string;
  manageToken?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentProvider?: string;
  paymentPreferenceId?: string;
  paymentExternalId?: string;
  customer_id: string;
  service_id: string;
  business: Pick<BusinessRecord, "id" | "name" | "slug" | "address" | "timezone" | "email">;
  service: Pick<ServiceRecord, "id" | "name" | "durationMinutes" | "price"> | null;
  customer: Pick<CustomerRecord, "fullName" | "email" | "phone"> | null;
}

export interface JoinedBookingManage {
  id: string;
  bookingDate: string;
  startTime: string;
  endTime?: string;
  status: BookingStatus;
  notes?: string;
  manageToken?: string;
  customer_id: string;
  service_id: string;
  business: Pick<BusinessRecord, "id" | "name" | "slug" | "address" | "timezone">;
  service: Pick<ServiceRecord, "id" | "name" | "durationMinutes"> | null;
  customer: Pick<CustomerRecord, "fullName" | "email" | "phone"> | null;
}

export interface JoinedBookingWithBusiness {
  id: string;
  status: BookingStatus;
  bookingDate: string;
  startTime: string;
  customer_id?: string;
  service_id?: string;
  notes?: string;
  business: Pick<BusinessRecord, "id" | "slug" | "name">;
}

export interface JoinedBookingWithBusinessStatus {
  id: string;
  status: BookingStatus;
  bookingDate: string;
  startTime: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentProvider?: string;
  paymentStatus?: string;
  paymentPreferenceId?: string;
  paymentExternalId?: string;
  business: Pick<BusinessRecord, "id" | "slug" | "mpCollectorId">;
}

export type PublicBookingConflictRow = Pick<
  BookingRecord,
  "id" | "startTime" | "endTime" | "status"
>;

export type SupabaseSubscriptionPaymentAttempt = {
  id: string;
  businessId: string;
  preferenceId: string;
  amountArs: number;
  currency: string;
  blueRate: number | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  paymentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateSupabaseBookingPaymentInput = BookingPaymentUpdateInput;
