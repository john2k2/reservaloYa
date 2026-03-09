import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedSection } from "./animated-section";

describe("AnimatedSection", () => {
  it("should render children correctly", () => {
    render(
      <AnimatedSection>
        <div data-testid="child">Test Content</div>
      </AnimatedSection>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    render(
      <AnimatedSection className="custom-class">
        <div>Content</div>
      </AnimatedSection>
    );

    const section = screen.getByText("Content").parentElement;
    expect(section).toHaveClass("custom-class");
  });

  it("should start with opacity-0", () => {
    render(
      <AnimatedSection>
        <div>Content</div>
      </AnimatedSection>
    );

    const section = screen.getByText("Content").parentElement;
    expect(section).toHaveClass("opacity-0");
  });
});
