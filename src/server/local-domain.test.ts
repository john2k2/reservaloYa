import { describe, expect, it } from "vitest";

import {
  buildBlockedSlotKey,
  buildLocalAnalyticsSummary,
  calculateAvailableSlots,
  findReminderCandidatesForBusiness,
  formatBookingStatus,
  formatMoney,
  fromMinutes,
  getAdminBusiness,
  getBookingTimestamp,
  getBusinessActiveDays,
  getBusinessBookings,
  getBusinessBySlug,
  getBusinessCustomers,
  getBusinessServices,
  getLocalBookingDetails,
  isLegacyStore,
  mergeUniqueById,
  normalizeServiceName,
  normalizeStore,
  overlaps,
  toMinutes,
  type LocalAnalyticsEvent,
  type LocalAvailabilityRule,
  type LocalBlockedSlot,
  type LocalBooking,
  type LocalStore,
} from "./local-domain";

const emptyStore: LocalStore = {
  businesses: [],
  services: [],
  availabilityRules: [],
  blockedSlots: [],
  customers: [],
  bookings: [],
  analyticsEvents: [],
  communicationEvents: [],
  waitlistEntries: [],
  reviews: [],
};

const mockBusiness = {
  id: "biz-1",
  slug: "mi-negocio",
  name: "Mi Negocio",
  phone: "1155550101",
  email: "hola@ejemplo.com",
  address: "Av. Corrientes 1234",
  timezone: "America/Argentina/Buenos_Aires",
  cancellationPolicy: "",
  mpConnected: false,
  active: true,
  createdAt: "2026-01-01T00:00:00Z",
};

describe("toMinutes / fromMinutes", () => {
  it("convierte '09:30' a 570 minutos", () => {
    expect(toMinutes("09:30")).toBe(570);
  });

  it("convierte '00:00' a 0 minutos", () => {
    expect(toMinutes("00:00")).toBe(0);
  });

  it("convierte 570 minutos a '09:30'", () => {
    expect(fromMinutes(570)).toBe("09:30");
  });

  it("convierte 0 minutos a '00:00'", () => {
    expect(fromMinutes(0)).toBe("00:00");
  });

  it("round-trip: toMinutes(fromMinutes(x)) === x", () => {
    expect(toMinutes(fromMinutes(750))).toBe(750);
  });
});

describe("overlaps", () => {
  it("detecta solapamiento completo", () => {
    expect(overlaps(10, 20, 12, 18)).toBe(true);
  });

  it("detecta solapamiento parcial al inicio", () => {
    expect(overlaps(10, 20, 5, 15)).toBe(true);
  });

  it("detecta solapamiento parcial al final", () => {
    expect(overlaps(10, 20, 15, 25)).toBe(true);
  });

  it("no hay solapamiento cuando A termina exactamente donde empieza B", () => {
    expect(overlaps(10, 20, 20, 30)).toBe(false);
  });

  it("no hay solapamiento cuando B está completamente antes de A", () => {
    expect(overlaps(30, 60, 10, 20)).toBe(false);
  });
});

describe("calculateAvailableSlots", () => {
  const baseRule: LocalAvailabilityRule = {
    id: "rule-1",
    businessId: "biz-1",
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "10:00",
    active: true,
  };

  it("genera slots cada 15 minutos dentro de la ventana", () => {
    const slots = calculateAvailableSlots({
      rules: [baseRule],
      blocked: [],
      bookings: [],
      durationMinutes: 30,
    });

    expect(slots).toEqual(["09:00", "09:15", "09:30"]);
  });

  it("excluye slots que se solapan con un bloqueo", () => {
    const blocked: LocalBlockedSlot[] = [
      {
        id: "block-1",
        businessId: "biz-1",
        blockedDate: "2026-05-01",
        startTime: "09:00",
        endTime: "09:30",
        reason: "Bloqueado",
      },
    ];

    const slots = calculateAvailableSlots({
      rules: [baseRule],
      blocked,
      bookings: [],
      durationMinutes: 30,
    });

    // 09:00 solapa con bloqueo; 09:15 también (09:15-09:45 vs 09:00-09:30)
    expect(slots).not.toContain("09:00");
    expect(slots).not.toContain("09:15");
    expect(slots).toContain("09:30");
  });

  it("devuelve lista vacía si la duración no cabe en ningún slot", () => {
    const slots = calculateAvailableSlots({
      rules: [{ ...baseRule, startTime: "09:00", endTime: "09:20" }],
      blocked: [],
      bookings: [],
      durationMinutes: 30,
    });

    expect(slots).toHaveLength(0);
  });
});

