import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubscriptionPayButton } from "./subscription-pay-button";

describe("SubscriptionPayButton", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    // @ts-expect-error — mocking window.location.href
    delete window.location;
    window.location = { href: "" } as unknown as Location & string;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.location = originalLocation as unknown as Location & string;
  });

  it("redirects to /login when the API returns 401", async () => {
    const fetchMock = vi.mocked(window.fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: false }), { status: 401, statusText: "Unauthorized" })
    );

    render(<SubscriptionPayButton csrfToken="csrf-123" label="Pagar" />);

    await userEvent.click(screen.getByRole("button", { name: /pagar/i }));

    expect(window.location.href).toBe("/login");
    expect(fetchMock).toHaveBeenCalledWith("/api/payments/create-preference", expect.any(Object));
  });

  it("redirects to error page on other failures", async () => {
    const fetchMock = vi.mocked(window.fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: "preference_failed" }), { status: 500 })
    );

    render(<SubscriptionPayButton csrfToken="csrf-123" label="Pagar" />);

    await userEvent.click(screen.getByRole("button", { name: /pagar/i }));

    expect(window.location.href).toContain("/admin/subscription/pay?error=");
  });

  it("redirects to checkoutUrl on success", async () => {
    const fetchMock = vi.mocked(window.fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true, checkoutUrl: "https://mp.com/checkout" }), { status: 200 })
    );

    render(<SubscriptionPayButton csrfToken="csrf-123" label="Pagar" />);

    await userEvent.click(screen.getByRole("button", { name: /pagar/i }));

    expect(window.location.href).toBe("https://mp.com/checkout");
  });
});
