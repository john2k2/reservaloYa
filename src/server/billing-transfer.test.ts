import { afterEach, describe, expect, it, vi } from "vitest";

describe("billing-transfer", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("lee detalles de transferencia desde env", async () => {
    vi.stubEnv("BILLING_TRANSFER_ALIAS", "reservaya.alias");
    vi.stubEnv("BILLING_TRANSFER_CBU", "0000000000000000000000");
    vi.stubEnv("BILLING_TRANSFER_HOLDER", "ReservaYa");
    vi.stubEnv("BILLING_TRANSFER_BANK", "Banco Test");

    const { getBillingTransferDetails, hasBillingTransferDetails } = await import(
      "./billing-transfer"
    );
    const details = getBillingTransferDetails();

    expect(details).toEqual({
      alias: "reservaya.alias",
      cbu: "0000000000000000000000",
      holder: "ReservaYa",
      bank: "Banco Test",
    });
    expect(hasBillingTransferDetails(details)).toBe(true);
  });

  it("arma mensaje de WhatsApp con monto", async () => {
    const { buildTransferWhatsAppMessage } = await import("./billing-transfer");
    expect(
      buildTransferWhatsAppMessage({ businessName: "Barbería Norte", amountArsLabel: "30.000" })
    ).toContain("Barbería Norte");
  });
});