describe("formatMoney", () => {
  it("formatea un precio en ARS", () => {
    const result = formatMoney(5000);
    expect(result).toContain("5.000");
  });

  it("devuelve 'Consultar' si el precio es null", () => {
    expect(formatMoney(null)).toBe("Consultar");
  });
});

describe("formatBookingStatus", () => {
  it.each([
    ["pending", "Pendiente"],
    ["pending_payment", "Pago pendiente"],
    ["confirmed", "Confirmado"],
    ["completed", "Completado"],
    ["cancelled", "Cancelado"],
    ["no_show", "No asistio"],
  ] as const)('formatea "%s" como "%s"', (status, label) => {
    expect(formatBookingStatus(status)).toBe(label);
  });
});

describe("normalizeServiceName", () => {
  it("convierte a minúsculas y elimina espacios laterales", () => {
    expect(normalizeServiceName("  Corte de Pelo  ")).toBe("corte de pelo");
  });
});

describe("buildBlockedSlotKey", () => {
  it("genera una clave compuesta", () => {
    const key = buildBlockedSlotKey({
      blockedDate: "2026-05-01",
      startTime: "09:00",
      endTime: "10:00",
    });
    expect(key).toBe("2026-05-01::09:00::10:00");
  });
});

describe("getBookingTimestamp", () => {
  it("convierte fecha y hora a timestamp numérico", () => {
    const ts = getBookingTimestamp("2026-05-01", "09:30");
    expect(typeof ts).toBe("number");
    expect(ts).toBeGreaterThan(0);
  });
});

describe("getBusinessBySlug", () => {
  const store: LocalStore = { ...emptyStore, businesses: [mockBusiness] };

  it("encuentra el negocio por slug exacto", () => {
    expect(getBusinessBySlug(store, "mi-negocio")).toEqual(mockBusiness);
  });

  it("devuelve null si no existe el slug", () => {
    expect(getBusinessBySlug(store, "no-existe")).toBeNull();
  });
});

describe("getAdminBusiness", () => {
  const store: LocalStore = { ...emptyStore, businesses: [mockBusiness] };

  it("devuelve el negocio por slug si se provee", () => {
    expect(getAdminBusiness(store, "mi-negocio")).toEqual(mockBusiness);
  });

  it("devuelve el negocio primario si no se provee slug", () => {
    expect(getAdminBusiness(store)).toBeDefined();
  });
});

describe("getBusinessServices", () => {
  const store: LocalStore = {
    ...emptyStore,
    services: [
      { id: "svc-1", businessId: "biz-1", name: "Corte", durationMinutes: 30, price: null, active: true, featured: false, createdAt: "2026-01-01T00:00:00Z" },
      { id: "svc-2", businessId: "biz-1", name: "Barba", durationMinutes: 20, price: null, active: false, featured: false, createdAt: "2026-01-01T00:00:00Z" },
      { id: "svc-3", businessId: "biz-2", name: "Spa", durationMinutes: 60, price: null, active: true, featured: false, createdAt: "2026-01-01T00:00:00Z" },
    ],
  };

  it("devuelve solo los servicios activos del negocio", () => {
    const services = getBusinessServices(store, "biz-1");
    expect(services).toHaveLength(1);
    expect(services[0]!.id).toBe("svc-1");
  });

  it("no devuelve servicios de otro negocio", () => {
    const services = getBusinessServices(store, "biz-1");
    expect(services.every((s) => s.businessId === "biz-1")).toBe(true);
  });
});

