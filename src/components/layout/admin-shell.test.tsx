import type React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminShell } from "@/components/layout/admin-shell";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/admin/dashboard"),
}));

vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({
    theme: "light",
    resolvedTheme: "light",
    setTheme: vi.fn(),
  })),
}));

vi.mock("@/components/ui/loading-button", () => ({
  LoadingButton: ({ children, ...props }: React.ComponentProps<"button">) => (
    <button type="submit" {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/app/admin/login/actions", () => ({
  resendVerificationAction: vi.fn(),
}));

describe("AdminShell navigation", () => {
  it("shows owner-only sections for owners", () => {
    render(
      <AdminShell
        businessName="Reserva Demo"
        businessSlug="demo-barberia"
        userEmail="owner@example.com"
        userRole="owner"
        userVerified
        profileName="Owner Demo"
        demoMode={false}
      >
        <div>Contenido</div>
      </AdminShell>
    );

    expect(screen.getAllByText("Equipo").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pagina").length).toBeGreaterThan(0);
  });

  it("hides owner-only sections for staff", () => {
    render(
      <AdminShell
        businessName="Reserva Demo"
        businessSlug="demo-barberia"
        userEmail="staff@example.com"
        userRole="staff"
        userVerified
        profileName="Staff Demo"
        demoMode={false}
      >
        <div>Contenido</div>
      </AdminShell>
    );

    expect(screen.queryByText("Equipo")).not.toBeInTheDocument();
    expect(screen.queryByText("Pagina")).not.toBeInTheDocument();
    expect(screen.getAllByText("Turnos").length).toBeGreaterThan(0);
  });
});
