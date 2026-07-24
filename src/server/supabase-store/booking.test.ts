import { beforeEach, describe, expect, it, vi } from "vitest";

const getSupabaseAdminClientMock = vi.fn();
const createSupabaseRecordMock = vi.fn();
const updateSupabaseRecordMock = vi.fn();
const getSupabaseRecordMock = vi.fn();
const sendBookingConfirmationEmailMock = vi.fn();
const sendBookingConfirmationWhatsAppMock = vi.fn();
const sendBusinessNotificationEmailMock = vi.fn();

vi.mock("./_core", () => ({
  getSupabaseAdminClient: getSupabaseAdminClientMock,
  createSupabaseRecord: createSupabaseRecordMock,
  updateSupabaseRecord: updateSupabaseRecordMock,
  getSupabaseRecord: getSupabaseRecordMock,
}));

vi.mock("@/server/booking-notifications", () => ({
  sendBookingConfirmationEmail: sendBookingConfirmationEmailMock,
  sendBookingConfirmationWhatsApp: sendBookingConfirmationWhatsAppMock,
  sendBusinessNotificationEmail: sendBusinessNotificationEmailMock,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

function buildMockClient(tableData: Record<string, unknown[] | unknown>) {
  return {
    from: vi.fn((table: string) => {
      const data = tableData[table];
      const arrayData = Array.isArray(data) ? data : data != null ? [data] : [];
      const singleData = Array.isArray(data) ? data[0] ?? null : data ?? null;

      const chain: {
        eq: ReturnType<typeof vi.fn>;
        single: ReturnType<typeof vi.fn>;
        order: ReturnType<typeof vi.fn>;
        then?: (onFulfilled: (value: { data: unknown[]; error: null }) => unknown) => unknown;
      } = {
        eq: vi.fn(() => chain),
        single: vi.fn(() => Promise.resolve({ data: singleData, error: null })),
        order: vi.fn(() => Promise.resolve({ data: arrayData, error: null })),
      };

      // Permite await sobre el final de la cadena de eq() para obtener el array.
      chain.then = (onFulfilled) => onFulfilled({ data: arrayData, error: null });

      return {
        select: vi.fn(() => chain),
      };
    }),
  };
}

const baseBusiness = {
  id: "business-1",
  slug: "demo",
  name: "Demo",
  active: true,
  timezone: "America/Argentina/Buenos_Aires",
};

const baseService = {
  id: "service-1",
  business_id: "business-1",
  name: "Corte",
  durationMinutes: 60,
  active: true,
};

const baseRule = {
  id: "rule-1",
  business_id: "business-1",
  dayOfWeek: 2,
  startTime: "09:00",
  endTime: "18:00",
  active: true,
};

const existingCustomer = {
  id: "customer-1",
  business_id: "business-1",
  fullName: "Cliente Existente",
  phone: "1234567890",
  email: "existente@example.com",
};

function setupRecordMocks() {
  createSupabaseRecordMock.mockImplementation(async (table, data) => ({
    id: table === "customers" ? "customer-new" : "booking-new",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    ...(data as Record<string, unknown>),
  }));

  updateSupabaseRecordMock.mockImplementation(async (table, id, data) => ({
    id,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    ...(data as Record<string, unknown>),
  }));

  sendBookingConfirmationEmailMock.mockResolvedValue({ status: "sent", messageId: "msg-1" });
  sendBookingConfirmationWhatsAppMock.mockResolvedValue({ status: "skipped", reason: "no_customer_phone" });
  sendBusinessNotificationEmailMock.mockResolvedValue({ status: "sent", messageId: "msg-2" });
}

describe("createSupabasePublicBooking - matching de customer", () => {
  beforeEach(() => {
    vi.resetModules();
    getSupabaseAdminClientMock.mockReset();
    createSupabaseRecordMock.mockReset();
    updateSupabaseRecordMock.mockReset();
    sendBookingConfirmationEmailMock.mockReset();
    sendBookingConfirmationWhatsAppMock.mockReset();
    sendBusinessNotificationEmailMock.mockReset();
    setupRecordMocks();
  });

  it("actualiza el cliente existente cuando el email no coincide pero el telefono si", async () => {
    getSupabaseAdminClientMock.mockResolvedValue(
      buildMockClient({
        businesses: baseBusiness,
        services: baseService,
        availability_rules: [baseRule],
        blocked_slots: [],
        bookings: [],
        customers: [existingCustomer],
      })
    );

    const { createSupabasePublicBooking } = await import("./booking");

    await createSupabasePublicBooking({
      businessSlug: "demo",
      serviceId: "service-1",
      bookingDate: "2026-07-07",
      startTime: "10:00",
      fullName: "Nuevo Cliente",
      phone: existingCustomer.phone,
      email: "nuevo@example.com",
    });

    expect(updateSupabaseRecordMock).toHaveBeenCalledWith(
      "customers",
      existingCustomer.id,
      expect.objectContaining({
        fullName: "Nuevo Cliente",
        email: "nuevo@example.com",
        phone: existingCustomer.phone,
      })
    );

    expect(createSupabaseRecordMock).not.toHaveBeenCalledWith(
      "customers",
      expect.anything()
    );
  });

  it("actualiza el cliente existente cuando el email coincide", async () => {
    getSupabaseAdminClientMock.mockResolvedValue(
      buildMockClient({
        businesses: baseBusiness,
        services: baseService,
        availability_rules: [baseRule],
        blocked_slots: [],
        bookings: [],
        customers: [existingCustomer],
      })
    );

    const { createSupabasePublicBooking } = await import("./booking");

    await createSupabasePublicBooking({
      businessSlug: "demo",
      serviceId: "service-1",
      bookingDate: "2026-07-07",
      startTime: "10:00",
      fullName: "Nombre Actualizado",
      phone: "9999999999",
      email: existingCustomer.email,
    });

    expect(updateSupabaseRecordMock).toHaveBeenCalledWith(
      "customers",
      existingCustomer.id,
      expect.objectContaining({
        fullName: "Nombre Actualizado",
        email: existingCustomer.email,
        phone: "9999999999",
      })
    );

    expect(createSupabaseRecordMock).not.toHaveBeenCalledWith(
      "customers",
      expect.anything()
    );
  });
});

describe("rescheduleSupabasePublicBooking", () => {
  beforeEach(() => {
    vi.resetModules();
    getSupabaseAdminClientMock.mockReset();
    createSupabaseRecordMock.mockReset();
    updateSupabaseRecordMock.mockReset();
    sendBookingConfirmationEmailMock.mockReset();
    sendBookingConfirmationWhatsAppMock.mockReset();
    sendBusinessNotificationEmailMock.mockReset();
    setupRecordMocks();
  });

  const existingBooking = {
    id: "booking-1",
    business_id: "business-1",
    customer_id: existingCustomer.id,
    service_id: "service-1",
    bookingDate: "2026-07-07",
    startTime: "09:00",
    endTime: "10:00",
    status: "confirmed",
    notes: "",
  };

  function buildRescheduleClient(business: typeof baseBusiness) {
    return buildMockClient({
      businesses: business,
      services: baseService,
      availability_rules: [baseRule],
      blocked_slots: [],
      bookings: [
        {
          ...existingBooking,
          business,
        },
      ],
      customers: [existingCustomer],
    });
  }

  it("mantiene confirmed cuando el negocio tiene autoConfirmBookings activo", async () => {
    const business = { ...baseBusiness, autoConfirmBookings: true, email: "negocio@example.com" };

    getSupabaseAdminClientMock.mockResolvedValue(buildRescheduleClient(business));

    const { rescheduleSupabasePublicBooking } = await import("./booking");

    await rescheduleSupabasePublicBooking({
      businessSlug: "demo",
      serviceId: "service-1",
      bookingDate: "2026-07-14",
      startTime: "11:00",
      fullName: existingCustomer.fullName,
      phone: existingCustomer.phone,
      email: existingCustomer.email,
      rescheduleBookingId: existingBooking.id,
    });

    const bookingUpdateCall = updateSupabaseRecordMock.mock.calls.find(
      (call) => call[0] === "bookings"
    );

    expect(bookingUpdateCall).toBeDefined();
    expect(bookingUpdateCall![1]).toBe(existingBooking.id);
    expect(bookingUpdateCall![2]).toMatchObject({ status: "confirmed" });
  });

  it("usa pending cuando el negocio no tiene autoConfirmBookings activo", async () => {
    const business = { ...baseBusiness, autoConfirmBookings: false };

    getSupabaseAdminClientMock.mockResolvedValue(buildRescheduleClient(business));

    const { rescheduleSupabasePublicBooking } = await import("./booking");

    await rescheduleSupabasePublicBooking({
      businessSlug: "demo",
      serviceId: "service-1",
      bookingDate: "2026-07-14",
      startTime: "11:00",
      fullName: existingCustomer.fullName,
      phone: existingCustomer.phone,
      email: existingCustomer.email,
      rescheduleBookingId: existingBooking.id,
    });

    const bookingUpdateCall = updateSupabaseRecordMock.mock.calls.find(
      (call) => call[0] === "bookings"
    );

    expect(bookingUpdateCall).toBeDefined();
    expect(bookingUpdateCall![1]).toBe(existingBooking.id);
    expect(bookingUpdateCall![2]).toMatchObject({ status: "pending" });
  });

  it("usa pending_payment cuando el servicio es pago y el negocio tiene MP configurado", async () => {
    const business = { ...baseBusiness, autoConfirmBookings: true, email: "negocio@example.com", mpConnected: true };
    const paidService = { ...baseService, price: 1500 };

    getSupabaseAdminClientMock.mockResolvedValue(
      buildMockClient({
        businesses: business,
        services: paidService,
        availability_rules: [baseRule],
        blocked_slots: [],
        bookings: [
          {
            ...existingBooking,
            business,
          },
        ],
        customers: [existingCustomer],
      })
    );

    const { rescheduleSupabasePublicBooking } = await import("./booking");

    await rescheduleSupabasePublicBooking({
      businessSlug: "demo",
      serviceId: "service-1",
      bookingDate: "2026-07-14",
      startTime: "11:00",
      fullName: existingCustomer.fullName,
      phone: existingCustomer.phone,
      email: existingCustomer.email,
      rescheduleBookingId: existingBooking.id,
    });

    const bookingUpdateCall = updateSupabaseRecordMock.mock.calls.find(
      (call) => call[0] === "bookings"
    );

    expect(bookingUpdateCall).toBeDefined();
    expect(bookingUpdateCall![1]).toBe(existingBooking.id);
    expect(bookingUpdateCall![2]).toMatchObject({ status: "pending_payment" });
  });

  it("envía notificación de reprogramación al cliente y al negocio", async () => {
    const business = { ...baseBusiness, autoConfirmBookings: true, email: "negocio@example.com" };

    getSupabaseAdminClientMock.mockResolvedValue(buildRescheduleClient(business));

    const { rescheduleSupabasePublicBooking } = await import("./booking");

    await rescheduleSupabasePublicBooking({
      businessSlug: "demo",
      serviceId: "service-1",
      bookingDate: "2026-07-14",
      startTime: "11:00",
      fullName: existingCustomer.fullName,
      phone: existingCustomer.phone,
      email: existingCustomer.email,
      rescheduleBookingId: existingBooking.id,
    });

    expect(sendBookingConfirmationEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: existingBooking.id,
        customerEmail: existingCustomer.email,
        businessSlug: business.slug,
      }),
      "rescheduled"
    );

    expect(sendBusinessNotificationEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: existingBooking.id,
        businessNotificationEmail: business.email,
      }),
      "rescheduled"
    );
  });
});

