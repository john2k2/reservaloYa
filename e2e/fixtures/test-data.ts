/**
 * Datos de prueba para tests E2E
 */

export const testBusiness = {
  slug: "demo-barberia",
  name: "Barbería Demo",
  services: [
    {
      id: "22222222-2222-2222-2222-222222222221",
      name: "Corte clásico",
      priceLabel: "$ 12.000",
      durationMinutes: 45,
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      name: "Corte + barba",
      priceLabel: "$ 18.000",
      durationMinutes: 60,
    },
  ],
};

export const testCustomer = {
  fullName: "Juan Pérez Test",
  phone: "11 5555 9999",
  email: "juan.test@example.com",
  notes: "Nota de prueba E2E",
};

export const testAdmin = {
  email: "admin@reservaya.local",
  password: "ReservaYaAdmin_2026_Local!",
};

export const testUrls = {
  public: {
    business: (slug: string) => `/${slug}`,
    booking: (slug: string) => `/${slug}/reservar`,
    confirmation: (slug: string, bookingId: string) =>
      `/${slug}/confirmacion?booking=${bookingId}`,
    manageBooking: (slug: string, id: string, token: string) =>
      `/${slug}/mi-turno?id=${id}&token=${token}`,
  },
  admin: {
    login: "/admin/login",
    dashboard: "/admin/dashboard",
    bookings: "/admin/bookings",
    services: "/admin/services",
    availability: "/admin/availability",
    customers: "/admin/customers",
    onboarding: "/admin/onboarding",
  },
};

/**
 * Selectores comunes usados en tests
 */
export const selectors = {
  // Página pública
  mainContent: "[id='main-content']",
  bookingButton: "a[href*='reservar']",
  serviceCard: "a[href*='service=']",
  
  // Formulario de reserva
  fullNameInput: "input[name='fullName'], input#fullName",
  phoneInput: "input[name='phone'], input#phone",
  bookingEmailInput: "input[name='email'], input#email",
  notesInput: "textarea[name='notes'], textarea#notes",
  submitButton: "button[type='submit']",
  
  // Admin
  loginForm: "form",
  adminEmailInput: "input[name='email'], input#email",
  passwordInput: "input[name='password'], input#password",
  metricCards: "[class*='metric'], [class*='card']",
};
