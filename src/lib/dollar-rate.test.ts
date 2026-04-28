import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getBlueDollarRate,
  clearDollarRateCache,
} from "./dollar-rate";

describe("getBlueDollarRate", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearDollarRateCache();
  });

  it("usa un timeout corto al consultar Bluelytics", async () => {
    const signal = new AbortController().signal;
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout").mockReturnValue(signal);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ blue: { value_sell: 1299.4 } }),
    } as Response);

    const rate = await getBlueDollarRate();
    expect(rate).toBe(1299);

    expect(timeoutSpy).toHaveBeenCalledWith(3000);
    expect(fetchSpy).toHaveBeenCalledWith("https://api.bluelytics.com.ar/v2/latest", {
      cache: "no-store",
      signal,
    });
  });

  it("devuelve null si la consulta falla y no hay cache", async () => {
    clearDollarRateCache();
    
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(new AbortController().signal);
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("timeout"));

    const rate = await getBlueDollarRate();
    expect(rate).toBeNull();
  });

  it("usa cache en memoria si tiene menos de 1 hora", async () => {
    clearDollarRateCache();
    
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ blue: { value_sell: 1500 } }),
    } as Response);

    // Primera llamada → hace fetch
    const rate1 = await getBlueDollarRate();
    expect(rate1).toBe(1500);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Segunda llamada inmediata → usa cache, no hace fetch
    const rate2 = await getBlueDollarRate();
    expect(rate2).toBe(1500);
    expect(fetchSpy).toHaveBeenCalledTimes(1); // sigue siendo 1
  });
});