describe("updateBookingScoped", () => {
  beforeEach(() => {
    getSupabaseRecordMock.mockReset();
    updateSupabaseRecordMock.mockReset();
  });

  it("applies the patch when the booking belongs to the given business", async () => {
    getSupabaseRecordMock.mockResolvedValue({
      id: "booking-1",
      business_id: "business-1",
      status: "pending",
    });
    updateSupabaseRecordMock.mockResolvedValue({
      id: "booking-1",
      business_id: "business-1",
      status: "confirmed",
    });

    const { updateBookingScoped } = await import("./booking");

    await updateBookingScoped("business-1", "booking-1", { status: "confirmed" });

    expect(getSupabaseRecordMock).toHaveBeenCalledWith("bookings", "booking-1");
    expect(updateSupabaseRecordMock).toHaveBeenCalledWith("bookings", "booking-1", {
      status: "confirmed",
    });
  });

  it("rejects when the booking belongs to a different business", async () => {
    getSupabaseRecordMock.mockResolvedValue({
      id: "booking-1",
      business_id: "business-other",
      status: "pending",
    });

    const { updateBookingScoped } = await import("./booking");

    await expect(
      updateBookingScoped("business-1", "booking-1", { status: "confirmed" })
    ).rejects.toThrow("No encontramos el turno a actualizar.");
    expect(updateSupabaseRecordMock).not.toHaveBeenCalled();
  });
});