describe("getBusinessCustomers / getBusinessBookings", () => {
  const store: LocalStore = {
    ...emptyStore,
    customers: [
      { id: "c-1", businessId: "biz-1", fullName: "Juan", phone: "1100000001", email: "", createdAt: "2026-01-01T00:00:00Z" },
      { id: "c-2", businessId: "biz-2", fullName: "Ana", phone: "1100000002", email: "", createdAt: "2026-01-01T00:00:00Z" },
    ],
    bookings: [
      {
        id: "b-1", businessId: "biz-1", serviceId: "svc-1", customerId: "c-1",
        bookingDate: "2026-05-01", startTime: "09:00", endTime: "09:30",
        status: "confirmed", createdAt: "2026-01-01T00:00:00Z",
      } as LocalBooking,
    ],
  };

  it("filtra clientes por businessId", () => {
    expect(getBusinessCustomers(store, "biz-1")).toHaveLength(1);
    expect(getBusinessCustomers(store, "biz-2")).toHaveLength(1);
  });

  it("filtra reservas por businessId", () => {
    expect(getBusinessBookings(store, "biz-1")).toHaveLength(1);
    expect(getBusinessBookings(store, "biz-2")).toHaveLength(0);
  });
});

describe("getLocalBookingDetails", () => {
  const store: LocalStore = {
    ...emptyStore,
    businesses: [mockBusiness],
    services: [{ id: "svc-1", businessId: "biz-1", name: "Corte", durationMinutes: 30, price: null, active: true, featured: false, createdAt: "2026-01-01T00:00:00Z" }],
    customers: [{ id: "c-1", businessId: "biz-1", fullName: "Juan", phone: "1100000001", email: "", createdAt: "2026-01-01T00:00:00Z" }],
    bookings: [
      {
        id: "b-1", businessId: "biz-1", serviceId: "svc-1", customerId: "c-1",
        bookingDate: "2026-05-01", startTime: "09:00", endTime: "09:30",
        status: "confirmed", createdAt: "2026-01-01T00:00:00Z",
      } as LocalBooking,
    ],
  };

  it("devuelve los detalles de una reserva existente", () => {
    const details = getLocalBookingDetails(store, "b-1");
    expect(details).not.toBeNull();
    expect(details?.booking.id).toBe("b-1");
    expect(details?.business?.name).toBe("Mi Negocio");
  });

  it("devuelve null si la reserva no existe", () => {
    expect(getLocalBookingDetails(store, "no-existe")).toBeNull();
  });

  it("devuelve null si no se provee bookingId", () => {
    expect(getLocalBookingDetails(store, undefined)).toBeNull();
  });
});

describe("getBusinessActiveDays", () => {
  const store: LocalStore = {
    ...emptyStore,
    availabilityRules: [
      { id: "r-1", businessId: "biz-1", dayOfWeek: 1, startTime: "09:00", endTime: "18:00", active: true },
      { id: "r-2", businessId: "biz-1", dayOfWeek: 1, startTime: "19:00", endTime: "21:00", active: true },
      { id: "r-3", businessId: "biz-1", dayOfWeek: 3, startTime: "09:00", endTime: "18:00", active: true },
      { id: "r-4", businessId: "biz-1", dayOfWeek: 5, startTime: "09:00", endTime: "18:00", active: false },
    ],
  };

  it("devuelve los días activos sin duplicados", () => {
    const days = getBusinessActiveDays(store, "biz-1");
    expect(days).toContain(1);
    expect(days).toContain(3);
    expect(days).not.toContain(5); // inactivo
    expect(days.filter((d) => d === 1)).toHaveLength(1); // sin duplicados
  });
});

