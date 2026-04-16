import { afterEach, describe, expect, it, vi } from "vitest";

import { getBlueDollarRate } from "./dollar-rate";

describe("getBlueDollarRate", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("usa un timeout corto al consultar Bluelytics", async () => {
    const signal = new AbortController().signal;
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout").mockReturnValue(signal);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ blue: { value_sell: 1299.4 } }),
    } as Response);

    await expect(getBlueDollarRate()).resolves.toBe(1299);

    expect(timeoutSpy).toHaveBeenCalledWith(3000);
    expect(fetchSpy).toHaveBeenCalledWith("https://api.bluelytics.com.ar/v2/latest", {
      next: { revalidate: 3600 },
      signal,
    });
  });

  it("devuelve null si la consulta falla", async () => {
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(new AbortController().signal);
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("timeout"));

    await expect(getBlueDollarRate()).resolves.toBeNull();
  });
});