describe("updateSupabaseBookingPayment", () => {
  beforeEach(() => {
    getSupabaseRecordMock.mockReset();
    updateSupabaseRecordMock.mockReset();
  });

  it("applies the payment patch when the booking belongs to the given business", async () => {
    getSupabaseRecordMock.mockResolvedValue({
      id: "booking-1",
      business_id: "business-1",
      status: "pending_payment",
    });
    updateSupabaseRecordMock.mockResolvedValue({ id: "booking-1" });

    const { updateSupabaseBookingPayment } = await import("./booking");

    await updateSupabaseBookingPayment({
      bookingId: "booking-1",
      businessId: "business-1",
      paymentStatus: "approved",
    });

    expect(updateSupabaseRecordMock).toHaveBeenCalledWith(
      "bookings",
      "booking-1",
      expect.objectContaining({ paymentStatus: "approved", status: "confirmed" })
    );
  });

  it("rejects applying a payment update to a booking from another business", async () => {
    getSupabaseRecordMock.mockResolvedValue({
      id: "booking-1",
      business_id: "business-other",
      status: "pending_payment",
    });

    const { updateSupabaseBookingPayment } = await import("./booking");

    await expect(
      updateSupabaseBookingPayment({
        bookingId: "booking-1",
        businessId: "business-1",
        paymentStatus: "approved",
      })
    ).rejects.toThrow("No encontramos el turno a actualizar.");
    expect(updateSupabaseRecordMock).not.toHaveBeenCalled();
  });
});