describe("isLegacyStore / normalizeStore", () => {
  it("detecta correctamente una tienda legacy", () => {
    const legacy = {
      business: mockBusiness,
      services: [],
      availabilityRules: [],
      blockedSlots: [],
      customers: [],
      bookings: [],
    };
    expect(isLegacyStore(legacy as Parameters<typeof isLegacyStore>[0])).toBe(true);
  });

  it("convierte tienda legacy a formato moderno", () => {
    const legacy = {
      business: mockBusiness,
      services: [],
      availabilityRules: [],
      blockedSlots: [],
      customers: [],
      bookings: [],
    };
    const normalized = normalizeStore(legacy as Parameters<typeof normalizeStore>[0]);
    expect(normalized.businesses).toHaveLength(1);
    expect(normalized.waitlistEntries).toEqual([]);
  });

  it("preserva una tienda moderna y rellena arrays faltantes", () => {
    const modern = {
      businesses: [mockBusiness],
      services: [],
      availabilityRules: [],
      blockedSlots: [],
      customers: [],
      bookings: [],
    } as unknown as LocalStore;
    const result = normalizeStore(modern);
    expect(result.analyticsEvents).toEqual([]);
    expect(result.communicationEvents).toEqual([]);
  });
});

describe("findReminderCandidatesForBusiness", () => {
  const futureBooking: LocalBooking = {
    id: "b-future",
    businessId: "biz-1",
    serviceId: "svc-1",
    customerId: "c-1",
    bookingDate: "",
    startTime: "",
    endTime: "",
    status: "confirmed",
    createdAt: "2026-01-01T00:00:00Z",
  };

  it("incluye reservas confirmadas dentro de la ventana de recordatorio", () => {
    const now = new Date();
    const inTwelveHours = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    // Usar componentes locales para ambos: date y time. getBookingTimestamp interpreta
    // la combinación date+time como hora local, así que toISOString().slice(0,10)
    // (fecha UTC) genera mismatch en zonas horarias como America/Argentina/Buenos_Aires
    // cuando la hora UTC y local están en distinto día calendario.
    const dateStr = [
      inTwelveHours.getFullYear(),
      String(inTwelveHours.getMonth() + 1).padStart(2, "0"),
      String(inTwelveHours.getDate()).padStart(2, "0"),
    ].join("-");
    const timeStr = `${String(inTwelveHours.getHours()).padStart(2, "0")}:${String(inTwelveHours.getMinutes()).padStart(2, "0")}`;

    const booking: LocalBooking = {
      ...futureBooking,
      bookingDate: dateStr,
      startTime: timeStr,
      endTime: timeStr,
    };

    const store: LocalStore = {
      ...emptyStore,
      businesses: [mockBusiness],
      services: [{ id: "svc-1", businessId: "biz-1", name: "Corte", durationMinutes: 30, price: null, active: true, featured: false, createdAt: "2026-01-01T00:00:00Z" }],
      customers: [{ id: "c-1", businessId: "biz-1", fullName: "Juan", phone: "1100000001", email: "", createdAt: "2026-01-01T00:00:00Z" }],
      bookings: [booking],
    };

    const candidates = findReminderCandidatesForBusiness(store, "biz-1", now, 24);
    expect(candidates.some((c) => c.booking.id === "b-future")).toBe(true);
  });

  it("excluye reservas que ya tienen recordatorio enviado", () => {
    const now = new Date();
    const inTwelveHours = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const dateStr = [
      inTwelveHours.getFullYear(),
      String(inTwelveHours.getMonth() + 1).padStart(2, "0"),
      String(inTwelveHours.getDate()).padStart(2, "0"),
    ].join("-");
    const timeStr = `${String(inTwelveHours.getHours()).padStart(2, "0")}:${String(inTwelveHours.getMinutes()).padStart(2, "0")}`;

    const booking: LocalBooking = {
      ...futureBooking,
      bookingDate: dateStr,
      startTime: timeStr,
      endTime: timeStr,
    };

    const store: LocalStore = {
      ...emptyStore,
      businesses: [mockBusiness],
      services: [{ id: "svc-1", businessId: "biz-1", name: "Corte", durationMinutes: 30, price: null, active: true, featured: false, createdAt: "2026-01-01T00:00:00Z" }],
      customers: [{ id: "c-1", businessId: "biz-1", fullName: "Juan", phone: "1100000001", email: "", createdAt: "2026-01-01T00:00:00Z" }],
      bookings: [booking],
      communicationEvents: [
        {
          id: "comm-1",
          businessId: "biz-1",
          bookingId: "b-future",
          kind: "reminder",
          status: "sent",
          channel: "email",
          createdAt: "2026-01-01T00:00:00Z",
        },
      ],
    };

    const candidates = findReminderCandidatesForBusiness(store, "biz-1", now, 24);
    expect(candidates.every((c) => c.booking.id !== "b-future")).toBe(true);
  });
});

