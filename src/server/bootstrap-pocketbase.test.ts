import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("bootstrap PocketBase schema", () => {
  it("includes pending_payment in bookings.status options", () => {
    const bootstrapPath = path.join(process.cwd(), "scripts", "setup", "bootstrap-pocketbase.mjs");
    const bootstrapSource = readFileSync(bootstrapPath, "utf8");

    expect(bootstrapSource).toContain('selectField("status", [');
    expect(bootstrapSource).toContain('"pending_payment"');
  });

  it("includes payment fields in bookings and keeps customer phone optional", () => {
    const bootstrapPath = path.join(process.cwd(), "scripts", "setup", "bootstrap-pocketbase.mjs");
    const bootstrapSource = readFileSync(bootstrapPath, "utf8");

    expect(bootstrapSource).toContain('textField("paymentStatus")');
    expect(bootstrapSource).toContain('numberField("paymentAmount")');
    expect(bootstrapSource).toContain('textField("paymentCurrency")');
    expect(bootstrapSource).toContain('textField("paymentProvider")');
    expect(bootstrapSource).toContain('textField("paymentPreferenceId")');
    expect(bootstrapSource).toContain('textField("paymentExternalId")');
    expect(bootstrapSource).toContain('name: "customers"');
    expect(bootstrapSource).toContain('textField("phone")');
  });
});
