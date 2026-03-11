import { z } from "zod";

export const publicBookingSchema = z.object({
  businessSlug: z.string().min(2).max(80),
  serviceId: z.string().min(1),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  fullName: z.string().min(3).max(120),
  phone: z.string().min(6).max(30),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  notes: z.union([z.string().max(500), z.literal("")]).optional(),
  rescheduleBookingId: z.union([z.string().min(1).max(64), z.literal("")]).optional(),
  manageToken: z.union([z.string().min(32), z.literal("")]).optional(),
});

export type PublicBookingInput = z.infer<typeof publicBookingSchema>;
