import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedSection } from "./animated-section";

beforeEach(() => {
  // jsdom no implementa matchMedia — mock mínimo para que el useEffect no explote
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn(() => ({ matches: false })),
  });
});

describe("AnimatedSection", () => {
  it("renders children correctly", () => {
    render(
      <AnimatedSection>
        <div data-testid="child">Test Content</div>
      </AnimatedSection>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies custom className to the wrapper", () => {
    render(
      <AnimatedSection className="custom-class">
        <div>Content</div>
      </AnimatedSection>
    );

    const section = screen.getByText("Content").parentElement;
    expect(section).toHaveClass("custom-class");
  });

  it("stays visible when element is already in the viewport", () => {
    // Simular que el elemento está en el viewport (top < innerHeight, bottom > 0)
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      top: 0,
      bottom: 200,
      left: 0,
      right: 800,
      width: 800,
      height: 200,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    });

    render(
      <AnimatedSection>
        <div>Content</div>
      </AnimatedSection>
    );

    const section = screen.getByText("Content").parentElement;
    expect(section).not.toHaveClass("opacity-0");

    vi.restoreAllMocks();
  });
});