describe("buildLocalAnalyticsSummary", () => {
  it("devuelve métricas en cero si no hay eventos", () => {
    const summary = buildLocalAnalyticsSummary(emptyStore, "biz-1");
    expect(summary.visits).toBe(0);
    expect(summary.ctaClicks).toBe(0);
    expect(summary.conversionRate).toBe(0);
    expect(summary.channels).toHaveLength(0);
  });

  it("calcula métricas correctamente con eventos", () => {
    const events: LocalAnalyticsEvent[] = [
      { id: "e-1", businessId: "biz-1", eventName: "public_page_view", source: "google", createdAt: "2026-01-01T00:00:00Z" },
      { id: "e-2", businessId: "biz-1", eventName: "public_page_view", source: "google", createdAt: "2026-01-01T00:00:00Z" },
      { id: "e-3", businessId: "biz-1", eventName: "booking_cta_clicked", source: "google", createdAt: "2026-01-01T00:00:00Z" },
      { id: "e-4", businessId: "biz-1", eventName: "booking_created", source: "google", createdAt: "2026-01-01T00:00:00Z" },
    ];

    const store: LocalStore = { ...emptyStore, analyticsEvents: events };
    const summary = buildLocalAnalyticsSummary(store, "biz-1");

    expect(summary.visits).toBe(2);
    expect(summary.ctaClicks).toBe(1);
    expect(summary.bookingsCreated).toBe(1);
    expect(summary.clickThroughRate).toBe(50); // 1/2 = 50%
    expect(summary.conversionRate).toBe(50); // 1/2 = 50%
    expect(summary.topSource).toBe("google");
  });

  it("agrupa canales por source y los ordena por bookingsCreated", () => {
    const events: LocalAnalyticsEvent[] = [
      { id: "e-1", businessId: "biz-1", eventName: "public_page_view", source: "instagram", createdAt: "2026-01-01T00:00:00Z" },
      { id: "e-2", businessId: "biz-1", eventName: "booking_created", source: "instagram", createdAt: "2026-01-01T00:00:00Z" },
      { id: "e-3", businessId: "biz-1", eventName: "public_page_view", source: "google", createdAt: "2026-01-01T00:00:00Z" },
    ];

    const store: LocalStore = { ...emptyStore, analyticsEvents: events };
    const summary = buildLocalAnalyticsSummary(store, "biz-1");

    expect(summary.channels[0]!.source).toBe("instagram");
  });

  it("usa 'direct' como source por defecto", () => {
    const events: LocalAnalyticsEvent[] = [
      { id: "e-1", businessId: "biz-1", eventName: "public_page_view", source: "", createdAt: "2026-01-01T00:00:00Z" },
    ];

    const store: LocalStore = { ...emptyStore, analyticsEvents: events };
    const summary = buildLocalAnalyticsSummary(store, "biz-1");

    expect(summary.topSource).toBe("direct");
  });
});

describe("mergeUniqueById", () => {
  it("mantiene los existentes y agrega nuevos", () => {
    const base = [{ id: "a", v: 1 }, { id: "b", v: 2 }];
    const additions = [{ id: "b", v: 99 }, { id: "c", v: 3 }];
    const result = mergeUniqueById(base, additions);

    expect(result).toHaveLength(3);
    // "b" de base se preserva (no se overwrite)
    expect(result.find((x) => x.id === "b")?.v).toBe(2);
    expect(result.find((x) => x.id === "c")?.v).toBe(3);
  });

  it("devuelve copia de base si no hay adiciones nuevas", () => {
    const base = [{ id: "a" }];
    const result = mergeUniqueById(base, [{ id: "a" }]);
    expect(result).toHaveLength(1);
  });
});
