import { describe, expect, it } from "vitest";

import { resolvePublicBookingFlashMessage } from "./public-booking-flash-messages";

describe("resolvePublicBookingFlashMessage", () => {
  it("devuelve vacío para input vacío", () => {
    expect(resolvePublicBookingFlashMessage("")).toBe("");
    expect(resolvePublicBookingFlashMessage(undefined)).toBe("");
  });

  it("acepta mensajes exactos del servidor", () => {
    expect(resolvePublicBookingFlashMessage("Link de gestion invalido.")).toBe(
      "Link de gestion invalido."
    );
  });

  it("acepta prefijos conocidos de rate limit", () => {
    expect(
      resolvePublicBookingFlashMessage(
        "Demasiados intentos de reserva. Intenta nuevamente en unos segundos."
      )
    ).toContain("Demasiados intentos");
  });

  it("reemplaza mensajes arbitrarios por genérico", () => {
    expect(resolvePublicBookingFlashMessage("Tu cuenta fue suspendida")).toBe(
      "No pudimos completar la acción. Intentá de nuevo o contactá al negocio."
    );
  });
});
