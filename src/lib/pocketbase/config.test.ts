import { afterEach, describe, expect, it } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("PocketBase config", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("trims whitespace from required credential values", async () => {
    process.env.NEXT_PUBLIC_POCKETBASE_URL = "  https://pb.example.com  ";
    process.env.POCKETBASE_PUBLIC_AUTH_EMAIL = "  public@app.test  ";
    process.env.POCKETBASE_PUBLIC_AUTH_PASSWORD = "  secret123  ";

    const {
      getPocketBaseUrl,
      getPocketBasePublicAuthEmail,
      getPocketBasePublicAuthPassword,
    } = await import("./config");

    expect(getPocketBaseUrl()).toBe("https://pb.example.com");
    expect(getPocketBasePublicAuthEmail()).toBe("public@app.test");
    expect(getPocketBasePublicAuthPassword()).toBe("secret123");
  });
});
