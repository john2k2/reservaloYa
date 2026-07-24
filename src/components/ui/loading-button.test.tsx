import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useFormStatus } from "react-dom";
import { describe, expect, it } from "vitest";

import { LoadingButton } from "@/components/ui/loading-button";

// Exposes the real useFormStatus() pending state so tests can prove the
// ancestor form is actually pending, independently of what LoadingButton renders.
function PendingSentinel() {
  const { pending } = useFormStatus();
  return <span data-testid="pending-sentinel">{pending ? "pending" : "idle"}</span>;
}

describe("LoadingButton", () => {
  it("stays enabled and shows children when there is no ancestor form", () => {
    render(<LoadingButton>Guardar</LoadingButton>);

    const button = screen.getByRole("button", { name: "Guardar" });
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "false");
  });

  it("reflects the ancestor form's real pending state when isLoading is not passed", async () => {
    const user = userEvent.setup();
    let resolveAction: () => void = () => {};
    const action = () =>
      new Promise<void>((resolve) => {
        resolveAction = resolve;
      });

    render(
      <form action={action}>
        <LoadingButton pendingLabel="Guardando...">Guardar</LoadingButton>
      </form>
    );

    const button = screen.getByRole("button", { name: "Guardar" });
    expect(button).not.toBeDisabled();

    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
    });

    resolveAction();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Guardar" })).not.toBeDisabled();
    });
  });

  it("lets an explicit isLoading take precedence over a pending ancestor form", async () => {
    const user = userEvent.setup();
    // Never resolves during the test, so the form stays pending the whole time.
    const action = () => new Promise<void>(() => {});

    render(
      <form action={action}>
        <PendingSentinel />
        <LoadingButton isLoading={false}>Guardar</LoadingButton>
      </form>
    );

    const button = screen.getByRole("button", { name: "Guardar" });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByTestId("pending-sentinel")).toHaveTextContent("pending");
    });
    expect(button).not.toBeDisabled();
  });

  it("shows the loading state when isLoading is explicitly true, even without an ancestor form", () => {
    render(
      <LoadingButton isLoading loadingLabel="Guardando...">
        Guardar
      </LoadingButton>
    );

    const button = screen.getByRole("button", { name: "Guardando..." });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
